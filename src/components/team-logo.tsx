import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { DisplayText } from './sports-type';
import { palette } from './app-ui';
import type { Team } from '@/lib/teams';

export function TeamLogo({ team, size = 50 }: { team: Team; size?: number }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const parts = team.name.trim().split(/\s+/);
  const initials = parts.length > 1 ? parts.slice(0, 2).map(part => part[0]).join('') : team.name.trim().slice(0, 2);
  return <View style={[s.frame, { width: size, height: size, borderRadius: Math.max(3, size * 0.08) }]}>
    {team.logo_url && failedUrl !== team.logo_url ? <Image source={{ uri: team.logo_url }} contentFit="contain" accessibilityLabel={`${team.name} logo`} cachePolicy="memory-disk" style={s.image} onError={() => setFailedUrl(team.logo_url ?? null)} /> : <DisplayText style={{ color: palette.white, fontSize: size * 0.44 }}>{initials.toUpperCase()}</DisplayText>}
  </View>;
}
const s = StyleSheet.create({ frame: { backgroundColor: palette.navy, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, image: { width: '100%', height: '100%', backgroundColor: '#FFFFFF' } });
