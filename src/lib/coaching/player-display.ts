/** Display only: keep original names in roster records and import matching. */
export function formatPlayerName(name: string | null | undefined): string {
  const clean = name?.trim().replace(/\s+/g, ' ');
  if (!clean) return 'Player';
  const comma = clean.match(/^([^,]+),\s*([^,]+)$/);
  if (comma && !/^(jr\.?|sr\.?|ii|iii|iv)$/i.test(comma[2])) {
    return `${Array.from(comma[2])[0].toUpperCase()} ${comma[1]}`;
  }
  const parts = clean.replace(/,\s*/g, ' ').split(' ');
  if (parts.length === 1) return clean;
  let last = parts.length - 1;
  if (/^(jr\.?|sr\.?|ii|iii|iv)$/i.test(parts[last]) && parts.length > 2) last--;
  while (last > 1 && /^(de|del|della|di|da|dos|du|la|le|van|von|der|den|ten|ter)$/i.test(parts[last - 1])) last--;
  return `${Array.from(parts[0])[0].toUpperCase()} ${parts.slice(last).join(' ')}`;
}
