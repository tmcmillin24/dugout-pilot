begin;
-- Team owners/coaches only have SELECT on teams; this field is managed by
-- trusted billing/admin writes, never by editable team-board JSON.
alter table public.teams add column if not exists subscription_tier text not null
  default 'standard' check (subscription_tier in ('standard','elite'));
comment on column public.teams.subscription_tier is
  'Trusted subscription tier. Active status alone does not grant Elite. Existing Elite trials and admin test access remain separate entitlements.';
commit;
