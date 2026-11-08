"""Swim Opt 2.16 test (Playwright, test mode): Place Judge Start again clears "fewer places confirmed" (ok),
so a race with no places is not counted as done (PROJECT-STATE next step 23).
Run: python3 tests/flow216.py "http://127.0.0.1:8102/?mode=local"   (from a scratch folder)"""
import asyncio, sys
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8102/?mode=local"
fails, errs = [], []
def check(ok, name):
    print(("ok  " if ok else "FAIL"), name); ok or fails.append(name)

async def main():
  async with async_playwright() as pw:
    b = await pw.chromium.launch()
    ctx = await b.new_context(viewport={"width": 1512, "height": 982})
    async def page(name, w=1512, h=982):
        p = await ctx.new_page(); await p.set_viewport_size({"width": w, "height": h})
        p.on("pageerror", lambda e: errs.append((name, str(e))))
        p.on("console", lambda m: errs.append((name, m.text)) if m.type == "error" else None)
        await p.goto(URL); await p.wait_for_function("!!A.store"); return p
    async def pin(p, c):
        for k in c: await p.click(f'[data-act=key][data-k="{k}"]')
        await p.wait_for_timeout(120)
    ev = lambda p, js: p.evaluate(js)
    async def type_time(p, race, lane, digits):
        await p.fill(f"#t-{race}-{lane}", digits); await p.press(f"#t-{race}-{lane}", "Enter"); await p.wait_for_timeout(120)

    O = await page("org"); await pin(O, "9999"); await O.click('[data-act=year][data-v=current]'); await O.click('.tile[data-job=organiser]')
    await O.click('[data-act=osec][data-v=students]'); await O.click('[data-act=otest]'); await O.click('[data-act=oimport]'); await O.wait_for_timeout(200)

    # Marshal: race 1 (4 lanes) and race 2 (3 lanes), back50 Girls 14
    M = await page("marshal", 1180, 820); await pin(M, "1111")
    await M.click('[data-act=mpick][data-v=back50]'); await M.click('[data-act=mpick][data-v=F]'); await M.click('[data-act=mpick][data-f=g][data-v="14"]'); await M.click('[data-act=mgo]')
    for _ in range(4): await M.click('.picklist button[data-act=mset]:not([disabled]) >> nth=0')
    await M.click('[data-act=mnext]'); await M.wait_for_timeout(150)
    for _ in range(3): await M.click('.picklist button[data-act=mset]:not([disabled]) >> nth=0')
    await M.click('[data-act=mnew]'); await M.click('[data-act=mconfirm]'); await M.wait_for_timeout(150)
    check(await ev(M, "A.heats.length") == 2, "races 1 and 2 sent (race 2 gives the judge a Next race button)")

    # Recorder types all four times
    R = await page("recorder"); await pin(R, "3333"); await R.wait_for_timeout(150)
    for l, t in [(1, "3500"), (2, "3600"), (3, "3700"), (4, "3800")]: await type_time(R, 1, l, t)

    # Place Judge taps 2 of 4 and confirms fewer places
    J = await page("judge", 390, 844); await pin(J, "2222")
    await J.click('[data-act=jtap][data-l="1"]'); await J.click('[data-act=jtap][data-l="2"]'); await J.wait_for_timeout(80)
    await J.click('[data-act=jnext]'); await J.wait_for_timeout(80); await J.click('[data-act=jconfirm]'); await J.wait_for_timeout(150)
    check(await ev(J, "A.finish.r0001.ok") is True, "fewer places confirmed sets ok")
    check(await ev(R, "A.R.races.get(1).done"), "race 1 done with 2 places confirmed")

    # Start again on race 1
    await J.click('[data-act=jgoto]'); await J.click('[data-act=pickrace][data-race="1"]'); await J.wait_for_timeout(80)
    await J.click('[data-act=jreset]'); await J.wait_for_timeout(80); await J.click('[data-act=jresetok]'); await J.wait_for_timeout(150)
    check(await ev(J, "A.finish.r0001.order.length") == 0, "Start again clears the places")
    check(await ev(J, "A.finish.r0001.ok") is False, "Start again clears ok")
    check(not await ev(R, "A.R.races.get(1).done"), "race 1 with no places is not done after Start again (step 23)")

    # Undo puts the places back; the judge confirms again
    await J.click('[data-act=jundo]'); await J.wait_for_timeout(150)
    check(await ev(J, "A.finish.r0001.order.length") == 2, "Undo last puts the 2 places back")
    check(not await ev(R, "A.R.races.get(1).done"), "after Undo the judge confirms fewer places again")
    await J.click('[data-act=jnext]'); await J.wait_for_timeout(80); await J.click('[data-act=jconfirm]'); await J.wait_for_timeout(150)
    check(await ev(R, "A.R.races.get(1).done"), "confirmed again: race 1 done")

    # A full top 4 never needs ok
    await J.click('[data-act=jgoto]'); await J.click('[data-act=pickrace][data-race="1"]'); await J.wait_for_timeout(80)
    await J.click('[data-act=jreset]'); await J.wait_for_timeout(80); await J.click('[data-act=jresetok]'); await J.wait_for_timeout(100)
    for l in [3, 1, 2, 4]: await J.click(f'[data-act=jtap][data-l="{l}"]'); await J.wait_for_timeout(50)
    await J.wait_for_timeout(150)
    check(await ev(R, "A.R.races.get(1).done"), "Start again then all 4 places: done")

    await b.close()
  print("console errors:", errs or "none")
  print("FAILED:" if fails or errs else "ALL PASSED", fails)
  sys.exit(1 if fails or errs else 0)

asyncio.run(main())
