import type { Board, Player, Stat, Position } from './board';
import { POSITIONS } from './board';
import type { StatColumn, StatGroup } from './stat-data';
import { inningsOuts, isCountingStat } from './stat-data';
export const NEW_PLAYER='__new__', REVIEW_PLAYER='__review__';
export type ImportRow = { id:string;name:string;number:string;stats:Stat;positions:Position[];playerId:string;ambiguous:boolean;matchNote:string };
export type ParsedImport={rows:ImportRow[];columns:StatColumn[];warnings:string[]};
const norm=(v:string)=>v.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const nameParts=(name:string)=>name.trim().replace(/,/g,' ').split(/\s+/);
const initialKey=(name:string)=>{const parts=nameParts(name);return norm(parts[0]?.[0]??'')+':'+norm(parts.slice(1).join(' '));};
export function matchPlayer(name:string,number:string,players:Player[]) {
 const exact=players.filter(p=>norm(p.name)===norm(name));
 if(exact.length===1&&(!number||!exact[0].number||norm(number)===norm(exact[0].number)))return {playerId:exact[0].id,ambiguous:false,matchNote:'Full name matched'};
 const initials=players.filter(p=>initialKey(p.name)===initialKey(name));
 const candidates=exact.length?exact:initials;
 const byNumber=candidates.filter(p=>number&&norm(p.number)===norm(number));
 if(byNumber.length===1)return {playerId:byNumber[0].id,ambiguous:false,matchNote:'Name and jersey matched'};
 if(candidates.length)return {playerId:REVIEW_PLAYER,ambiguous:true,matchNote:'Similar name or changed jersey — choose the player'};
 return {playerId:NEW_PLAYER,ambiguous:false,matchNote:'Add new player'};
}
export function csvRows(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], cell = '', quoted = false;
  for (let i=0;i<text.length;i++) { const ch=text[i]; if(ch==='"') { if(quoted&&text[i+1]==='"') { cell+='"';i++; } else quoted=!quoted; } else if(ch===','&&!quoted) { row.push(cell.trim());cell=''; } else if((ch==='\n'||ch==='\r')&&!quoted) { if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell.trim());if(row.some(Boolean))rows.push(row);row=[];cell=''; } else cell+=ch; }
  if (quoted) throw new Error('The CSV has an unfinished quoted field. Export the file again.');
  row.push(cell.trim());if(row.some(Boolean))rows.push(row);return rows;
}

export function parseDetailedImport(text:string,players:Player[]):ParsedImport {
 if(text.length>1000000)throw new Error('Choose a CSV under 1 MB.');
 if(text.startsWith('%PDF'))throw new Error('This is a PDF. Export Stats as a CSV instead.');
 const records=csvRows(text.replace(/^\uFEFF/,''));
 const headerIndex=records.findIndex(row=>row.some(v=>['player','name','playername','first','firstname','last','lastname'].includes(norm(v)))&&row.some(v=>['ab','pa','avg','ip','tc'].includes(norm(v))));
 if(headerIndex<0)throw new Error('No player-stat header found. Export Stats as a CSV from GameChanger.');
 const header=records[headerIndex],keys=header.map(norm),sectionRow=records[headerIndex-1]??[];
 let group:StatGroup='batting';
 const columns:StatColumn[]=[],columnIndex:{index:number;group:StatGroup;key:string}[]=[];
 const identity=new Set(['number','no','jersey','jerseynumber','last','lastname','first','firstname','player','name','playername','position','positions','pos']);
 header.forEach((label,index)=>{const section=norm(sectionRow[index]??'');if(['batting','pitching','fielding'].includes(section))group=section as StatGroup;
  if(!sectionRow.some(v=>['batting','pitching','fielding'].includes(norm(v)))&&['ip','inningspitched'].includes(norm(label)))group='pitching';
  if(!label||identity.has(norm(label)))return;
  const key=label.trim().toUpperCase();if(columns.some(c=>c.group===group&&c.key===key))throw new Error(`Duplicate ${group} column ${key}. Export the sectioned CSV again.`);
  columns.push({group,key,label:key});columnIndex.push({index,group,key});
 });
 const rows:ImportRow[]=[];
 for(let index=headerIndex+1;index<records.length;index++){
  const raw=records[index];if(raw.some(v=>/^glossary$/i.test(v.trim())))break;
  const get=(...names:string[])=>raw[keys.findIndex(k=>names.includes(k))]?.trim()??'';
  const first=get('first','firstname'),last=get('last','lastname');
  const full=get('player','name','playername');
  const name=full.includes(',')?full.split(',').reverse().map(v=>v.trim()).join(' '):full||[first,last].filter(Boolean).join(' ');
  if(!name||/^(?:team\s*)?totals?$/i.test(name)||/^(?:team\s*)?totals?$/i.test(raw[0]??''))continue;
  const number=get('number','no','jersey','jerseynumber');
  if(name.length>100||number.length>8)throw new Error('A player name or jersey number is too long. Check the export.');
  const stats:Stat={batting:{},pitching:{},fielding:{}};
  for(const col of columnIndex){const value=raw[col.index]?.trim();if(!value||value==='-'||value==='—')continue;
   const n=Number(value.replace(/%$/,''));if(!Number.isFinite(n)||Math.abs(n)>1000000||(n<0&&!(col.group==='pitching'&&col.key==='FIP')))throw new Error(`Invalid ${col.key} for ${name}. Check the CSV.`);
   if((col.group==='pitching'&&col.key==='IP')||(col.group==='fielding'&&['INN','P','C','1B','2B','3B','SS','LF','CF','RF','SF','TOTAL'].includes(col.key))){if(inningsOuts(n)===null)throw new Error(`Invalid innings for ${name}: ${value}. Use baseball innings such as 2.1 or 2.2.`);}
   if(isCountingStat(col.group,col.key)&&!Number.isInteger(n))throw new Error(`Use whole counts for ${col.key} (${name}).`);
   const max=col.key.endsWith('%')?100:col.group==='batting'&&['AVG','OBP'].includes(col.key)||col.group==='fielding'&&col.key==='FPCT'?1:col.group==='batting'&&col.key==='SLG'?4:col.group==='batting'&&col.key==='OPS'?5:1000000;
   if(n>max)throw new Error(`Out-of-range ${col.key} for ${name}. Check the CSV.`);
   stats[col.group]![col.key]=n;
  }
  if(!Object.values(stats).some(v=>typeof v==='object'&&Object.keys(v).length))continue;
  const b=stats.batting!,p=stats.pitching!;
  for(const [key,field]of Object.entries({PA:'pa',AB:'ab',H:'h',BB:'bb',SO:'so',AVG:'avg',OBP:'obp',OPS:'ops'}))if(b[key]!==undefined)(stats as Record<string,unknown>)[field]=b[key];
  if(p.IP!==undefined)stats.ip=String(p.IP);if(p.ERA!==undefined)stats.era=p.ERA;if(p['#P']!==undefined)stats.pitches=p['#P'];
  const declared=get('position','positions','pos').toUpperCase().split(/[;,/|\s]+/).filter(v=>POSITIONS.includes(v as Position)) as Position[];
  const played=POSITIONS.filter(pos=>(stats.fielding?.[pos]??0)>0);
  rows.push({id:String(index),name,number,stats,positions:[...new Set([...declared,...played])],...matchPlayer(name,number,players)});
  if(rows.length>200)throw new Error('This file has more than 200 player rows. Export one team.');
 }
 if(!rows.length)throw new Error('No player statistics found in this CSV.');
 const seen=new Set<string>();for(const row of rows){const key=norm(row.name)+':'+norm(row.number);if(seen.has(key))throw new Error(`Duplicate player row: ${row.name}. Export one team without repeated tables.`);seen.add(key);}
 return {rows,columns,warnings:rows.some(r=>r.positions.length)?['Position suggestions use recorded playing history. Review before applying.']:['No position history found. Set playable positions in Roster.']};
}
export function parseStatsImport(text:string,players:Player[]):ImportRow[]{return parseDetailedImport(text,players).rows;}
export function compileStatsImport(rows:ImportRow[],players:Player[]):Record<string,Stat>{
 const stats:Record<string,Stat>={};for(const row of rows){if(!row.playerId)continue;if([NEW_PLAYER,REVIEW_PLAYER].includes(row.playerId)||!players.some(p=>p.id===row.playerId))throw new Error('Resolve player matches first.');if(stats[row.playerId])throw new Error('Two rows match the same player. Review the matches.');stats[row.playerId]=row.stats;}if(!Object.keys(stats).length)throw new Error('Include at least one player.');return stats;
}
export type ImportRequest={mode:'season'|'game';season:string;gameId?:string;label:string;fingerprint:string;importedAt:string;rows:ImportRow[];columns:StatColumn[];mergePositions:boolean};
export function applyStatsImport(board:Board,request:ImportRequest,newId:()=>string):Board {
 if(!/^20\d{2}$/.test(request.season))throw new Error('Choose a four-digit season.');
 if(request.rows.some(r=>r.playerId===REVIEW_PLAYER))throw new Error('Resolve every highlighted player match.');
 if(request.mode==='game'&&request.rows.some(r=>(r.stats.batting?.GP??0)>1||(r.stats.pitching?.GP??0)>1))throw new Error('This file contains multiple games. Choose Season or export a single-game CSV.');
 const existing=request.mode==='season'?board.seasonImports?.find(s=>s.season===request.season):board.games.find(g=>g.id===request.gameId);
 if(request.mode==='game'&&board.games.some(g=>g.id!==request.gameId&&g.importFingerprint===request.fingerprint))throw new Error('This CSV is already assigned to another game. Review that import instead of counting it twice.');
 if(existing&&('fingerprint'in existing?existing.fingerprint:existing.importFingerprint)===request.fingerprint)throw new Error('This file is already imported into this destination.');
 const players=[...board.players];const mapped=request.rows.map(row=>{
  if(row.playerId!==NEW_PLAYER)return row;
  if(players.some(p=>norm(p.name)===norm(row.name)))throw new Error(`A player named ${row.name} now exists. Match the existing player instead.`);
  const id=newId();players.push({id,name:row.name,number:row.number,bats:'',throws:'',notes:'',positions:row.positions});return {...row,playerId:id};
 });
 const stats=compileStatsImport(mapped,players);
 const updatedPlayers=players.map(p=>{const row=mapped.find(r=>r.playerId===p.id);return row?{...p,number:p.number||row.number,positions:request.mergePositions?[...new Set([...(p.positions??[]),...row.positions])]:p.positions}:p;});
 if(request.mode==='season')return {...board,players:updatedPlayers,statsSeason:request.season,seasonImports:[...(board.seasonImports??[]).filter(s=>s.season!==request.season),{id:existing?.id??newId(),season:request.season,label:request.label,fingerprint:request.fingerprint,importedAt:request.importedAt,stats,columns:request.columns}]};
 if(!board.games.some(g=>g.id===request.gameId))throw new Error('The selected game no longer exists.');
 return {...board,players:updatedPlayers,statsSeason:request.season,games:board.games.map(g=>g.id===request.gameId?{...g,stats,statsSeason:request.season,statColumns:request.columns,importedAt:request.importedAt,importLabel:request.label,importFingerprint:request.fingerprint}:g)};
}
