begin;

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  activation_status text not null default 'pending' check (activation_status in ('pending','trial','active','suspended')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create table public.team_memberships (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','coach')),
  created_at timestamptz not null default now(),
  primary key (team_id,user_id)
);
create index team_memberships_user_id_idx on public.team_memberships(user_id);
alter table public.teams enable row level security;
alter table public.team_memberships enable row level security;

revoke all on public.teams, public.team_memberships from anon, authenticated;
grant select on public.teams, public.team_memberships to authenticated;

create policy own_memberships on public.team_memberships for select to authenticated
  using (user_id = (select auth.uid()));
create policy member_teams on public.teams for select to authenticated
  using (exists (select 1 from public.team_memberships m where m.team_id = teams.id and m.user_id = (select auth.uid())));

-- Creates the team and owner membership together; clients cannot choose a user,
-- role, activation status, subscription, or another team's identifier.
create function public.create_team(team_name text, request_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  existing_creator uuid;
  clean_name text := btrim(team_name);
begin
  if caller is null then raise exception 'Sign in to create a team.' using errcode = '42501'; end if;
  if clean_name is null or char_length(clean_name) not between 2 and 80 then
    raise exception 'Team name must contain 2 to 80 characters.' using errcode = '22023';
  end if;
  if request_id is null then raise exception 'A request identifier is required.' using errcode = '22023'; end if;
  -- A stable request UUID makes retries safe if the first response is lost.
  insert into public.teams(id,name,created_by) values (request_id,clean_name,caller)
    on conflict (id) do nothing;
  select created_by into existing_creator from public.teams where id = request_id;
  if existing_creator is distinct from caller then
    raise exception 'Unable to create team.' using errcode = '42501';
  end if;
  insert into public.team_memberships(team_id,user_id,role) values(request_id,caller,'owner')
    on conflict (team_id,user_id) do nothing;
  return request_id;
end;
$$;
revoke all on function public.create_team(text,uuid) from public, anon, authenticated;
grant execute on function public.create_team(text,uuid) to authenticated;

commit;
