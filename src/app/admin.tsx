import { Screen } from '@/components/app-ui';
import { ActivationPanel } from '@/components/team-controls';
import { useTeams } from '@/providers/team-provider';
export default function AdminScreen() {
  const { refresh } = useTeams();
  return <Screen title="Test access" eyebrow="SUPER ADMIN" subtitle="Development access" back><ActivationPanel onChanged={refresh} /></Screen>;
}
