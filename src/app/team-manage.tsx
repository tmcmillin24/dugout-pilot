import { router, useLocalSearchParams } from 'expo-router';
import { AccessBadge, Loading, MenuRow, Panel, Screen, Section, StatusMessage } from '@/components/app-ui';
import { useTeams } from '@/providers/team-provider';
export default function ManageTeamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { teams, loading, error, refresh } = useTeams(); const team = teams.find(value => value.id === id);
  return <Screen title={team?.name ?? 'Team management'} subtitle="Team settings" back onRefresh={refresh}>
    <StatusMessage text={error} error />{loading ? <Loading /> : team?.role === 'owner' ? <><AccessBadge team={team} /><Section title="Team settings"><Panel><MenuRow icon="teams" title="Team details" description="Update your team name" onPress={() => router.push({ pathname: '/team-settings', params: { id } })} /><MenuRow icon="shield" title="Coach access" description="Manage coaches and recent invitations" onPress={() => router.push({ pathname: '/team-coaches', params: { id } })} /><MenuRow icon="mail" title="Invite a coach" description="Create a secure invitation for your staff" onPress={() => router.push({ pathname: '/team-invite', params: { id } })} last /></Panel></Section></> : <StatusMessage text="Only the current team owner can manage this team. Refresh to check your access." />}
  </Screen>;
}
