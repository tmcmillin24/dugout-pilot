begin;
-- Keep only an administrative deletion receipt and activation audit; the live
-- team, memberships, and invitations are removed, not archived/restorable in-app.
create table app_private.team_deletions (
  team_id uuid primary key,
  team_name text not null,
  deleted_by uuid references auth.users(id) on delete set null,
  deleted_at timestamptz not null default now(),
  activation_audit jsonb not null default '[]'::jsonb
);
create table app_private.team_logo_cleanup (
  object_path text primary key,
  team_id uuid not null,
  requested_at timestamptz not null default now()
);
alter table app_private.team_deletions enable row level security;
alter table app_private.team_logo_cleanup enable row level security;
revoke all on app_private.team_deletions, app_private.team_logo_cleanup from public,anon,authenticated;

create function public.delete_team(p_team_id uuid, p_confirmation text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  selected public.teams%rowtype;
begin
  if caller is null then raise exception 'Sign in to delete a team.' using errcode = '42501'; end if;
  if p_team_id is null then raise exception 'This team is unavailable.' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_team_id::text,0));
  select * into selected from public.teams where id = p_team_id for update;
  if not found then
    -- Retry safely if the first deletion succeeded but its response was lost.
    if exists(select 1 from app_private.team_deletions where team_id = p_team_id and deleted_by = caller and team_name = btrim(p_confirmation)) then return; end if;
    raise exception 'This team is unavailable.' using errcode = '42501';
  end if;
  if not exists(select 1 from public.team_memberships where team_id = p_team_id and user_id = caller and role = 'owner') then
    raise exception 'Only the team owner can delete this team.' using errcode = '42501';
  end if;
  if p_confirmation is null or btrim(p_confirmation) <> selected.name then
    raise exception 'Enter the exact team name to confirm deletion.' using errcode = '22023';
  end if;
  insert into app_private.team_deletions(team_id,team_name,deleted_by,activation_audit)
    values(p_team_id,selected.name,caller,coalesce((select jsonb_agg(to_jsonb(e)) from app_private.activation_events e where e.team_id = p_team_id),'[]'::jsonb));
  -- Physical image files must be removed through the Storage API, not by deleting
  -- storage.objects metadata in SQL. Retain a durable cleanup queue for that job.
  insert into app_private.team_logo_cleanup(object_path,team_id)
    select name,p_team_id from storage.objects where bucket_id = 'team-logos' and split_part(name,'/',1) = p_team_id::text
    on conflict (object_path) do nothing;
  delete from app_private.activation_events where team_id = p_team_id;
  -- Existing FK cascades remove memberships and invitations atomically.
  delete from public.teams where id = p_team_id;
end;
$$;
revoke all on function public.delete_team(uuid,text) from public,anon,authenticated;
grant execute on function public.delete_team(uuid,text) to authenticated;

-- A deleted request UUID must never be reused to recreate the team on retry.
create or replace function public.create_team(team_name text, request_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid(); existing_creator uuid; clean_name text := btrim(team_name);
begin
  if caller is null then raise exception 'Sign in to create a team.' using errcode = '42501'; end if;
  if clean_name is null or char_length(clean_name) not between 2 and 80 then raise exception 'Team name must contain 2 to 80 characters.' using errcode = '22023'; end if;
  if request_id is null then raise exception 'A request identifier is required.' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(request_id::text,0));
  if exists(select 1 from app_private.team_deletions where team_id = request_id) then raise exception 'Create a new team instead of retrying a deleted team.' using errcode = '22023'; end if;
  insert into public.teams(id,name,created_by,activation_status,trial_started_at,trial_ends_at)
    values(request_id,clean_name,caller,'trial',now(),now() + interval '14 days') on conflict(id) do nothing;
  select created_by into existing_creator from public.teams where id = request_id;
  if existing_creator is distinct from caller then raise exception 'Unable to create team.' using errcode = '42501'; end if;
  insert into public.team_memberships(team_id,user_id,role) values(request_id,caller,'owner') on conflict(team_id,user_id) do nothing;
  return request_id;
end;
$$;
revoke all on function public.create_team(text,uuid) from public,anon,authenticated;
grant execute on function public.create_team(text,uuid) to authenticated;
commit;
