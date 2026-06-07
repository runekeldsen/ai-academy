-- AI Academy: separate profiles table sharing the same Supabase project as coaching-platform

create table if not exists academy_profiles (
  id uuid primary key references auth.users on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  role text not null check (role in ('trainer', 'learner', 'admin')) default 'learner',
  trainer_id uuid references academy_profiles(id),
  avatar_url text,
  created_at timestamptz default now()
);

alter table academy_profiles enable row level security;

-- Users can read their own profile
create policy "academy: own profile read" on academy_profiles
  for select using (auth.uid() = id);

-- Trainers can read their learners' profiles
create policy "academy: trainers read learners" on academy_profiles
  for select using (
    exists (
      select 1 from academy_profiles ap
      where ap.id = auth.uid()
        and ap.role in ('trainer', 'admin')
    )
  );

-- Users can update their own profile
create policy "academy: own profile update" on academy_profiles
  for update using (auth.uid() = id);

-- Trainers can insert learner profiles (used by service role in practice)
create policy "academy: trainers insert learners" on academy_profiles
  for insert with check (
    auth.uid() = trainer_id or
    exists (
      select 1 from academy_profiles ap
      where ap.id = auth.uid()
        and ap.role in ('trainer', 'admin')
    )
  );

-- Reuse existing get_user_auth_status function from coaching platform
-- (already created; no need to recreate)
-- If not present:
-- create or replace function get_user_auth_status(user_ids uuid[])
-- returns table(id uuid, confirmed_at timestamptz)
-- language sql security definer
-- as $$ select id, confirmed_at from auth.users where id = any(user_ids) $$;
