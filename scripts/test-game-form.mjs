import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const jsx=(type,props,key)=>({type,props,key});let seeds=[],index=0,commits=0,closed=0,board={games:[],activeGameId:''};
const exports={};const source=readFileSync(new URL('../src/components/game-card.tsx',import.meta.url),'utf8').replace('function GameDetails(', 'export function GameDetails(');
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:name=>name==='react'?{useState:value=>[index<seeds.length?seeds[index++]:typeof value==='function'?value():value,()=>{}]}:name==='react/jsx-runtime'?{jsx,jsxs:jsx}:name==='react-native'?{StyleSheet:{create:x=>x},Text:'Text',View:'View',Pressable:'Pressable'}:name.includes('coaching-provider')?{useCoaching:()=>({writable:true,busy:false,commit:async change=>{board=change(board);commits++;return true;}})}:name.includes('calendar')?{parseCalendarDate:value=>/^\d{4}-\d{2}-\d{2}$/.test(value)?new Date(value):null}:name.includes('app-ui')?{Button:'Button',palette:{}}:name.includes('coaching-ui')?{c:{}}:{}});
function form(date,creating=true){seeds=[false,'Game 2','Thunder','1',date,'17:30',''];index=0;return exports.GameDetails({game:{id:'new',lineup:['p'],positions:{P:'p'}},creating,close:()=>closed++});}
function find(tree,label){if(!tree||typeof tree!=='object')return null;if(tree.type==='Button'&&tree.props.children===label)return tree;for(const child of [tree.props?.children].flat(Infinity)){const result=find(child,label);if(result)return result;}return null;}
let tree=form('');assert.equal(find(tree,'ADD GAME').props.disabled,true);assert.equal(commits,0);
tree=form('2026-11-03');assert.equal(commits,0,'Opening and editing a draft must not persist');find(tree,'CANCEL').props.onPress();assert.equal(commits,0,'Cancel must not persist');assert.equal(closed,1);
find(tree,'ADD GAME').props.onPress();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(commits,1);assert.equal(board.games.length,1);assert.equal(board.games[0].opponent,'Thunder');assert.equal(board.games[0].date,'2026-11-03');assert.equal(board.games[0].time,'17:30');assert.equal(board.activeGameId,'new');assert.equal(board.games[0].lineup[0],'p');assert.equal(closed,2);
tree=form('2026-11-04',false);find(tree,'SAVE DETAILS').props.onPress();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(board.games.length,1);assert.equal(board.games[0].date,'2026-11-04');
console.log('PASS game form: date required for creation, drafts/cancel do not save, Add saves entered details once and selects game, Edit updates existing game.');
