-- ============================================================================
-- CareerTwin AI — Phase B: roadmap progress tracking
-- Run in Supabase SQL Editor after 0002_phase2.sql.
-- ============================================================================

create table if not exists public.roadmap_progress (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users(id) on delete cascade,
  completed  jsonb not null default '[]',  -- array of completed phase names
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.roadmap_progress;
create trigger set_updated_at before update on public.roadmap_progress
  for each row execute function public.set_updated_at();

alter table public.roadmap_progress enable row level security;

drop policy if exists "roadmap_progress_owner" on public.roadmap_progress;
create policy "roadmap_progress_owner" on public.roadmap_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
