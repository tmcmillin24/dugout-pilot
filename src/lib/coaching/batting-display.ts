/** A removed/unknown last batter starts the display at the first active batter. */
export function nextBatterIndex(lineup: string[], lastBatterId?: string) {
  if (!lineup.length) return -1;
  const last = lastBatterId ? lineup.indexOf(lastBatterId) : -1;
  return (last + 1) % lineup.length;
}

/** Only deliberate horizontal swipes change the display; vertical roster scrolling stays put. */
export function displayPageForSwipe(current:'offense'|'defense',dx:number,dy:number):'offense'|'defense' {
 if(Math.abs(dx)<50||Math.abs(dx)<=Math.abs(dy)*1.5)return current;
 return dx<0?'defense':'offense';
}
