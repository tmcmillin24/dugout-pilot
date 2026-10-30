import type { Board, Game, Player, Stat } from './board';
import { statsSource, statValue, inningsOuts } from './stat-data';
import { gameSchedule } from './game-schedule';
import { parseCalendarDate, dateKey } from './calendar';
import type { Team } from '../teams';
export function hasEliteAccess(team:Team|null):boolean {
 if(!team)return false;
 const eliteTrial=team.access_status==='trial'&&!!team.trial_ends_at&&Date.parse(team.trial_ends_at)>Date.now();
 return eliteTrial||(team.access_status==='active'&&(team.subscription_tier==='elite'||team.test_access));
}
function number(stat:Stat|undefined,group:'batting'|'pitching'|'fielding',key:string){return statValue(stat,group,key);}
export function batterProfile(stat:Stat|undefined){
 const ab=number(stat,'batting','AB'),h=number(stat,'batting','H'),bb=number(stat,'batting','BB'),hbp=number(stat,'batting','HBP'),sf=number(stat,'batting','SF');
 const obp=number(stat,'batting','OBP')??(ab!==undefined&&h!==undefined&&bb!==undefined&&hbp!==undefined&&sf!==undefined&&ab+bb+hbp+sf>0?(h+bb+hbp)/(ab+bb+hbp+sf):undefined);
 const avg=number(stat,'batting','AVG')??(ab&&h!==undefined?h/ab:undefined);
 const slg=number(stat,'batting','SLG')??(ab&&number(stat,'batting','TB')!==undefined?number(stat,'batting','TB')!/ab:undefined);
 const pa=number(stat,'batting','PA')??ab??0,so=number(stat,'batting','SO');
 return {obp,avg,slg,pa,contact:pa>0&&so!==undefined?Math.max(0,1-so/pa):undefined,small:pa<20};
}
export function suggestBattingOrder(board:Board,ids:string[],locks:Record<string,number>={}){
 const stats=statsSource(board).stats;
 const players=ids.map(id=>board.players.find(p=>p.id===id)).filter((p):p is Player=>!!p);
 if(new Set(ids).size!==ids.length||players.length!==ids.length||!players.length)throw new Error('Choose attending players from the roster.');
 if(!players.some(p=>batterProfile(stats[p.id]).obp!==undefined))throw new Error('Import OBP or complete on-base counts before suggesting an order.');
 const profiles=Object.fromEntries(players.map(p=>[p.id,batterProfile(stats[p.id])]));
 const mean=(key:'obp'|'slg'|'contact')=>{const values=Object.values(profiles).map(p=>p[key]).filter((v):v is number=>v!==undefined);return values.length?values.reduce((a,b)=>a+b,0)/values.length:0;};
 const baseline={obp:mean('obp'),slg:mean('slg'),contact:mean('contact')};
 const score=(id:string,power=false)=>{const p=profiles[id],weight=p.pa/(p.pa+12);const shrink=(key:'obp'|'slg'|'contact')=>{const value=p[key];return value===undefined?baseline[key]:(value*weight+baseline[key]*(1-weight));};if(p.obp===undefined)return -1;return shrink('obp')*(power?40:70)+shrink('slg')*(power?55:25)+shrink('contact')*5;};
 const order=Array<string>(players.length).fill('');
 for(const [id,slot]of Object.entries(locks)){if(!ids.includes(id)||!Number.isInteger(slot)||slot<0||slot>=order.length||order[slot])throw new Error('Locked slots conflict or are outside the attending order.');order[slot]=id;}
 const remaining=ids.filter(id=>!Object.keys(locks).includes(id));
 const slots=[0,1,3,2,...Array.from({length:players.length},(_,i)=>i).filter(i=>i>=4)].filter(i=>i<order.length);
 for(const slot of slots){if(order[slot])continue;remaining.sort((a,b)=>score(b,slot===3)-score(a,slot===3)||ids.indexOf(a)-ids.indexOf(b));order[slot]=remaining.shift()!;}
 return order.map((id,index)=>{const p=profiles[id];return {id,slot:index,reason:locks[id]!==undefined?'Coach-locked slot':p.obp===undefined?'No on-base data; retained after players with stats':`${index===3?'Power emphasis':'On-base / contact emphasis'} · ${p.pa} PA${p.small?' · Small sample':''}`,profile:p};});
}
export function pitchingRestriction(board:Board,game:Game,id:string):string {
 const target=parseCalendarDate(gameSchedule(game).date);if(!target)return 'Set the game date before reviewing workload.';
 if(game.positions.P!==id&&((inningsOuts(game.pitchers[id]?.innings)??0)>0||Object.values(game.defenseInnings??{}).some(v=>v.P===id)))return 'Already used as pitcher in this game; verify re-entry rules.';
 const context=board.rulesContext,age=Number(context?.age.replace(/U$/i,''));
 if(context?.sport!=='baseball'||context.season!=='2026'||age<7||age>14||!Number.isFinite(age))return 'Coach must verify this division’s event limits and rest rules.';
 const days:Record<string,number>={};let unknown=false;
 for(const g of board.games){const logged=inningsOuts(g.pitchers[id]?.innings),imported=inningsOuts(number(g.stats[id],'pitching','IP'));const outs=Math.max(logged??0,imported??0);if(!outs)continue;const date=parseCalendarDate(gameSchedule(g).date);if(!date){unknown=true;continue;}const key=dateKey(date);days[key]=(days[key]??0)+outs;}
 const day=(offset:number)=>{const d=new Date(target);d.setDate(d.getDate()+offset);return days[dateKey(d)]??0;};
 if(day(-1)>9||day(-1)+day(-2)>=24||(day(-1)>0&&day(-2)>0&&day(-3)>0))return 'Rest required under the reviewed USSSA 2026 innings rules.';
 if(day(0)>=(age<=12?18:21)||day(0)+day(-1)+day(-2)>=24)return 'Recorded innings have reached the daily or three-day limit.';
 return unknown?'Some pitching history has no date. Resolve it and confirm availability.':'No recorded limit violation. Coach must confirm complete history, event rules and availability.';
}
export function rankPitchers(board:Board,game:Game,available:string[]){const stats=statsSource(board).stats;
 return board.players.filter(p=>p.positions?.includes('P')&&available.includes(p.id)).map(p=>{const s=stats[p.id],ip=inningsOuts(number(s,'pitching','IP'))??0,bb=number(s,'pitching','BB'),so=number(s,'pitching','SO'),whip=number(s,'pitching','WHIP');const score=ip>0&&so!==undefined&&bb!==undefined&&whip!==undefined?(so-bb)*3/ip-whip: -Infinity;return {player:p,score,outs:ip,restriction:pitchingRestriction(board,game,p.id)};}).sort((a,b)=>b.score-a.score||a.player.name.localeCompare(b.player.name));
}
export function practicePriorities(board:Board){const stats=statsSource(board).stats,rows=Object.values(stats);const sum=(g:'batting'|'pitching'|'fielding',k:string)=>{const relevant=rows.filter(s=>Object.keys(s[g]??{}).length);const v=relevant.map(s=>number(s,g,k));return v.length&&v.every(n=>n!==undefined)?v.reduce<number>((a,b)=>a+(b??0),0):null;};
 const ideas:{focus:'hitting'|'throwing'|'defense';reason:string}[]=[];
 const pa=sum('batting','PA'),so=sum('batting','SO'),bf=sum('pitching','BF'),bb=sum('pitching','BB'),tc=sum('fielding','TC'),e=sum('fielding','E');
 if(pa&&so!==null&&pa>=20&&so/pa>=.25)ideas.push({focus:'hitting',reason:`${so} strikeouts in ${pa} PA. Emphasize contact and two-strike approaches.`});
 if(bf&&bb!==null&&bf>=20&&bb/bf>=.15)ideas.push({focus:'throwing',reason:`${bb} walks in ${bf} batters faced. Emphasize strike throwing and repeatable mechanics.`});
 if(tc&&e!==null&&tc>=10&&e/tc>=.15)ideas.push({focus:'defense',reason:`${e} errors in ${tc} chances. Emphasize clean fielding and accurate throws.`});
 return ideas;
}
export function playerReport(player:Player,stat:Stat|undefined){const p=batterProfile(stat);return [`${player.name}${player.number?' #'+player.number:''}`,`Imported batting sample: ${p.pa} PA${p.small?' — small sample':''}.`,p.obp!==undefined?`On-base percentage: ${p.obp.toFixed(3)}.`:'On-base data unavailable.',p.contact!==undefined?`PA without a strikeout: ${(p.contact*100).toFixed(1)}%.`:'Strikeout-avoidance data unavailable.',p.contact!==undefined&&p.contact<.75?'Practice focus: contact and two-strike approaches.':'Practice focus: maintain a balanced hitting and fielding routine.','Descriptive report from imported stats; no opponent, competition-level or injury adjustment.'].join('\n');}
