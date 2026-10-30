import type { Board, Stat } from './board';
export type StatGroup='batting'|'pitching'|'fielding';
export type StatColumn={group:StatGroup;key:string;label:string};
export type StatImport={id:string;season:string;label:string;fingerprint:string;importedAt:string;stats:Record<string,Stat>;columns:StatColumn[]};
export const groupLabels={batting:'Batting',pitching:'Pitching',fielding:'Fielding'};
const fallback:Record<StatGroup,Record<string,string>>={batting:{PA:'pa',AB:'ab',H:'h',BB:'bb',SO:'so',AVG:'avg',OBP:'obp',OPS:'ops'},pitching:{IP:'ip',ERA:'era','#P':'pitches'},fielding:{}};
export function statValue(stat:Stat|undefined,group:StatGroup,key:string):number|undefined {
 if(!stat)return undefined;const value=stat[group]?.[key]??stat[fallback[group][key] as keyof Stat];
 const n=typeof value==='number'?value:typeof value==='string'&&value.trim()?Number(value):NaN;return Number.isFinite(n)?n:undefined;
}
export function inningsOuts(value:number|string|undefined):number|null {if(value===undefined)return null;const x=/^(\d+)(?:\.([012]))?$/.exec(String(value));return x?Number(x[1])*3+Number(x[2]??0):null;}
export function formatOuts(outs:number):string{return `${Math.floor(outs/3)}.${outs%3}`;}
export function seasonKey(board:Board):string{return board.statsSeason||board.seasonImports?.at(-1)?.season||board.rulesContext?.season||String(new Date().getFullYear());}
export function gameSeason(game:Board['games'][number]):string{return game.statsSeason||game.date?.match(/\b(\d{4})\b/)?.[1]||'';}
export function statsSource(board:Board,season=seasonKey(board)) {
 const snapshot=board.seasonImports?.find(s=>s.season===season);
 const games=board.games.filter(g=>g.importLabel&&Object.keys(g.stats).length&&gameSeason(g)===season);
 return {snapshot,games,label:snapshot?`${snapshot.label} · Updated ${new Date(snapshot.importedAt).toLocaleDateString()}`:`${games.length} imported games · ${season}`,stats:snapshot?.stats??Object.fromEntries(board.players.map(p=>[p.id,aggregateStats(games.flatMap(g=>g.stats[p.id]?[g.stats[p.id]]:[]))]))};
}
const battingCounts=new Set(['GP','PA','AB','H','1B','2B','3B','HR','RBI','R','BB','SO','K-L','HBP','SAC','SF','ROE','FC','SB','CS','PIK','QAB','HHB','LOB','2OUTRBI','XBH','TB','PS','2S+3','6+','GIDP','GITP','CI']);
const pitchingCounts=new Set(['GP','GS','BF','#P','W','L','SV','SVO','BS','H','R','ER','BB','SO','K-L','HBP','LOB','BK','PIK','CS','SB','WP','LOO','1ST2OUT','123INN','<13','0BBINN','BBS','LOBB','LOBBS','HR','FB','FBS','CB','CBS','CT','CTS','SL','SLS','CH','CHS','OS','OSS']);
const fieldingCounts=new Set(['TC','A','PO','E','DP','TP','PB','SB','SBATT','CS','PIK','CI']);
const fieldInnings=new Set(['INN','P','C','1B','2B','3B','SS','LF','CF','RF','SF','TOTAL']);
export function isCountingStat(group:StatGroup,key:string):boolean{return (group==='batting'?battingCounts:group==='pitching'?pitchingCounts:fieldingCounts).has(key);}
export function aggregateStats(rows:Stat[]):Stat {
 if(!rows.length)return {};if(rows.length===1)return {...rows[0]};
 const result:Stat={batting:{},pitching:{},fielding:{}};
 for(const group of ['batting','pitching','fielding'] as StatGroup[]) {
  const keys=new Set([...rows.flatMap(r=>Object.keys(r[group]??{})),...Object.keys(fallback[group]).filter(k=>rows.some(r=>statValue(r,group,k)!==undefined))]);
  for(const key of keys){const vals=rows.map(r=>statValue(r,group,key));if(vals.some(v=>v===undefined))continue;
   if((group==='pitching'&&key==='IP')||(group==='fielding'&&fieldInnings.has(key))){const outs=vals.map(v=>inningsOuts(v));if(outs.every(v=>v!==null))result[group]![key]=Number(formatOuts(outs.reduce<number>((a,b)=>a+(b??0),0)));}
   else if((group==='batting'?battingCounts:group==='pitching'?pitchingCounts:fieldingCounts).has(key))result[group]![key]=vals.reduce<number>((a,b)=>a+(b??0),0);
  }
 }
 const b=result.batting!,p=result.pitching!,f=result.fielding!;
 if(b.AB>0&&b.H!==undefined)b.AVG=b.H/b.AB;
 if([b.H,b.BB,b.HBP,b.AB,b.SF].every(v=>v!==undefined)&&b.AB+b.BB+b.HBP+b.SF>0)b.OBP=(b.H+b.BB+b.HBP)/(b.AB+b.BB+b.HBP+b.SF);
 if(b.TB!==undefined&&b.AB>0)b.SLG=b.TB/b.AB;
 if(b.SLG!==undefined&&b.OBP!==undefined)b.OPS=b.SLG+b.OBP;
 const outs=inningsOuts(p.IP);if(outs&&p.BB!==undefined&&p.H!==undefined)p.WHIP=(p.BB+p.H)/(outs/3);
 if(f.TC>0&&f.A!==undefined&&f.PO!==undefined)f.FPCT=(f.A+f.PO)/f.TC;
 // ERA uses the event's regulation-inning basis; do not guess it across imported games.
 return result;
}
export function availableColumns(stats:Record<string,Stat>,group:StatGroup):string[]{return [...new Set(Object.values(stats).flatMap(s=>[...Object.keys(s[group]??{}),...Object.keys(fallback[group]).filter(k=>statValue(s,group,k)!==undefined)]))];}
export function formatStat(value:number|undefined,key:string):string {if(value===undefined)return '—';if(['AVG','OBP','OPS','SLG','BABIP','BA/RISP','BAA','FPCT'].includes(key))return value.toFixed(3).replace(/^0\./,'.');if(/%$/.test(key))return `${value.toFixed(1)}%`;return Number.isInteger(value)?String(value):String(Number(value.toFixed(3)));}
