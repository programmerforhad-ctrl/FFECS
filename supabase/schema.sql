-- =====================================================================
-- FREE FIRE E-SPORTS COMMUNITY SYLHET  -  Supabase schema
-- Run this whole file once in: Supabase Dashboard -> SQL Editor -> New query
-- It is safe to run again (idempotent).
-- =====================================================================

-- ---------- 1. Admins -------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------- 2. Tables -------------------------------------------------
create table if not exists public.site_settings (
  key   text primary key,
  value text not null default ''
);

create table if not exists public.management_members (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  position     text not null,
  bio          text,
  photo_url    text,
  facebook_url text,
  sort_order   int  not null default 0,
  created_at   timestamptz not null default now()
);

create table if not exists public.events (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  event_date   timestamptz not null,
  location     text,
  image_url    text,
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists public.forms (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  description     text,
  is_open         boolean not null default true,
  collect_email   boolean not null default true,
  deadline        timestamptz,
  max_responses   int,
  success_message text not null default 'Thank you! Your response has been recorded.',
  created_at      timestamptz not null default now()
);

create table if not exists public.tournaments (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  description    text,
  status         text not null default 'upcoming'
                 check (status in ('upcoming','live','completed')),
  start_date     timestamptz,
  entry_fee      text,
  prize_pool     text,
  rules          text,
  banner_url     text,
  champion       text,
  result_summary text,
  form_id        uuid references public.forms(id) on delete set null,
  is_published   boolean not null default true,
  created_at     timestamptz not null default now()
);

create table if not exists public.form_questions (
  id         uuid primary key default gen_random_uuid(),
  form_id    uuid not null references public.forms(id) on delete cascade,
  label      text not null,
  help_text  text,
  type       text not null default 'short_text'
             check (type in ('short_text','long_text','number','phone','email','date','radio','checkbox','dropdown')),
  options    jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  required   boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists form_questions_form_idx on public.form_questions(form_id, sort_order);

create table if not exists public.form_responses (
  id               uuid primary key default gen_random_uuid(),
  form_id          uuid not null references public.forms(id) on delete cascade,
  respondent_email text check (respondent_email is null or respondent_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  answers          jsonb not null default '[]'::jsonb
                   check (jsonb_typeof(answers) = 'array' and octet_length(answers::text) < 100000),
  created_at       timestamptz not null default now()
);
create index if not exists form_responses_form_idx on public.form_responses(form_id, created_at desc);
-- one response per email per form
create unique index if not exists form_responses_unique_email
  on public.form_responses(form_id, lower(respondent_email))
  where respondent_email is not null;

-- ---------- 3. Server-side form rules ---------------------------------
create or replace function public.check_response_allowed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  f public.forms%rowtype;
  cnt int;
begin
  select * into f from public.forms where id = new.form_id;
  if not found or not f.is_open then
    raise exception 'This form is closed.';
  end if;
  if f.deadline is not null and now() > f.deadline then
    raise exception 'The deadline for this form has passed.';
  end if;
  if f.max_responses is not null then
    select count(*) into cnt from public.form_responses where form_id = new.form_id;
    if cnt >= f.max_responses then
      raise exception 'This form has reached its response limit.';
    end if;
  end if;
  if f.collect_email and (new.respondent_email is null or new.respondent_email = '') then
    raise exception 'Email is required for this form.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_check_response_allowed on public.form_responses;
create trigger trg_check_response_allowed
  before insert on public.form_responses
  for each row execute function public.check_response_allowed();

-- public can see how many responses a form has (to show "form full"), nothing else
create or replace function public.form_response_count(fid uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int from public.form_responses where form_id = fid;
$$;

-- ---------- 4. Row Level Security -------------------------------------
alter table public.admins            enable row level security;
alter table public.site_settings     enable row level security;
alter table public.management_members enable row level security;
alter table public.events            enable row level security;
alter table public.forms             enable row level security;
alter table public.tournaments       enable row level security;
alter table public.form_questions    enable row level security;
alter table public.form_responses    enable row level security;

-- admins: a logged-in user can only see their own row
drop policy if exists "admins read own" on public.admins;
create policy "admins read own" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- site_settings
drop policy if exists "settings public read" on public.site_settings;
create policy "settings public read" on public.site_settings for select using (true);
drop policy if exists "settings admin write" on public.site_settings;
create policy "settings admin write" on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- management_members
drop policy if exists "members public read" on public.management_members;
create policy "members public read" on public.management_members for select using (true);
drop policy if exists "members admin write" on public.management_members;
create policy "members admin write" on public.management_members
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- events
drop policy if exists "events public read" on public.events;
create policy "events public read" on public.events
  for select using (is_published or public.is_admin());
drop policy if exists "events admin write" on public.events;
create policy "events admin write" on public.events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- tournaments
drop policy if exists "tournaments public read" on public.tournaments;
create policy "tournaments public read" on public.tournaments
  for select using (is_published or public.is_admin());
drop policy if exists "tournaments admin write" on public.tournaments;
create policy "tournaments admin write" on public.tournaments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- forms
drop policy if exists "forms public read" on public.forms;
create policy "forms public read" on public.forms for select using (true);
drop policy if exists "forms admin write" on public.forms;
create policy "forms admin write" on public.forms
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- form_questions
drop policy if exists "questions public read" on public.form_questions;
create policy "questions public read" on public.form_questions for select using (true);
drop policy if exists "questions admin write" on public.form_questions;
create policy "questions admin write" on public.form_questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- form_responses: anyone can submit to an OPEN form, only admins can read/edit/delete
drop policy if exists "responses public insert" on public.form_responses;
create policy "responses public insert" on public.form_responses
  for insert to anon, authenticated
  with check (exists (select 1 from public.forms f where f.id = form_id and f.is_open));
drop policy if exists "responses admin all" on public.form_responses;
create policy "responses admin all" on public.form_responses
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- 5. Grants (RLS above does the real filtering) --------------
grant usage on schema public to anon, authenticated;
grant select on public.site_settings, public.management_members, public.events,
               public.tournaments, public.forms, public.form_questions to anon;
grant insert on public.form_responses to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.form_response_count(uuid) to anon, authenticated;

-- ---------- 6. Storage ------------------------------------------------
-- "Info" is the public bucket used by the website for logos, photos, banners.
insert into storage.buckets (id, name, public)
values ('Info', 'Info', true)
on conflict (id) do update set public = true;

-- B-2, B-3, B-4 are left exactly as you created them (private unless you changed it).

drop policy if exists "info public read" on storage.objects;
create policy "info public read" on storage.objects
  for select using (bucket_id = 'Info');

drop policy if exists "admin manage buckets" on storage.objects;
create policy "admin manage buckets" on storage.objects
  for all to authenticated
  using (bucket_id in ('Info','B-2','B-3','B-4') and public.is_admin())
  with check (bucket_id in ('Info','B-2','B-3','B-4') and public.is_admin());

-- ---------- 7. Default site content (editable later from /admin/settings)
insert into public.site_settings (key, value) values
  ('community_name', 'FREE FIRE E-SPORTS COMMUNITY SYLHET'),
  ('tagline', 'Sylhet''s home of competitive Free Fire'),
  ('about_text', 'We are the Free Fire E-Sports Community of Sylhet. We organise tournaments, events and practice matches for players across Sylhet.'),
  ('mission', 'To build a fair, active and welcoming Free Fire e-sports scene in Sylhet.'),
  ('vision', 'To grow Sylhet''s best players into national-level competitors.')
on conflict (key) do nothing;

-- =====================================================================
-- 8. MAKE YOURSELF ADMIN  (do this AFTER step 2 in the README)
--    1) Supabase -> Authentication -> Users -> Add user (tick "Auto Confirm User")
--    2) Replace the email below with that user's email and run just this line:
--
-- insert into public.admins (user_id)
-- select id from auth.users where email = 'YOUR_ADMIN_EMAIL_HERE'
-- on conflict do nothing;
-- =====================================================================
