"""Swim Opt 2.7 walk-through in test mode (Playwright): every item of PROJECT-STATE next step 13.
Run: python3 tests/flow27.py "http://127.0.0.1:8102/?mode=local"   (from a scratch folder: it writes flow27-shots/)"""
import asyncio, sys, os, json
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8102/?mode=local"
SLIP = os.path.join(os.path.dirname(os.path.abspath(__file__)), "slip.jpg")
os.makedirs("flow27-shots", exist_ok=True)
fails, errs = [], []
def check(ok, name):
    print(("ok  " if ok else "FAIL"), name); ok or fails.append(name)

async def main():
  async with async_playwright() as pw:
    b = await pw.chromium.launch()
    ctx = await b.new_context(viewport={"width": 1512, "height": 982}, accept_downloads=True)
    async def page(name, w=1512, h=982):
        p = await ctx.new_page(); await p.set_viewport_size({"width": w, "height": h})
        p.on("pageerror", lambda e: errs.append((name, str(e))))
        p.on("console", lambda m: errs.append((name, m.text)) if m.type == "error" else None)
        await p.goto(URL); await p.wait_for_function("!!A.store"); return p
    async def pin(p, c):
        for k in c: await p.click(f'[data-act=key][data-k="{k}"]')
        await p.wait_for_timeout(120)
    ev = lambda p, js: p.evaluate(js)
    async def shot(p, n): await p.screenshot(path=f"flow27-shots/{n}.png", full_page=True)
    async def goto_rec(p, n):
        await p.click('[data-act=rgoto]'); await p.click(f'[data-act=pickrace][data-race="{n}"]'); await p.wait_for_timeout(100)
    async def type_time(p, race, lane, digits):
        await p.fill(f"#t-{race}-{lane}", digits); await p.press(f"#t-{race}-{lane}", "Enter"); await p.wait_for_timeout(120)

    O = await page("org"); await pin(O, "9999"); await O.click('[data-act=year][data-v=current]'); await O.click('.tile[data-job=organiser]')
    await O.click('[data-act=osec][data-v=students]'); await O.click('[data-act=otest]'); await O.click('[data-act=oimport]'); await O.wait_for_timeout(200)

    # Marshal: race 1 (4 lanes), race 2 (3 lanes) back50 Girls 14; race 3 free50 Girls 14 (2 lanes)
    M = await page("marshal", 1180, 820); await pin(M, "1111")
    async def group(k, x, g):
        await M.click(f'[data-act=mpick][data-v={k}]'); await M.click(f'[data-act=mpick][data-v={x}]'); await M.click(f'[data-act=mpick][data-f=g][data-v="{g}"]'); await M.click('[data-act=mgo]')
    async def fill(n):
        for _ in range(n): await M.click('.picklist button[data-act=mset]:not([disabled]) >> nth=0')
    await group("back50", "F", "14"); await fill(4); await M.click('[data-act=mnext]'); await M.wait_for_timeout(150)
    await fill(3); await M.click('[data-act=mnew]'); await M.click('[data-act=mconfirm]'); await M.wait_for_timeout(150)
    await group("free50", "F", "14"); await fill(2); await M.click('[data-act=mnew]'); await M.click('[data-act=mconfirm]'); await M.wait_for_timeout(150)
    check(await ev(M, "A.heats.length") == 3, "three races sent")

    # B2: the heat being filled survives a reload
    await group("fly50", "M", "15"); await fill(2)
    await M.reload(); await M.wait_for_function("!!A.store"); await M.wait_for_timeout(300)
    check(await ev(M, "A.m.phase") == "lanes" and await ev(M, "Object.keys(A.m.lanes).length") == 2, "B2: unsent lanes come back after a reload")
    await shot(M, "b2-marshal-after-reload")
    await M.click('[data-act=mback]'); await M.click('[data-act=leaveok]'); await M.wait_for_timeout(100)
    check(await ev(M, "sessionStorage.getItem('swim_marshal')") is None, "B2: leaving clears the kept lanes")

    # A12: In the water now = first race with no places or times
    An = await page("announcer", 390, 844); await pin(An, "5555"); await An.wait_for_timeout(200)
    check(await ev(An, "waterRace().race") == 1, "A12: in the water now is Race 1 (nothing placed yet)")

    # A13: Place Judge undo puts back a removed place; Start again asks first
    J = await page("judge", 390, 844); await pin(J, "2222")
    for l in [1, 2, 3, 4]: await J.click(f'[data-act=jtap][data-l="{l}"]'); await J.wait_for_timeout(50)
    await J.click('[data-act=jtap][data-l="2"]'); await J.wait_for_timeout(80)
    check(await ev(J, "JSON.stringify(A.finish.r0001.order)") == "[[1],[3],[4]]", "A13: tapping a placed lane removes it")
    await J.click('[data-act=jundo]'); await J.wait_for_timeout(80)
    check(await ev(J, "JSON.stringify(A.finish.r0001.order)") == "[[1],[2],[3],[4]]", "A13: Undo last puts the removed place back")
    await J.click('[data-act=jreset]'); await J.wait_for_timeout(80); await shot(J, "a13-start-again-box")
    check(await J.locator('[data-act=jresetok]').count() == 1, "A13: Start again asks first")
    await J.click('[data-act=jresetok]'); await J.wait_for_timeout(80)
    check(await ev(J, "A.finish.r0001.order.length") == 0, "A13: Start again clears")
    await J.click('[data-act=jundo]'); await J.wait_for_timeout(80)
    check(await ev(J, "A.finish.r0001.order.length") == 4, "A13: Undo after Start again puts all places back")
    check(await ev(An, "waterRace().race") == 2, "A12: once Race 1 has places, Race 2 is in the water")

    # 143: Recorder types race 1, no Times checked: race done
    R = await page("recorder"); await pin(R, "3333"); await R.wait_for_timeout(150)
    check(await ev(R, "A.r.race") == 1, "B1: a fresh Recorder opens on the first race that needs work")
    for l, t in [(1, "3500"), (2, "3600"), (3, "3700"), (4, "3800")]: await type_time(R, 1, l, t)
    check(await ev(R, "A.R.races.get(1).done") and not await ev(R, "A.R.races.get(1).checked"), "143: times and places in: done without Times checked")
    check(not await ev(R, "A.R.groups.get('back50|F|14').final"), "143: the group waits for Race 2")
    # Race 2: two times and one No time; judge places the two with a time
    await goto_rec(R, 2)
    await type_time(R, 2, 1, "3550"); await type_time(R, 2, 2, "3650")
    await R.click('[data-act=rst][data-l="3"][data-st=NT]'); await R.wait_for_timeout(120)
    await J.click('[data-act=jnext]'); await J.wait_for_timeout(100)
    await J.click('[data-act=jtap][data-l="1"]'); await J.click('[data-act=jtap][data-l="2"]'); await J.wait_for_timeout(100)
    check(await ev(R, "A.R.groups.get('back50|F|14').final"), "143: places in for every swimmer with a time: group Final, never checked")
    nt = json.loads(await ev(R, "JSON.stringify(A.R.groups.get('back50|F|14').rows.find(r=>r.race===2&&r.lane===3))"))
    check(nt["st"] == "NT" and nt["place"] is None and nt["pts"] == 5 and not nt.get("hris"), "144: No time: no place, 5 points, not on the HRIS list")
    await shot(R, "144-recorder-no-time")
    await ev(An, "0"); await An.wait_for_timeout(200)
    check(await ev(An, "A.a.key") == "back50|F|14", "143: the Announcer reads the Final group")
    await shot(An, "143-announcer-phone")

    # A2: a place change after Times checked sends the race back
    await goto_rec(R, 1); await R.click('[data-act=rcheck]'); await R.wait_for_timeout(150)
    if await R.locator('[data-act=rforce]').count(): await R.click('[data-act=rforce]'); await R.wait_for_timeout(150)
    check(await ev(R, "A.R.races.get(1).checked"), "A2: Race 1 checked")
    await J.click('[data-act=jgoto]'); await J.click('[data-act=pickrace][data-race="1"]'); await J.wait_for_timeout(80)
    await J.click('[data-act=jtap][data-l="4"]'); await J.wait_for_timeout(150)
    check(await ev(R, "A.R.races.get(1).tstatus") == "To check", "A2: a place changed after Times checked: back to To check")
    await J.click('[data-act=jundo]'); await J.wait_for_timeout(100)

    # A3 (136): a late slip keeps the typed times; Slip differs; the Recorder picks
    S = await page("slips", 390, 844); await pin(S, "4444"); await S.wait_for_timeout(150)
    check(await ev(S, "A.s.race") == 1, "B1: Time Slips opens on the first race (no slips yet)")
    await S.set_input_files("#camin", SLIP); await S.wait_for_timeout(600)
    t1 = json.loads(await ev(R, "JSON.stringify(A.times.r0001.lanes)"))
    check(all(t1[str(l)]["t"] == v for l, v in [(1, 3500), (2, 3600), (3, 3700), (4, 3800)]), "136: the late slip did not overwrite the typed times")
    d = await ev(R, "A.R.races.get(1).differs.length")
    check(d > 0, "136: Slip differs shown")
    await R.reload(); await R.wait_for_function("!!A.store"); await R.wait_for_timeout(200)
    check(await ev(R, "A.r.race") == 1, "B1: after a reload the Recorder opens on the race with a slip that differs")
    await shot(R, "136-slip-differs")
    l1 = await ev(R, "A.R.races.get(1).differs[0]"); slip1 = await ev(R, f"A.times.r0001.lanes[{l1}].slip")
    await R.click(f'[data-act=rslipuse][data-l="{l1}"]'); await R.wait_for_timeout(120)
    check(await ev(R, f"A.times.r0001.lanes[{l1}].t") == slip1, "136: Use slip takes the slip time")
    while await ev(R, "A.R.races.get(1).differs.length"):
        l2 = await ev(R, "A.R.races.get(1).differs[0]"); await R.click(f'[data-act=rslipkeep][data-l="{l2}"]'); await R.wait_for_timeout(100)
    check(await ev(R, "A.R.races.get(1).differs.length") == 0, "136: Keep typed clears the note")
    await S.click('[data-act=snext]'); await S.wait_for_timeout(80)
    check(await ev(S, "A.s.race") == 2, "Time Slips Next race")

    # A1: cancel Race 3, bring it back; re-swim Race 1 keeps the number
    await goto_rec(R, 3); await R.click('[data-act=rcancel]'); await shot(R, "a1-cancel-box"); await R.click('[data-act=rcancelok]'); await R.wait_for_timeout(150)
    check(await ev(R, "A.R.races.get(3).cancelled") and not await ev(R, "A.R.groups.has('free50|F|14')"), "A1: Race 3 cancelled, its group no longer waits")
    check(await ev(M, "(A.m.k='free50',A.m.x='F',A.m.g='14',usedInGroup().size)") == 0, "A1: its swimmers can be marshalled again")
    await M.evaluate("A.m.k=null;A.m.x=null;A.m.g=null")
    check(await ev(J, "liveRaces().map(r=>r.race).join()") == "1,2", "A1: Place Judge skips the cancelled race")
    await shot(R, "a1-cancelled")
    await R.click('[data-act=runcancel]'); await R.wait_for_timeout(120)
    check(not await ev(R, "A.R.races.get(3).cancelled"), "A1: Bring this race back")
    await goto_rec(R, 1); await R.click('[data-act=rreswim]'); await shot(R, "a1-reswim-box"); await R.click('[data-act=rreswimok]'); await R.wait_for_timeout(200)
    r1 = json.loads(await ev(J, "JSON.stringify({n:A.R.races.get(1).nTimes,t:A.R.races.get(1).tapped,s:A.R.races.get(1).hasSlip,race:A.R.races.get(1).race})"))
    check(r1 == {"n": 0, "t": 0, "s": False, "race": 1}, "A1: re-swim clears places, times and slip and keeps Race 1")
    check(await ev(An, "waterRace().race") == 1, "A12: the re-swum Race 1 is in the water again")
    await J.click('[data-act=jgoto]'); await J.click('[data-act=pickrace][data-race="1"]'); await J.wait_for_timeout(80)
    await J.click('[data-act=jtap][data-l="2"]'); await J.wait_for_timeout(100)
    check(await ev(J, "A.R.races.get(1).tapped") == 1, "A1: the re-swim takes new places")

    # Organiser: Set next race number (forward only)
    await O.click('[data-act=osec][data-v=details]')
    n0 = await ev(O, "A.counter")
    await O.fill("#cNext", str(n0 - 1)); await O.click('[data-act=onext]'); await O.wait_for_timeout(100)
    check(await ev(O, "A.counter") == n0, "A1: next race number cannot go back")
    await O.fill("#cNext", str(n0 + 2)); await O.click('[data-act=onext]'); await O.wait_for_timeout(150)
    check(await ev(O, "A.counter") == n0 + 2 and await ev(M, "A.counter") == n0 + 2, "A1: next race number moves forward for every job")
    await shot(O, "a1-next-race-number")

    # A9: Not swum and the full HRIS list
    await O.click('[data-act=osec][data-v=program]')
    f0 = await ev(O, "A.R.finalCount")
    await O.select_option("#oNotSwum", "fly50|F|13"); await O.click('[data-act=onotswum]'); await O.wait_for_timeout(150)
    check(await ev(O, "A.R.finalCount") == f0 + 1 and await ev(O, "A.R.isFinal('fly50|F|13')"), "A9: a group marked Not swum counts as final")
    await shot(O, "a9-not-swum")
    await An.click('[data-act=goto][data-job=results]'); await An.click('[data-act=rtab][data-v=hris]'); await An.wait_for_timeout(150)
    check(await An.locator("tbody tr").count() == 74, "A9: the HRIS Team List shows all 74 groups")
    check(await An.locator("tbody tr", has_text="Not swum").count() == 1, "A9: the not-swum group says Not swum")
    await shot(An, "a9-hris-phone")
    await An.click('[data-act=goto][data-job=announcer]')

    # A11: the Announcer's read list belongs to the carnival and goes on Sign out
    await ev(An, "markRead('back50|F|14')")
    check(await ev(An, "readSet().size") == 1, "A11: read list kept")
    await An.click('[data-act=menu]'); await An.click('[data-act=signout]'); await An.wait_for_timeout(100)
    check(await ev(An, "Object.keys(localStorage).filter(k=>k.startsWith('swim_read')).length") == 0, "A11: Sign out clears the read list")

    # A6: CSV and full backup are real downloads; A7: Clear practice data; then restore the backup
    await O.click('[data-act=osec][data-v=export]')
    async with O.expect_download() as dl: await O.click('[data-act=csv]')
    d = await dl.value; csv = open(await d.path()).read()
    check(d.suggested_filename.endswith(".csv") and "No time" in csv, "A6: Export CSV downloads a file (No time listed)")
    async with O.expect_download() as dl: await O.click('[data-act=obackup]')
    d = await dl.value; bpath = "flow27-shots/backup.json"; await d.save_as(bpath)
    bk = json.load(open(bpath))
    check(bk["kind"] == "full backup" and len(bk["heats"]) == 3 and len(bk["photos"]) >= 1, "A6: full backup file with races and slip photos")
    await shot(O, "a6-export")
    await O.click('[data-act=osec][data-v=lock]'); await O.click('[data-act=oclear]'); await shot(O, "a7-clear-box")
    await O.fill("#opPin", "1111"); await O.click('[data-act=oorgpinok]'); await O.wait_for_timeout(100)
    check(await ev(O, "A.heats.length") == 3, "A7: a wrong PIN clears nothing")
    await O.fill("#opPin", "9999"); await O.click('[data-act=oorgpinok]'); await O.wait_for_timeout(500)
    check(await ev(O, "A.heats.length") == 0 and await ev(O, "A.counter") == 1 and await ev(O, "students().length") == 620, "A7: practice cleared, race number 1, students kept")
    check(await ev(O, "A.years.length") == 0 and await ev(M, "A.heats.length") == 0, "A7: no year kept, every job sees it cleared")
    await shot(O, "a7-cleared")
    await O.click('[data-act=osec][data-v=export]')
    await O.set_input_files("#oRestore", bpath); await O.wait_for_timeout(200); await shot(O, "a6-restore-box")
    await O.fill("#opPin", "9999"); await O.click('[data-act=oorgpinok]'); await O.wait_for_timeout(800)
    check(await ev(O, "A.heats.length") == 3 and await ev(O, "A.counter") == bk["counter"], "A6: restore puts the races and race number back")
    check(await ev(R, "A.R.races.get(2).nTimes") == 3, "A6: restored times reach the Recorder")
    ph = await ev(O, "A.store.get('photos/r0001').then(p=>!!(p&&p.img))")
    check(ph, "A6: restored slip photo")

    print("ERRS", errs)
    await b.close()
  print(f"\n{len(fails)} failed" if fails else "\nall passed"); sys.exit(1 if fails or errs else 0)
asyncio.run(main())
