create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vibe_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null check (score between 0 and 100),
  analysis text not null,
  factors jsonb not null default '[]'::jsonb,
  photo_path text,
  visibility text not null default 'private' check (visibility in ('private', 'friends', 'public')),
  created_at timestamptz not null default now()
);

create table if not exists public.vibe_reactions (
  id uuid primary key default gen_random_uuid(),
  vibe_check_id uuid not null references public.vibe_checks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (char_length(reaction) between 1 and 24),
  created_at timestamptz not null default now(),
  unique (vibe_check_id, user_id)
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

alter table public.profiles enable row level security;
alter table public.vibe_checks enable row level security;
alter table public.vibe_reactions enable row level security;
alter table public.follows enable row level security;

create policy "profiles are readable"
  on public.profiles for select
  using (true);

create policy "users manage their own profile"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "users read visible vibe checks"
  on public.vibe_checks for select
  using (
    visibility = 'public'
    or user_id = auth.uid()
    or (
      visibility = 'friends'
      and exists (
        select 1
        from public.follows f1
        join public.follows f2
          on f2.follower_id = f1.following_id
         and f2.following_id = f1.follower_id
        where f1.follower_id = auth.uid()
          and f1.following_id = vibe_checks.user_id
      )
    )
  );

create policy "users create their own vibe checks"
  on public.vibe_checks for insert
  with check (auth.uid() = user_id);

create policy "users update their own vibe checks"
  on public.vibe_checks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users delete their own vibe checks"
  on public.vibe_checks for delete
  using (auth.uid() = user_id);

create policy "users read reactions on visible vibe checks"
  on public.vibe_reactions for select
  using (
    exists (
      select 1
      from public.vibe_checks vc
      where vc.id = vibe_reactions.vibe_check_id
        and (
          vc.visibility = 'public'
          or vc.user_id = auth.uid()
          or (
            vc.visibility = 'friends'
            and exists (
              select 1
              from public.follows f1
              join public.follows f2
                on f2.follower_id = f1.following_id
               and f2.following_id = f1.follower_id
              where f1.follower_id = auth.uid()
                and f1.following_id = vc.user_id
            )
          )
        )
    )
  );

create policy "users manage their own reactions"
  on public.vibe_reactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users read follows"
  on public.follows for select
  using (true);

create policy "users manage their outgoing follows"
  on public.follows for all
  using (auth.uid() = follower_id)
  with check (auth.uid() = follower_id);
