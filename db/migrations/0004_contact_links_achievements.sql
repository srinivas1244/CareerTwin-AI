-- Resume parser fields: primary contact, profiles & links, achievements.
alter table public.career_profiles
  add column if not exists contact jsonb not null default '{}',
  add column if not exists links jsonb not null default '{}',
  add column if not exists achievements jsonb not null default '[]';


