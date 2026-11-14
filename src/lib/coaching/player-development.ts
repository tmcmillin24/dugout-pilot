import type {Player,Stat} from './board';
import {statValue,inningsOuts} from './stat-data';
export type DevelopmentFocus={key:string;title:string;evidence:string;drill:string;track:string;early:boolean;score:number};
export function playerDevelopment(player:Player,stat:Stat|undefined){
 const n=(group:'batting'|'pitching'|'fielding',key:string)=>{const v=statValue(stat,group,key);return v!==undefined&&v>=0?v:undefined;};
 const pa=n('batting','PA'),ab=n('batting','AB'),so=n('batting','SO'),bb=n('batting','BB'),hits=n('batting','H'),tb=n('batting','TB');
 const bf=n('pitching','BF'),pbb=n('pitching','BB'),pso=n('pitching','SO'),outs=inningsOuts(n('pitching','IP'));
 const tc=n('fielding','TC'),errors=n('fielding','E'),sb=n('batting','SB'),cs=n('batting','CS');
 const ratio=(a:number|undefined,b:number|undefined)=>a!==undefined&&b!==undefined&&b>0&&a<=b?a/b:undefined;
 const kRate=ratio(so,pa),walkRate=ratio(bb,pa),pitchWalkRate=ratio(pbb,bf),pitchKRate=ratio(pso,bf),errorRate=ratio(errors,tc);
 const percent=(v:number)=>`${(v*100).toFixed(1)}%`;
 const priorities:DevelopmentFocus[]=[],strengths:string[]=[],metrics:{label:string;value:string}[]=[];
 function add(key:string,title:string,evidence:string,drill:string,track:string,early:boolean,score:number){priorities.push({key,title,evidence,drill,track,early,score});}
 if(pa!==undefined)metrics.push({label:'Plate appearances',value:String(pa)});
 else if(ab!==undefined)metrics.push({label:'At-bats',value:String(ab)});
 if(kRate===undefined&&hits!==undefined)metrics.push({label:'Hits',value:String(hits)});
 if(kRate!==undefined)metrics.push({label:'Strikeouts / PA',value:percent(kRate)});
 if(walkRate!==undefined)metrics.push({label:'Walks / PA',value:percent(walkRate)});
 if(outs!==null&&outs>0)metrics.push({label:'Innings pitched',value:`${Math.floor(outs/3)}.${outs%3}`});
 if(pitchWalkRate!==undefined)metrics.push({label:'Pitching BB / BF',value:percent(pitchWalkRate)});
 if(errorRate!==undefined)metrics.push({label:'Errors / chances',value:percent(errorRate)});
 if(kRate!==undefined&&pa!>=8&&kRate>=.25)add('contact','Two-strike contact',`${so} strikeouts in ${pa} PA (${percent(kRate)}).`,'Two-strike front-toss rounds: protect the zone and put hittable pitches in play.',`Record strikeouts over the next 10 PA; compare with the current ${percent(kRate)}.`,pa!<20,kRate/.25);
 else if(walkRate!==undefined&&kRate!==undefined&&pa!>=12&&walkRate<.08&&kRate>=.15)add('decisions','At-bat decisions',`${bb} walks and ${so} strikeouts in ${pa} PA.`,'Take/swing decision rounds. Observe pitch selection before choosing a mechanical change.',`Track walks and strikeouts over the next 10 PA; current walk rate ${percent(walkRate)}.`,pa!<20,1.1);
 if(ab!==undefined&&ab>=12&&hits!==undefined&&tb!==undefined&&hits<=ab&&tb>=hits&&tb<=ab*4&&kRate!==undefined&&kRate<.2&&(tb-hits)/ab<.08)add('impact','Line-drive impact',`${hits} hits and ${tb} total bases in ${ab} AB; extra bases per AB ${((tb-hits)/ab).toFixed(3)}.`,'Gap-target tee and front-toss rounds. Record firm line drives; avoid changing mechanics from totals alone.','Track extra-base hits and total bases alongside AB over the next 10 at-bats.',ab<30,1.05);
 if(pitchWalkRate!==undefined&&bf!>=12&&pitchWalkRate>=.15)add('command','Pitching command',`${pbb} walks in ${bf} batters faced (${percent(pitchWalkRate)}).`,'Short target bullpens with a catcher. Record strike locations and repeat the delivery between pitches.',`Track BB/BF in the next appearance; current rate ${percent(pitchWalkRate)}.`,bf!<30,pitchWalkRate/.15);
 else if(bf===undefined&&pbb!==undefined&&outs!==null&&outs>=9&&pbb*3/outs>=1)add('command','Pitching command',`${pbb} walks in ${Math.floor(outs/3)}.${outs%3} IP (${(pbb*3/outs).toFixed(2)} BB per inning).`,'Short target bullpens with a catcher. Observe location and delivery consistency.','Import batters faced for a walk-rate comparison; record walks in the next appearance.',outs<18,pbb*3/outs);
 if(errorRate!==undefined&&tc!>=8&&errorRate>=.12)add('fielding','Clean fielding reps',`${errors} errors in ${tc} fielding chances (${percent(errorRate)}).`,'Controlled ground-ball and catch/throw reps. Classify fielding versus throwing misses before choosing the next drill.',`Record errors and chances over the next 10 chances; current error rate ${percent(errorRate)}.`,tc!<20,errorRate/.12);
 const attempts=sb!==undefined&&cs!==undefined?sb+cs:0;
 if(attempts>=4&&cs!/attempts>=.25)add('running','Steal decisions',`${cs} caught stealing in ${attempts} recorded attempts.`,'Review leads, reads and coach signals using controlled steal situations. Totals cannot identify which caused an out.',`Track the next 5 attempts; current success rate ${percent(sb!/attempts)}.`,attempts<10,cs!/attempts/.25);
 if(kRate!==undefined&&pa!>=20&&kRate<=.15)strengths.push(`Contact foundation: ${so} strikeouts in ${pa} PA (${percent(kRate)}).`);
 if(pitchWalkRate!==undefined&&bf!>=20&&pitchWalkRate<=.08)strengths.push(`Walk prevention: ${pbb} walks in ${bf} BF (${percent(pitchWalkRate)}).`);
 if(pitchKRate!==undefined&&bf!>=20&&pitchKRate>=.25)strengths.push(`Strikeout production: ${pso} strikeouts in ${bf} BF (${percent(pitchKRate)}).`);
 if(errorRate!==undefined&&tc!>=20&&errorRate<=.05)strengths.push(`Reliable recorded fielding: ${errors} errors in ${tc} chances.`);
 const missing:string[]=[];
 if(pa===undefined||so===undefined)missing.push('Batting PA and SO are needed to assess strikeout frequency.');
 if(player.positions?.includes('P')&&(pbb===undefined||(bf===undefined&&outs===null)))missing.push('Pitching BB plus BF or IP are needed to assess walk control.');
 if(tc===undefined||errors===undefined)missing.push('Fielding TC and E are needed to assess recorded fielding results.');
 priorities.sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key));
 return {priorities:priorities.slice(0,3),strengths,metrics,missing,summary:priorities.length?'Practice targets drawn from this player’s recorded results.':metrics.length?'No clear practice flag from the available counts. Use the numbers below to guide observation.':'Not enough recorded counts to recommend a player-specific focus yet.'};
}
export function developmentReport(player:Player,stat:Stat|undefined){const r=playerDevelopment(player,stat);return [`${player.name}${player.number?' #'+player.number:''}`,r.summary,...r.metrics.map(m=>`${m.label}: ${m.value}`),...r.priorities.flatMap(p=>[`${p.title}${p.early?' · Early signal':''}`,p.evidence,p.drill,p.track]),...r.strengths,...r.missing,'Coaching heuristics, not age-group benchmarks. Stats do not diagnose mechanics, injuries or pitch selection.'].join('\n');}
