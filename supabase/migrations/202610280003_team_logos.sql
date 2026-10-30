begin;
alter table public.teams add column logo_path text;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('team-logos','team-logos',false,5242880,array['image/png'])
on conflict (id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['image/png'];

create policy team_logo_read on storage.objects for select to authenticated using (
  bucket_id = 'team-logos' and exists (
    select 1 from public.team_memberships m where m.team_id::text = split_part(storage.objects.name,'/',1) and m.user_id = (select auth.uid())
  )
);
create policy team_logo_upload on storage.objects for insert to authenticated with check (
  bucket_id = 'team-logos' and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.png$' and exists (
    select 1 from public.team_memberships m where m.team_id::text = split_part(storage.objects.name,'/',1) and m.user_id = (select auth.uid()) and m.role = 'owner'
  )
);
-- Immutable filenames avoid overwriting a cached logo. Only unreferenced versions
-- can be deleted through the Storage API after a replacement/removal succeeds.
create policy team_logo_cleanup on storage.objects for delete to authenticated using (
  bucket_id = 'team-logos' and exists (
    select 1 from public.team_memberships m where m.team_id::text = split_part(storage.objects.name,'/',1) and m.user_id = (select auth.uid()) and m.role = 'owner'
  ) and not exists (select 1 from public.teams t where t.logo_path = storage.objects.name)
);

create function public.set_team_logo(p_team_id uuid, p_path text)
returns text language plpgsql security definer set search_path = '' as $$
declare previous text;
begin
  select logo_path into previous from public.teams where id = p_team_id for update;
  if not exists(select 1 from public.team_memberships where team_id = p_team_id and user_id = auth.uid() and role = 'owner') then
    raise exception 'Only the team owner can change its logo.' using errcode = '42501';
  end if;
  if p_path is not null then
    if split_part(p_path,'/',1) <> p_team_id::text or p_path !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.png$' then
      raise exception 'Invalid team logo path.' using errcode = '22023';
    end if;
    perform 1 from storage.objects where bucket_id = 'team-logos' and name = p_path for key share;
    if not found then raise exception 'Upload the logo before saving it.' using errcode = '22023'; end if;
  end if;
  update public.teams set logo_path = p_path where id = p_team_id;
  return previous;
end;
$$;
revoke all on function public.set_team_logo(uuid,text) from public,anon,authenticated;
grant execute on function public.set_team_logo(uuid,text) to authenticated;

drop function public.list_my_teams();
create function public.list_my_teams()
returns table(id uuid, name text, activation_status text, test_access boolean, role text, trial_ends_at timestamptz, access_status text, logo_path text)
language sql stable security invoker set search_path = '' as $$
  select t.id,t.name,t.activation_status,t.test_access,m.role,t.trial_ends_at,
    case when t.activation_status = 'trial' and (t.trial_ends_at is null or t.trial_ends_at <= now()) then 'expired' else t.activation_status end,
    t.logo_path
  from public.teams t join public.team_memberships m on m.team_id = t.id where m.user_id = auth.uid();
$$;
revoke all on function public.list_my_teams() from public,anon,authenticated;
grant execute on function public.list_my_teams() to authenticated;
commit;
