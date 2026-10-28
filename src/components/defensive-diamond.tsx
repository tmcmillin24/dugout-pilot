import { Pressable, StyleSheet, Text, View } from 'react-native';
import { POSITIONS, playerName, type Board, type Position } from '@/lib/coaching/board';
import { palette } from './app-ui';
const points: Record<Position, [number, number]> = { LF: [16,16], CF: [50,8], RF: [84,16], SS: [33,36], '2B': [66,36], '3B': [17,58], P: [50,58], '1B': [83,58], C: [50,85] };
export function DefensiveDiamond({ board, positions, disabled, onPosition }: { board: Board; positions: Record<string,string>; disabled?: boolean; onPosition: (pos: Position) => void }) {
  return <View style={s.field}><View style={s.diamond} />{POSITIONS.map(pos => { const [left,top] = points[pos]; const player = board.players.find(p => p.id === positions[pos]); return <Pressable key={pos} accessibilityRole="button" accessibilityLabel={`Assign ${pos}: ${playerName(board,positions[pos])}`} disabled={disabled} onPress={() => onPosition(pos)} style={[s.position,{left:`${left}%`,top:`${top}%`}]}><Text style={s.positionLabel}>{pos}</Text><Text numberOfLines={1} style={s.playerLabel}>{player ? `${player.number ? '#'+player.number+' ' : ''}${player.name}` : 'Assign +'}</Text></Pressable>; })}</View>;
}
const s = StyleSheet.create({
  field: { height: 370, backgroundColor: palette.navy, borderRadius: 5, borderBottomWidth: 4, borderBottomColor: palette.accent, overflow: 'hidden' }, diamond: { position: 'absolute', width: 160, height: 160, top: 136, left: '50%', marginLeft: -80, transform: [{ rotate: '45deg' }], borderWidth: 1, borderColor: '#668D9C', backgroundColor: '#21485C' }, position: { position: 'absolute', width: 92, marginLeft: -46, marginTop: -10, minHeight: 55, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, gap: 5, backgroundColor: '#113B55', borderWidth: 1, borderColor: '#41657B', borderRadius: 4 }, positionLabel: { color: '#FF986B', fontWeight: '800', fontSize: 12 }, playerLabel: { color: palette.white, fontSize: 12, fontWeight: '700', maxWidth: 84 },
});
