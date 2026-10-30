import { answerRulesQuestion, type RulesAnswer, type RulesContext } from './rules-context';
import { explainRulesLocally, type GenerateLocal, type RuleTurn } from './local-rules';
export type Citation={start:number;end:number;url:string;title:string};
export type DugoutAnswer=RulesAnswer & {citations?:Citation[];route?:'online'|'offline';notice?:string};
export type OnlineQuestion={teamId:string;question:string;history:RuleTurn[];signal:AbortSignal};
export async function answerDugout(options:{question:string;context:RulesContext;history:RuleTurn[];eventNotes:string;teamId?:string;connected:boolean;localAvailable:boolean;signal:AbortSignal;online:(question:OnlineQuestion)=>Promise<DugoutAnswer>;generate:GenerateLocal}):Promise<DugoutAnswer> {
 const {question,context,history,signal}=options;
 if(signal.aborted)throw new Error('Answer stopped.');
 let notice='';
 if(options.connected&&options.teamId){
   try{return {...await options.online({teamId:options.teamId,question,history,signal}),route:'online'};}
   catch(error){if(signal.aborted)throw new Error('Answer stopped.');if(error instanceof Error&&'noFallback' in error&&error.noFallback)throw error;notice=error instanceof Error?error.message:'The online assistant is unavailable. Using offline references.';}
 }else if(options.connected)notice='Choose a team for online answers. Using offline references.';
 if(signal.aborted)throw new Error('Answer stopped.');
 let response:RulesAnswer;
 const reference=offlineReference(question,context,history);
 const followUp=reference.kind==='reference'&&reference.answer!==answerRulesQuestion(question,context).answer;
 if(followUp)response=reference;
 else if(options.localAvailable){
   try{response=await explainRulesLocally({...options,generate:options.generate});}
   catch{if(signal.aborted)throw new Error('Answer stopped.');response=offlineReference(question,context,history);}
 }else response=offlineReference(question,context,history);
 return {...response,route:'offline',...(notice?{notice}:{})};
}
export function offlineReference(question:string,context:RulesContext,history:RuleTurn[]):RulesAnswer {
 // Carry only a recent known play into short follow-ups; don't append unrelated old keywords.
 const previous=history.at(-1);
 if(context.sport==='baseball'&&previous&&/\b(?:where|that happens|that play|in that case)\b/i.test(question)&&/\b(?:runner|he|they|that happens|that play)\b/i.test(question)&&!/\b(?:obstruction|interference|steal|tag|fly|throw)\b/i.test(question)&&/automatic double/i.test(previous.answer)) {
  if(/\b(?:first|1st)\b/i.test(question))return {...answerRulesQuestion('ground rule double',context),answer:'The runner on first at the time of the pitch is awarded third base. The batter is awarded second. The ball is dead. This assumes the same fair batted ball bounced over the fence; event exceptions still apply.'};
  if(/\b(?:second|2nd|third|3rd)\b/i.test(question))return {...answerRulesQuestion('ground rule double',context),answer:'A runner on second or third at the time of the pitch is awarded home and scores. The batter is awarded second. The ball is dead. This assumes the same fair batted ball bounced over the fence; event exceptions still apply.'};
  return {...answerRulesQuestion('ground rule double',context)};
 }
 return answerRulesQuestion(question,context);
}
