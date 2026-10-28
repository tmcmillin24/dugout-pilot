import { supabase } from './supabase';

export type Team = {
  id: string;
  name: string;
  activation_status: 'pending' | 'trial' | 'active' | 'suspended';
  role: 'owner' | 'coach';
};

export async function listTeams(): Promise<Team[]> {
  const { data, error } = await supabase.from('team_memberships')
    .select('role, team:teams(id,name,activation_status)');
  if (error) throw error;
  return (data ?? []).flatMap(row => {
    const team = row.team as unknown as Omit<Team, 'role'> | null;
    return team ? [{ ...team, role: row.role as Team['role'] }] : [];
  }).sort((a, b) => a.name.localeCompare(b.name));
}

export async function createTeam(name: string, requestId: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_team', { team_name: name.trim(), request_id: requestId });
  if (error) throw error;
  return data as string;
}
