export const boundarySource='https://mktg.mlbstatic.com/mlb/official-information/2026-official-baseball-rules.pdf';
export const boundarySummary='If a fair batted ball hits the ground and then bounces over the outfield fence, it is an automatic double, commonly called a ground-rule double. The ball is dead. The batter gets second base, and each runner gets two bases from their position at the time of the pitch: a runner on first goes to third; runners on second or third score. A ball clearing the fence without first touching the ground is a different play. USSSA/event modifications and park ground rules take priority; this is the general MLB baseball fallback.';
export function boundaryIntent(question:string):'bounce'|'unclear'|null {
 const q=question.toLowerCase();
 if(/\b(?:ground[ -]?rule|automatic|rulebook) double\b/.test(q))return 'bounce';
 if(!/\b(?:fence|wall|stands|boundary)\b/.test(q))return null;
 if(/\b(?:distance|dimensions|feet|foot|ft|how far|how tall|height)\b/.test(q))return null;
 if(/\b(?:bounce\w*|hops?|hopped|bounds?|bouncing|roll\w*)\b/.test(q)||/\b(?:hit\w*|touch\w*) the ground\b/.test(q)) {
   if(/\b(?:over|under|through|into|out of)\b/.test(q)&&!/\b(?:throw\w*|pitch\w*)\b/.test(q)&&!/\b(?:not|never|without|doesn t|didn t|no)\b/.test(q))return 'bounce';
   return 'unclear';
 }
 return /\b(?:ball|hit|batter|fielder|catch|home run)\b/.test(q)?'unclear':null;
}
export function isDimensionQuestion(question:string):boolean { return /\b(?:dimensions?|distance|base paths?|mound|bases? apart|how far|fence height)\b/i.test(question); }
