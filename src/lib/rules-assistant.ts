import { supabase } from './supabase';
export type RuleCitation = { start:number;end:number;url:string;title:string };
export type AssistantAnswer = { answer:string;citations:RuleCitation[];kind:'reference'|'unverified'|'clarification';mode:'ai';mlbFallback?:boolean };
export async function askRulesAI(teamId:string,question:string,history:{role:'user'|'assistant';content:string}[],signal:AbortSignal):Promise<AssistantAnswer> {
  const {data,error}=await supabase.functions.invoke('rules-assistant',{body:{teamId,question,history:history.slice(-6)},signal});
  if(error) {
    const response=error.context as Response|undefined;
    const detail=typeof response?.json==='function'?await response.json().catch(()=>null):null;
    if(typeof detail?.error==='string')throw new Error(detail.error);
    throw new Error('Ask AI needs internet and a connected AI service. Saved Rules still work on this device.');
  }
  if(!data||typeof data.answer!=='string'||!Array.isArray(data.citations))throw new Error('The AI service returned an unreadable answer. Please retry.');
  return data as AssistantAnswer;
}
