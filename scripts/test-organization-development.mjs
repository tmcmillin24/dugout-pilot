import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';
const cache=new Map();
function load(file){const url=file instanceof URL?file:new URL(file,import.meta.url);if(cache.has(url.href))return cache.get(url.href);const exports={};cache.set(url.href,exports);vm.runInNewContext(ts.transpileModule(readFileSync(url,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:name=>name==='expo-crypto'?{randomUUID}:name.startsWith('.')?load(new URL(name+'.ts',url)):createRequire(import.meta.url)(name)});return exports;}
const {organizationDevelopment}=load('../src/lib/organizations/development.ts');
const {parseDetailedImport}=load('../src/lib/coaching/csv-import.ts');
const players=['contact','command','fielding','missing','small','healthy'].map(id=>({id,name:id,number:'',positions:id==='command'?['P']:[]}));
const stats={contact:{batting:{PA:30,AB:25,H:4,TB:4,SO:15,BB:3}},command:{pitching:{BF:40,BB:12,IP:8}},fielding:{fielding:{TC:25,E:8}},missing:{},small:{batting:{PA:5,SO:5}},healthy:{batting:{PA:30,AB:25,H:12,TB:15,SO:1,BB:4},fielding:{TC:25,E:0}}};
const board={players,games:[],statsSeason:'2026',seasonImports:[{season:'2026',stats,importedAt:'2026-10-01',label:'Season CSV'}]};
let report=organizationDevelopment(board);assert.equal(report.opportunities.length,3);assert.deepEqual(new Set(report.opportunities.map(r=>r.player.id)),new Set(['contact','command','fielding']));
assert.equal(organizationDevelopment(board,'2026','pitching').opportunities[0].player.id,'command');assert.equal(organizationDevelopment(board,'2026','fielding').opportunities[0].player.id,'fielding');assert.equal(organizationDevelopment(board,'2026','batting').opportunities[0].player.id,'contact');assert.equal(organizationDevelopment(board,'2025').opportunities.length,0);
assert.equal(report.rows.find(r=>r.player.id==='missing').priorities.length,0);assert.equal(report.rows.find(r=>r.player.id==='small').priorities.length,0);assert.equal(report.rows.find(r=>r.player.id==='healthy').priorities.length,0);
const added={id:'g',date:'2026-10-02',statsSeason:'2026',statsContribution:'add',importLabel:'Game',importedAt:'2026-10-02',stats:{contact:{batting:{PA:10,AB:8,H:2,TB:2,SO:5,BB:1}}}};
report=organizationDevelopment({...board,games:[added]});assert.equal(report.source.stats.contact.batting.PA,40);assert.equal(organizationDevelopment({...board,games:[{...added,statsContribution:'included'}]}).source.stats.contact.batting.PA,30);
// Team size never caps at twelve.
const large={...board,players:Array.from({length:50},(_,i)=>({...players[0],id:'p'+i})),seasonImports:[]};assert.equal(organizationDevelopment(large).rows.length,50);
if(process.argv[2]){const parsed=parseDetailedImport(readFileSync(process.argv[2],'utf8'),[]);assert.equal(parsed.rows.length,12);for(const [group,key] of [['batting','PA'],['batting','SO'],['pitching','BF'],['pitching','BB'],['fielding','TC'],['fielding','E']])assert.ok(parsed.columns.some(c=>c.group===group&&c.key===key));const imported={...board,players:parsed.rows.map(r=>({id:r.id,name:r.name,number:r.number,positions:r.positions})),seasonImports:[{season:'2026',stats:Object.fromEntries(parsed.rows.map(r=>[r.id,r.stats])),importedAt:'2026-11-14'}]};const actual=organizationDevelopment(imported);assert.equal(actual.rows.length,12);assert.ok(actual.opportunities.every(r=>r.priorities.every(f=>!f.early)));console.log(`CSV verified: ${parsed.rows.length} players, ${parsed.columns.length} sectioned stat columns, ${actual.opportunities.length} established opportunities.`);}
console.log('PASS: evidence-specific priorities, minimum samples, missing-data handling, area/season filters, 50-player roster and season-plus-game totals.');
