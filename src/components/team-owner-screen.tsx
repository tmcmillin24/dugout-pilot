import TeamLogoEditor from './team-logo-editor';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Loading, Screen, StatusMessage } from './app-ui';
import { OwnerPanel } from './team-controls';
import { useTeams } from '@/providers/team-provider';
export default function TeamOwnerScreen({ view }: { view: 'settings' | 'coaches' | 'invite' }) {
  const { id } = useLocalSearchParams<{ id: string }>(); const { teams, loading, error, refresh } = useTeams(); const team = teams.find(value => value.id === id);
  const title = { settings: 'Team details', coaches: 'Coaching staff', invite: 'Invite a coach' }[view];
  return <Screen title={title} subtitle={team?.name} back onRefresh={refresh}>
    <StatusMessage text={error} error />{loading ? <Loading /> : team?.role === 'owner' ? <>
      {view === 'settings' && <TeamLogoEditor team={team} onChanged={() => refresh(team.id)} />}
      {view === 'coaches' && <Button onPress={() => router.push({ pathname: '/team-invite', params: { id } })}>Invite a coach</Button>}
      <OwnerPanel key={`${team.id}:${view}`} team={team} view={view} onChanged={() => refresh(team.id)} />
    </> : <StatusMessage text="Only the current team owner can manage this team. Refresh to check your access." />}
  </Screen>;
}
