"""Fill the staging Supabase project with a made-up carnival day (about 110 races).
Run: ../.venv/bin/python tools/simday.py fill   or   ... undo  (undo puts staging back to empty, as before)."""
import io, json, math, os, random, sys, time, datetime
T = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "tests")
src = open(os.path.join(T, "supabase_live.py")).read().split("async def main")[0]
src = src.replace("HERE = os.path.dirname(os.path.abspath(__file__))", f"HERE={T!r}")
exec(src)
from PIL import Image, ImageDraw, ImageFont

random.seed(2027)
org = device("org"); req("/rest/v1/rpc/set_year", {"y": "current"}, org)

def put(tbl, rows_):
    for i in range(0, len(rows_), 40):
        s, r = req(f"/rest/v1/{tbl}", rows_[i:i + 40], org, method="POST")
        if s >= 300: raise SystemExit(f"{tbl}: {s} {r}")

def undo():
    for t in ["heats", "times", "finish", "slips", "extras", "records"]:
        req(f"/rest/v1/{t}?id=neq.__none__", tok=org, method="DELETE")
    s, objs = req("/storage/v1/object/list/slips", {"prefix": "", "limit": 1000}, org)
    if isinstance(objs, list) and objs:
        req("/storage/v1/object/slips", {"prefixes": [o["name"] for o in objs]}, org, method="DELETE")
    req("/rest/v1/counter?id=eq.race", tok=org, method="DELETE")
    put("counter", [{"id": "race", "doc": {"next": 1, "at": int(time.time() * 1000)}}])
    print("staging cleared: no races, slips, photos or records; race number back to 1; students and settings kept")

if sys.argv[1] == "undo": undo(); sys.exit()

# ---------- the made-up day ----------
studs = []
for r in rows("roster", org): studs += r["doc"]["students"]
skill = {s["id"]: random.gauss(0, 1) for s in studs}
cfg = rows("config", org)[0]["doc"]
order = [p["k"] for p in cfg["program"] if p["on"]]
GROUPS = {"age": ["13", "14", "15", "16", "17", "18"], "band": ["J", "I", "S"], "open": ["O"]}
GK = {"fly50": "age", "back50": "age", "free50": "age", "free100": "age", "breast50": "age", "free200": "band", "relayfree": "band", "relaymed": "open"}
BAND = {"J": ["13", "14"], "I": ["15", "16"], "S": ["17", "18"]}
F50 = {"F": {"13": 4000, "14": 3850, "15": 3750, "16": 3650, "17": 3600, "18": 3550}, "M": {"13": 3800, "14": 3550, "15": 3350, "16": 3200, "17": 3100, "18": 3050}}
MULT = {"free50": 1.0, "back50": 1.17, "fly50": 1.2, "breast50": 1.32, "free100": 2.25, "free200": 4.9}
LIM = cfg["limits"]
TEAMS = ["B-A", "B-B", "J-A", "J-B", "N-A", "N-B"]
team_sk = {t: random.gauss(0, 1) for t in TEAMS}

groups = []
for k in order:
    for g in GROUPS[GK[k]]:
        for x in "FM": groups.append((k, x, g))
indiv = [gr for gr in groups if not gr[0].startswith("relay")]
two = set(random.sample(range(len(indiv)), 110 - len(groups)))  # groups with 2 heats, so the day has 110 races

def swim_time(k, x, ages, sid):
    base = sum(F50[x][a] for a in ages) / len(ages) * MULT[k]
    t = base * (1 + 0.11 * skill[sid] + random.gauss(0, 0.025))
    lo, hi = LIM[k]; return int(max(lo + 150, min(hi - 300, round(t))))

day = datetime.datetime.now().replace(hour=8, minute=55, second=0, microsecond=0)
heats, times, finish, slips, photos = [], [], [], [], {}
race = 0; specials = {"swap": 0, "dns": 0, "dq": 0, "nt": 0, "tie": 0}
best = {}  # group key -> winning time, for the records
for gi, (k, x, g) in enumerate(groups):
    relay = k.startswith("relay")
    if relay:
        entrants = [TEAMS[:]]
    else:
        ages = BAND[g] if GK[k] == "band" else [g]
        pool = [s["id"] for s in studs if s["x"] == x and s["g"] in ages]
        nh = 2 if indiv.index((k, x, g)) in two else 1
        n = random.randint(11, 16) if nh == 2 else random.randint(5, 8)
        picked = random.sample(pool, min(n, len(pool)))
        half = math.ceil(len(picked) / nh)
        entrants = [picked[i:i + half] for i in range(0, len(picked), half)]
    for hn, ent in enumerate(entrants, 1):
        race += 1; rid = "r" + str(race).zfill(4)
        at = int((day + datetime.timedelta(minutes=2.9 * race)).timestamp() * 1000)
        lanes_avail = [4, 5, 3, 6, 2, 7, 1, 8]
        lanes = {}
        for i, sid in enumerate(ent): lanes[str(sorted(lanes_avail[:len(ent)])[i])] = sid
        lanes = dict(sorted(lanes.items(), key=lambda kv: int(kv[0])))
        heats.append({"id": rid, "doc": {"race": race, "k": k, "x": x, "g": g, "heat": hn, "lanes": lanes, "at": at, "dev": "sim"}})
        tl = {}
        for l, sid in lanes.items():
            if relay:
                base = sum(F50[x][a] for a in (BAND[g] if g in BAND else ["15", "16", "17"])) / (2 if g in BAND else 3) * 4 * (1.12 if k == "relaymed" else 0.98)
                tl[l] = int(base * (1 + 0.05 * team_sk[sid] + random.gauss(0, 0.02)))
            else:
                tl[l] = swim_time(k, x, ages, sid)
        st = {}
        if not relay and len(lanes) >= 6:
            if specials["dns"] < 4 and race % 9 == 4: l = random.choice(list(lanes)); st[l] = "DNS"; specials["dns"] += 1
            elif specials["dq"] < 2 and race % 17 == 8: l = random.choice(list(lanes)); st[l] = "DQ"; specials["dq"] += 1
            elif specials["nt"] < 1 and race == 61: l = random.choice(list(lanes)); st[l] = "NT"; specials["nt"] += 1
        # a tie across heats: heat 2's winner touches in the same time as heat 1's winner
        if hn == 2 and ((specials["tie"] == 0 and race > 30) or (specials["tie"] == 1 and race > 80)):
            h1 = times[-1]["doc"]["lanes"]; w1 = min(v["t"] for v in h1.values() if v["t"] is not None and v["st"] == "ok")
            lw = min((l for l in tl if l not in st), key=lambda l: tl[l]); tl[lw] = w1; specials["tie"] += 1
        timed = sorted((l for l in tl if l not in st or st[l] == "DQ"), key=lambda l: tl[l])
        ranked = [l for l in timed if st.get(l) != "DQ"]
        place = ranked[:4]
        # the Place Judge sometimes saw 2nd and 3rd the other way round (the times go pink)
        if specials["swap"] < 5 and race % 11 == 3 and len(place) >= 3 and tl[place[2]] - tl[place[1]] < 40:
            place[1], place[2] = place[2], place[1]; specials["swap"] += 1
        on_slip = {l: tl[l] for l in tl if st.get(l) not in ("DNS", "NT")}
        lanes_doc = {}
        for l in lanes:
            if st.get(l) in ("DNS", "NT"): lanes_doc[l] = {"t": None, "st": st[l], "src": "typed", "keep": False, "chk": False, "slip": None}
            elif st.get(l) == "DQ": lanes_doc[l] = {"t": tl[l], "st": "DQ", "src": "typed", "keep": False, "chk": False, "slip": None}
            else: lanes_doc[l] = {"t": tl[l], "st": "ok", "src": "photo", "keep": False, "chk": False}
        ck = at + 150000
        times.append({"id": rid, "doc": {"lanes": lanes_doc, "src": "photo", "checked": True, "checkedAt": ck, "gen": 0, "by": "sim", "at": at + 120000}})
        finish.append({"id": rid, "doc": {"order": [[int(l)] for l in place], "seq": [int(l) for l in place], "undo": [], "gen": 0, "ck": 0, "ok": True, "at": at + 60000, "dev": "sim"}})
        slips.append({"id": rid, "doc": {"race": race, "read": on_slip, "unsure": [], "miss": False, "missed": [], "mism": False, "two": False, "gen": 0, "at": at + 90000, "dev": "sim", "test": False}})
        photos[rid] = (race, at, on_slip)
        key = f"{k}|{x}|{g}"
        okt = [tl[l] for l in ranked]
        if okt: best[key] = min(min(okt), best.get(key, 10 ** 9))

# made-up records: most stand, about 8 are broken and 2 equalled today
recs = []; names = ["A. Carter", "B. Nguyen", "C. Walsh", "D. Okafor", "E. Rossi", "F. Tan", "G. Hughes", "H. Patel"]
keys = list(best)
brk = set(random.sample(keys, 8)); eq = set(random.sample([k_ for k_ in keys if k_ not in brk], 2))
for i, key in enumerate(keys):
    b = best[key]
    t = b + random.randint(20, 120) if key in brk else b if key in eq else b - random.randint(30, 400)
    recs.append({"key": key, "t": int(t), "holders": [{"n": "Test: " + names[i % len(names)], "h": "BJN"[i % 3], "y": str(2012 + i % 13)}]})

# ---------- slip photos, drawn like a Swiss Timing slip (decision 110) ----------
def fmt(cs):
    s = cs / 100
    return f"{int(s // 60)}:{s % 60:05.2f}" if s >= 60 else f"{s:.2f}"
def clock(ms):
    d = datetime.datetime.fromtimestamp(ms / 1000); return d.strftime("%H:%M:%S") + ".%02d" % (d.microsecond // 10000)
try: font = ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", 22)
except Exception: font = ImageFont.load_default()
def slip_img(race, at, on_slip):
    lines = [f"LANE MODE 1/ {race}", "", f"start   {clock(at)}", ""]
    for l in sorted(on_slip, key=lambda l: on_slip[l]):
        lines += [f"stop {l}  {clock(at + on_slip[l] * 10)}", f"  sec    {fmt(on_slip[l])}", ""]
    h = 60 + 30 * len(lines)
    im = Image.new("RGB", (340, h), (246, 244, 236)); d = ImageDraw.Draw(im)
    for i, ln in enumerate(lines): d.text((30, 30 + i * 30), ln, fill=(40, 40, 48), font=font)
    bg = Image.new("RGB", (420, h + 80), (120, 120, 126)); bg.paste(im.rotate(random.uniform(-2, 2), expand=False, fillcolor=(246, 244, 236)), (40, 40))
    b = io.BytesIO(); bg.save(b, "JPEG", quality=70); return b.getvalue()

undo()
put("heats", heats); put("times", times); put("finish", finish); put("slips", slips)
put("records", [{"id": "all", "doc": {"list": recs}}])
req("/rest/v1/counter?id=eq.race", tok=org, method="DELETE")
put("counter", [{"id": "race", "doc": {"next": race + 1, "at": int(time.time() * 1000)}}])
for rid, (rc, at, on_slip) in photos.items():
    s, r = req(f"/storage/v1/object/slips/{rid}.jpg", tok=org, raw=slip_img(rc, at, on_slip), ctype="image/jpeg", method="POST")
    if s >= 300: print("photo", rid, s, r)
print(f"{race} races in {len(groups)} groups; {sum(1 for h in heats if h['doc']['heat'] == 2)} second heats; specials {specials}; records {len(recs)} (broken 8, equalled 2)")
