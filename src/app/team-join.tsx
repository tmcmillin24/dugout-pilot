import { router } from 'expo-router';
import { JoinTeam } from '@/components/team-controls';
import { Screen } from '@/components/app-ui';
import { useTeams } from '@/providers/team-provider';
export default function JoinTeamScreen() {
  const { refresh } = useTeams();
  return <Screen title="Join your team." subtitle="Your next dugout is one invitation away." back><JoinTeam onJoined={async id => { await refresh(id); router.replace('/teams'); }} /></Screen>;
}
