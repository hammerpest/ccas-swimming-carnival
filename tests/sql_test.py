"""Tests supabase/01-setup.sql on a throwaway local Postgres (pgserver), before it goes near Supabase.
Supabase's own parts (auth.uid, storage, realtime) are replaced by small stand-ins.
Run: python3 tests/sql_test.py   (needs: pip install pgserver "psycopg[binary]")"""
import os, sys, tempfile, threading, uuid
import pgserver, psycopg

HERE = os.path.dirname(os.path.abspath(__file__))
SQL = os.path.join(HERE, "..", "supabase")
STUBS = """
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
end $$;
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated;
create schema if not exists storage;
create table if not exists storage.buckets (id text primary key, name text, public boolean);
create table if not exists storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
grant usage on schema storage to authenticated;
grant select, insert, update, delete on storage.objects to authenticated;
create schema if not exists realtime;
create table if not exists realtime.messages (id bigserial primary key, topic text, payload jsonb);
alter table realtime.messages enable row level security;
create or replace function realtime.topic() returns text language sql stable as
  $$ select current_setting('realtime.topic', true) $$;
grant usage on schema realtime to authenticated;
grant select, insert on realtime.messages to authenticated;
grant usage on sequence realtime.messages_id_seq to authenticated;
do $$ begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then create publication supabase_realtime; end if;
end $$;
"""
HASH = {"marshal": "ad5c28bc", "judge": "e71d4378", "recorder": "37799a1c", "slips": "ac6c05b0", "announcer": "de198c1c", "org": "276fbdc"}
fails = []
def check(ok, name):
    print(("ok  " if ok else "FAIL"), name); ok or fails.append(name)

tmp = tempfile.mkdtemp(prefix="swim-pg-")
srv = pgserver.get_server(tmp, cleanup_mode="stop")
URI = srv.get_uri()
admin = psycopg.connect(URI, autocommit=True)
admin.execute(STUBS)
setup = open(os.path.join(SQL, "01-setup.sql")).read()
admin.execute(setup)
admin.execute(setup)  # safe to run twice
parents = open(os.path.join(SQL, "03-parent-results.sql")).read()
admin.execute(parents); admin.execute(parents)  # safe to run twice
admin.execute(open(os.path.join(SQL, "02-seed-test-students.sql")).read())
check(admin.execute("select jsonb_array_length(doc->'students') from roster where id='F'").fetchone()[0] == 310, "seed: 310 girls")

class Dev:
    """One device: its own anonymous user and connection."""
    def __init__(self):
        self.uid = str(uuid.uuid4())
        self.c = psycopg.connect(URI, autocommit=True)
        self.c.execute("set role authenticated")
        self.c.execute("select set_config('request.jwt.claim.sub', %s, false)", (self.uid,))
    def q(self, sql, args=()):
        return self.c.execute(sql, args).fetchall()
    def ok(self, sql, args=()):
        try: self.c.execute(sql, args); return True
        except psycopg.Error: return False
    def pin(self, role): return self.q("select claim_role(%s)", (HASH[role],))[0][0]

# nobody reads anything without a job
x = Dev()
check(x.q("select count(*) from roster")[0][0] == 0, "no job: cannot read students")
check(not x.ok("insert into times values ('r0001', '{}')"), "no job: cannot write times")
check(not x.ok("select next_race('x')"), "no job: cannot take a race number")
check(x.q("select claim_role('0000')")[0][0] is None, "wrong PIN refused")
check(not x.ok("select * from private.pins"), "page cannot read the PIN table")

# marshal
m = Dev(); check(m.pin("marshal") == "marshal", "Marshal PIN gives marshal")
check(m.q("select count(*) from roster")[0][0] == 2, "marshal reads students")
check(m.ok("insert into heats values ('r0001', '{\"race\":1}')"), "marshal writes heats")
check(m.ok("insert into extras values ('e1', '{}')"), "marshal writes extras")
check(not m.ok("insert into times values ('r0001', '{}')"), "Marshal PIN cannot write times")
check(not m.ok("insert into config values ('main', '{}') on conflict (id) do update set doc = excluded.doc"), "marshal cannot write config")
check([m.q("select next_race('m1')")[0][0] for _ in range(3)] == [1, 2, 3], "race numbers 1, 2, 3")

# two marshals sending at once: different numbers, no gaps, no repeats
got, lock = [], threading.Lock()
def send(dev, n):
    for _ in range(n):
        v = dev.q("select next_race('x')")[0][0]
        with lock: got.append(v)
m2 = Dev(); m2.pin("marshal")
ts = [threading.Thread(target=send, args=(d, 25)) for d in (m, m2)]
[t.start() for t in ts]; [t.join() for t in ts]
check(sorted(got) == list(range(4, 54)), "two marshals at once: 50 numbers, no gaps or repeats")

# recorder: deep merge keeps other lanes
r = Dev(); r.pin("recorder")
check(r.ok("select doc_update('times', 'r0001', '{\"lanes\":{\"1\":{\"t\":3412}},\"checked\":false}')"), "recorder writes a time")
r.q("select doc_update('times', 'r0001', '{\"lanes\":{\"2\":{\"t\":3500}}}')")
d = r.q("select doc from times where id='r0001'")[0][0]
check(d["lanes"]["1"]["t"] == 3412 and d["lanes"]["2"]["t"] == 3500 and d["checked"] is False, "update keeps the other lanes")
check(not r.ok("insert into heats values ('r0009', '{}')"), "recorder cannot write heats")
check(r.ok("select doc_update('heats', 'r0001', '{\"lanes\":{\"7\":\"t007\"}}')"), "recorder can fill a lane on a race already sent (2.2)")
check(not r.ok("select doc_update('heats', 'r0042', '{\"lanes\":{\"1\":\"t001\"}}')"), "recorder cannot make a new race (2.2)")
check(not r.ok("select doc_update('heats', 'r0001', '{\"race\":99}')"), "recorder can change only lanes, not the race (2.2)")
check(m.ok("select doc_update('heats', 'r0001', '{\"heat\":1}')"), "marshal can still change the whole race (2.2)")
check(not r.ok("select doc_update('pins', 'x', '{}')"), "doc_update refuses unknown collections")

# Swim Opt 2.7 (A1): the Recorder cancels a race or clears it for a re-swim, nothing more
check(r.ok("select doc_update('heats', 'r0001', '{\"cancelled\":true,\"cancelAt\":5}')"), "recorder can cancel a race (A1)")
check(r.ok("select doc_update('heats', 'r0001', '{\"cancelled\":false,\"gen\":1}')"), "recorder can bring a race back and clear it for a re-swim (A1)")
check(not r.ok("select doc_update('heats', 'r0001', '{\"k\":\"fly50\"}')"), "recorder still cannot change the event (A1)")

# judge, slips, announcer
j = Dev(); j.pin("judge")
check(j.ok("insert into finish values ('r0001', '{}')"), "judge writes finish")
check(not j.ok("select doc_update('times', 'r0001', '{\"lanes\":{}}')"), "judge cannot write times")
s = Dev(); s.pin("slips")
check(s.ok("insert into slips values ('r0001', '{}')") and s.ok("select doc_update('times', 'r0002', '{}')"), "time slips writes slips and times")
check(s.ok("insert into finish values ('r0003', '{}')"), "time slips writes places from the multitimer (121)")
# decision 136: a late slip keeps the Recorder's typed times
r.ok("""insert into times values ('r0007', '{"lanes":{"1":{"t":3500,"st":"ok","src":"typed"},"2":{"st":"DNS","src":"typed"},"3":{"t":3700,"st":"ok","src":"photo"}},"checked":true,"checkedAt":9}')""")
up = """insert into times values ('r0007', %s) on conflict (id) do update set doc = excluded.doc"""
check(s.ok(up, ('{"lanes":{"1":{"t":3510,"st":"ok","src":"photo"},"2":{"t":3900,"st":"ok","src":"photo"},"3":{"t":3700,"st":"ok","src":"photo"}},"src":"photo","checked":false}',)), "late slip saved")
d = r.q("select doc from times where id='r0007'")[0][0]
check(d["lanes"]["1"]["t"] == 3500 and d["lanes"]["1"]["slip"] == 3510 and d["lanes"]["2"]["st"] == "DNS" and d["lanes"]["2"]["slip"] == 3900, "late slip: typed lanes kept, slip time beside them (136)")
check(d["checked"] is True and d["checkedAt"] == 9, "late slip that changes nothing: still checked (136)")
s.ok(up, ('{"lanes":{"3":{"t":3650,"st":"ok","src":"photo"}},"src":"photo","checked":false}',))
d = r.q("select doc from times where id='r0007'")[0][0]
check(d["lanes"]["3"]["t"] == 3650 and d["lanes"]["1"]["t"] == 3500 and d["checked"] is False, "late slip changes an untyped lane: To check (136)")
s.ok(up, ('{"lanes":{"1":{"t":1,"st":"ok","src":"photo"}},"src":"photo","gen":1,"checked":false}',))
check(r.q("select doc->'lanes'->'1'->>'t' from times where id='r0007'")[0][0] == "1", "slip for a re-swum race starts fresh (134)")
# Swim Opt 2.11: a late multitimer send keeps the Recorder's typed times and statuses too
r.ok("""insert into times values ('r0008', '{"lanes":{"1":{"t":6500,"st":"ok","src":"typed"},"2":{"st":"DQ","src":"typed"}},"checked":false}')""")
up8 = """insert into times values ('r0008', %s) on conflict (id) do update set doc = excluded.doc"""
check(s.ok(up8, ('{"lanes":{"1":{"t":6620,"st":"ok","src":"multi"},"2":{"t":6800,"st":"ok","src":"multi"},"3":{"t":7000,"st":"ok","src":"multi"}},"src":"multi","checked":false}',)), "late multitimer send saved")
d = r.q("select doc from times where id='r0008'")[0][0]
check(d["lanes"]["1"]["t"] == 6500 and d["lanes"]["1"]["slip"] == 6620 and d["lanes"]["2"]["st"] == "DQ" and d["lanes"]["3"]["t"] == 7000, "late multitimer: typed lanes and DQ kept, multitimer time beside them (2.11)")
s.ok(up8, ('{"lanes":{"3":{"t":7050,"st":"ok","src":"multi"}},"src":"multi","checked":false}',))
check(r.q("select doc->'lanes'->'3'->>'t' from times where id='r0008'")[0][0] == "7050", "a second multitimer send replaces the first one's times (2.11)")
# Swim Opt 2.11: a send that waited in the queue from before a re-swim never replaces the re-swim's results
r.ok("""insert into times values ('r0010', '{"lanes":{"1":{"t":5000,"st":"ok","src":"typed"}},"gen":1}')""")
s.ok("""insert into times values ('r0010', '{"lanes":{"1":{"t":1,"st":"ok","src":"multi"}},"src":"multi","gen":0}') on conflict (id) do update set doc = excluded.doc""")
check(r.q("select doc->'lanes'->'1'->>'t' from times where id='r0010'")[0][0] == "5000", "2.11: old-gen multitimer times do not replace a re-swim")
admin_fin = """insert into finish values ('r0010', %s) on conflict (id) do update set doc = excluded.doc"""
s.ok(admin_fin, ('{"order":[[2]],"gen":1}',)); s.ok(admin_fin, ('{"order":[[1]],"gen":0}',))
check(r.q("select doc->'order'->0->>0 from finish where id='r0010'")[0][0] == "2", "2.11: old-gen multitimer places do not replace a re-swim")
s.ok(admin_fin, ('{"order":[[3]],"gen":1}',))
check(r.q("select doc->'order'->0->>0 from finish where id='r0010'")[0][0] == "3", "2.11: same-gen places still save")
# Swim Opt 2.12 (decision 154): multitimer places skip lanes marked DNS, DQ or No time, even for a late send
r.ok("""insert into times values ('r0011', '{"lanes":{"1":{"st":"DNS","src":"typed"},"3":{"st":"DQ","src":"multi","t":4000}},"gen":0}')""")
fin11 = """insert into finish values ('r0011', %s) on conflict (id) do update set doc = excluded.doc"""
check(s.ok(fin11, ('{"order":[[1],[2],[3],[4]],"seq":[1,2,3,4],"taps":[1,2,3,4,5,6],"n":4,"multi":true,"gen":0}',)), "late multitimer places saved")
d = r.q("select doc from finish where id='r0011'")[0][0]
check(d["order"] == [[2], [4], [5], [6]] and d["seq"] == [2, 4, 5, 6], "2.12: multitimer places skip DNS and DQ lanes (154)")
check(j.ok("""insert into finish values ('r0012', '{"order":[[1],[2]],"taps":[1,2],"multi":true,"gen":0}')"""), "judge saves places")
check(r.q("select doc->'order' from finish where id='r0012'")[0][0] == [[1], [2]], "2.12: Place Judge places are left alone")
# Swim Opt 2.11: updated_at is the server's clock, whatever the phone sends
r.ok("""insert into times values ('r0009', '{}', '2000-01-01') on conflict (id) do update set doc = excluded.doc, updated_at = excluded.updated_at""")
check(r.q("select updated_at > now() - interval '1 minute' from times where id='r0009'")[0][0], "updated_at: an old phone clock on insert is replaced by the server's (2.11)")
r.ok("""update times set updated_at = '2000-01-01' where id = 'r0009'""")
check(r.q("select updated_at > now() - interval '1 minute' from times where id='r0009'")[0][0], "updated_at: an old phone clock on update is replaced by the server's (2.11)")
check(s.ok("insert into storage.objects (bucket_id, name) values ('slips', 'r0001.jpg')"), "time slips uploads a photo")
check(not m.ok("insert into storage.objects (bucket_id, name) values ('slips', 'r0002.jpg')"), "marshal cannot upload a photo")
check(m.q("select count(*) from storage.objects")[0][0] == 1, "any job can see the photos")
check(x.q("select count(*) from storage.objects")[0][0] == 0, "no job: cannot see photos")
a = Dev(); a.pin("announcer")
check(a.q("select count(*) from heats")[0][0] == 1, "announcer reads")
check(not any(a.ok(f"insert into {t} values ('zz', '{{}}')") for t in ["heats", "times", "finish", "slips", "config", "extras"]), "announcer writes nothing")

# realtime presence channel
m.c.execute("select set_config('realtime.topic', 'carnival', false)")
check(m.ok("insert into realtime.messages (topic) values ('carnival')"), "a job can join the carnival channel")
x.c.execute("select set_config('realtime.topic', 'carnival', false)")
check(not x.ok("insert into realtime.messages (topic) values ('carnival')"), "no job: cannot join the carnival channel")

# organiser: PINs, lock, years
o = Dev(); check(o.pin("org") == "org", "organiser PIN")
check(o.ok("insert into config values ('main', %s) on conflict (id) do update set doc = excluded.doc",
           ('{"name":"Test","pins":{"marshal":"aaaa1111","judge":"e71d4378"}}',)), "organiser changes the Marshal PIN")
cfg = o.q("select doc from config where id='main'")[0][0]
check(cfg["pins"] == {"marshal": "set"}, "config keeps only 'set', never the hash")
check(Dev().pin("marshal") is None, "old Marshal PIN no longer works")
check(Dev().q("select claim_role('aaaa1111')")[0][0] == "marshal", "new Marshal PIN works")
check(not o.ok("insert into config values ('main', %s) on conflict (id) do update set doc = excluded.doc",
               ('{"pins":{"judge":"aaaa1111"}}',)), "two jobs cannot share a PIN")
check(o.q("select doc->'pins' from config where id='main'")[0][0] == {"marshal": "set"}, "a refused PIN change keeps the old PINs")
check(o.q("select check_pin('org', %s)", (HASH["org"],))[0][0] is True, "check_pin: organiser PIN")
check(m.q("select check_pin('org', %s)", (HASH["org"],))[0][0] is False, "check_pin: only the organiser can ask")
o.q("select doc_update('config', 'main', '{\"locked\":true}')")
check(not m.ok("insert into heats values ('r0050', '{}')") and not m.ok("select next_race('x')"), "locked: marshal cannot write")
check(m.q("select count(*) from heats")[0][0] == 1, "locked: marshal can still look")
check(not r.ok("select doc_update('heats', 'r0001', '{\"lanes\":{\"6\":\"t006\"}}')"), "locked: recorder cannot change lanes (2.2)")
check(o.ok("insert into heats values ('r0050', '{}')"), "locked: organiser can still write")
o.q("select doc_update('config', 'main', '{\"locked\":false}')")
o.q("select set_year('2026')")
check(not o.ok("insert into heats values ('r0051', '{}')"), "past year open: organiser cannot write")
check(not o.ok("insert into archive values ('2026-data', '{}')"), "a past year cannot be written")
o.q("select set_year('current')")
check(o.ok("insert into archive values ('2026-data', '{}')"), "current year: organiser keeps a year")
check(not m.ok("insert into archive values ('2027-data', '{}')") and not m.ok("insert into years values ('2027', '{}')"), "marshal cannot write archive or years")
check(m.q("select count(*) from archive")[0][0] == 1, "jobs can read kept years")

# too many wrong PINs
b = Dev()
for _ in range(5): b.q("select claim_role('0000')")
check(b.pin("judge") is None, "after 5 wrong PINs, even the right PIN waits")
b.q("select release_role()")

# sign out
check(m.q("select my_role()")[0][0] == "marshal", "my_role")
m.q("select release_role()")
check(m.q("select count(*) from roster")[0][0] == 0, "signed out: cannot read")

# results for parents (Swim Opt 2.8, 2.19): no sign-in, off until turned on, codes not ids, names only when chosen,
# unfinished events held back unless "show before final" is ticked
import json as _json
pa = psycopg.connect(URI, autocommit=True); pa.execute("set role anon")
pr = lambda have="": pa.execute("select parent_results(%s)", (have,)).fetchone()[0]
check(pr() == {"off": True}, "parents: nothing until parent results are turned on")
check(pa.execute("select count(*) from information_schema.role_table_grants where grantee='anon' and table_schema='public'").fetchone()[0] == 0, "parents: no table access, only the function")
admin.execute("insert into config (id, doc) values ('main', '{}') on conflict (id) do nothing")
admin.execute("update config set doc = doc || '{\"parents\": true, \"pins\": {\"x\": 1}}' where id = 'main'")
admin.execute("delete from heats"); admin.execute("delete from extras"); admin.execute("delete from times"); admin.execute("delete from finish")
st = admin.execute("select doc->'students'->0 from roster where id='F'").fetchone()[0]
st1 = admin.execute("select doc->'students'->1 from roster where id='F'").fetchone()[0]
H = lambda rid, doc: admin.execute("insert into heats (id, doc) values (%s, %s) on conflict (id) do update set doc = excluded.doc", (rid, _json.dumps(doc)))
T = lambda rid, doc: admin.execute("insert into times (id, doc) values (%s, %s) on conflict (id) do update set doc = excluded.doc", (rid, _json.dumps(doc)))
F = lambda rid, doc: admin.execute("insert into finish (id, doc) values (%s, %s) on conflict (id) do update set doc = excluded.doc", (rid, _json.dumps(doc)))
# race 50: a finished 50 m freestyle (one heat, places in); a relay team in lane 5
H("r0050", {"race": 50, "k": "free50", "x": "F", "g": st["g"], "heat": 1, "lanes": {"4": st["id"], "5": "B-A"}, "dev": "secret-device"})
T("r0050", {"lanes": {"4": {"t": 3500, "st": "ok", "src": "photo", "chk": False}, "5": {"t": 3600, "st": "ok"}}, "checked": False, "checkedBy": "secret-device", "by": "secret-device"})
F("r0050", {"order": [[4], [5]], "ok": True, "dev": "secret-device"})
# races 60 and 61: a 50 m backstroke in two heats; heat 1 is in, heat 2 has no times yet. An id the list does not know in heat 2.
H("r0060", {"race": 60, "k": "back50", "x": "F", "g": st1["g"], "heat": 1, "lanes": {"3": st1["id"]}})
T("r0060", {"lanes": {"3": {"t": 4100, "st": "ok"}}}); F("r0060", {"order": [[3]], "ok": True})
H("r0061", {"race": 61, "k": "back50", "x": "F", "g": st1["g"], "heat": 2, "lanes": {"2": "Ghost-Removed-1999", "6": ""}})
admin.execute("insert into records (id, doc) values ('all', %s) on conflict (id) do update set doc = excluded.doc", (_json.dumps({"list": [{"key": "free50|F|13", "t": 3000, "holders": [{"n": "Test: Jane Mary Citizen", "h": "B", "y": "2019"}]}]}),))
d = pr(); raw = _json.dumps(d)
check(not d.get("off") and len(d["heats"]) == 3, "parents: heats come through")
check("secret-device" not in raw and "checkedBy" not in raw and "pins" not in d["config"], "parents: no device ids or PIN settings")
code = [h for h in d["heats"] if h["_id"] == "r0050"][0]["lanes"]["4"]
check(st["id"] not in raw and st1["id"] not in raw and code.startswith("p") and len(code) == 11, "parents: no student id anywhere, a code instead")
check([h for h in d["heats"] if h["_id"] == "r0050"][0]["lanes"]["5"] == "B-A", "parents: relay teams keep their names")
gh = [h for h in d["heats"] if h["_id"] == "r0061"][0]["lanes"]
check("Ghost" not in raw and gh["2"].startswith("p") and len(gh["2"]) == 11 and "6" not in gh, "parents: an id the student list does not know is hashed (fails closed); empty lanes are left out")
check(sorted(x["id"] for x in d["students"]) == sorted([code, [h for h in d["heats"] if h["_id"] == "r0060"][0]["lanes"]["3"]]), "parents: only swimmers who are in a heat")
check(all(x["f"] == "Swimmer" and x["s"] == "" for x in d["students"]) and st["f"] not in raw and st["s"] not in raw, "parents: names off by default, no name leaves the server")
check(d["records"][0]["holders"][0]["n"] == "A swimmer" and "Citizen" not in raw, "parents: record holders are A swimmer when names are off")
check(d["config"]["parentsNames"] == "none" and d["config"]["parentsProv"] is False, "parents: the page is told names are off and show before final is off")
check("r0050" in d["times"] and "r0050" in d["finish"], "parents: a finished event's times and places come through")
check("r0060" not in d["times"] and "r0060" not in d["finish"] and "r0061" not in d["times"], "parents: an event with a heat not in is held back, every heat of it")
hin = {h["_id"]: h.get("in") for h in d["heats"]}
check(hin["r0060"] is True and hin["r0061"] is False and hin["r0050"] is None, "parents: held-back heats say whether they are in, for the heats-in count")
check(set(d["times"]["r0050"]["lanes"]["4"]) == {"t", "st", "slip"}, "parents: times carry only what the results need")
check(pr(d["v"]) == {"v": d["v"], "same": True} and len(_json.dumps(pr(d["v"]))) < 200, "parents: the same version gives a tiny answer")
check(not admin.execute("select has_table_privilege('anon', 'private.parent_secret', 'select')").fetchone()[0], "parents: the secret cannot be read")
# a swimmer keeps their code when others are added
H("r0051", {"race": 51, "k": "free50", "x": "F", "g": st["g"], "heat": 2, "lanes": {"1": "a-aaa-first-1"}})
check([h for h in pr()["heats"] if h["_id"] == "r0050"][0]["lanes"]["4"] == code, "parents: a swimmer keeps their code when others are added")
admin.execute("delete from heats where id = 'r0051'")
# names on: first initial and surname (decision 168)
admin.execute("update config set doc = doc || '{\"parentsNames\": \"short\"}' where id = 'main'")
d = pr(); raw = _json.dumps(d)
me = [x for x in d["students"] if x["id"] == code][0]
check(me["f"] == st["f"][0] and me["s"] == st["s"], "parents: names on gives first initial and surname (" + st["f"][0] + " " + st["s"] + ")")
check(st["f"] not in raw or st["f"] == st["f"][0], "parents: names on still never sends the first name")
check(d["records"][0]["holders"][0]["n"] == "J Citizen", "parents: record holders as first initial and surname")
# Swim Opt 2.22 (decision 171): two swimmers with the same first initial and surname show two letters of the first name
twin = {"id": "a-twin-2-22", "f": st["f"][0] + "q", "s": st["s"], "h": st["h"], "x": st["x"], "g": st["g"]}
admin.execute("insert into extras (id, doc) values (%s, %s) on conflict (id) do update set doc = excluded.doc", (twin["id"], _json.dumps(twin)))
H("r0052", {"race": 52, "k": "free50", "x": "F", "g": st["g"], "heat": 3, "lanes": {"2": twin["id"]}})
d = pr(); me = [x for x in d["students"] if x["id"] == code][0]; others = [x for x in d["students"] if x["s"] == st["s"] and x["id"] != code and x["f"][0] == st["f"][0]]
check(me["f"] == st["f"][:2] and len(others) == 1 and others[0]["f"] == twin["f"][:2], "parents: same first initial and surname show two letters (" + me["f"] + " and " + others[0]["f"] + " " + st["s"] + ")")
check(all(len(x["f"]) == 1 for x in d["students"] if x["id"] != code and x not in others), "parents: everyone else keeps one letter " + str([(x["f"], x["s"]) for x in d["students"]]))
admin.execute("delete from heats where id = 'r0052'"); admin.execute("delete from extras where id = %s", (twin["id"],))
check([x for x in pr()["students"] if x["id"] == code][0]["f"] == st["f"][0], "parents: back to one letter when the clash is gone")
admin.execute("update config set doc = doc || '{\"parentsNames\": \"full\"}' where id = 'main'")
check(all(x["f"] == "Swimmer" for x in pr()["students"]), "parents: any other names setting counts as off")
# show before final ticked: the unfinished event comes through
admin.execute("update config set doc = doc || '{\"parentsNames\": \"none\", \"parentsProv\": true}' where id = 'main'")
d = pr()
check("r0060" in d["times"] and "r0060" in d["finish"] and all(h.get("in") is None for h in d["heats"]), "parents: show before final ticked sends unfinished events")
admin.execute("update config set doc = doc || '{\"parentsProv\": false}' where id = 'main'")
# heat 2 of the backstroke comes in: all DNS and no places still counts as in, so the event comes through
T("r0061", {"lanes": {"2": {"t": None, "st": "DNS"}}})
check("r0060" in pr()["times"], "parents: once every heat is in (here all DNS, no places) the event comes through")
# a re-swum race: the earlier run's times do not count, so the event is held back again
H("r0061", {"race": 61, "k": "back50", "x": "F", "g": st1["g"], "heat": 2, "gen": 1, "lanes": {"2": st1["id"]}})
check("r0060" not in pr()["times"], "parents: a re-swum heat with only the earlier run's times holds the event back")
# a cancelled heat does not hold an event back
H("r0061", {"race": 61, "k": "back50", "x": "F", "g": st1["g"], "heat": 2, "cancelled": True, "lanes": {"2": st1["id"]}})
check("r0060" in pr()["times"], "parents: a cancelled heat does not hold the event back")
# odd records (check 3): gen 1.0, ok 2 and a heat with no race number never break the answer or hold a finished event back
H("r0061", {"race": 61, "k": "back50", "x": "F", "g": st1["g"], "heat": 2, "gen": 1.0, "lanes": {"2": st1["id"]}})
T("r0061", {"gen": 1.0, "lanes": {"2": {"t": 4300, "st": "ok"}}}); F("r0061", {"gen": 1, "order": [], "ok": 2})
H("r0062", {"race": None, "k": "back50", "x": "F", "g": st1["g"], "heat": 3, "lanes": {"1": st1["id"]}})
try:
    dd = pr(); okq = True
except Exception as e:
    dd = {}; okq = False
check(okq and "r0060" in dd.get("times", {}) and "r0061" in dd.get("times", {}), "parents: odd values (gen 1.0, ok 2, a heat with no race) are read like the app and do not hold a finished event back")
admin.execute("delete from heats where id = 'r0062'")
admin.execute("update config set doc = doc || '{\"parents\": false}' where id = 'main'")
check(pr() == {"off": True}, "parents: turned off again")
admin.execute("delete from heats"); admin.execute("delete from times"); admin.execute("delete from finish"); admin.execute("delete from records")

srv.cleanup()
print(f"\n{len(fails)} failed" if fails else "\nall passed")
sys.exit(1 if fails else 0)
