import { JoinTeam, OwnerControls, TestActivationControls } from '@/components/team-controls';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { createTeam, listTeams, teamError, type Team } from '@/lib/teams';

export default function TeamHub({ userId }: { userId: string }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const request = useRef<{ id: string; name: string } | null>(null);
  const busy = useRef(false);
  const generation = useRef(0);
  const alive = useRef(true);
  const key = `dugout-pilot:active-team:${userId}`;
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const reload = useCallback(async (preferred?: string) => {
    const current = ++generation.current;
    try {
      const available = await listTeams();
      const stored = preferred ?? await AsyncStorage.getItem(key);
      if (!alive.current || current !== generation.current) return;
      setTeams(available);
      setSelectedId(available.find(t => t.id === stored)?.id ?? available[0]?.id ?? null);
    } catch (reason) {
      if (alive.current && current === generation.current) {
        setError(teamError(reason)); setTeams([]); setSelectedId(null);
      }
    } finally { if (alive.current && current === generation.current) setLoading(false); }
  }, [key]);
  // reload updates React state only after its database/storage requests settle.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void reload(); }, [reload]);
  async function select(team: Team) {
    setSelectedId(team.id); setNotice('');
    try { await AsyncStorage.setItem(key, team.id); }
    catch { if (alive.current) setNotice('Team selected. This device could not save your selection for next time.'); }
  }
  async function submit() {
    if (busy.current) return;
    const clean = name.trim();
    if (clean.length < 2 || clean.length > 80) { setError('Use a team name with 2 to 80 characters.'); return; }
    busy.current = true; setCreating(true); setError(''); setNotice('');
    try {
      if (!request.current || request.current.name !== clean) request.current = { id: randomUUID(), name: clean };
      const id = await createTeam(clean, request.current.id);
      if (!alive.current) return;
      request.current = null; setName('');
      setNotice('Team created. You are its owner, and your 14-day Elite trial has started automatically. No approval is needed.');
      setLoading(true);
      await reload(id);
      try { await AsyncStorage.setItem(key, id); } catch { /* Selection works in memory. */ }
    } catch (reason) { if (alive.current) setError(teamError(reason)); }
    finally { busy.current = false; if (alive.current) setCreating(false); }
  }
  const active = teams.find(t => t.id === selectedId);
  return <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Your dugout</Text>
      <Text style={styles.body}>Create a team or choose one you belong to. Each team has its own workspace and permissions.</Text>
      {!!error && <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
      {!!notice && <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text>}
      <View style={styles.card}>
        <Text style={styles.heading}>Your teams</Text>
        {loading ? <ActivityIndicator color="#a7db91" accessibilityLabel="Loading teams" /> : teams.length ? teams.map(team =>
          <Pressable key={team.id} accessibilityRole="button" accessibilityState={{ selected: team.id === selectedId }} onPress={() => { void select(team); }} style={[styles.team, team.id === selectedId && styles.selected]}>
            <Text style={styles.teamName}>{team.name}{team.id === selectedId ? ' · Selected' : ''}</Text>
            <Text style={styles.body}>{team.role === 'owner' ? 'Owner' : 'Coach'} · {team.test_access ? 'Active · Test access' : team.access_status === 'trial' ? 'Elite trial' : team.access_status === 'expired' ? 'Trial ended' : team.access_status === 'pending' ? 'Activation pending' : team.access_status}</Text>
          </Pressable>) : <Text style={styles.body}>{error ? 'Teams could not be loaded.' : 'No teams yet. Create your first team below.'}</Text>}
        <Pressable accessibilityRole="button" disabled={loading || creating} onPress={() => { setLoading(true); setError(''); void reload(selectedId ?? undefined); }} style={styles.link}><Text style={styles.linkText}>Refresh teams</Text></Pressable>
      </View>
      {active && <View style={styles.card}>
        <Text style={styles.heading}>{active.name}</Text>
        <Text style={styles.body}>Your role: {active.role}. This team is selected for your workspace.</Text>
        <Text style={styles.body}>{active.test_access ? 'Test access is enabled for this team. Game and roster tools are the next development phase.' : active.access_status === 'trial' ? `Your Elite trial ends ${new Date(active.trial_ends_at!).toLocaleDateString()}. No team approval is required. Subscriptions will continue access after the trial; billing is a later development phase.` : active.access_status === 'expired' ? 'Your trial has ended. A subscription will be needed for game features once billing is available. Team management remains accessible.' : 'Your team workspace is ready. Game and roster tools are the next development phase.'}</Text>
      </View>}
      {active?.role === 'owner' && <OwnerControls key={active.id} team={active} onChanged={() => reload(active.id)} />}
      <JoinTeam onJoined={async id => { setError(''); setNotice('Invitation accepted. You joined the team as a coach.'); setLoading(true); await reload(id); try { await AsyncStorage.setItem(key, id); } catch { /* Selection works in memory. */ } }} />
      <TestActivationControls onChanged={() => reload(selectedId ?? undefined)} />
      <View style={styles.card}>
        <Text style={styles.heading}>Create a team</Text>
        <Text style={styles.body}>You can own or coach more than one team. Each new team starts a 14-day Elite trial automatically. No payment is collected here.</Text>
        <Text style={styles.label}>Team name</Text>
        <TextInput accessibilityLabel="Team name" style={styles.input} value={name} onChangeText={setName} maxLength={80} editable={!creating} placeholder="Enter your team name" placeholderTextColor="#778397" returnKeyType="done" onSubmitEditing={submit} />
        <Pressable accessibilityRole="button" disabled={creating} onPress={submit} style={[styles.button, creating && styles.disabled]}>
          {creating ? <ActivityIndicator color="#10251c" /> : <Text style={styles.buttonText}>Create team</Text>}
        </Pressable>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({
  flex: { flex: 1 }, content: { padding: 24, gap: 20, maxWidth: 640, width: '100%', alignSelf: 'center' },
  title: { color: '#fff', fontSize: 34, fontWeight: '800' }, body: { color: '#b2bfd0', fontSize: 16, lineHeight: 24 },
  heading: { color: '#fff', fontSize: 22, fontWeight: '700' }, card: { padding: 20, gap: 16, backgroundColor: '#172438', borderRadius: 20 },
  team: { borderColor: '#40506a', borderWidth: 1, borderRadius: 12, padding: 16, gap: 8 }, selected: { borderColor: '#a7db91', backgroundColor: '#20352e' },
  teamName: { color: '#fff', fontSize: 18, fontWeight: '700' }, label: { color: '#dce5ef', fontWeight: '600' },
  input: { color: '#fff', backgroundColor: '#0d1726', borderColor: '#40506a', borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  button: { backgroundColor: '#a7db91', borderRadius: 12, minHeight: 52, justifyContent: 'center', alignItems: 'center' }, buttonText: { color: '#10251c', fontWeight: '800', fontSize: 16 },
  disabled: { opacity: 0.6 }, error: { color: '#ffb4ab', lineHeight: 22 }, notice: { color: '#b9e9a8', lineHeight: 22 }, link: { paddingVertical: 8 }, linkText: { color: '#a7db91', fontWeight: '600' },
});
