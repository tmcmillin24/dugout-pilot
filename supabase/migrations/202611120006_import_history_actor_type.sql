begin;
-- Dugout Pilot only: rlxscbutvxvsijgtcrbq.
-- auth.users.email is varchar, but the public result contract requires text.
create or replace function public.list_team_import_history(p_team_id uuid)
returns table(id uuid,created_at timestamptz,label text,summary text,player_count integer,actor text,recoverable boolean,revision integer)
language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.team_memberships where team_id=p_team_id and user_id=auth.uid()) then raise exception 'Team membership required.' using errcode='42501'; end if;
 return query select h.id,h.created_at,h.label,h.summary,h.player_count,case when h.actor_id=auth.uid() then 'You' when m.user_id is not null then coalesce(u.email::text,'Team coach') else 'Former team coach' end,h.previous_stats is not null,h.revision from public.team_import_history h left join auth.users u on u.id=h.actor_id left join public.team_memberships m on m.team_id=h.team_id and m.user_id=h.actor_id where h.team_id=p_team_id order by h.revision desc,h.id desc limit 30;
end;
$$;
revoke all on function public.list_team_import_history(uuid) from public,anon,authenticated;
grant execute on function public.list_team_import_history(uuid) to authenticated;
notify pgrst, 'reload schema';
commit;

