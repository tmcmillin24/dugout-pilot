import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { ImagePickerAsset } from 'expo-image-picker';
import { randomUUID } from 'expo-crypto';
import { supabase } from './supabase';

async function changeReference(teamId: string, path: string | null) {
  const { data, error } = await supabase.rpc('set_team_logo', { p_team_id: teamId, p_path: path });
  if (error) throw error;
  return data as string | null;
}
async function cleanUp(path: string | null) {
  if (path) await supabase.storage.from('team-logos').remove([path]).catch(() => {});
}
export async function uploadTeamLogo(teamId: string, asset: ImagePickerAsset, crop?: { originX: number; originY: number; width: number; height: number }) {
  const context = ImageManipulator.manipulate(asset.uri);
  const { width, height } = asset;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) throw new Error('This photo could not be read. Choose another image.');
  if (crop) {
    if (![crop.originX, crop.originY, crop.width, crop.height].every(Number.isInteger) || crop.originX < 0 || crop.originY < 0 || crop.width < 1 || crop.width !== crop.height || crop.originX + crop.width > width || crop.originY + crop.height > height) throw new Error('Invalid image framing.');
    context.crop(crop);
  }
  const outputWidth = crop?.width ?? width;
  const outputHeight = crop?.height ?? height;
  // Resize the long edge only. Supplying one dimension preserves the original
  // aspect ratio; square cropping here discarded the framing chosen by coaches.
  if (Math.max(outputWidth, outputHeight) > 1024) context.resize(outputWidth >= outputHeight ? { width: 1024 } : { height: 1024 });
  const rendered = await context.renderAsync();
  const image = await rendered.saveAsync({ format: SaveFormat.PNG, base64: true });
  if (!image.base64) throw new Error('Could not prepare this photo. Try another image.');
  const binary = atob(image.base64);
  if (binary.length > 5242880) throw new Error('This image is too large. Choose a simpler photo or logo.');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const path = `${teamId}/${randomUUID()}.png`;
  const { error } = await supabase.storage.from('team-logos').upload(path, bytes.buffer, { contentType: 'image/png', upsert: false });
  if (error) throw error;
  try { const previous = await changeReference(teamId, path); if (previous !== path) await cleanUp(previous); }
  catch (reason) { await cleanUp(path); throw reason; }
}
export async function removeTeamLogo(teamId: string) { const previous = await changeReference(teamId, null); await cleanUp(previous); }
