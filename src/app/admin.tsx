import { Screen } from '@/components/app-ui';
import { ActivationPanel } from '@/components/team-controls';
import { useTeams } from '@/providers/team-provider';
export default function AdminScreen() {
  const { refresh } = useTeams();
  return <Screen title="Test access" eyebrow="SUPER ADMIN" subtitle="Optional development overrides. New team trials start automatically." back><ActivationPanel onChanged={refresh} /></Screen>;
}
