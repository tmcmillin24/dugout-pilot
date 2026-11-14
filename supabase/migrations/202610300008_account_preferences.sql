begin;
create table if not exists public.account_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  preference_key text not null check (length(preference_key) between 1 and 200),
  value jsonb not null check (jsonb_typeof(value)='array' and octet_length(value::text)<=8192),
  primary key (user_id,preference_key)
);
alter table public.account_preferences enable row level security;
revoke all on public.account_preferences from anon;
grant select,insert,update,delete on public.account_preferences to authenticated;
drop policy if exists account_preferences_owner on public.account_preferences;
create policy account_preferences_owner on public.account_preferences
  for all to authenticated using ((select auth.uid())=user_id)
  with check ((select auth.uid())=user_id);
-- Polling works without Realtime; publish when this project has that publication.
do $$ begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime')
     and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='account_preferences') then
    alter publication supabase_realtime add table public.account_preferences;
  end if;
end $$;
commit;
