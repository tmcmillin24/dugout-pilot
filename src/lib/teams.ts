import { supabase } from './supabase';

export type Team = {
  id: string;
  logo_path?: string | null;
  logo_url?: string | null;
  name: string;
  subscription_tier?: 'standard' | 'elite';
  test_access: boolean;
  trial_ends_at: string | null;
  access_status: 'pending' | 'trial' | 'active' | 'suspended' | 'expired';
  activation_status: 'pending' | 'trial' | 'active' | 'suspended';
  role: 'owner' | 'coach';
};

const signedLogos = new Map<string, { url: string; expires: number }>();

export async function listTeams(): Promise<Team[]> {
  const { data, error } = await supabase.rpc('list_my_teams');
  if (error) throw error;
  const tierResult = await supabase.from('teams').select('id,subscription_tier');
  const tiers = new Map<string,'standard'|'elite'>(tierResult.error ? [] : (tierResult.data ?? []).map(t=>[t.id,t.subscription_tier==='elite'?'elite':'standard']));
  const { data: { session } } = await supabase.auth.getSession();
  return (await Promise.all(((data ?? []) as Team[]).map(async row => {
    const team:Team={...row,subscription_tier:tiers.get(row.id)??'standard'};
    if (!team.logo_path || !session) return team;
    const key = `${session.user.id}:${team.logo_path}`;
    const cached = signedLogos.get(key);
    if (cached && cached.expires > Date.now()) return { ...team, logo_url: cached.url };
    const result = await supabase.storage.from('team-logos').createSignedUrl(team.logo_path, 600);
    if (result.error) return { ...team, logo_url: null };
    if (signedLogos.size > 100) signedLogos.clear();
    signedLogos.set(key, { url: result.data.signedUrl, expires: Date.now() + 480000 });
    return { ...team, logo_url: result.data.signedUrl };
  }))).sort((a, b) => a.name.localeCompare(b.name));
}

export async function createTeam(name: string, requestId: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_team', { team_name: name.trim(), request_id: requestId });
  if (error) throw error;
  return data as string;
}

export type TeamMember = { user_id: string; email: string; role: 'owner' | 'coach' };
export type TeamInvitation = { id: string; email: string; expires_at: string; status: 'pending' | 'accepted' | 'revoked' | 'expired' };
export type ActivationTeam = { id: string; name: string; activation_status: Team['activation_status']; test_access: boolean };

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data as T;
}
export const renameTeam = (teamId: string, name: string) => rpc<void>('rename_team', { p_team_id: teamId, p_name: name.trim() });
export const listTeamCoaches = (teamId: string) => rpc<TeamMember[]>('list_team_coaches', { p_team_id: teamId });
export const listTeamInvitations = (teamId: string) => rpc<TeamInvitation[]>('list_team_invitations', { p_team_id: teamId });
export const inviteCoach = (teamId: string, email: string, inviteId: string, code: string) => rpc<string>('invite_coach', { p_team_id: teamId, p_email: email.trim().toLowerCase(), p_invite_id: inviteId, p_code: code });
export const revokeCoachInvite = (teamId: string, inviteId: string) => rpc<void>('revoke_coach_invite', { p_team_id: teamId, p_invite_id: inviteId });
export const acceptCoachInvite = (code: string) => rpc<string>('accept_coach_invite', { p_code: code.trim().toLowerCase() });
export const removeTeamCoach = (teamId: string, userId: string) => rpc<void>('remove_team_coach', { p_team_id: teamId, p_user_id: userId });
export const isSuperAdmin = () => rpc<boolean>('is_super_admin');
export const listActivationTeams = (page: number) => rpc<ActivationTeam[]>('list_test_activation_teams', { p_page: page });
export const setTeamTestAccess = (teamId: string, enabled: boolean) => rpc<void>('set_team_test_access', { p_team_id: teamId, p_enabled: enabled });

export function teamError(reason: unknown): string {
  const error = reason as { message?: string; code?: string };
  if (['42P01', 'PGRST205', 'PGRST202'].includes(error?.code ?? '')) return 'The latest team database setup is not installed yet. Apply the latest team migration in Supabase, then refresh.';
  return error?.message || 'Could not connect. Please try again.';
}

export const deleteTeam = (teamId: string, confirmation: string) => rpc<void>('delete_team', { p_team_id: teamId, p_confirmation: confirmation.trim() });
