import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, palette } from './app-ui';
import type { Team } from '@/lib/teams';

export function TeamLogo({ team, size = 50, fallback = 'icon' }: { team: Team; size?: number; fallback?: 'icon' | 'none' }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const hasLogo = !!team.logo_url && failedUrl !== team.logo_url;
  if (!hasLogo && fallback === 'none') return null;
  return <View style={[s.frame, { width: size, height: size, borderRadius: Math.max(3, size * 0.08) }]}>
    {hasLogo ? <Image source={{ uri: team.logo_url ?? undefined }} contentFit="contain" accessibilityLabel={`${team.name} logo`} cachePolicy="memory-disk" style={s.image} onError={() => setFailedUrl(team.logo_url ?? null)} /> : <Icon name="ball" color={palette.white} size={Math.round(size * 0.48)} />}
  </View>;
}
const s = StyleSheet.create({ frame: { backgroundColor: palette.navy, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, image: { width: '100%', height: '100%', backgroundColor: '#FFFFFF' } });
