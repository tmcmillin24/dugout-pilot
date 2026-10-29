/** A removed/unknown last batter starts the display at the first active batter. */
export function nextBatterIndex(lineup: string[], lastBatterId?: string) {
  if (!lineup.length) return -1;
  const last = lastBatterId ? lineup.indexOf(lastBatterId) : -1;
  return (last + 1) % lineup.length;
}
