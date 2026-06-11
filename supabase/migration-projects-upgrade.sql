-- Migration: My Projects upgrade (themed inspiration + ship moment)
-- Run this in the Supabase SQL editor.

-- 1. Theme + "great first project" flag on inspiration templates
alter table academy_project_templates
  add column if not exists category text,
  add column if not exists recommended_first boolean not null default false;

comment on column academy_project_templates.category is
  'claude-project | add-context | build-skill | null (null renders under "More ideas")';

-- 2. Ship moment on projects (null = not shipped; timestamp doubles as celebration date)
alter table academy_projects
  add column if not exists shipped_at timestamptz;

-- 3. Trainer write access to inspiration templates (idempotent)
drop policy if exists "academy: trainers manage own templates" on academy_project_templates;
create policy "academy: trainers manage own templates" on academy_project_templates
  for all
  using (trainer_id = auth.uid())
  with check (trainer_id = auth.uid());
