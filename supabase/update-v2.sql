-- =====================================================================
-- UPDATE v2: tournament teams, groups, matches, team login portal
-- Run ONCE in Supabase -> SQL Editor, AFTER schema.sql. Safe to run again.
-- =====================================================================

-- ---------- 1. Form question roles + tournament registration end ------
alter table public.form_questions add column if not exists role text;
alter table public.form_questions drop constraint if exists form_questions_role_check;
alter table public.form_questions add constraint form_questions_role_check
  check (role is null or role in ('team_name','captain_name','captain_uid'));

alter table public.tournaments add column if not exists registration_end timestamptz;
alter table public.tournaments add column if not exists portal_info text;

-- When a tournament has a registration form and an end time, the form closes automatically at that time.
create or replace function public.sync_form_deadline()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.form_id is not null and new.registration_end is not null then
    update public.forms set deadline = new.registration_end where id = new.form_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_form_deadline on public.tournaments;
create trigger trg_sync_form_deadline
  after insert or update of registration_end, form_id on public.tournaments
  for each row execute function public.sync_form_deadline();

-- ---------- 2. Tables --------------------------------------------------
create table if not exists public.tournament_groups (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  name          text not null,
  max_teams     int  not null default 12 check (max_teams between 1 and 60),
  qualify_top   int  check (qualify_top is null or qualify_top >= 0),
  info          text,
  created_at    timestamptz not null default now()
);
create index if not exists tournament_groups_t_idx on public.tournament_groups(tournament_id);

create table if not exists public.tournament_teams (
  id                uuid primary key default gen_random_uuid(),
  tournament_id     uuid not null references public.tournaments(id) on delete cascade,
  response_id       uuid unique references public.form_responses(id) on delete set null,
  team_name         text not null,
  captain_name      text,
  captain_uid       text not null check (captain_uid ~ '^[0-9]{5,15}$'),
  email             text not null,
  status            text not null default 'registered'
                    check (status in ('registered','selected','qualified','eliminated','disqualified')),
  group_id          uuid references public.tournament_groups(id) on delete set null,
  disqualify_reason text,
  evidence_url      text,
  admin_notes       text,
  created_at        timestamptz not null default now()
);
create index if not exists tournament_teams_t_idx on public.tournament_teams(tournament_id, status);
create unique index if not exists tournament_teams_uid_uq on public.tournament_teams(tournament_id, captain_uid);
create unique index if not exists tournament_teams_email_uq on public.tournament_teams(tournament_id, lower(email));
create index if not exists tournament_teams_login_idx on public.tournament_teams(lower(email), captain_uid);

create table if not exists public.tournament_matches (
  id                    uuid primary key default gen_random_uuid(),
  tournament_id         uuid not null references public.tournaments(id) on delete cascade,
  group_id              uuid references public.tournament_groups(id) on delete cascade, -- null = all selected teams
  title                 text not null,
  start_time            timestamptz not null,
  room_id               text,
  room_password         text,
  reveal_minutes_before int not null default 10 check (reveal_minutes_before between 0 and 180),
  note                  text,
  created_at            timestamptz not null default now()
);
create index if not exists tournament_matches_t_idx on public.tournament_matches(tournament_id, start_time);

-- failed team-login attempts (used for rate limiting; nobody can read it directly)
create table if not exists public.login_attempts (
  id         bigint generated always as identity primary key,
  email      text not null,
  created_at timestamptz not null default now()
);
create index if not exists login_attempts_idx on public.login_attempts(email, created_at);

-- ---------- 3. Row Level Security: admin only --------------------------
alter table public.tournament_groups  enable row level security;
alter table public.tournament_teams   enable row level security;
alter table public.tournament_matches enable row level security;
alter table public.login_attempts     enable row level security;

drop policy if exists "groups admin all" on public.tournament_groups;
create policy "groups admin all" on public.tournament_groups
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "teams admin all" on public.tournament_teams;
create policy "teams admin all" on public.tournament_teams
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "matches admin all" on public.tournament_matches;
create policy "matches admin all" on public.tournament_matches
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.tournament_groups, public.tournament_teams,
  public.tournament_matches to authenticated;
-- anon gets NO direct access to these tables. Teams only see their data through team_login() below.

-- ---------- 4. Registration -> team (automatic) ------------------------
create or replace function public.ensure_team_for_response(p_response uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  r   public.form_responses%rowtype;
  t   record;
  v_team text;
  v_cap  text;
  v_uid  text;
  made int := 0;
begin
  select * into r from public.form_responses where id = p_response;
  if not found or r.respondent_email is null then return 0; end if;

  select a->>'value' into v_team
    from jsonb_array_elements(r.answers) a
    join public.form_questions q on q.id::text = a->>'question_id'
   where q.form_id = r.form_id and q.role = 'team_name' limit 1;
  select a->>'value' into v_cap
    from jsonb_array_elements(r.answers) a
    join public.form_questions q on q.id::text = a->>'question_id'
   where q.form_id = r.form_id and q.role = 'captain_name' limit 1;
  select regexp_replace(coalesce(a->>'value',''), '\D', '', 'g') into v_uid
    from jsonb_array_elements(r.answers) a
    join public.form_questions q on q.id::text = a->>'question_id'
   where q.form_id = r.form_id and q.role = 'captain_uid' limit 1;

  if v_team is null or btrim(v_team) = '' or v_uid is null or v_uid !~ '^[0-9]{5,15}$' then
    return 0;
  end if;

  for t in select id from public.tournaments where form_id = r.form_id loop
    if exists (select 1 from public.tournament_teams
                where tournament_id = t.id and captain_uid = v_uid and response_id is distinct from r.id) then
      raise exception 'This captain UID is already registered for this tournament.';
    end if;
    insert into public.tournament_teams (tournament_id, response_id, team_name, captain_name, captain_uid, email)
    values (t.id, r.id, left(btrim(v_team), 80), nullif(left(btrim(coalesce(v_cap,'')), 80), ''), v_uid, lower(r.respondent_email))
    on conflict (response_id) do nothing;
    if found then made := made + 1; end if;
  end loop;
  return made;
end;
$$;

create or replace function public.on_response_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.ensure_team_for_response(new.id);
  return new;
end;
$$;

drop trigger if exists trg_on_response_created on public.form_responses;
create trigger trg_on_response_created
  after insert on public.form_responses
  for each row execute function public.on_response_created();

-- Admin button "Sync from form": creates teams for responses that arrived before the form was linked.
create or replace function public.sync_tournament_teams(p_tournament uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  fid uuid;
  rid uuid;
  total int := 0;
begin
  if not public.is_admin() then raise exception 'Admins only.'; end if;
  select form_id into fid from public.tournaments where id = p_tournament;
  if fid is null then return 0; end if;
  for rid in select id from public.form_responses where form_id = fid loop
    begin
      total := total + public.ensure_team_for_response(rid);
    exception when others then
      null; -- skip duplicates, keep going
    end;
  end loop;
  return total;
end;
$$;
grant execute on function public.sync_tournament_teams(uuid) to authenticated;

-- ---------- 5. Team login (email + captain UID) ------------------------
create or replace function public.team_login(p_email text, p_uid text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  e text := lower(btrim(coalesce(p_email, '')));
  u text := regexp_replace(coalesce(p_uid, ''), '\D', '', 'g');
  fails int;
  teams jsonb;
begin
  if e = '' or u = '' or length(e) > 200 or length(u) > 20 then
    return jsonb_build_object('ok', false, 'error', 'Enter your team email and captain UID.');
  end if;

  delete from public.login_attempts where created_at < now() - interval '1 day';
  select count(*) into fails from public.login_attempts
   where email = e and created_at > now() - interval '15 minutes';
  if fails >= 5 then
    return jsonb_build_object('ok', false, 'error', 'Too many wrong attempts. Try again in 15 minutes.');
  end if;

  select coalesce(jsonb_agg(x.obj order by x.sort_date desc nulls last), '[]'::jsonb) into teams
  from (
    select
      tn.start_date as sort_date,
      jsonb_build_object(
        'team_id', tt.id,
        'team_name', tt.team_name,
        'status', tt.status,
        'disqualify_reason', case when tt.status = 'disqualified' then tt.disqualify_reason end,
        'evidence_url', case when tt.status = 'disqualified' then tt.evidence_url end,
        'tournament', jsonb_build_object(
          'id', tn.id, 'title', tn.title, 'status', tn.status,
          'start_date', tn.start_date, 'portal_info', tn.portal_info),
        'group', case when tt.group_id is not null and tt.status in ('selected','qualified') then (
          select jsonb_build_object(
            'name', g.name, 'info', g.info, 'qualify_top', g.qualify_top, 'max_teams', g.max_teams,
            'teams', (select coalesce(jsonb_agg(o.team_name order by o.team_name), '[]'::jsonb)
                        from public.tournament_teams o
                       where o.group_id = g.id and o.status in ('selected','qualified')))
          from public.tournament_groups g where g.id = tt.group_id) end,
        'matches', case when tt.status in ('selected','qualified') then (
          select coalesce(jsonb_agg(mm.obj order by mm.start_time), '[]'::jsonb)
          from (
            select m.start_time,
              jsonb_build_object(
                'id', m.id,
                'title', m.title,
                'start_time', m.start_time,
                'reveal_at', m.start_time - make_interval(mins => m.reveal_minutes_before),
                'note', m.note,
                'state', case
                  when now() < m.start_time - make_interval(mins => m.reveal_minutes_before) then 'waiting'
                  when now() <= m.start_time + interval '4 hours' then 'open'
                  else 'finished' end,
                'room_id', case when now() >= m.start_time - make_interval(mins => m.reveal_minutes_before)
                                 and now() <= m.start_time + interval '4 hours' then m.room_id end,
                'room_password', case when now() >= m.start_time - make_interval(mins => m.reveal_minutes_before)
                                       and now() <= m.start_time + interval '4 hours' then m.room_password end
              ) as obj
            from public.tournament_matches m
            where m.tournament_id = tt.tournament_id
              and (m.group_id is null or m.group_id = tt.group_id)
          ) mm) else '[]'::jsonb end
      ) as obj
    from public.tournament_teams tt
    join public.tournaments tn on tn.id = tt.tournament_id
    where lower(tt.email) = e and tt.captain_uid = u and tn.is_published
  ) x;

  if jsonb_array_length(teams) = 0 then
    insert into public.login_attempts (email) values (e);
    return jsonb_build_object('ok', false, 'error', 'Email and captain UID do not match a registered team.');
  end if;

  return jsonb_build_object('ok', true, 'server_time', now(), 'teams', teams);
end;
$$;
grant execute on function public.team_login(text, text) to anon, authenticated;

-- ---------- 6. Public numbers for the home page ------------------------
create or replace function public.public_stats()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'teams',       (select count(*) from public.tournament_teams),
    'tournaments', (select count(*) from public.tournaments where is_published),
    'events',      (select count(*) from public.events where is_published),
    'members',     (select count(*) from public.management_members)
  );
$$;
grant execute on function public.public_stats() to anon, authenticated;
