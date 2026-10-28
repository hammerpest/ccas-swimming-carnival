"""Live tests against the Supabase project in js/config.js (use the STAGING project only).
Clears the project's carnival data first and puts the 620 test students back at the end.
Run: python3 tests/supabase_live.py <site url>   (the site must be served with js/config.js filled in)
Covers: the six-device flow (tests/flow.py) and what it saved, two marshals at once, two Recorders on one race,
the phone offline, and the security rules (no PIN, wrong job, past year)."""
import asyncio, json, os, re, subprocess, sys, time, urllib.request, urllib.error
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8102/"
cfg = open(os.path.join(ROOT, "js", "config.js")).read()
SB = re.search(r'url:"([^"]+)"', cfg).group(1); KEY = re.search(r'key:"([^"]+)"', cfg).group(1)
HASH = {"marshal": "ad5c28bc", "judge": "e71d4378", "recorder": "37799a1c", "slips": "ac6c05b0", "announcer": "de198c1c", "org": "276fbdc"}
TABLES = ["config", "roster", "extras", "heats", "times", "finish", "slips", "records", "counter", "years", "archive"]
fails = []
def check(ok, name):
    print(("ok  " if ok else "FAIL"), name, flush=True); ok or fails.append(name)

def req(path, body=None, tok=None, method=None, raw=None, ctype="application/json"):
    h = {"apikey": KEY, "Content-Type": ctype}
    if tok: h["Authorization"] = "Bearer " + tok
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    r = urllib.request.Request(SB + path, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(r) as f:
            t = f.read(); return f.status, (json.loads(t) if t else None)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:300]

def device(role=None):
    s, a = req("/auth/v1/signup", {}); tok = a["access_token"]
    if role: req("/rest/v1/rpc/claim_role", {"pin_hash": HASH[role]}, tok)
    return tok

def rows(t, tok):
    s, r = req(f"/rest/v1/{t}?select=id,doc", tok=tok); return r if isinstance(r, list) else []

def reset(org):
    req("/rest/v1/rpc/set_year", {"y": "current"}, org)
    req("/rest/v1/rpc/doc_update", {"tbl": "config", "doc_id": "main", "patch": {"locked": False}}, org)
    for t in TABLES:
        if t != "config": req(f"/rest/v1/{t}?id=neq.__none__", tok=org, method="DELETE")
    req("/rest/v1/config?id=eq.main", tok=org, method="DELETE")
    s, objs = req("/storage/v1/object/list/slips", {"prefix": "", "limit": 1000}, org)
    if isinstance(objs, list) and objs:
        req("/storage/v1/object/slips", {"prefixes": [o["name"] for o in objs]}, org, method="DELETE")
    studs = json.load(open(os.path.join(ROOT, "src", "test-students.json")))["students"]
    studs = [{"id": "t" + str(i + 1).zfill(3), "s": r["s"], "f": r["f"], "h": r["h"], "x": r["x"], "g": r["g"], "test": True} for i, r in enumerate(studs)]
    for x in "FM":
        req("/rest/v1/roster", [{"id": x, "doc": {"students": [s for s in studs if s["x"] == x], "at": int(time.time() * 1000)}}], org)
    return studs

async def pin(p, c):
    for k in c: await p.click(f'[data-act=key][data-k="{k}"]')

async def wait_for(fn, secs, step=0.5):
    end = time.time() + secs
    while time.time() < end:
        if await fn(): return True
        await asyncio.sleep(step)
    return False

async def main():
    org = device("org")
    studs = reset(org)
    check(len(rows("roster", org)) == 2 and not rows("heats", org), "staging cleared, 620 test students in")

    # 1. the six-device flow, then what it saved
    r = subprocess.run([sys.executable, os.path.join(HERE, "flow.py"), URL], capture_output=True, text=True, cwd=os.path.join(ROOT, "..", "work") if os.path.isdir(os.path.join(ROOT, "..", "work")) else None)
    check("ERRS []" in r.stdout, "six-device flow: no errors")
    if "ERRS []" not in r.stdout: print("\n".join(l for l in (r.stdout + r.stderr).splitlines() if "flow.py" in l or "Error" in l or "locator(" in l)[:1500])
    await asyncio.sleep(4)
    yrs = rows("years", org); arch = {a["id"]: a["doc"] for a in rows("archive", org)}
    check([y["id"] for y in yrs] == ["2027"], "flow: the 2027 carnival is kept")
    d = arch.get("2027-data", {})
    check(len(d.get("heats", [])) == 2 and len(d.get("times", {})) == 2 and len(d.get("finish", {})) == 2, "flow: kept year has its 2 heats, times and places")
    check(not rows("heats", org) and not rows("times", org), "flow: live heats and times cleared for the new year")
    c = {x["id"]: x["doc"] for x in rows("counter", org)}
    check(c.get("race", {}).get("next") == 1, "flow: race number back to 1")
    s, objs = req("/storage/v1/object/list/slips", {"prefix": "", "limit": 100}, org)
    check(isinstance(objs, list) and any(o["name"].startswith("y2027-") for o in objs), "flow: slip photos kept with the year")
    studs = reset(org)

    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        errs = []
        async def page(ctx, name, code=None):
            p = await ctx.new_page()
            p.on("pageerror", lambda e: errs.append((name, str(e))))
            await p.goto(URL)
            await wait_for(lambda: p.evaluate("!!(A.store&&A.store.mode)"), 15)
            if code:
                await pin(p, code); await wait_for(lambda: p.evaluate("!!A.role"), 15)
            return p
        ctx = await b.new_context(viewport={"width": 1512, "height": 982})

        # 2. two marshals pressing at once
        M1 = await page(ctx, "m1", "1111"); M2 = await page(ctx, "m2", "1111")
        js = "Promise.all(Array.from({length:15},()=>A.store.nextRace()))"
        a1, a2 = await asyncio.gather(M1.evaluate(js), M2.evaluate(js))
        got = sorted(a1 + a2)
        check(got == list(range(1, 31)), f"two marshals at once: 30 race numbers, no gaps or repeats")
        req("/rest/v1/counter?id=eq.race", tok=org, method="DELETE")

        # live update between devices: a heat sent on one marshal shows on the other
        girls14 = [s["id"] for s in studs if s["x"] == "F" and s["g"] == "14"][:4]
        heat = {"race": 1, "k": "back50", "x": "F", "g": "14", "heat": 1, "lanes": {str(i + 1): sid for i, sid in enumerate(girls14)}, "at": int(time.time() * 1000), "dev": "test"}
        await M1.evaluate("h=>A.store.set('heats/r0001',h)", heat)
        check(await wait_for(lambda: M2.evaluate("A.heats.length===1"), 10), "a heat sent on one iPad shows live on the other")
        check(await wait_for(lambda: M2.evaluate("A.peers.some(p=>p.job==='marshal'&&p.dev!==DEV)"), 10), "each marshal sees the other one (presence)")

        # 3. two Recorders on one race: the second is locked, and freed when the first drops out
        ctxR1 = await b.new_context(viewport={"width": 1512, "height": 982})
        R1 = await page(ctxR1, "r1", "3333"); await asyncio.sleep(3)
        R2 = await page(ctx, "r2", "3333")
        LOCK = "Being entered by another device"
        check(await wait_for(lambda: R2.evaluate(f"document.body.innerText.includes('{LOCK}')"), 15), "second Recorder on Race 1 is locked")
        check(not await R1.evaluate(f"document.body.innerText.includes('{LOCK}')"), "first Recorder is not locked")
        await ctxR1.close()
        check(await wait_for(lambda: R2.evaluate(f"!document.body.innerText.includes('{LOCK}')"), 90, 1), "lock frees when the first Recorder drops out")

        # 4. the phone offline: the photo waits on the phone and sends by itself later
        ctxP = await b.new_context(viewport={"width": 390, "height": 844})
        P = await page(ctxP, "phone", "4444"); await asyncio.sleep(2)
        await ctxP.set_offline(True)
        await P.set_input_files("#camin", os.path.join(HERE, "slip.jpg"))
        check(await wait_for(lambda: P.evaluate("A.store.pending()>0"), 20), "offline: the photo and times wait on the phone")
        check(await P.evaluate("document.getElementById('hdr').innerText.includes('waiting to send')"), "offline: header shows the waiting count")
        await ctxP.set_offline(False)
        check(await wait_for(lambda: P.evaluate("A.store.pending()===0"), 40, 1), "back online: everything sends by itself")
        t = {x["id"]: x["doc"] for x in rows("times", org)}
        check(t.get("r0001", {}).get("src") == "photo" and len(t["r0001"].get("lanes", {})) >= 1, "the slip times reached the server")
        check(await wait_for(lambda: R2.evaluate("!!(A.times.r0001&&A.times.r0001.src==='photo')"), 15), "the Recorder sees the slip times live")
        s, objs = req("/storage/v1/object/list/slips", {"prefix": "", "limit": 100}, org)
        check(isinstance(objs, list) and any(o["name"] == "r0001.jpg" for o in objs), "the slip photo is in the private bucket")
        img = await R2.evaluate("A.store.get('photos/r0001').then(p=>p&&p.img.slice(0,11))")
        check(img == "data:image/", "the Recorder can open the slip photo")
        check(not errs, f"no page errors {errs[:3]}")
        await b.close()

    # 5. security rules (one sign-in, changing job, to save on the hourly sign-in limit)
    d = device()
    check(rows("roster", d) == [] and rows("heats", d) == [], "no PIN: reads nothing")
    s, _ = req("/rest/v1/heats", [{"id": "r0099", "doc": {}}], d)
    check(s >= 400, "no PIN: cannot write")
    s, r = req("/rest/v1/rpc/claim_role", {"pin_hash": "00000000"}, d)
    check(r is None, "wrong PIN: no job")
    req("/rest/v1/rpc/claim_role", {"pin_hash": HASH["marshal"]}, d)
    s, _ = req("/rest/v1/times", [{"id": "r0098", "doc": {}}], d)
    check(s >= 400, "Marshal PIN cannot write times")
    s, _ = req("/storage/v1/object/slips/r0098.jpg", tok=d, raw=b"x", ctype="image/jpeg", method="POST")
    check(s >= 400, "Marshal PIN cannot upload slip photos")
    s, _ = req("/rest/v1/archive", [{"id": "2026-data", "doc": {}}], d)
    check(s >= 400, "a past year cannot be written by a job")
    req("/rest/v1/rpc/claim_role", {"pin_hash": HASH["announcer"]}, d)
    s, _ = req("/rest/v1/finish", [{"id": "r0098", "doc": {}}], d)
    check(s >= 400 and len(rows("roster", d)) == 2, "Announcer reads but cannot write")
    req("/rest/v1/rpc/release_role", {}, d)
    check(rows("roster", d) == [], "signed out: reads nothing")
    req("/rest/v1/rpc/set_year", {"y": "2026"}, org)
    s, _ = req("/rest/v1/heats", [{"id": "r0097", "doc": {}}], org)
    check(s >= 400, "past year open: nothing can be written")
    req("/rest/v1/rpc/set_year", {"y": "current"}, org)

    reset(org)
    print(f"\n{len(fails)} failed" if fails else "\nall passed")
    sys.exit(1 if fails else 0)

asyncio.run(main())
