begin;
create table if not exists app_private.rules_ai_usage (
  scope text not null,
  subject text not null,
  window_start timestamptz not null,
  requests integer not null default 0,
  primary key(scope,subject,window_start)
);
revoke all on app_private.rules_ai_usage from public,anon,authenticated;
create or replace function public.consume_rules_ai_budget(p_team_id uuid,p_user_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare item record;
  day_start timestamptz := date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
  hour_start timestamptz := date_trunc('hour',now() at time zone 'UTC') at time zone 'UTC';
begin
  -- Only the authenticated Edge Function's service credential can call this RPC.
  perform pg_advisory_xact_lock(hashtextextended('dugout-rules-ai-budget',0));
  if not exists(select 1 from public.team_memberships m join public.teams t on t.id=m.team_id
    where m.team_id=p_team_id and m.user_id=p_user_id and (
      t.test_access or t.activation_status='active' or (t.activation_status='trial' and t.trial_ends_at>now())
    )) then raise exception 'Team access required' using errcode='42501'; end if;
  for item in select * from (values
    ('user-hour',p_user_id::text,hour_start,20),
    ('user-day',p_user_id::text,day_start,100),
    ('team-day',p_team_id::text,day_start,500),
    ('project-day','project',day_start,2000)
  ) as limits(scope,subject,window_start,maximum) loop
    insert into app_private.rules_ai_usage(scope,subject,window_start)
      values(item.scope,item.subject,item.window_start) on conflict do nothing;
    if (select requests from app_private.rules_ai_usage
      where scope=item.scope and subject=item.subject and window_start=item.window_start)>=item.maximum then
      raise exception 'Ask AI usage limit reached';
    end if;
    update app_private.rules_ai_usage set requests=requests+1
      where scope=item.scope and subject=item.subject and window_start=item.window_start;
  end loop;
  delete from app_private.rules_ai_usage where window_start<day_start-interval '2 days';
end;
$$;
revoke all on function public.consume_rules_ai_budget(uuid,uuid) from public,anon,authenticated;
grant execute on function public.consume_rules_ai_budget(uuid,uuid) to service_role;
commit;
