type Context = { sport: string; age: string; season: string };
export const baseballBooks: Record<string,string> = {
  '2026': 'https://www.usssabaseball.org/images/2026_USSSA_National_By-Laws.pdf',
  '2027': 'https://www.usssabaseball.org/images/2025/USSSA_National_By-Laws_9-12-2026.pdf',
};
export const fastpitchBook = 'https://dev-newsfeed.usssa.com/wp-content/uploads/2025/12/usssa-fastpitch-rulebook-edition-18.pdf';
export function coreTopic(question: string): 'bats' | 'pitching' | null {
  if (/\bbats?\b|bbcor|bpf|\bdrop\b/i.test(question)) return 'bats';
  if ((/pitch/i.test(question) && /tomorrow|next day|rest|eligib|limit|maximum|how many|can .*pitch|pitch count|innings|outs/i.test(question)) || /\brest\b|throw.*(?:tomorrow|next day)|(?:tomorrow|next day).*throw/i.test(question)) return 'pitching';
  return null;
}
export function coreReferences(context: Context) {
  const age = Number(context.age.match(/^(\d{1,2})U$/i)?.[1]);
  if (!Number.isInteger(age) || age < 4 || age > 18 || !baseballBooks[context.season]) return [];
  const ref = (topic: string, text: string, rule: string, url: string) => ({ id: `usssa-${context.sport}-${context.season}-${context.age}-${topic}`, title: `${context.age} ${context.sport}: ${topic}`, text, keywords: topic === 'bats' ? ['bat','bats','bbcor','bpf','drop','legal'] : ['pitcher','pitching','tomorrow','next day','rest','innings'], sources: [{ title: `USSSA ${context.season} ${context.age} ${context.sport} · ${rule}`, url }] });
  if (context.sport === 'fastpitch') {
    // 18th edition is reviewed for 2026; never silently relabel it as 2027.
    if (context.season !== '2026') return [];
    return [ref('bats','Non-wood fastpitch bats require a licensed manufacturer and the 2020 Fastpitch Only or accepted 2014 USSSA certification mark, with 1.20 BPF or less. Licensed wood bats need no BPF mark. Withdrawn/non-compliant bats are illegal. Check current model status separately.','18th edition · 2-10',fastpitchBook),ref('pitching','The reviewed fastpitch pitching chapter does not specify baseball-style daily innings or next-day rest limits. Do not apply baseball’s 3/6/8 chart to softball. Check event restrictions before confirming eligibility tomorrow.','18th edition · Rule 6',fastpitchBook)];
  }
  if (context.sport !== 'baseball') return [];
  const url = baseballBooks[context.season];
  const bats = age <= 12 ? 'Use USSSA 1.15 BPF, BBCOR .50, licensed wood, or USA Baseball certification where BBCOR is not required. No national drop restriction is stated for this division.' : age === 13 ? '13U uses maximum drop -8 with USSSA 1.15 BPF or accepted USA certification; BBCOR or licensed wood also qualify. Elite World Series 13 Majors requires -5, BBCOR or wood. Certification and event exceptions still apply.' : age === 14 ? '14U’s national standard is -3 BBCOR or wood; a state may adopt a -5 event exception. Verify the event’s adopted rule.' : 'Scholastic events require NFHS-compliant -3 BBCOR or licensed wood. Confirm whether this event uses the scholastic rules.';
  const pitching = age < 7 ? 'Identify tee-ball, coach-pitch, machine-pitch or player-pitch format before applying pitcher eligibility rules.' : age <= 14 ? `Player-pitch ${context.age}: daily maximum ${age <= 12 ? 6 : 7} innings; three-day maximum 8. Next-day threshold: 3 innings. Rest after more than 3 in a day, 8 over two days, or three consecutive pitching days. One out is one-third inning. Ask for outs recorded today and each preceding day before deciding eligibility tomorrow. Approved major events may use pitch counts.` : 'The scholastic 15U–18U chart lists unlimited innings. Confirm scholastic/event rules; do not apply younger divisions’ innings limits.';
  return [ref('bats',bats+' Check current disallowed models and event rules.','7.01.C–D',url),ref('pitching',pitching,'7.05.B; Chart 7.05.B-1',url)];
}
