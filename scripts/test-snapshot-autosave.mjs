import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const jsx=(type,props)=>({type,props});let states=[],cursor=0,saves=[];let selected=['AVG','OBP','H','R','BB','E'];
const choices=['AVG','OBP','H','R','BB','E','ERA','SO'].map(key=>({key,label:key}));
const exports={};const source=readFileSync('src/components/season-snapshot.tsx','utf8').replace('function Snapshot(', 'export function Snapshot(');
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:name=>name==='react'?{useState:value=>{const i=cursor++;if(!(i in states))states[i]=value;return[states[i],v=>{states[i]=v;}];}}:name==='react/jsx-runtime'?{jsx,jsxs:jsx}:name==='react-native'?{View:'View',Text:'Text',Pressable:'Pressable',StyleSheet:{create:s=>s},useWindowDimensions:()=>({width:834,height:1194})}:name.includes('use-account-preference')?{useAccountPreference:()=>({value:selected,error:'',save:v=>{saves.push(v);selected=v;}})}:name.includes('snapshot-metrics')?{SNAPSHOT_DEFAULTS:['AVG','OBP','H','R','BB','E'],snapshotMetrics:()=>choices}:name.includes('coaching-ui')?{Sheet:'Sheet',c:{}}:name.includes('app-ui')?{Section:'Section',Button:'Button',ui:{},palette:{}}:name.includes('stat-data')?{snapshotMetrics:()=>choices,seasonKey:()=> '2026'}:{}});
function render(){cursor=0;return exports.Snapshot({board:null,storageKey:'fixture'});}
function find(tree,predicate){if(!tree)return;if(Array.isArray(tree)){for(const child of tree){const r=find(child,predicate);if(r)return r;}}else if(typeof tree==='object'){if(predicate(tree))return tree;return find(tree.props?.children,predicate);}}
let tree=render();find(tree,n=>n.props?.accessibilityLabel==='Filter team totals').props.onPress();tree=render();let sheet=find(tree,n=>n.type==='Sheet');assert.equal(sheet.props.open,true);
find(tree,n=>n.props?.accessibilityRole==='checkbox'&&n.props.children[1].props.children==='AVG').props.onPress();tree=render();sheet=find(tree,n=>n.type==='Sheet');sheet.props.onClose();assert.equal(saves.length,1);assert(!saves[0].includes('AVG'));assert.equal(states[1],false);
assert(!find(tree,n=>n.type==='Button'&&n.props.children==='SAVE FILTER'));
// Closing an untouched selection must not issue another write.
tree=render();find(tree,n=>n.props?.accessibilityLabel==='Filter team totals').props.onPress();tree=render();find(tree,n=>n.type==='Sheet').props.onClose();assert.equal(saves.length,1);
selected=['AVG'];states=[];tree=render();find(tree,n=>n.props?.accessibilityLabel==='Filter team totals').props.onPress();tree=render();const last=find(tree,n=>n.props?.accessibilityRole==='checkbox'&&n.props.children[1].props.children==='AVG');assert.equal(last.props.disabled,true);
console.log('PASS dismiss-to-save, no redundant unchanged writes, no required footer Save button and last-stat protection.');
