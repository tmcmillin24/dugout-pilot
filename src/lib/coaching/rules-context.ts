import sources from './usssa-sources.json';
import { findRule, rulesSource } from './rules';
export type RulesContext = { sport: 'baseball' | 'fastpitch' | 'slowpitch'; organization: 'usssa'; age: string; season: string };
export type RulesBoard = { rulesContext?: RulesContext; rulesProfile?: string; eventRules?: string };
export const sportNames = { baseball: 'Baseball', fastpitch: 'Fastpitch softball', slowpitch: 'Slowpitch softball' };
export const organizationNames = { usssa: 'USSSA' };
export function getRulesContext(board: RulesBoard): RulesContext {
  return board.rulesContext ? { ...board.rulesContext, organization: 'usssa' } : (board.rulesProfile === 'usssa-11u-2026' ? { sport: 'baseball', organization: 'usssa', age: '11U', season: '2026' } : { sport: 'baseball', organization: 'usssa', age: '', season: '' });
}
export function hasReferencePack(context: RulesContext) { return context.sport === 'baseball' && context.organization === 'usssa' && context.age === '11U' && context.season === '2026'; }
export function contextLabel(context: RulesContext) { return [organizationNames[context.organization], context.age, sportNames[context.sport]].filter(Boolean).join(' · '); }
export function officialRulesLink(context: RulesContext) {
  if (hasReferencePack(context)) return rulesSource;
  return sources.sports[context.sport].landingUrl;
}
export type RulesAnswer = { answer: string; reference: string; url: string | null; kind: 'reference' | 'unavailable' | 'mismatch' | 'clarification'; sources?: {title:string;url:string}[] };
export function answerRulesQuestion(question: string, selected: RulesContext): RulesAnswer {
  // Explicit question context can fill missing settings, but never overwrites an existing team profile.
  const context = { ...selected, age: selected.age || (question.match(/\b(\d{1,2})\s*U\b/i)?.[1] ? question.match(/\b(\d{1,2})\s*U\b/i)![1]+'U' : ''), season: selected.season || question.match(/\b(2026|2027)\b/)?.[1] || '' };
  const ages = [...question.matchAll(/\b(\d{1,2})\s*U\b/gi)].map(match => `${match[1]}U`);
  const otherAuthority = /\b(?:USA\s+Softball|NFHS|NCAA|Little\s+League)\b/i.test(question);
  const mismatch = otherAuthority || ages.some(age => age !== context.age) || (/\bsoftball\b/i.test(question) && context.sport === 'baseball') || (/\bbaseball\b/i.test(question) && context.sport !== 'baseball');
  if (mismatch) return { answer: 'That question appears to use a different rules authority, sport, or age group. Update your team rules profile before checking this play.', reference: 'Check team rules profile', url: null, kind: 'mismatch' };
  const usssaBook = context.season === '2027' ? 'https://www.usssabaseball.org/images/2025/USSSA_National_By-Laws_9-12-2026.pdf' : rulesSource;
  if (/\bin(?:field| field)[ -]?fly\b/i.test(question) && context.sport === 'baseball') {
    const mlbBook = 'https://mktg.mlbstatic.com/mlb/official-information/2026-official-baseball-rules.pdf';
    return { answer: 'In standard baseball, a fair fly catchable by an infielder with ordinary effort, with first and second occupied (or bases loaded) and fewer than two outs can be an infield fly. Bunts and line drives do not qualify. The batter is out even if it drops; the ball stays live. Runners advance at their own risk and must retouch after a catch. Coach-pitch, machine-pitch, and younger-division exceptions must be checked before applying this to a game.', reference: 'MLB 2026 · Infield Fly definition / 5.09(a)(5); USSSA baseball Foreword', url: mlbBook, kind:'reference', sources:[{title:'MLB 2026 · Infield Fly / 5.09(a)(5)',url:mlbBook},{title:'USSSA baseball · governing-rule hierarchy',url:usssaBook}] };
  }
  if (/\b(bats|bbcor|bpf|drop)\b|\bbat\b.*\b(legal|allowed|approved)\b/i.test(question) && context.sport === 'baseball') {
    if (!context.age || !context.season) return {answer:'Which age division and season are you asking about? For example, 11U baseball, 2027. Bat requirements depend on the division and event.',reference:'Division and season needed',url:null,kind:'clarification'};
    if (['11U','12U'].includes(context.age) && ['2026','2027'].includes(context.season)) return {answer:'For '+context.age+' USSSA baseball, look for permanent USSSA 1.15 BPF certification, BBCOR .50 certification, or wood from a licensed USSSA manufacturer. Permanently marked USA Baseball bats are also accepted where BBCOR is not required. Check the event’s approved exceptions and any current disallowed-bat list before using a specific model.',reference:'USSSA '+context.season+' baseball · 7.01.C–D',url:usssaBook,kind:'reference'};
  }
  let lookup = question;
  if (/\bpitch(?:er|ing)?\b.*\b(?:tomorrow|next day)\b/i.test(question)) lookup = 'pitch tomorrow';
  if (/\b(?:pitch count limit|how many pitches)\b/i.test(question)) lookup = 'daily pitching limit';
  lookup = lookup.replace(/\blead[ -]?offs?\b/gi, 'lead off').replace(/\b(bat|helmet|cleat|runner)s\b/gi,'$1');
  const rule = hasReferencePack(context) ? findRule(lookup) : null;
  if (rule) return { answer: rule.answer, reference: `${rule.ref} · 2026 USSSA 11U`, url: rulesSource, kind: 'reference' };
  return { answer: hasReferencePack(context) ? 'I don’t have a clear reference for that play. Try a topic such as pitching limits, courtesy runners, or bats—or check the official rulebook.' : 'There isn’t a reviewed answer pack for this team profile yet. Use your event notes and the official rulebook for this sport, division, and season. I won’t substitute 11U baseball rules.', reference: hasReferencePack(context) ? 'No matched rule' : 'Official source needed', url: officialRulesLink(context), kind: 'unavailable' };
}
