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

# judge, slips, announcer
j = Dev(); j.pin("judge")
check(j.ok("insert into finish values ('r0001', '{}')"), "judge writes finish")
check(not j.ok("select doc_update('times', 'r0001', '{\"lanes\":{}}')"), "judge cannot write times")
s = Dev(); s.pin("slips")
check(s.ok("insert into slips values ('r0001', '{}')") and s.ok("select doc_update('times', 'r0002', '{}')"), "time slips writes slips and times")
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

srv.cleanup()
print(f"\n{len(fails)} failed" if fails else "\nall passed")
sys.exit(1 if fails else 0)
