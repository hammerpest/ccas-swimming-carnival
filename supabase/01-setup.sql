-- CCAS Swimming Carnival, Swim Opt 2.0: database setup for Supabase.
-- Paste the whole file into the Supabase SQL editor and press Run. Safe to run again.
--
-- One table per collection. Each row is one document: id, doc (JSON), updated_at.
-- Security: each device signs in anonymously, then claim_role(PIN hash) gives it a job.
-- Row-level security reads that job to decide what the device can read and write.

-- ---------- private schema (never reachable from the page) ----------
create schema if not exists private;
revoke all on schema private from public, anon;

create table if not exists private.pins (
  role text primary key,
  hash text not null,
  test_hash text not null
);
create table if not exists private.sessions (
  user_id uuid primary key,
  role text not null,
  year text,
  at timestamptz not null default now()
);
create table if not exists private.pin_tries (
  user_id uuid not null,
  at timestamptz not null default now()
);
create index if not exists pin_tries_at on private.pin_tries (at);
alter table private.pins enable row level security;
alter table private.sessions enable row level security;
alter table private.pin_tries enable row level security;
revoke all on all tables in schema private from public, anon, authenticated;

-- Test PINs (decision 88): Marshal 1111, Place Judge 2222, Recorder 3333, Time Slips 4444,
-- Announcer 5555, Carnival Organiser 9999. Stored as the same hash the page makes.
-- Running this file again keeps any PIN already changed.
insert into private.pins (role, hash, test_hash) values
  ('marshal',   'ad5c28bc', 'ad5c28bc'),
  ('judge',     'e71d4378', 'e71d4378'),
  ('recorder',  '37799a1c', '37799a1c'),
  ('slips',     'ac6c05b0', 'ac6c05b0'),
  ('announcer', 'de198c1c', 'de198c1c'),
  ('org',       '276fbdc',  '276fbdc')
on conflict (role) do nothing;

-- ---------- document tables ----------
do $$
declare t text;
begin
  foreach t in array array['config','roster','extras','heats','times','finish','slips','records','counter','years','archive'] loop
    execute format('create table if not exists public.%I (id text primary key, doc jsonb not null, updated_at timestamptz not null default now())', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- ---------- helpers ----------
create or replace function private.my_role() returns text
language sql stable security definer set search_path = '' as $$
  select role from private.sessions where user_id = auth.uid()
$$;

create or replace function private.in_past() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select year is not null from private.sessions where user_id = auth.uid()), false)
$$;

create or replace function private.is_locked() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select (doc->>'locked')::boolean from public.config where id = 'main'), false)
$$;

-- Who can write each collection. The organiser writes everything (but not while a past year is open).
-- When results are locked, only the organiser can write.
create or replace function private.can_write(tbl text) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare r text := private.my_role();
begin
  if r is null or private.in_past() then return false; end if;
  if r = 'org' then return true; end if;
  if private.is_locked() then return false; end if;
  return case tbl
    when 'heats'  then r = 'marshal'
    when 'extras' then r = 'marshal'
    when 'finish' then r = 'judge'
    when 'times'  then r in ('recorder', 'slips')
    when 'slips'  then r = 'slips'
    when 'photos' then r = 'slips'
    else false
  end;
end $$;

-- Deep merge, the same as the page's update() in test mode.
create or replace function private.jsonb_merge(a jsonb, b jsonb) returns jsonb
language sql immutable set search_path = '' as $$
  select case when jsonb_typeof(a) = 'object' then a else '{}'::jsonb end
    || coalesce((
      select jsonb_object_agg(k, case
        when jsonb_typeof(v) = 'object' and jsonb_typeof(a->k) = 'object' then private.jsonb_merge(a->k, v)
        else v end)
      from jsonb_each(b) as e(k, v)
    ), '{}'::jsonb)
$$;

grant usage on schema private to authenticated;
revoke all on all functions in schema private from public, anon;
grant execute on function private.my_role(), private.in_past(), private.is_locked(),
  private.can_write(text), private.jsonb_merge(jsonb, jsonb) to authenticated;

-- ---------- row-level security on the document tables ----------
do $$
declare t text;
begin
  foreach t in array array['config','roster','extras','heats','times','finish','slips','records','counter','years','archive'] loop
    execute format('drop policy if exists "job can read" on public.%I', t);
    execute format('drop policy if exists "job can add" on public.%I', t);
    execute format('drop policy if exists "job can change" on public.%I', t);
    execute format('drop policy if exists "job can delete" on public.%I', t);
    execute format('create policy "job can read" on public.%I for select to authenticated using (private.my_role() is not null)', t);
    execute format('create policy "job can add" on public.%I for insert to authenticated with check (private.can_write(%L))', t, t);
    execute format('create policy "job can change" on public.%I for update to authenticated using (private.can_write(%L)) with check (private.can_write(%L))', t, t, t);
    execute format('create policy "job can delete" on public.%I for delete to authenticated using (private.can_write(%L))', t, t);
  end loop;
end $$;

-- Swim Opt 2.2 (decision 114): the Recorder may fill or change lanes, but only on a race already sent
-- (the heat row must exist), and not when results are locked or a past year is open.
create or replace function private.recorder_heat(row_id text) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.my_role() = 'recorder' and not private.in_past() and not private.is_locked()
    and exists (select 1 from public.heats h where h.id = row_id)
$$;
revoke all on function private.recorder_heat(text) from public, anon;
grant execute on function private.recorder_heat(text) to authenticated;
drop policy if exists "job can add" on public.heats;
drop policy if exists "job can change" on public.heats;
create policy "job can add" on public.heats for insert to authenticated
  with check (private.can_write('heats') or private.recorder_heat(id));
create policy "job can change" on public.heats for update to authenticated
  using (private.can_write('heats') or private.recorder_heat(id))
  with check (private.can_write('heats') or private.recorder_heat(id));

-- ---------- PINs ----------
-- Every wrong PIN is counted. More than 5 wrong in 5 minutes on one device,
-- or 100 wrong in 10 minutes in total, and every PIN is refused for a while.
create or replace function private.too_many_tries() returns boolean
language sql stable security definer set search_path = '' as $$
  select (select count(*) from private.pin_tries where user_id = auth.uid() and at > now() - interval '5 minutes') >= 5
      or (select count(*) from private.pin_tries where at > now() - interval '10 minutes') >= 100
$$;

create or replace function public.claim_role(pin_hash text) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := auth.uid(); r text;
begin
  if uid is null then return null; end if;
  delete from private.pin_tries where at < now() - interval '1 day';
  if private.too_many_tries() then return null; end if;
  select role into r from private.pins where hash = pin_hash;
  if r is null then
    insert into private.pin_tries (user_id) values (uid);
    return null;
  end if;
  insert into private.sessions (user_id, role, year, at) values (uid, r, null, now())
    on conflict (user_id) do update set role = excluded.role, year = null, at = now();
  return r;
end $$;

create or replace function public.my_role() returns text
language sql stable security definer set search_path = '' as $$
  select private.my_role()
$$;

create or replace function public.release_role() returns void
language sql volatile security definer set search_path = '' as $$
  delete from private.sessions where user_id = auth.uid()
$$;

-- Only the organiser picks the year (decision 95). 'current' means the live carnival.
create or replace function public.set_year(y text) returns void
language sql volatile security definer set search_path = '' as $$
  update private.sessions set year = nullif(y, 'current') where user_id = auth.uid() and role = 'org'
$$;

-- Used by Start a new carnival, which asks for the organiser PIN again.
create or replace function public.check_pin(job text, pin_hash text) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare ok boolean;
begin
  if private.my_role() is distinct from 'org' or private.too_many_tries() then return false; end if;
  ok := exists (select 1 from private.pins where role = job and hash = pin_hash);
  if not ok then insert into private.pin_tries (user_id) values (auth.uid()); end if;
  return ok;
end $$;

-- The organiser changes PINs by saving config/main with pins in it.
-- The hashes go into private.pins; config/main only keeps "set" for each changed PIN,
-- so no job can read a PIN hash. Every PIN must be different.
create or replace function private.config_pins() returns trigger
language plpgsql security definer set search_path = '' as $$
declare k text; v text; marks jsonb;
begin
  if new.id <> 'main' then return new; end if;
  if jsonb_typeof(new.doc->'pins') = 'object' then
    for k, v in select key, value #>> '{}' from jsonb_each(new.doc->'pins') loop
      if v is not null and v <> 'set' then
        update private.pins set hash = v where role = k;
      end if;
    end loop;
    if (select count(distinct hash) from private.pins) < (select count(*) from private.pins) then
      raise exception 'Every PIN must be different' using errcode = '23505';
    end if;
  end if;
  select coalesce(jsonb_object_agg(role, 'set'), '{}'::jsonb) into marks from private.pins where hash <> test_hash;
  new.doc := jsonb_set(new.doc, '{pins}', marks);
  return new;
end $$;

drop trigger if exists config_pins on public.config;
create trigger config_pins before insert or update on public.config
  for each row execute function private.config_pins();

-- ---------- race numbers (decisions 40 and 42) ----------
-- One sequence all day. The row lock makes two marshals pressing at once wait in turn,
-- so numbers come out in arrival order with no gaps or repeats.
create or replace function public.next_race(dev text) returns integer
language plpgsql volatile security definer set search_path = '' as $$
declare n integer; r text := private.my_role();
begin
  if r is null or r not in ('marshal', 'org') or private.in_past() or (r <> 'org' and private.is_locked()) then
    raise exception 'This job cannot send heats' using errcode = '42501';
  end if;
  insert into public.counter (id, doc) values ('race', '{"next":1}') on conflict (id) do nothing;
  select coalesce((doc->>'next')::integer, 1) into n from public.counter where id = 'race' for update;
  update public.counter
    set doc = jsonb_build_object('next', n + 1, 'by', dev, 'at', floor(extract(epoch from now()) * 1000)::bigint),
        updated_at = now()
    where id = 'race';
  return n;
end $$;

-- ---------- update() with a deep merge, checked by row-level security ----------
create or replace function public.doc_update(tbl text, doc_id text, patch jsonb) returns void
language plpgsql volatile security invoker set search_path = '' as $$
begin
  if tbl not in ('config','roster','extras','heats','times','finish','slips','records','counter','years','archive') then
    raise exception 'Unknown collection %', tbl using errcode = '22023';
  end if;
  execute format(
    'insert into public.%I as t (id, doc, updated_at) values ($1, $2, now())
     on conflict (id) do update set doc = private.jsonb_merge(t.doc, excluded.doc), updated_at = now()', tbl)
    using doc_id, patch;
end $$;

revoke all on function public.claim_role(text), public.my_role(), public.release_role(), public.set_year(text),
  public.check_pin(text, text), public.next_race(text), public.doc_update(text, text, jsonb) from public, anon;
grant execute on function public.claim_role(text), public.my_role(), public.release_role(), public.set_year(text),
  public.check_pin(text, text), public.next_race(text), public.doc_update(text, text, jsonb) to authenticated;

-- ---------- slip photos: private bucket "slips" ----------
insert into storage.buckets (id, name, public) values ('slips', 'slips', false) on conflict (id) do nothing;
drop policy if exists "slips photos read" on storage.objects;
drop policy if exists "slips photos add" on storage.objects;
drop policy if exists "slips photos change" on storage.objects;
drop policy if exists "slips photos delete" on storage.objects;
create policy "slips photos read" on storage.objects for select to authenticated
  using (bucket_id = 'slips' and private.my_role() is not null);
create policy "slips photos add" on storage.objects for insert to authenticated
  with check (bucket_id = 'slips' and private.can_write('photos'));
create policy "slips photos change" on storage.objects for update to authenticated
  using (bucket_id = 'slips' and private.can_write('photos')) with check (bucket_id = 'slips' and private.can_write('photos'));
create policy "slips photos delete" on storage.objects for delete to authenticated
  using (bucket_id = 'slips' and private.can_write('photos'));

-- ---------- live updates and presence ----------
-- Row changes reach a device only if it can read the row (row-level security above).
do $$
declare t text;
begin
  foreach t in array array['config','roster','extras','heats','times','finish','slips','records','counter','years'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- The private "carnival" channel carries presence ("Already selected", the Recorder lock).
-- Only a device with a job can join it.
drop policy if exists "job can listen" on realtime.messages;
drop policy if exists "job can send" on realtime.messages;
create policy "job can listen" on realtime.messages for select to authenticated
  using (realtime.topic() = 'carnival' and private.my_role() is not null);
create policy "job can send" on realtime.messages for insert to authenticated
  with check (realtime.topic() = 'carnival' and private.my_role() is not null);
