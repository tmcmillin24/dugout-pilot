import { useEffect, useMemo, useRef, useState } from 'react';
import { Image } from 'expo-image';
import type { ImagePickerAsset } from 'expo-image-picker';
import { PanResponder, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Button, palette, ui } from './app-ui';
import { Sheet, c } from './coaching-ui';
import { clampUnit, logoCrop, type LogoPosition } from '@/lib/logo-crop';
export type LogoCrop = ReturnType<typeof logoCrop>;
export function TeamLogoCropper({ asset, busy, error, onClose, onSave }: { asset: ImagePickerAsset | null; busy: boolean; error: string; onClose: () => void; onSave: (crop?: LogoCrop) => void }) {
  return <Sheet title="Frame your team logo" open={!!asset} onClose={() => { if (!busy) onClose(); }}>{asset && <CropSession key={asset.uri} asset={asset} busy={busy} error={error} onSave={onSave} />}</Sheet>;
}
function CropSession({ asset, busy, error, onSave }: { asset: ImagePickerAsset; busy: boolean; error: string; onSave: (crop?: LogoCrop) => void }) {
  const { width, height } = useWindowDimensions();
  const size = Math.max(140, Math.min(340, width - 92, height * 0.4));
  const [fit, setFit] = useState(false);
  const [position, setPosition] = useState<LogoPosition>({ zoom: 1, x: 0, y: 0 });
  const latest = useRef(position); const origin = useRef(position);
  useEffect(() => { latest.current = position; }, [position]);
  const crop = logoCrop(asset.width, asset.height, position);
  // Preview and export share this exact pixel crop, including rounded edges.
  const scale = size / crop.width;
  const maxX = (asset.width * scale - size) / 2;
  const maxY = (asset.height * scale - size) / 2;
  // PanResponder stores these callbacks; it does not invoke gesture handlers during render.
  // eslint-disable-next-line react-hooks/refs
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !fit && !busy,
    onMoveShouldSetPanResponder: () => !fit && !busy,
    onPanResponderGrant: () => { origin.current = latest.current; },
    onPanResponderMove: (_event, gesture) => { setPosition({ ...origin.current, x: maxX ? clampUnit(origin.current.x + gesture.dx / maxX) : 0, y: maxY ? clampUnit(origin.current.y + gesture.dy / maxY) : 0 }); },
    onPanResponderTerminationRequest: () => false,
  }), [fit, busy, maxX, maxY]);
  function move(x: number, y: number) { setPosition(p => ({ ...p, x: clampUnit(p.x + x), y: clampUnit(p.y + y) })); }
  return <>
    <Text style={ui.body}>{fit ? 'The entire image will be shown.' : 'Drag to position. Use − and + to zoom. This square is what gets saved.'}</Text>
    <View style={c.row}>{[{ value: true, label: 'FIT FULL IMAGE' }, { value: false, label: 'CROP & POSITION' }].map(item => <Pressable key={item.label} disabled={busy} accessibilityRole="button" accessibilityState={{ selected: fit === item.value }} onPress={() => setFit(item.value)} style={[c.chip, { flex: 1, paddingHorizontal: 8 }, fit === item.value && c.selected]}><Text style={[c.chipText, fit === item.value && c.selectedText]}>{item.label}</Text></Pressable>)}</View>
    <View {...pan.panHandlers} accessibilityLabel="Team logo preview" style={{ width: size, height: size, alignSelf: 'center', backgroundColor: '#FFFFFF', overflow: 'hidden', borderRadius: 4 }}>
      {fit ? <Image source={{ uri: asset.uri }} contentFit="contain" style={{ width: size, height: size }} /> : <Image source={{ uri: asset.uri }} contentFit="fill" style={{ position: 'absolute', width: asset.width * scale, height: asset.height * scale, left: -crop.originX * scale, top: -crop.originY * scale }} />}
    </View>
    {!fit && <><View style={c.row}><View style={c.grow}><Button secondary disabled={busy || position.zoom <= 1} onPress={() => setPosition(p => ({ ...p, zoom: Math.max(1, p.zoom - 0.1) }))}>− ZOOM</Button></View><Text style={ui.rowTitle}>{Math.round(position.zoom * 100)}%</Text><View style={c.grow}><Button secondary disabled={busy || position.zoom >= 4} onPress={() => setPosition(p => ({ ...p, zoom: Math.min(4, p.zoom + 0.1) }))}>+ ZOOM</Button></View></View>
      <View style={c.row}>{[{ label: '←', x: -0.1, y: 0, name: 'Move image left' }, { label: '↑', x: 0, y: -0.1, name: 'Move image up' }, { label: '↓', x: 0, y: 0.1, name: 'Move image down' }, { label: '→', x: 0.1, y: 0, name: 'Move image right' }].map(item => <Pressable key={item.name} accessibilityRole="button" accessibilityLabel={item.name} disabled={busy} onPress={() => move(item.x, item.y)} style={[c.chip, { flex: 1, alignItems: 'center' }]}><Text style={{ color: palette.ink }}>{item.label}</Text></Pressable>)}</View>
      <Button secondary disabled={busy} onPress={() => setPosition({ zoom: 1, x: 0, y: 0 })}>RESET FRAMING</Button></>}
    {!!error && <Text style={ui.error}>{error}</Text>}
    <Button disabled={busy} onPress={() => onSave(fit ? undefined : crop)}>{busy ? 'SAVING…' : 'SAVE TEAM LOGO'}</Button>
  </>;
}
