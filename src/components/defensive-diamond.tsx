import { Image } from 'expo-image';
import { formatPlayerName } from '@/lib/coaching/player-display';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { POSITIONS, playerName, type Board, type Position } from '@/lib/coaching/board';
import { palette } from './app-ui';
const points: Record<Position, [number, number]> = { LF: [20,32], CF: [50,23], RF: [80,32], SS: [35,50], '2B': [65,50], '3B': [18,68], P: [50,68], '1B': [82,68], C: [50,90] };
export function DefensiveDiamond({ board, positions, disabled, onPosition }: { board: Board; positions: Record<string,string>; disabled?: boolean; onPosition: (pos: Position) => void }) {
  return <View style={s.field}><Image source={require('@/assets/images/defensive-field.svg')} contentFit="contain" transition={0} pointerEvents="none" accessible={false} style={s.art} />{POSITIONS.map(pos => {
    const [left,top] = points[pos]; const player = board.players.find(p => p.id === positions[pos]);
    return <View key={pos} pointerEvents="box-none" style={[s.anchor,{left:`${left-12.5}%`,top:`${top}%`}]}><Pressable accessibilityRole="button" accessibilityLabel={`Assign ${pos}: ${playerName(board,positions[pos])}`} disabled={disabled} onPress={() => onPosition(pos)} style={[s.position, player && s.assigned, disabled && { opacity: 0.65 }]}><Text style={s.positionLabel}>{pos}</Text><Text numberOfLines={1} style={s.playerLabel}>{player ? `${player.number ? '#'+player.number+' ' : ''}${formatPlayerName(player.name)}` : 'Assign +'}</Text></Pressable></View>;
  })}</View>;
}
const s = StyleSheet.create({
  art: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  field: { width: '100%', aspectRatio: 420 / 460, backgroundColor: palette.navy, borderRadius: 12, borderBottomWidth: 4, borderBottomColor: palette.accent, overflow: 'hidden' },
  anchor: { position: 'absolute', width: '25%', marginTop: -26, alignItems: 'center' },
  position: { width: '100%', maxWidth: 132, minHeight: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, gap: 5, backgroundColor: '#082E4BF2', borderWidth: 1, borderColor: '#648A9A', borderRadius: 8 },
  assigned: { borderColor: '#F5B18C', backgroundColor: '#082E4B' }, positionLabel: { color: '#FF986B', fontWeight: '800', fontSize: 12 }, playerLabel: { color: palette.white, fontSize: 12, fontWeight: '700', maxWidth: '100%' },
});
