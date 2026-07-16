-- Live schema of the "Vibe Check" Supabase project (hkakpvfytmuqpjympmwx).
-- This file documents what is deployed; change it via migrations, not by hand.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'anon',
  created_at timestamptz not null default now()
);

create table if not exists public.vibes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null check (score >= 0 and score <= 100),
  analysis text not null default '',
  factors jsonb not null default '[]'::jsonb,
  photo_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  vibe_id uuid not null references public.vibes(id),
  reporter_id uuid not null references auth.users(id),
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.blocks (
  blocker_id uuid not null references auth.users(id),
  blocked_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

alter table public.profiles enable row level security;
alter table public.vibes enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;

create policy "profiles readable by all"
  on public.profiles for select
  using (true);

create policy "insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "vibes readable by all"
  on public.vibes for select
  using (true);

create policy "insert own vibe"
  on public.vibes for insert
  with check (auth.uid() = user_id);

create policy "delete own vibe"
  on public.vibes for delete
  using (auth.uid() = user_id);

create policy "read own reports"
  on public.reports for select
  using (auth.uid() = reporter_id);

create policy "insert own report"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "read own blocks"
  on public.blocks for select
  using (auth.uid() = blocker_id);

create policy "insert own block"
  on public.blocks for insert
  with check (auth.uid() = blocker_id);

create policy "delete own block"
  on public.blocks for delete
  using (auth.uid() = blocker_id);
