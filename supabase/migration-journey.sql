-- Migration: guided journey + motivation
-- Run in the Supabase SQL editor.

-- 1. Optional prerequisite per module (soft-lock guidance, never blocking)
alter table academy_modules
  add column if not exists prerequisite_module_id uuid
  references academy_modules(id) on delete set null;

-- 2. Per-learner step checklist state (indices of checked "## Step N" headings)
alter table academy_progress
  add column if not exists completed_steps integer[] not null default '{}';

-- 3. Earn-once achievements: rows are inserted the first time a learner
--    qualifies and never deleted, so new content can never demote a learner.
create table if not exists academy_achievements (
  learner_id uuid not null references academy_profiles(id) on delete cascade,
  achievement_id text not null,
  earned_at timestamptz not null default now(),
  primary key (learner_id, achievement_id)
);

alter table academy_achievements enable row level security;

create policy "academy: learners read own achievements" on academy_achievements
  for select using (learner_id = auth.uid());

create policy "academy: learners insert own achievements" on academy_achievements
  for insert with check (learner_id = auth.uid());

create policy "academy: trainers read learner achievements" on academy_achievements
  for select using (
    exists (
      select 1 from academy_profiles p
      where p.id = academy_achievements.learner_id
        and p.trainer_id = auth.uid()
    )
  );
