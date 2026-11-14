import { PLANS, type Plan } from '@/lib/team-plans';
import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Panel, Section, StatusMessage, ui } from './app-ui';
import { supabase } from '@/lib/supabase';
import { teamError } from '@/lib/teams';
import { useTeams } from '@/providers/team-provider';

export function TierTesting() {
  const { active, refresh } = useTeams();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const lock = useRef(false);
  async function change(tier: Plan) {
    if (!active || lock.current) return;
    const teamId = active.id;
    lock.current = true; setBusy(true); setError(''); setMessage('');
    try {
      const result = await supabase.rpc('set_testing_tier', { p_team_id: teamId, p_tier: tier });
      if (result.error) throw result.error;
      await refresh(teamId);
      setMessage(`${active.name}: ${PLANS[tier].name} access enabled.`);
    } catch (reason) { setError(teamError(reason)); }
    finally { lock.current = false; setBusy(false); }
  }
  return <Section title="Tier testing"><Panel><View style={{ padding: 18, gap: 12 }}>
    <Text style={ui.subtitle}>{active ? `${active.name} · ${active.subscription_tier === 'elite' ? 'Elite' : active.subscription_tier === 'starter' ? 'Starter' : 'Pro'} · ${active.access_status}` : 'Select a team first.'}</Text>
    <Text style={ui.subtitle}>Changes access for this team and its coaches. No subscription or payment is created.</Text>
    <View style={{ flexDirection: 'row', gap: 12 }}>
      {(Object.keys(PLANS) as Plan[]).map(tier=><View key={tier} style={ui.flex}><Button secondary disabled={busy||!active} onPress={()=>{void change(tier);}}>{PLANS[tier].name}</Button></View>)}
    </View>
    <StatusMessage text={error} error /><StatusMessage text={message} />
  </View></Panel></Section>;
}
