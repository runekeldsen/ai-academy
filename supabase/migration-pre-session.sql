-- Pre-session prep path (EMT and future teams)
alter table academy_sections add column if not exists is_pre_session boolean not null default false;
alter table academy_teams add column if not exists pre_session_section_id uuid references academy_sections(id) on delete set null;
alter table academy_profiles add column if not exists pre_session_dismissed boolean not null default false;

create table if not exists academy_topic_choices (
  learner_id uuid primary key references academy_profiles(id) on delete cascade,
  topic text not null check (topic in ('financial-review','strategy-review','effective-meetings')),
  chosen_at timestamptz not null default now()
);

alter table academy_topic_choices enable row level security;

create policy "Learners manage own topic choice"
  on academy_topic_choices for all
  using (learner_id = auth.uid())
  with check (learner_id = auth.uid());

create policy "Trainers read their learners' topic choices"
  on academy_topic_choices for select
  using (
    exists (
      select 1 from academy_profiles p
      where p.id = academy_topic_choices.learner_id
        and p.trainer_id = auth.uid()
    )
  );
