-- Migration: link an inspiration template to a tutorial module
-- Run this in the Supabase SQL editor.

-- Bridges "Use cases" tutorials and "Projects": when set, the template card
-- links learners to the tutorial, and that module shows a "Start this as a
-- project" hand-off. on delete set null so removing a module just drops the link.
alter table academy_project_templates
  add column if not exists module_id uuid references academy_modules(id) on delete set null;
