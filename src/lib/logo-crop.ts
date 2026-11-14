export type LogoPosition = { zoom: number; x: number; y: number };
export const clampUnit = (value: number) => Math.max(-1, Math.min(1, value));
export function logoCrop(width: number, height: number, position: LogoPosition) {
  if (![width, height, position.zoom, position.x, position.y].every(Number.isFinite) || width < 1 || height < 1) throw new Error('Invalid image framing.');
  const side = Math.max(1, Math.round(Math.min(width, height) / Math.max(1, Math.min(4, position.zoom))));
  return { originX: Math.round((width - side) / 2 * (1 - clampUnit(position.x))), originY: Math.round((height - side) / 2 * (1 - clampUnit(position.y))), width: side, height: side };
}
