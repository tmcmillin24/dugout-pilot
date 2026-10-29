import { answerRulesQuestion, type RulesContext, type RulesAnswer } from './rules-context';
import { findRule, rulesSource } from './rules';
// Stable lookup phrases bypass chat entirely; labels stay natural and coach-focused.
const questions = [
  ['bats', 'What bats can our team use?', 'What bats are legal?'],
  ['pitching', 'How much can a pitcher throw, and when is rest required?', 'daily pitching limit'],
  ['mercy', 'What is the mercy rule?', 'mercy rule'],
  ['courtesy', 'Who can courtesy-run for the pitcher or catcher?', 'courtesy runner'],
  ['lineup', 'Can we bat the whole roster?', 'continuous lineup'],
  ['stealing', 'Are lead-offs and stealing allowed?', 'lead off'],
  ['third-strike', 'Can a batter run on a dropped third strike?', 'dropped third strike'],
  ['pitcher-return', 'Can a pitcher return after being taken off the mound?', 'return to pitch'],
  ['visits', 'How many mound visits are allowed?', 'mound visit'],
  ['length', 'How many innings do we play?', 'game length'],
  ['time', 'What is the game time limit?', 'time limit'],
  ['short', 'Can we play with only eight players?', '8 players'],
  ['cleats', 'Are metal cleats allowed?', 'cleat'],
  ['slide', 'Does a runner have to slide?', 'slide'],
  ['balk', 'Are balks called in our division?', 'balk'],
] as const;
// Reviewed national player-pitch provisions apply to 9U–14U in this edition.
// Younger formats, scholastic divisions and other editions are not inferred.
function faqAnswer(id:string,lookup:string,context:RulesContext):RulesAnswer {
  const saved=answerRulesQuestion(lookup,context);
  const age=Number(context.age.match(/^(\d+)U$/)?.[1]);
  if(context.sport!=='baseball'||context.season!=='2026'||age<9||age>14||!Number.isInteger(age)||id==='bats'||id==='pitching')return saved;
  const rule=findRule(lookup);if(!rule)return saved;
  let answer=rule.answer.replaceAll('11U',context.age);
  if(id==='mercy'&&age>=13)answer='For a seven-inning game, the national run rule is 15 runs beginning in the 3rd, 12 in the 4th, or 8 in the 5th. The home team does not need to finish batting if it already meets the winning margin. Check event exceptions.';
  if(id==='length'&&age>=13)answer='A regulation game is seven innings. Time limits, the run rule, weather, or a home-team win can shorten it; check event rules.';
  if(id==='cleats'&&age>=13)answer='Traditional metal baseball spikes are permitted in 13U and older divisions under the national rule. Check any facility restrictions.';
  return {answer,reference:`${rule.ref} · USSSA 2026 ${context.age} baseball`,url:rulesSource,kind:'reference'};
}
export function quickFaq(context: RulesContext) {
  return questions.map(([id,question,lookup])=>({id,question,answer:faqAnswer(id,lookup,context)})).filter(item=>item.answer.kind==='reference');
}
