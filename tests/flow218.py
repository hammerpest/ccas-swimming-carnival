"""Swim Opt 2.18 test (Playwright, test mode): Primary or Secondary carnival and age switches (S1.44, decisions 160 to 164).
Run: python3 tests/flow218.py "http://127.0.0.1:8102/?mode=local"   (from a scratch folder)"""
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
    txt = lambda p: p.evaluate("document.body.innerText")

    O = await page("org"); await pin(O, "9999"); await O.click('[data-act=year][data-v=current]'); await O.click('.tile[data-job=organiser]')
    await O.click('[data-act=osec][data-v=program]'); await O.wait_for_timeout(150)
    t = await txt(O)
    check("Carnival" in t and "Age groups" in t and "Ages 13 to 18" in t, "Program shows Carnival and Age groups")
    check(await ev(O, "document.querySelector('[data-act=olevel][data-v=secondary]').getAttribute('aria-pressed')") == "true", "Secondary chosen by default")
    check("74 races on the program" in t and "13 and over" not in t and "13 & under" in t, "secondary: 74 races, 13 & under")

    # a secondary list is loaded, then Primary is chosen: the organiser is told to import again
    await O.click('[data-act=osec][data-v=students]'); await O.click('[data-act=otest]'); await O.click('[data-act=oimport]'); await O.wait_for_timeout(200)
    await O.click('[data-act=osec][data-v=program]'); await O.wait_for_timeout(100)
    # choose Primary
    await O.click('[data-act=olevel][data-v=primary]'); await O.wait_for_timeout(200)
    t = await txt(O)
    check("loaded for a secondary carnival. Import the student list again." in t and "Import the list again" in t, "secondary list under Primary: warning and amber Students status")
    check(await ev(O, "A.cfg.level") == "primary", "Primary saved")
    check("58 races on the program" in t, "primary: 58 races")
    check("Not swum at primary" in t, "primary: 200 m freestyle greyed")
    check(await ev(O, "[...document.querySelectorAll('[data-act=oage]')].map(b=>b.dataset.v).join()") == "8,9,10,11,12", "primary: switches for 8 to 12")
    check("8 & under" in t and "12 and over" in t and "5 age groups on: 8 & under to 12 and over" in t, "primary: age names")
    check("Junior (8 to 10), Senior (11 and 12)" in t, "primary relays: Junior (8 to 10), Senior (11 and 12)")

    # turn 8 off, then on again; last age cannot go off
    await O.click('[data-act=oage][data-v="8"]'); await O.wait_for_timeout(150)
    t = await txt(O)
    check("4 age groups on: 9 & under to 12 and over" in t and "48 races on the program" in t, "8 off: 9 & under, 48 races")
    await O.click('[data-act=oage][data-v="8"]'); await O.wait_for_timeout(150)
    check(await ev(O, "A.R.events.length") == 58, "8 back on: 58 races")

    # primary test students
    await O.click('[data-act=osec][data-v=students]'); await O.click('[data-act=otest]'); await O.click('[data-act=oimport]'); await O.wait_for_timeout(200)
    t = await txt(O)
    check("loaded for a" not in t, "primary list loaded: warning gone")
    check("8 & UNDER" in t.upper() and "12+" in t and "13 & UNDER" not in t.upper(), "students table: primary ages")
    check(await ev(O, "students().every(s=>+s.g>=8&&+s.g<=12)"), "test students given ages 8 to 12")

    # Marshal: primary ages, no 200 m, medley relay Junior and Senior
    M = await page("marshal", 1180, 820); await pin(M, "1111")
    check(await ev(M, "[...document.querySelectorAll('[data-act=mpick][data-f=k]')].map(b=>b.dataset.v).includes('free200')") is False, "Marshal: no 200 m freestyle")
    await M.click('[data-act=mpick][data-v=relaymed]'); await M.wait_for_timeout(80)
    check(await ev(M, "[...document.querySelectorAll('[data-act=mpick][data-f=g]')].map(b=>b.textContent.trim()).join()") == "Junior,Senior", "Marshal: medley relay Junior and Senior")
    await M.click('[data-act=mpick][data-v=free50]'); await M.wait_for_timeout(80)
    check(await ev(M, "[...document.querySelectorAll('[data-act=mpick][data-f=g]')].map(b=>b.textContent.trim()).join('|')") == "8& under|9|10|11|12and over", "Marshal: ages 8 & under to 12 and over")
    await M.click('[data-act=mpick][data-v=F]'); await M.click('[data-act=mpick][data-f=g][data-v="10"]'); await M.click('[data-act=mgo]')
    check(await ev(M, "eligible('free50','F','10').every(s=>s.g==='10')") and await ev(M, "eligible('free50','F','10').length") > 0, "Marshal: 10 list holds only age 10")
    for _ in range(4): await M.click('.picklist button[data-act=mset]:not([disabled]) >> nth=0')
    await M.click('[data-act=mnew]'); await M.click('[data-act=mconfirm]'); await M.wait_for_timeout(200)
    check(await ev(M, "A.heats.length") == 1, "race 1 sent: 50 m freestyle Girls 10")

    # after the first race is sent, the carnival and ages are fixed
    await O.click('[data-act=osec][data-v=program]'); await O.wait_for_timeout(200)
    check(await ev(O, "[...document.querySelectorAll('[data-act=olevel],[data-act=oage]')].every(b=>b.disabled)"), "after race 1: carnival and age switches fixed")
    check("Races have been sent, so the carnival and ages are fixed." in await txt(O), "after race 1: note says the ages are fixed")
    check(await ev(O, "getComputedStyle(document.querySelector('[data-act=oage]')).opacity") == "0.45", "after race 1: switches look disabled")
    await O.click('[data-act=menu]'); await O.click('[data-act=goto][data-job=announcer]'); await O.wait_for_timeout(150); await O.click('[data-act=goto][data-job=houses]'); await O.wait_for_timeout(150)
    t = await txt(O)
    check("Girls and boys together." in t and "200 m freestyle points" not in t, "Houses: no 200 m note at primary")
    await O.click('[data-act=menu]'); await O.click('[data-act=goto][data-job=organiser]'); await O.wait_for_timeout(150)
    await O.click('[data-act=osec][data-v=points]'); await O.wait_for_timeout(100)
    t = await txt(O)
    check("count the 5 age races." in t, "Points: primary champions count the 5 age races")

    # phone: no sideways scroll on the Program section
    P = await page("org-phone", 390, 844); await pin(P, "9999"); await P.click('[data-act=year][data-v=current]'); await P.click('.tile[data-job=organiser]')
    await P.click('[data-act=osec][data-v=program]'); await P.wait_for_timeout(150)
    check(await ev(P, "document.documentElement.scrollWidth<=innerWidth"), "phone: no sideways scroll")
    tt = await P.evaluate("[...document.querySelectorAll('[data-act=olevel],[data-act=oage]')].map(b=>{const r=b.getBoundingClientRect();return Math.min(r.width,r.height)})")
    check(min(tt) >= 30, "phone: switches and choices big enough (%s px)" % min(tt))

    await b.close()
  check(not errs, "no console errors " + (str(errs[:3]) if errs else ""))
  print("PASSED" if not fails else "FAILED: %d" % len(fails))
asyncio.run(main())
