-- Migration: promote content to a team (pinned on the learner front page)
-- Run this in the Supabase SQL editor.

-- 1. A trainer pins one piece of content (a module or a resource) to a team.
create table if not exists academy_promotions (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references academy_profiles(id) on delete cascade,
  team_id uuid not null references academy_teams(id) on delete cascade,
  content_type text not null check (content_type in ('module', 'resource')),
  content_id uuid not null,
  created_at timestamptz not null default now(),
  unique (team_id, content_type, content_id)
);

alter table academy_promotions enable row level security;

-- Trainers manage their own promotions
create policy "academy: trainers manage own promotions" on academy_promotions
  for all
  using (trainer_id = auth.uid())
  with check (trainer_id = auth.uid());

-- Learners read promotions targeting their own team
create policy "academy: learners read team promotions" on academy_promotions
  for select using (
    exists (
      select 1 from academy_profiles p
      where p.id = auth.uid()
        and p.team_id = academy_promotions.team_id
    )
  );

-- 2. Per-learner dismissal: a row exists once the learner has opened the promotion.
create table if not exists academy_promotion_dismissals (
  promotion_id uuid not null references academy_promotions(id) on delete cascade,
  learner_id uuid not null references academy_profiles(id) on delete cascade,
  dismissed_at timestamptz not null default now(),
  primary key (promotion_id, learner_id)
);

alter table academy_promotion_dismissals enable row level security;

create policy "academy: learners read own dismissals" on academy_promotion_dismissals
  for select using (learner_id = auth.uid());

create policy "academy: learners insert own dismissals" on academy_promotion_dismissals
  for insert with check (learner_id = auth.uid());

-- Trainers can read dismissals for their own learners (optional reach stats)
create policy "academy: trainers read learner dismissals" on academy_promotion_dismissals
  for select using (
    exists (
      select 1 from academy_profiles p
      where p.id = academy_promotion_dismissals.learner_id
        and p.trainer_id = auth.uid()
    )
  );
