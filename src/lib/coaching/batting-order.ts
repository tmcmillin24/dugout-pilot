export const BATTING_ROW_HEIGHT = 76;
export function moveBatter(order:string[],id:string,target:number):string[] {
  const from=order.indexOf(id);if(from<0||!Number.isFinite(target))return [...order];
  const next=[...order];next.splice(from,1);next.splice(Math.max(0,Math.min(order.length-1,Math.round(target))),0,id);return next;
}
export function dragTarget(start:number,translation:number,scrollDelta:number,length:number):number {
  return Math.max(0,Math.min(length-1,start+Math.round((translation+scrollDelta)/BATTING_ROW_HEIGHT)));
}
export function sameBattingOrder(a:string[],b:string[]) { return a.length===b.length&&a.every((id,i)=>id===b[i]); }
