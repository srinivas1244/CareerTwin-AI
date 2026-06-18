-- ============================================================================
-- CareerTwin AI — Phase 2 schema (Career Twin Chat)
-- Run in Supabase SQL Editor after 0001_init.sql.
-- (The AI Career Roadmap reuses the existing `recommendations` table.)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists conversations_user_id_idx
  on public.conversations(user_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- chat_messages
-- ---------------------------------------------------------------------------
create table if not exists public.chat_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null default '',
  created_at      timestamptz not null default now()
);
create index if not exists chat_messages_conversation_idx
  on public.chat_messages(conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- updated_at trigger (reuses public.set_updated_at from 0001)
-- ---------------------------------------------------------------------------
drop trigger if exists set_updated_at on public.conversations;
create trigger set_updated_at before update on public.conversations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: owner-only
-- ---------------------------------------------------------------------------
alter table public.conversations enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "conversations_owner" on public.conversations;
create policy "conversations_owner" on public.conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "chat_messages_owner" on public.chat_messages;
create policy "chat_messages_owner" on public.chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
