import { supabase } from './supabase';
import type { DugoutAnswer, OnlineQuestion } from './coaching/ask-dugout';
const allowed=(url:string)=>{try{const parsed=new URL(url);return parsed.protocol==='https:'&&['usssa.com','usssa.net','usssabaseball.org','mlb.com','mlbstatic.com'].some(host=>parsed.hostname===host||parsed.hostname.endsWith('.'+host));}catch{return false;}};
export async function askRulesOnline({teamId,question,history,signal}:OnlineQuestion):Promise<DugoutAnswer> {
 const turns=history.slice(-3).flatMap(turn=>[{role:'user',content:turn.question.slice(0,800)},{role:'assistant',content:turn.answer.slice(0,2400)}]);
 const {data,error}=await supabase.functions.invoke('rules-assistant',{body:{teamId,question,history:turns},signal});
 if(signal.aborted)throw new Error('Answer stopped.');
 if(error){
  const response=error.context as Response|undefined;const body=await response?.json?.().catch(()=>null);
  if(response?.status===401||response?.status===403)throw Object.assign(new Error(response.status===401?'Please sign in again to use Ask Dugout.':'Online answers require active access to this team.'),{noFallback:true});
  throw new Error(body?.code==='not_configured'?'The online assistant isn’t connected yet. Using offline references.':response?.status===429?'The online assistant has reached its usage limit. Using offline references.':'The online assistant couldn’t connect. Using offline references.');
 }
 if(!data||typeof data.answer!=='string'||data.answer.length>16000||!['reference','unverified','clarification'].includes(data.kind)||!Array.isArray(data.citations))throw new Error('The online answer could not be verified. Using offline references.');
 const citations=data.citations.filter((c:Record<string,unknown>)=>typeof c.url==='string'&&allowed(c.url)&&typeof c.title==='string'&&Number.isInteger(c.start)&&Number.isInteger(c.end)&&Number(c.start)>=0&&Number(c.end)>Number(c.start)&&Number(c.end)<=data.answer.length);
 if(data.kind==='reference'&&!citations.length)throw new Error('The online answer had no verified source links. Using offline references.');
 return {answer:data.answer,citations,kind:data.kind==='unverified'?'unavailable':data.kind,reference:data.mlbFallback?'MLB fallback · check USSSA and event exceptions':'Official rules references',url:citations[0]?.url??null,sources:citations.map((c:{title:string;url:string})=>({title:c.title,url:c.url}))};
}
