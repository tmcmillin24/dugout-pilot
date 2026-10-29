import { formatPlayerName } from './player-display';
import type { Player, Stat } from './board';
export type ImportRow = { id: string; name: string; number: string; stats: Stat; playerId: string; ambiguous: boolean };
const norm = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, '');
const aliases = { pa:['pa'],ab:['ab'],h:['h','hits'],bb:['bb','walks'],so:['so','k','strikeouts'],avg:['avg','ba'],obp:['obp'],ops:['ops'],era:['era'],pitches:['pitches','pc','pitchcount'] };
export function csvRows(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], cell = '', quoted = false;
  for (let i=0;i<text.length;i++) { const ch=text[i]; if(ch==='"') { if(quoted&&text[i+1]==='"') { cell+='"';i++; } else quoted=!quoted; } else if(ch===','&&!quoted) { row.push(cell.trim());cell=''; } else if((ch==='\n'||ch==='\r')&&!quoted) { if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell.trim());if(row.some(Boolean))rows.push(row);row=[];cell=''; } else cell+=ch; }
  if (quoted) throw new Error('The CSV has an unfinished quoted field. Export the file again.');
  row.push(cell.trim());if(row.some(Boolean))rows.push(row);return rows;
}
export function parseStatsImport(text: string, players: Player[]): ImportRow[] {
  if(text.length>1000000)throw new Error('Choose a CSV under 1 MB.');
  const rows=csvRows(text.replace(/^\uFEFF/,'')); let header: string[]|null=null; const result: ImportRow[]=[];
  for(let index=0;index<rows.length;index++) {
    const row=rows[index], keys=row.map(norm);
    if(keys.some(k=>['player','name','firstname','lastname','playername'].includes(k))&&keys.some(k=>['pa','ab','avg','obp','ops','h','bb','ip','pitches','pc'].includes(k))) { header=keys;continue; }
    if(!header)continue;
    const value=(...names:string[])=>{ const col=header!.findIndex(k=>names.includes(k));return col<0?'':row[col]??''; };
    const name=value('player','name','playername')||[value('firstname','first'),value('lastname','last')].filter(Boolean).join(' '),number=value('number','no','jersey','jerseynumber');
    if(!name||/^(team\s*)?totals?$/i.test(name))continue;
    const stats: Stat={};
    for(const [field,names] of Object.entries(aliases)) { const raw=value(...names);if(!raw.trim())continue;const n=Number(raw);if(!Number.isFinite(n)||n<0||n>1000000)continue;if(['pa','ab','h','bb','so','pitches'].includes(field)&&!Number.isInteger(n))continue;(stats as Record<string,number>)[field]=n; }
    const ip=value('ip','inningspitched');if(/^\d+(\.[012])?$/.test(ip))stats.ip=ip;
    if(!Object.keys(stats).length)continue;
    const byName=players.filter(p=>norm(name)===norm(p.name)||norm(name)===norm(p.name.split(/\s+/).reverse().join(' ')));
    const byNumber=number?players.filter(p=>p.number&&norm(p.number)===norm(number)):[];
    const candidates=byName.length===1?byName:byName.length>1?(byNumber.length===1?byName.filter(p=>p.id===byNumber[0].id):byName):byNumber;
    result.push({id:String(index),name,number,stats,playerId:candidates.length===1?candidates[0].id:'',ambiguous:candidates.length>1});
    if(result.length>500)throw new Error('This export has too many player rows. Export one game only.');
  }
  if(!result.length)throw new Error('No supported player stats found. Use a CSV with player names and columns such as AB, H, OBP, or IP.');
  return result;
}
export function compileStatsImport(rows: ImportRow[], players: Player[]): Record<string,Stat> {
  const stats: Record<string,Stat>={};
  for(const row of rows) { if(!row.playerId)continue;if(!players.some(p=>p.id===row.playerId))throw new Error('A selected player is no longer on this roster. Match players again.');const previous=stats[row.playerId]??{};
    for(const [key,value] of Object.entries(row.stats)) { if(key in previous && previous[key as keyof Stat]!==value)throw new Error(`Conflicting rows for ${formatPlayerName(players.find(p=>p.id===row.playerId)?.name)}. Import one game and match each row carefully.`); }
    stats[row.playerId]={...previous,...row.stats};
  }
  if(!Object.keys(stats).length)throw new Error('Match at least one player before importing.');return stats;
}
