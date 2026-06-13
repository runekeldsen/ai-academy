-- Per-team display name for the platform brand.
-- When set, learners in that team see this instead of the default "Rune's AI Academy".
-- e.g. the EMT team can show "AI Academy for the EMT".
alter table academy_teams
  add column if not exists academy_name text;
