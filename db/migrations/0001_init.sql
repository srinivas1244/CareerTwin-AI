-- ============================================================================
-- CareerTwin AI — initial schema
-- Run this in Supabase: SQL Editor -> paste -> Run.
-- Then create a Storage bucket named "resumes".
--
-- Conventions: uuid PKs, created_at/updated_at on every table, RLS enabled.
-- The backend uses the service-role key (bypasses RLS) but always scopes every
-- query by the JWT-derived user_id. RLS here is defense-in-depth for any direct
-- client (anon-key) access.
-- ============================================================================

-- gen_random_uuid() is provided by pgcrypto (enabled by default on Supabase).
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- users  (app-side mirror of auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create the mirror row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', null))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- resumes
-- ---------------------------------------------------------------------------
create table if not exists public.resumes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  file_name    text not null,
  storage_path text,
  mime_type    text,
  file_size    integer,
  raw_text     text,
  parsed_json  jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists resumes_user_id_idx on public.resumes(user_id);

-- ---------------------------------------------------------------------------
-- github_profiles  (one snapshot per user; re-connect upserts)
-- ---------------------------------------------------------------------------
create table if not exists public.github_profiles (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null unique references auth.users(id) on delete cascade,
  username              text not null,
  raw_json              jsonb,
  languages             jsonb,
  repo_count            integer not null default 0,
  total_stars           integer not null default 0,
  total_forks           integer not null default 0,
  github_strength_score integer not null default 0,
  insights              jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- career_profiles  (the Career Twin; one per user)
-- ---------------------------------------------------------------------------
create table if not exists public.career_profiles (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null unique references auth.users(id) on delete cascade,
  skills         text[] not null default '{}',
  technologies   text[] not null default '{}',
  certifications jsonb  not null default '[]',
  projects       jsonb  not null default '[]',
  experience     jsonb  not null default '[]',
  education       jsonb  not null default '[]',
  inferred_role  text,
  target_role    text,
  career_goal    text,
  summary        text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- career_scores  (deterministic Hiring Score + breakdown + AI explanation)
-- ---------------------------------------------------------------------------
create table if not exists public.career_scores (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  hiring_score integer not null,
  breakdown    jsonb not null default '{}',
  explanation  text,
  role         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists career_scores_user_id_idx on public.career_scores(user_id);

-- ---------------------------------------------------------------------------
-- credibility_scores  (Milestone 2: Resume Reality Check)
-- ---------------------------------------------------------------------------
create table if not exists public.credibility_scores (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  credibility_score integer not null,
  evidence          jsonb not null default '[]',
  explanation       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists credibility_scores_user_id_idx on public.credibility_scores(user_id);

-- ---------------------------------------------------------------------------
-- project_gaps  (Milestone 3)
-- ---------------------------------------------------------------------------
create table if not exists public.project_gaps (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  target_role text,
  gaps        jsonb not null default '[]',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists project_gaps_user_id_idx on public.project_gaps(user_id);

-- ---------------------------------------------------------------------------
-- recommendations  (Milestone 3/4)
-- ---------------------------------------------------------------------------
create table if not exists public.recommendations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null,
  payload    jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists recommendations_user_id_idx on public.recommendations(user_id);

-- ---------------------------------------------------------------------------
-- simulations  (Milestone 4: Career Simulator)
-- ---------------------------------------------------------------------------
create table if not exists public.simulations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  base_score integer not null,
  scenarios  jsonb not null default '[]',
  roadmap    jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists simulations_user_id_idx on public.simulations(user_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'users','resumes','github_profiles','career_profiles','career_scores',
    'credibility_scores','project_gaps','recommendations','simulations'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I;', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();', t);
  end loop;
end$$;

-- ---------------------------------------------------------------------------
-- Row Level Security: each user can only touch their own rows.
-- ---------------------------------------------------------------------------
alter table public.users              enable row level security;
alter table public.resumes            enable row level security;
alter table public.github_profiles    enable row level security;
alter table public.career_profiles    enable row level security;
alter table public.career_scores      enable row level security;
alter table public.credibility_scores enable row level security;
alter table public.project_gaps       enable row level security;
alter table public.recommendations    enable row level security;
alter table public.simulations        enable row level security;

-- users: row keyed by id == auth.uid()
drop policy if exists "users_self" on public.users;
create policy "users_self" on public.users
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- all other tables: row keyed by user_id == auth.uid()
do $$
declare t text;
begin
  foreach t in array array[
    'resumes','github_profiles','career_profiles','career_scores',
    'credibility_scores','project_gaps','recommendations','simulations'
  ]
  loop
    execute format('drop policy if exists "%s_owner" on public.%I;', t, t);
    execute format(
      'create policy "%s_owner" on public.%I
         for all using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t, t);
  end loop;
end$$;
