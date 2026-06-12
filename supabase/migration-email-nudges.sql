-- Email nudges: learner opt-out flag (default on)
alter table academy_profiles
  add column if not exists email_nudges boolean not null default true;
