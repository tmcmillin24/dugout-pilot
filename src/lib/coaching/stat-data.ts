import { dateKey } from './calendar';
import type { Board, Stat } from './board';
export type StatGroup='batting'|'pitching'|'fielding';
export type StatColumn={group:StatGroup;key:string;label:string};
export type StatImport={id:string;season:string;label:string;fingerprint:string;importedAt:string;stats:Record<string,Stat>;columns:StatColumn[];coveredGameIds?:string[];eraInnings?:number;gamesPlayed?:number};
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
export function inferEraInnings(stats:Record<string,Stat>):number|undefined {
 const samples=Object.values(stats).flatMap(s=>{const er=statValue(s,'pitching','ER'),era=statValue(s,'pitching','ERA'),outs=inningsOuts(statValue(s,'pitching','IP'));return er&&era!==undefined&&outs&&outs>0?[{er,era,outs}]:[];});
 if(!samples.length)return undefined;
 const options=[6,7,9].filter(basis=>samples.every(s=>Math.abs(s.er*basis*3/s.outs-s.era)<=.025));return options.length===1?options[0]:undefined;
}
export function suggestedContribution(board:Board,gameId:string,season:string):'add'|'included' {
 const snapshot=board.seasonImports?.find(s=>s.season===season),game=board.games.find(g=>g.id===gameId);
 if(!snapshot||!game)return 'add';if(game.statsContribution)return game.statsContribution;
 if(snapshot.coveredGameIds?.includes(gameId)||(game.importLabel&&(!game.importedAt||game.importedAt<=snapshot.importedAt))||(game.date&&/^\d{4}-\d{2}-\d{2}$/.test(game.date)&&game.date<=dateKey(new Date(snapshot.importedAt))))return 'included';return 'add';
}
export function statsSource(board:Board,season=seasonKey(board)) {
 const snapshot=board.seasonImports?.find(s=>s.season===season);
 const games=board.games.filter(g=>g.importLabel&&Object.keys(g.stats).length&&gameSeason(g)===season);
 const additions=snapshot?games.filter(g=>g.statsContribution==='add'||(g.statsContribution!=='included'&&!(snapshot.coveredGameIds??[]).includes(g.id)&&!!g.importedAt&&g.importedAt>snapshot.importedAt)):games;
 const eraInnings=snapshot?.eraInnings??(snapshot?inferEraInnings(snapshot.stats):undefined)??games.find(g=>g.eraInnings)?.eraInnings??inferEraInnings(Object.fromEntries(games.flatMap(g=>Object.entries(g.stats).map(([id,s])=>[g.id+id,s]))));
 const ids=[...new Set([...(snapshot?Object.keys(snapshot.stats):[]),...additions.flatMap(g=>Object.keys(g.stats))])];
 const stats=Object.fromEntries(ids.map(id=>[id,aggregateStats([...(snapshot?.stats[id]?[snapshot.stats[id]]:[]),...additions.flatMap(g=>g.stats[id]?[g.stats[id]]:[])],eraInnings)]));
 const reported=snapshot?.gamesPlayed;
 const knownGP=snapshot?Math.max(0,...Object.values(snapshot.stats).map(s=>statValue(s,'batting','GP')??0)):0;
 const gamesPlayed=snapshot?(reported??(knownGP||undefined)):games.length;
 return {snapshot,games,additions,eraInnings,gamesPlayed:gamesPlayed===undefined?undefined:gamesPlayed+(snapshot?additions.length:0),gamesPlayedExact:!snapshot||reported!==undefined,label:snapshot?`Season CSV${additions.length?` + ${additions.length} added ${additions.length===1?'game':'games'}`:''} · ${season}`:`${games.length} imported games · ${season}`,stats};
}
export function teamSummary(stats:Record<string,Stat>,eraInnings?:number) {
 const rows=Object.values(stats);
 const sum=(group:StatGroup,key:string)=>{const relevant=rows.filter(s=>availableColumns({s},group).length);const vals=relevant.map(s=>statValue(s,group,key));return vals.length&&vals.every(v=>v!==undefined)?vals.reduce<number>((a,b)=>a+(b??0),0):undefined;};
 const ab=sum('batting','AB'),hits=sum('batting','H'),bb=sum('batting','BB'),hbp=sum('batting','HBP'),sf=sum('batting','SF');
 const er=sum('pitching','ER'),pitching=rows.filter(s=>availableColumns({s},'pitching').length),outs=pitching.map(s=>inningsOuts(statValue(s,'pitching','IP')));
 const totalOuts=outs.length&&outs.every(v=>v!==null)?outs.reduce<number>((a,b)=>a+(b??0),0):0;
 return {avg:ab&&hits!==undefined?hits/ab:undefined,obp:[ab,hits,bb,hbp,sf].every(v=>v!==undefined)&&ab!+bb!+hbp!+sf!>0?(hits!+bb!+hbp!)/(ab!+bb!+hbp!+sf!):undefined,hits,runs:sum('batting','R'),walks:bb,era:er!==undefined&&totalOuts>0&&eraInnings?er*eraInnings*3/totalOuts:undefined,outs:totalOuts};
}

const battingCounts=new Set(['GP','PA','AB','H','1B','2B','3B','HR','RBI','R','BB','SO','K-L','HBP','SAC','SF','ROE','FC','SB','CS','PIK','QAB','HHB','LOB','2OUTRBI','XBH','TB','PS','2S+3','6+','GIDP','GITP','CI']);
const pitchingCounts=new Set(['GP','GS','BF','#P','W','L','SV','SVO','BS','H','R','ER','BB','SO','K-L','HBP','LOB','BK','PIK','CS','SB','WP','LOO','1ST2OUT','123INN','<13','0BBINN','BBS','LOBB','LOBBS','HR','FB','FBS','CB','CBS','CT','CTS','SL','SLS','CH','CHS','OS','OSS']);
const fieldingCounts=new Set(['TC','A','PO','E','DP','TP','PB','SB','SBATT','CS','PIK','CI']);
const fieldInnings=new Set(['INN','P','C','1B','2B','3B','SS','LF','CF','RF','SF','TOTAL']);
export function isCountingStat(group:StatGroup,key:string):boolean{return (group==='batting'?battingCounts:group==='pitching'?pitchingCounts:fieldingCounts).has(key);}
export function aggregateStats(rows:Stat[],eraInnings?:number):Stat {
 if(!rows.length)return {};if(rows.length===1){const result={...rows[0],pitching:{...rows[0].pitching}};const er=statValue(result,'pitching','ER'),outs=inningsOuts(statValue(result,'pitching','IP'));if(eraInnings&&er!==undefined&&outs)result.pitching.ERA=er*eraInnings*3/outs;return result;}
 const result:Stat={batting:{},pitching:{},fielding:{}};
 for(const group of ['batting','pitching','fielding'] as StatGroup[]) {
  const sectionRows=rows.filter(r=>availableColumns({r},group).length);
  const keys=new Set([...sectionRows.flatMap(r=>Object.keys(r[group]??{})),...Object.keys(fallback[group]).filter(k=>sectionRows.some(r=>statValue(r,group,k)!==undefined))]);
  for(const key of keys){const vals=sectionRows.map(r=>statValue(r,group,key));if(vals.some(v=>v===undefined))continue;
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
 if(eraInnings&&outs&&p.ER!==undefined)p.ERA=p.ER*eraInnings*3/outs;
 return result;
}
export function availableColumns(stats:Record<string,Stat>,group:StatGroup):string[]{return [...new Set(Object.values(stats).flatMap(s=>[...Object.keys(s[group]??{}),...Object.keys(fallback[group]).filter(k=>statValue(s,group,k)!==undefined)]))];}
export function formatStat(value:number|undefined,key:string):string {if(value===undefined)return '—';if(['AVG','OBP','OPS','SLG','BABIP','BA/RISP','BAA','FPCT'].includes(key))return value.toFixed(3).replace(/^0\./,'.');if(['ERA','WHIP'].includes(key))return value.toFixed(2);if(/%$/.test(key))return `${value.toFixed(1)}%`;return Number.isInteger(value)?String(value):String(Number(value.toFixed(3)));}
