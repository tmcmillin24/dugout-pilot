begin;
create table if not exists public.rules_source_versions (
  url text primary key,
  digest text not null,
  checked_at timestamptz not null default now()
);
create table if not exists public.rules_answer_cache (
  cache_key text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  answer jsonb not null,
  expires_at timestamptz not null
);
alter table public.rules_source_versions enable row level security;
alter table public.rules_answer_cache enable row level security;
revoke all on public.rules_source_versions,public.rules_answer_cache from public,anon,authenticated;
grant select,insert,update,delete on public.rules_source_versions,public.rules_answer_cache to service_role;
create index if not exists rules_answer_cache_expiry on public.rules_answer_cache(expires_at);
commit;
