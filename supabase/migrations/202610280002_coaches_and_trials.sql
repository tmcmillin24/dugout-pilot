begin;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;
create table app_private.super_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table app_private.activation_events (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id),
  actor_id uuid not null references auth.users(id),
  enabled boolean not null,
  created_at timestamptz not null default now()
);
alter table app_private.super_admins enable row level security;
alter table app_private.activation_events enable row level security;
revoke all on app_private.super_admins, app_private.activation_events from public, anon, authenticated;

alter table public.teams add column test_access boolean not null default false;
alter table public.teams add constraint test_access_requires_active check (not test_access or activation_status = 'active');

alter table public.teams add column trial_started_at timestamptz;
alter table public.teams add column trial_ends_at timestamptz;
alter table public.teams add constraint valid_team_trial check (
  (trial_started_at is null and trial_ends_at is null) or
  (trial_started_at is not null and trial_ends_at is not null and trial_ends_at > trial_started_at)
);
-- Existing development teams also receive their trial automatically, without approval.
update public.teams set activation_status = 'trial', trial_started_at = now(), trial_ends_at = now() + interval '14 days'
  where activation_status = 'pending' and not test_access;

create or replace function public.create_team(team_name text, request_id uuid)
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
  insert into public.teams(id,name,created_by,activation_status,trial_started_at,trial_ends_at)
    values (request_id,clean_name,caller,'trial',now(),now() + interval '14 days') on conflict (id) do nothing;
  select created_by into existing_creator from public.teams where id = request_id;
  if existing_creator is distinct from caller then raise exception 'Unable to create team.' using errcode = '42501'; end if;
  insert into public.team_memberships(team_id,user_id,role) values(request_id,caller,'owner') on conflict (team_id,user_id) do nothing;
  return request_id;
end;
$$;

-- Authoritative access is derived from server time, so no scheduled job or client
-- clock change is needed to stop an expired trial. Use this for future game-data RLS.
create function public.has_team_feature_access(p_team_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.teams t join public.team_memberships m on m.team_id = t.id
    where t.id = p_team_id and m.user_id = auth.uid() and (
      t.activation_status = 'active' or (t.activation_status = 'trial' and t.trial_ends_at > now())
    ));
$$;

create function public.list_my_teams()
returns table(id uuid, name text, activation_status text, test_access boolean, role text, trial_ends_at timestamptz, access_status text)
language sql stable security invoker set search_path = '' as $$
  select t.id,t.name,t.activation_status,t.test_access,m.role,t.trial_ends_at,
    case when t.activation_status = 'trial' and (t.trial_ends_at is null or t.trial_ends_at <= now()) then 'expired' else t.activation_status end
  from public.teams t join public.team_memberships m on m.team_id = t.id where m.user_id = auth.uid();
$$;


create table public.team_invitations (
  id uuid primary key,
  team_id uuid not null references public.teams(id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  invited_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz,
  revoked_at timestamptz
);
create index team_invitations_team_idx on public.team_invitations(team_id, created_at desc);
alter table public.team_invitations enable row level security;
revoke all on public.team_invitations from public, anon, authenticated;
-- Invitation records are accessible only through owner-checked functions.

create function public.rename_team(p_team_id uuid, p_name text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.teams where id = p_team_id for update;
  if not exists (select 1 from public.team_memberships where team_id = p_team_id and user_id = auth.uid() and role = 'owner') then
    raise exception 'Only the team owner can rename this team.' using errcode = '42501';
  end if;
  if p_name is null or char_length(btrim(p_name)) not between 2 and 80 then
    raise exception 'Team name must contain 2 to 80 characters.' using errcode = '22023';
  end if;
  update public.teams set name = btrim(p_name) where id = p_team_id;
end;
$$;

create function public.list_team_coaches(p_team_id uuid)
returns table(user_id uuid, email text, role text)
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.team_memberships m where m.team_id = p_team_id and m.user_id = auth.uid() and m.role = 'owner') then
    raise exception 'Only the team owner can view team access.' using errcode = '42501';
  end if;
  return query select m.user_id, u.email::text, m.role from public.team_memberships m
    join auth.users u on u.id = m.user_id where m.team_id = p_team_id order by m.role desc, m.created_at;
end;
$$;

create function public.list_team_invitations(p_team_id uuid)
returns table(id uuid, email text, expires_at timestamptz, status text)
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.team_memberships m where m.team_id = p_team_id and m.user_id = auth.uid() and m.role = 'owner') then
    raise exception 'Only the team owner can view invitations.' using errcode = '42501';
  end if;
  return query select i.id, i.email, i.expires_at,
    case when i.revoked_at is not null then 'revoked' when i.accepted_at is not null then 'accepted'
      when i.expires_at <= now() then 'expired' else 'pending' end
    from public.team_invitations i where i.team_id = p_team_id order by i.created_at desc limit 50;
end;
$$;

create function public.invite_coach(p_team_id uuid, p_email text, p_invite_id uuid, p_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  address text := lower(btrim(p_email));
  code text := lower(btrim(p_code));
  hashed text;
  previous public.team_invitations%rowtype;
begin
  perform 1 from public.teams where id = p_team_id for update;
  if not exists (select 1 from public.team_memberships where team_id = p_team_id and user_id = auth.uid() and role = 'owner') then
    raise exception 'Only the team owner can invite coaches.' using errcode = '42501';
  end if;
  if address is null or char_length(address) > 254 or address !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Enter a valid coach email address.' using errcode = '22023';
  end if;
  if p_invite_id is null or code is null or code !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid invitation request.' using errcode = '22023';
  end if;
  hashed := encode(sha256(convert_to(code,'UTF8')),'hex');
  select * into previous from public.team_invitations where id = p_invite_id;
  if found then
    if previous.team_id <> p_team_id or previous.email <> address or previous.token_hash <> hashed then
      raise exception 'Invitation request conflicts with an existing request.' using errcode = '22023';
    end if;
    if previous.revoked_at is not null or previous.accepted_at is not null or previous.expires_at <= now() then
      raise exception 'This invitation is no longer pending. Create a new invitation.' using errcode = '22023';
    end if;
    return previous.id;
  end if;
  if exists (select 1 from public.team_memberships m join auth.users u on u.id = m.user_id where m.team_id = p_team_id and lower(u.email) = address) then
    raise exception 'This person already belongs to this team.' using errcode = '22023';
  end if;
  update public.team_invitations set revoked_at = now()
    where team_id = p_team_id and email = address and accepted_at is null and revoked_at is null;
  if (select count(*) from public.team_invitations where team_id = p_team_id and accepted_at is null and revoked_at is null and expires_at > now()) >= 25 then
    raise exception 'This team already has 25 pending invitations. Revoke an invitation first.' using errcode = '22023';
  end if;
  insert into public.team_invitations(id,team_id,email,token_hash,invited_by)
    values(p_invite_id,p_team_id,address,hashed,auth.uid());
  return p_invite_id;
end;
$$;

create function public.revoke_coach_invite(p_team_id uuid, p_invite_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.teams where id = p_team_id for update;
  if not exists (select 1 from public.team_memberships where team_id = p_team_id and user_id = auth.uid() and role = 'owner') then
    raise exception 'Only the team owner can revoke invitations.' using errcode = '42501';
  end if;
  update public.team_invitations set revoked_at = coalesce(revoked_at,now())
    where id = p_invite_id and team_id = p_team_id and accepted_at is null;
end;
$$;

create function public.accept_coach_invite(p_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  code text := lower(btrim(p_code));
  invitation public.team_invitations%rowtype;
  address text;
  confirmed timestamptz;
  caller uuid := auth.uid();
begin
  if caller is null then raise exception 'Sign in to accept an invitation.' using errcode = '42501'; end if;
  select lower(email), email_confirmed_at into address, confirmed from auth.users where id = caller;
  if confirmed is null then raise exception 'Confirm your account email before accepting an invitation.' using errcode = '42501'; end if;
  if code is null or code !~ '^[a-f0-9]{64}$' then raise exception 'This invitation is invalid or unavailable.' using errcode = '22023'; end if;
  select * into invitation from public.team_invitations where token_hash = encode(sha256(convert_to(code,'UTF8')),'hex');
  if not found then raise exception 'This invitation is invalid or unavailable.' using errcode = '22023'; end if;
  -- All membership/invitation mutations lock the team first, so revoke/remove races are serialized.
  perform 1 from public.teams where id = invitation.team_id for update;
  select * into invitation from public.team_invitations where id = invitation.id for update;
  if invitation.email is distinct from address or invitation.revoked_at is not null then
    raise exception 'This invitation is invalid or unavailable for this account.' using errcode = '42501';
  end if;
  if invitation.accepted_at is not null then
    if invitation.accepted_by = caller and exists(select 1 from public.team_memberships where team_id = invitation.team_id and user_id = caller) then return invitation.team_id; end if;
    raise exception 'This invitation has already been used.' using errcode = '22023';
  end if;
  if invitation.expires_at <= now() then raise exception 'This invitation has expired. Ask the owner for a new one.' using errcode = '22023'; end if;
  insert into public.team_memberships(team_id,user_id,role) values(invitation.team_id,caller,'coach') on conflict (team_id,user_id) do nothing;
  update public.team_invitations set accepted_at = now(), accepted_by = caller where id = invitation.id;
  return invitation.team_id;
end;
$$;

create function public.remove_team_coach(p_team_id uuid, p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.teams where id = p_team_id for update;
  if not exists (select 1 from public.team_memberships where team_id = p_team_id and user_id = auth.uid() and role = 'owner') then
    raise exception 'Only the team owner can remove coaches.' using errcode = '42501';
  end if;
  if exists (select 1 from public.team_memberships where team_id = p_team_id and user_id = p_user_id and role = 'owner') then
    raise exception 'The team owner cannot be removed.' using errcode = '22023';
  end if;
  delete from public.team_memberships where team_id = p_team_id and user_id = p_user_id and role = 'coach';
end;
$$;

create function public.is_super_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from app_private.super_admins where user_id = auth.uid());
$$;

create function public.list_test_activation_teams(p_page integer default 0)
returns table(id uuid, name text, activation_status text, test_access boolean)
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_super_admin() then raise exception 'Super Admin access required.' using errcode = '42501'; end if;
  if p_page is null or p_page < 0 or p_page > 100000 then raise exception 'Invalid page.' using errcode = '22023'; end if;
  return query select t.id,t.name,t.activation_status,t.test_access from public.teams t
    order by t.id limit 50 offset (p_page * 50);
end;
$$;

create function public.set_team_test_access(p_team_id uuid, p_enabled boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare selected public.teams%rowtype;
begin
  if not public.is_super_admin() then raise exception 'Super Admin access required.' using errcode = '42501'; end if;
  if p_enabled is null then raise exception 'Specify whether test access is enabled.' using errcode = '22023'; end if;
  select * into selected from public.teams where id = p_team_id for update;
  if not found then raise exception 'Team not found.' using errcode = '22023'; end if;
  if selected.activation_status not in ('pending','trial') and not selected.test_access then
    raise exception 'Only trial, pending, or test teams can use this control.' using errcode = '22023';
  end if;
  if selected.test_access = p_enabled then return; end if;
  update public.teams set test_access = p_enabled, activation_status = case when p_enabled then 'active' when trial_ends_at is not null then 'trial' else 'pending' end where id = p_team_id;
  insert into app_private.activation_events(team_id,actor_id,enabled) values(p_team_id,auth.uid(),p_enabled);
end;
$$;

-- Do not inherit default PUBLIC/anon execution rights. Private grants remain SQL-only.
revoke all on function public.create_team(text,uuid), public.has_team_feature_access(uuid), public.list_my_teams(), public.rename_team(uuid,text), public.list_team_coaches(uuid), public.list_team_invitations(uuid),
  public.invite_coach(uuid,text,uuid,text), public.revoke_coach_invite(uuid,uuid), public.accept_coach_invite(text),
  public.remove_team_coach(uuid,uuid), public.is_super_admin(), public.list_test_activation_teams(integer), public.set_team_test_access(uuid,boolean)
  from public, anon, authenticated;
grant execute on function public.create_team(text,uuid), public.has_team_feature_access(uuid), public.list_my_teams(), public.rename_team(uuid,text), public.list_team_coaches(uuid), public.list_team_invitations(uuid),
  public.invite_coach(uuid,text,uuid,text), public.revoke_coach_invite(uuid,uuid), public.accept_coach_invite(text),
  public.remove_team_coach(uuid,uuid), public.is_super_admin(), public.list_test_activation_teams(integer), public.set_team_test_access(uuid,boolean)
  to authenticated;

commit;
