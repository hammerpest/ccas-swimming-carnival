-- Swim Opt 2.8: results for parents (the page at /parents/). Safe to run again.
-- Run it after 01-setup.sql, in the Supabase SQL Editor.
--
-- Parents need no PIN and no sign-in, so hundreds of phones never touch the hourly sign-in limit.
-- They call one function that hands out only what the results page needs:
--   - nothing at all unless the organiser has turned parent results on (config/main "parents": true);
--   - swimmers as a code (p and 10 letters) with first name and surname initial, and only swimmers in a heat.
--     Student ids are built from the full name, so they never leave the server; the code is a hash of the id
--     with a secret kept on the server, so it stays the same all day and says nothing about the name;
--   - record holders as first name and surname initial;
--   - only the fields the results need: no PINs, devices, slip readings or photos.
-- The page asks every minute with the version it has; when nothing changed the answer is tiny.

create table if not exists private.parent_secret (id int primary key default 1 check (id = 1), salt text not null);
insert into private.parent_secret (salt) values (md5(random()::text || clock_timestamp()::text)) on conflict (id) do nothing;
revoke all on private.parent_secret from public, anon, authenticated;

create or replace function private.short_name(n text) returns text
language sql immutable set search_path = '' as $$
  select case
    when coalesce(btrim(n), '') = '' then ''
    when array_length(regexp_split_to_array(btrim(n), '\s+'), 1) = 1 then left(btrim(n), 1) || '.'
    else split_part(btrim(n), ' ', 1) || ' ' || left((regexp_split_to_array(btrim(n), '\s+'))[array_length(regexp_split_to_array(btrim(n), '\s+'), 1)], 1) || '.'
  end
$$;

create or replace function public.parent_results(have text default '') returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare cfg jsonb; v text; ids jsonb; salt text;
begin
  select doc into cfg from public.config where id = 'main';
  if cfg is null or coalesce(cfg->'parents', 'false'::jsonb) <> 'true'::jsonb then
    return jsonb_build_object('off', true);
  end if;
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
  -- every swimmer in a heat gets a fixed code; relay teams (B-A ... N-B) keep their names
  select p.salt into salt from private.parent_secret p where p.id = 1;
  select coalesce(jsonb_object_agg(id, 'p' || left(md5(salt || id), 10)), '{}'::jsonb) into ids from (
    select distinct e.value as id from public.heats h, jsonb_each_text(h.doc->'lanes') e
    where e.value not in ('B-A', 'B-B', 'J-A', 'J-B', 'N-A', 'N-B')) q;
  return jsonb_build_object(
    'v', v,
    'config', jsonb_build_object('name', cfg->'name', 'date', cfg->'date', 'dateConfirmed', cfg->'dateConfirmed',
      'pool', cfg->'pool', 'lanes', cfg->'lanes', 'points', cfg->'points', 'program', cfg->'program',
      'notSwum', cfg->'notSwum', 'locked', cfg->'locked', 'level', cfg->'level', 'agesOff', cfg->'agesOff'),
    'heats', coalesce((select jsonb_agg(jsonb_build_object('_id', h.id, 'race', h.doc->'race', 'heat', h.doc->'heat',
        'k', h.doc->'k', 'x', h.doc->'x', 'g', h.doc->'g', 'gen', h.doc->'gen', 'cancelled', h.doc->'cancelled',
        'edited', h.doc->'edited', 'at', h.doc->'at',
        'lanes', coalesce((select jsonb_object_agg(e.key, coalesce(ids->>e.value, e.value)) from jsonb_each_text(h.doc->'lanes') e), '{}'::jsonb)))
      from public.heats h), '[]'::jsonb),
    -- per lane only the time, its status and (for "Slip differs") the slip's time
    'times', coalesce((select jsonb_object_agg(t.id, jsonb_build_object('gen', t.doc->'gen', 'checked', t.doc->'checked',
        'checkedAt', t.doc->'checkedAt', 'at', t.doc->'at',
        'lanes', coalesce((select jsonb_object_agg(l.key, jsonb_build_object('t', l.value->'t', 'st', l.value->'st', 'slip', l.value->'slip'))
          from jsonb_each(t.doc->'lanes') l), '{}'::jsonb)))
      from public.times t), '{}'::jsonb),
    'finish', coalesce((select jsonb_object_agg(f.id, jsonb_build_object('order', f.doc->'order', 'gen', f.doc->'gen',
      'ck', f.doc->'ck', 'ok', f.doc->'ok', 'at', f.doc->'at',
      -- Swim Opt 2.12: multitimer tap order (lane numbers only), so places follow DNS, DQ or No time marks
      'multi', f.doc->'multi', 'taps', f.doc->'taps', 'n', f.doc->'n')) from public.finish f), '{}'::jsonb),
    'records', coalesce((select jsonb_agg(jsonb_build_object('key', r->'key', 't', r->'t',
        'holders', coalesce((select jsonb_agg(jsonb_build_object('n', private.short_name(regexp_replace(hd->>'n', '^Test: ', '')),
          'h', hd->'h', 'y', hd->'y')) from jsonb_array_elements(r->'holders') hd), '[]'::jsonb)))
      from public.records rr, jsonb_array_elements(rr.doc->'list') r where rr.id = 'all'), '[]'::jsonb),
    'students', coalesce((
      with everyone as (
        select s from public.roster r, jsonb_array_elements(r.doc->'students') s
        union all select x.doc from public.extras x)
      select jsonb_agg(jsonb_build_object('id', ids->>(s->>'id'), 'f', coalesce(nullif(btrim(s->>'f'), ''), 'Swimmer'),
        's', case when coalesce(btrim(s->>'s'), '') = '' then '' else left(btrim(s->>'s'), 1) || '.' end,
        'h', s->>'h', 'x', s->>'x', 'g', s->>'g'))
      from everyone where ids ? (s->>'id')), '[]'::jsonb)
  );
end $$;

revoke all on function private.short_name(text) from public, anon;
revoke all on function public.parent_results(text) from public;
grant execute on function public.parent_results(text) to anon, authenticated;
