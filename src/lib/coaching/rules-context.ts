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
export type RulesAnswer = { answer: string; reference: string; url: string | null; kind: 'reference' | 'unavailable' | 'mismatch' };
export function answerRulesQuestion(question: string, context: RulesContext): RulesAnswer {
  const ages = [...question.matchAll(/\b(\d{1,2})\s*U\b/gi)].map(match => `${match[1]}U`);
  const otherAuthority = /\b(?:USA\s+Softball|NFHS|NCAA|Little\s+League)\b/i.test(question);
  const mismatch = otherAuthority || ages.some(age => age !== context.age) || (/\bsoftball\b/i.test(question) && context.sport === 'baseball') || (/\bbaseball\b/i.test(question) && context.sport !== 'baseball');
  if (mismatch) return { answer: 'That question appears to use a different rules authority, sport, or age group. Update your team rules profile before checking this play.', reference: 'Check team rules profile', url: null, kind: 'mismatch' };
  let lookup = question;
  if (/\bpitch(?:er|ing)?\b.*\b(?:tomorrow|next day)\b/i.test(question)) lookup = 'pitch tomorrow';
  if (/\b(?:pitch count limit|how many pitches)\b/i.test(question)) lookup = 'daily pitching limit';
  lookup = lookup.replace(/\blead[ -]?offs?\b/gi, 'lead off');
  const rule = hasReferencePack(context) ? findRule(lookup) : null;
  if (rule) return { answer: rule.answer, reference: `${rule.ref} · 2026 USSSA 11U`, url: rulesSource, kind: 'reference' };
  return { answer: hasReferencePack(context) ? 'I don’t have a clear reference for that play. Try a topic such as pitching limits, courtesy runners, or bats—or check the official rulebook.' : 'There isn’t a reviewed answer pack for this team profile yet. Use your event notes and the official rulebook for this sport, division, and season. I won’t substitute 11U baseball rules.', reference: hasReferencePack(context) ? 'No matched rule' : 'Official source needed', url: officialRulesLink(context), kind: 'unavailable' };
}
