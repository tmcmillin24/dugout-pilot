import { router } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Button, Icon, Panel, Screen, StatusMessage, palette, ui } from '@/components/app-ui';
import { createTeam, teamError } from '@/lib/teams';
import { useTeams } from '@/providers/team-provider';

export default function CreateTeamScreen() {
  const { refresh } = useTeams();
  const [name, setName] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const inFlight = useRef(false); const request = useRef<{ name: string; id: string } | null>(null);
  async function submit() {
    if (inFlight.current) return;
    const clean = name.trim(); if (clean.length < 2 || clean.length > 80) { setError('Use a team name with 2 to 80 characters.'); return; }
    inFlight.current = true; setBusy(true); setError('');
    try { if (!request.current || request.current.name !== clean) request.current = { name: clean, id: randomUUID() }; const id = await createTeam(clean, request.current.id); await refresh(id); router.replace('/teams'); }
    catch (reason) { setError(teamError(reason)); }
    finally { inFlight.current = false; setBusy(false); }
  }
  return <Screen title="Create your team." subtitle="A new dugout, ready for your coaching staff." back>
    <View style={{ gap: 12 }}><Text style={ui.label}>Team name</Text><TextInput accessibilityLabel="Team name" style={ui.input} value={name} onChangeText={setName} editable={!busy} maxLength={80} placeholder="Your team name" placeholderTextColor={palette.muted} autoFocus returnKeyType="done" onSubmitEditing={submit} /></View>
    <Panel><View style={ui.inset}><Icon name="shield" color={palette.accent} /><Text style={ui.heading}>14 days. All Elite access.</Text><Text style={ui.body}>Your trial starts automatically. No approval or payment is needed to create your team.</Text></View></Panel>
    <StatusMessage text={error} error /><Button disabled={busy} onPress={() => { void submit(); }}>{busy ? 'Creating team…' : 'Create team'}</Button>
  </Screen>;
}
