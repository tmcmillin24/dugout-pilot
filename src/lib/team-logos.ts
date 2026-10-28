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
export async function uploadTeamLogo(teamId: string, asset: ImagePickerAsset) {
  const context = ImageManipulator.manipulate(asset.uri);
  const side = Math.min(asset.width, asset.height);
  if (!Number.isFinite(side) || side < 1) throw new Error('This photo could not be read. Choose another image.');
  context.crop({ originX: Math.floor((asset.width - side) / 2), originY: Math.floor((asset.height - side) / 2), width: side, height: side });
  context.resize({ width: 1024, height: 1024 });
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
