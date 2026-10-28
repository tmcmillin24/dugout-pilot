import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { Button, StatusMessage, palette } from './app-ui';
import { DisplayText } from './sports-type';
import { TeamLogo } from './team-logo';
import { uploadTeamLogo, removeTeamLogo } from '@/lib/team-logos';
import { teamError, type Team } from '@/lib/teams';
export default function TeamLogoEditor({ team, onChanged }: { team: Team; onChanged: () => Promise<void> }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const lock = useRef(false);
  async function choose() {
    if (lock.current) return; lock.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 });
      if (result.canceled || !result.assets[0]) return;
      await uploadTeamLogo(team.id, result.assets[0]); await onChanged(); setNotice('Team logo updated.');
    } catch (reason) { setError(teamError(reason)); }
    finally { lock.current = false; setBusy(false); }
  }
  async function remove() {
    if (lock.current) return; lock.current = true; setBusy(true); setError(''); setNotice('');
    try { await removeTeamLogo(team.id); await onChanged(); setNotice('Team logo removed.'); }
    catch (reason) { setError(teamError(reason)); }
    finally { lock.current = false; setBusy(false); }
  }
  function confirmRemove() {
    if (Platform.OS === 'web') { if (window.confirm('Remove this team logo?')) void remove(); }
    else Alert.alert('Remove team logo?', 'Your uploaded logo will be removed.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', onPress: () => { void remove(); } }]);
  }
  return <View style={s.section}><DisplayText style={s.title}>TEAM IDENTITY</DisplayText><View style={s.preview}><TeamLogo team={team} size={88} /><View style={s.copy}><Text style={s.name}>{team.name}</Text><Text style={s.caption}>Photo or team logo</Text></View></View><Button disabled={busy} onPress={() => { void choose(); }}>{busy ? 'UPDATING…' : team.logo_path ? 'CHANGE TEAM LOGO' : 'ADD TEAM LOGO'}</Button>{team.logo_path && <Button secondary disabled={busy} onPress={confirmRemove}>Remove logo</Button>}<StatusMessage text={error} error /><StatusMessage text={notice} /></View>;
}
const s = StyleSheet.create({ section: { gap: 16, paddingBottom: 24, borderBottomWidth: 1, borderColor: palette.line }, title: { color: palette.ink, fontSize: 25 }, preview: { flexDirection: 'row', alignItems: 'center', gap: 18 }, copy: { flex: 1, gap: 7 }, name: { color: palette.ink, fontSize: 16, fontWeight: '700' }, caption: { color: palette.muted, fontSize: 13 } });
