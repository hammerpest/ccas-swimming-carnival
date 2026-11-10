-- Results for parents (the page at /parents/). Swim Opt 2.8, names and "show before final" in Swim Opt 2.19 (S1.45). Safe to run again.
-- Run it after 01-setup.sql, in the Supabase SQL Editor (paste it all into a new query, then Run).
--
-- Parents need no PIN and no sign-in, so hundreds of phones never touch the hourly sign-in limit.
-- They call one function that hands out only what the results page needs:
--   - nothing at all unless the organiser has turned the parents page on (config/main "parents": true);
--   - swimmers as a code (p and 10 letters), and only swimmers in a heat. Student ids are built from the full name, so they
--     never leave the server; the code is a hash of the id with a secret kept on the server, so it stays the same all day and
--     says nothing about the name. An id the student list does not know is hashed too (fails closed); only a relay team keeps
--     its own name (B-A and so on);
--   - names only when the organiser chooses them (config/main "parentsNames": "short"): first initial and surname, for example
--     J Smith (decision 168). The default is "none": no name leaves the server, swimmers are "Swimmer" and record holders "A swimmer";
--   - unless the organiser ticked "show results before an event is final" (config/main "parentsProv": true), times and places
--     leave the server only for events where every heat is in (decision 166). The rule here is never stricter than the page's own
--     (js/core.js), so a finished event always shows; the page still waits for Final;
--   - only the fields the results need: no PINs, devices or slip photos. Each lane's slip time goes with its time, so the page
--     can tell a "Slip differs" race; the slip reader's other readings do not.
--   - the organiser's ticks (parentsShow) choose what the page shows; the results data is the same whatever is ticked.
-- The page asks every minute with the version it has; when nothing changed the answer is tiny.

create table if not exists private.parent_secret (id int primary key default 1 check (id = 1), salt text not null);
insert into private.parent_secret (salt) values (md5(random()::text || clock_timestamp()::text)) on conflict (id) do nothing;
alter table private.parent_secret enable row level security;
revoke all on private.parent_secret from public, anon, authenticated;

-- Swim Opt 2.19: first initial and surname ("Jane Mary Citizen" is "J Citizen"); one word stays as it is
drop function if exists private.short_name(text);
create or replace function private.initial_surname(n text) returns text
language sql immutable set search_path = '' as $$
  select case
    when coalesce(btrim(n), '') = '' then ''
    when array_length(regexp_split_to_array(btrim(n), '\s+'), 1) = 1 then btrim(n)
    else left(btrim(n), 1) || ' ' || (regexp_split_to_array(btrim(n), '\s+'))[array_length(regexp_split_to_array(btrim(n), '\s+'), 1)]
  end
$$;

-- Swim Opt 2.19: read values the way the app does (js/core.js), so one odd record never stops the whole answer:
-- a number (1 and 1.0 alike; anything else is 0), and true or false (false, 0, "", null or missing are false, as in JavaScript)
create or replace function private.jnum(j jsonb) returns numeric
language sql immutable set search_path = '' as $$
  select case when jsonb_typeof(j) = 'number' then (j #>> '{}')::numeric else 0 end
$$;
create or replace function private.jtrue(j jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select case when j is null then false else case jsonb_typeof(j) when 'boolean' then (j #>> '{}')::boolean
    when 'number' then (j #>> '{}')::numeric <> 0 when 'string' then (j #>> '{}') <> '' when 'null' then false else true end end
$$;

-- The code for a lane's id: a relay team keeps its name, anything else is hashed (known or not)
create or replace function private.pcode(val text, salt text) returns text
language sql immutable set search_path = '' as $$
  select case when val in ('B-A', 'B-B', 'J-A', 'J-B', 'N-A', 'N-B') then val else 'p' || left(md5(salt || coalesce(val, '')), 10) end
$$;

create or replace function public.parent_results(have text default '') returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare cfg jsonb; v text; ids jsonb; salt text; names_on boolean; prov boolean; open_races jsonb;
begin
  select doc into cfg from public.config where id = 'main';
  if cfg is null or coalesce(cfg->'parents', 'false'::jsonb) <> 'true'::jsonb then
    return jsonb_build_object('off', true);
  end if;
  -- names are off unless the organiser chooses them (privacy: check consent first)
  names_on := coalesce(cfg->>'parentsNames', 'none') = 'short';
  prov := coalesce(cfg->'parentsProv', 'false'::jsonb) = 'true'::jsonb;
  v := concat_ws('.',
    (select count(*) || '-' || coalesce(floor(extract(epoch from max(updated_at)) * 1000)::bigint, 0) from public.heats),
    (select count(*) || '-' || coalesce(floor(extract(epoch from max(updated_at)) * 1000)::bigint, 0) from public.times),
    (select count(*) || '-' || coalesce(floor(extract(epoch from max(updated_at)) * 1000)::bigint, 0) from public.finish),
    (select count(*) || '-' || coalesce(floor(extract(epoch from max(updated_at)) * 1000)::bigint, 0) from public.records),
    (select count(*) || '-' || coalesce(floor(extract(epoch from max(updated_at)) * 1000)::bigint, 0) from public.roster),
    (select count(*) || '-' || coalesce(floor(extract(epoch from max(updated_at)) * 1000)::bigint, 0) from public.extras),
    (select coalesce(floor(extract(epoch from max(updated_at)) * 1000)::bigint, 0) from public.config));
  if v = have then
    return jsonb_build_object('v', v, 'same', true);
  end if;
  select p.salt into salt from private.parent_secret p where p.id = 1;
  -- every swimmer in a heat gets a fixed code
  select coalesce(jsonb_object_agg(id, private.pcode(id, salt)), '{}'::jsonb) into ids from (
    select distinct e.value as id from public.heats h,
      jsonb_each_text(case when jsonb_typeof(h.doc->'lanes') = 'object' then h.doc->'lanes' else '{}'::jsonb end) e
    where coalesce(e.value, '') <> '') q;

  -- Swim Opt 2.19: which races belong to an event that is not finished yet. A heat is in when every filled lane has a time or
  -- DNS, DQ or No time, and there are places (or the Recorder checked it, or nobody has a time); times and places of an
  -- earlier run of a re-swum race (older gen) do not count. Cancelled races do not count.
  with hs as (
    select h.id, h.doc, private.jnum(h.doc->'gen') as gen,
      private.jtrue(h.doc->'cancelled') as cancelled,
      case when jsonb_typeof(h.doc->'lanes') = 'object' then h.doc->'lanes' else '{}'::jsonb end as lanes
    from public.heats h where private.jtrue(h.doc->'race')),
  hd as (
    -- grouped like the app's groupKey: a missing value and null stay apart
    select hs.id, hs.doc->'k' as k, hs.doc->'x' as x, hs.doc->'g' as g, hs.cancelled,
      (select count(*) from jsonb_each_text(hs.lanes) l where coalesce(l.value, '') <> '') as filled,
      (select count(*) from jsonb_each_text(hs.lanes) l
        where coalesce(l.value, '') <> '' and private.jnum(t.doc->'gen') = hs.gen
          and (t.doc->'lanes'->l.key->'t' is not null and jsonb_typeof(t.doc->'lanes'->l.key->'t') <> 'null'
               or t.doc->'lanes'->l.key->>'st' in ('DNS', 'DQ', 'NT'))) as n_in,
      (select count(*) from jsonb_each_text(hs.lanes) l
        where coalesce(l.value, '') <> '' and private.jnum(t.doc->'gen') = hs.gen
          and t.doc->'lanes'->l.key->'t' is not null and jsonb_typeof(t.doc->'lanes'->l.key->'t') <> 'null'
          and coalesce(t.doc->'lanes'->l.key->>'st', '') not in ('DNS', 'DQ', 'NT')) as n_ok,
      (f.doc is not null and private.jnum(f.doc->'gen') = hs.gen and (
         private.jtrue(f.doc->'ok')
         or (jsonb_typeof(f.doc->'order') = 'array' and jsonb_array_length(f.doc->'order') > 0)
         or (jsonb_typeof(f.doc->'taps') = 'array' and jsonb_array_length(f.doc->'taps') > 0))) as places,
      (t.doc is not null and private.jnum(t.doc->'gen') = hs.gen and private.jtrue(t.doc->'checked')) as checked
    from hs left join public.times t on t.id = hs.id left join public.finish f on f.id = hs.id),
  heat_in as (
    select id, k, x, g, cancelled, (n_in = filled and (places or checked or n_ok = 0)) as is_in from hd),
  open_ev as (
    select k, x, g from heat_in where not cancelled group by k, x, g having not bool_and(is_in))
  select coalesce(jsonb_object_agg(hi.id, hi.is_in), '{}'::jsonb) into open_races
  from heat_in hi join open_ev o on o.k is not distinct from hi.k and o.x is not distinct from hi.x and o.g is not distinct from hi.g;
  if prov then open_races := '{}'::jsonb; end if;

  return jsonb_build_object(
    'v', v,
    'config', jsonb_build_object('name', cfg->'name', 'date', cfg->'date', 'dateConfirmed', cfg->'dateConfirmed',
      'pool', cfg->'pool', 'lanes', cfg->'lanes', 'points', cfg->'points', 'program', cfg->'program',
      'notSwum', cfg->'notSwum', 'locked', cfg->'locked', 'level', cfg->'level', 'agesOff', cfg->'agesOff',
      'parentsNames', case when names_on then 'short' else 'none' end, 'parentsProv', prov, 'parentsShow', cfg->'parentsShow'),
    -- "in": a heat whose times are held back because its event is not finished; true when the heat itself is in
    'heats', coalesce((select jsonb_agg(jsonb_build_object('_id', h.id, 'race', h.doc->'race', 'heat', h.doc->'heat',
        'k', h.doc->'k', 'x', h.doc->'x', 'g', h.doc->'g', 'gen', h.doc->'gen', 'cancelled', h.doc->'cancelled',
        'edited', h.doc->'edited', 'at', h.doc->'at', 'in', open_races->h.id,
        'lanes', coalesce((select jsonb_object_agg(e.key, private.pcode(e.value, salt))
          from jsonb_each_text(case when jsonb_typeof(h.doc->'lanes') = 'object' then h.doc->'lanes' else '{}'::jsonb end) e
          where coalesce(e.value, '') <> ''), '{}'::jsonb)))
      from public.heats h), '[]'::jsonb),
    -- per lane only the time, its status and (for "Slip differs") the slip's time
    'times', coalesce((select jsonb_object_agg(t.id, jsonb_build_object('gen', t.doc->'gen', 'checked', t.doc->'checked',
        'checkedAt', t.doc->'checkedAt', 'at', t.doc->'at',
        'lanes', coalesce((select jsonb_object_agg(l.key, jsonb_build_object('t', l.value->'t', 'st', l.value->'st', 'slip', l.value->'slip'))
          from jsonb_each(case when jsonb_typeof(t.doc->'lanes') = 'object' then t.doc->'lanes' else '{}'::jsonb end) l), '{}'::jsonb)))
      from public.times t where not (open_races ? t.id)), '{}'::jsonb),
    'finish', coalesce((select jsonb_object_agg(f.id, jsonb_build_object('order', f.doc->'order', 'gen', f.doc->'gen',
      'ck', f.doc->'ck', 'ok', f.doc->'ok', 'at', f.doc->'at',
      -- Swim Opt 2.12: multitimer tap order (lane numbers only), so places follow DNS, DQ or No time marks
      'multi', f.doc->'multi', 'taps', f.doc->'taps', 'n', f.doc->'n'))
      from public.finish f where not (open_races ? f.id)), '{}'::jsonb),
    'records', coalesce((select jsonb_agg(jsonb_build_object('key', r->'key', 't', r->'t',
        'holders', coalesce((select jsonb_agg(jsonb_build_object('n',
            case when names_on then private.initial_surname(regexp_replace(coalesce(hd->>'n', ''), '^Test: ', '')) else 'A swimmer' end,
          'h', hd->'h', 'y', hd->'y')) from jsonb_array_elements(case when jsonb_typeof(r->'holders') = 'array' then r->'holders' else '[]'::jsonb end) hd), '[]'::jsonb)))
      from public.records rr, jsonb_array_elements(case when jsonb_typeof(rr.doc->'list') = 'array' then rr.doc->'list' else '[]'::jsonb end) r
      where rr.id = 'all'), '[]'::jsonb),
    'students', coalesce((
      with everyone as (
        select s from public.roster r, jsonb_array_elements(case when jsonb_typeof(r.doc->'students') = 'array' then r.doc->'students' else '[]'::jsonb end) s
        union all select x.doc from public.extras x)
      select jsonb_agg(jsonb_build_object('id', ids->>(s->>'id'),
        'f', case when names_on then left(btrim(coalesce(s->>'f', '')), 1) else 'Swimmer' end,
        's', case when names_on then btrim(coalesce(s->>'s', '')) else '' end,
        'h', s->>'h', 'x', s->>'x', 'g', s->>'g'))
      from everyone where ids ? (s->>'id')), '[]'::jsonb)
  );
end $$;

revoke all on function private.initial_surname(text) from public, anon, authenticated;
revoke all on function private.pcode(text, text) from public, anon, authenticated;
revoke all on function private.jnum(jsonb) from public, anon, authenticated;
revoke all on function private.jtrue(jsonb) from public, anon, authenticated;
revoke all on function public.parent_results(text) from public;
grant execute on function public.parent_results(text) to anon, authenticated;
