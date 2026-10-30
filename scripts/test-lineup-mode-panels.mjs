import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const jsx=(type,props,key)=>({type,props,key});let mode='defense',viewport=834,isPad=true;
const source=readFileSync(new URL('../src/app/(tabs)/lineups.tsx',import.meta.url),'utf8').replace('function LineupBoard(', 'export function LineupBoard(');
const exports={};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:name=>name==='react'?{useState:()=>[mode,()=>{}]}:name==='react/jsx-runtime'?{jsx,jsxs:jsx}:name==='react-native'?{useWindowDimensions:()=>({width:viewport}),Platform:{OS:'ios',get isPad(){return isPad;}},View:'View',Text:'Text',Pressable:'Pressable'}:name.includes('coaching-provider')?{useCoaching:()=>({writable:true,commit(){}})}:name.includes('coaching-ui')?{c:{}}:{}});
const find=(tree,key)=>{if(!tree||typeof tree!=='object')return null;if(tree.key===key)return tree;for(const child of [tree.props?.children].flat(Infinity)){const result=find(child,key);if(result)return result;}return null;};
let defenseType;
for(mode of ['defense','batting','pitching','defense','batting']){
 const tree=exports.LineupBoard({board:{players:[{id:'p'}],games:[{id:'g'}],activeGameId:'g'},scroll:{}});
 const panel=find(tree,'defense-panel');assert.ok(panel,'Defense remains mounted when changing modes');defenseType??=panel.props.children.type;assert.equal(panel.props.children.type,defenseType);assert.equal(panel.props.collapsable,false);assert.equal(panel.props.style.display,mode==='defense'?'flex':'none');assert.equal(panel.props.accessibilityElementsHidden,mode!=='defense');assert.equal(panel.props.pointerEvents,mode==='defense'?'auto':'none');assert.equal(!!find(tree,'batting-panel'),mode==='batting');assert.equal(!!find(tree,'pitching-panel'),mode==='pitching');
}
const field={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/components/defensive-diamond.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports:field,require:name=>name==='react'?{useState(){throw Error('Field must not perform a measured-width second render');}}:name==='react/jsx-runtime'?{jsx,jsxs:jsx}:name==='react-native'?{useWindowDimensions:()=>({width:viewport}),Platform:{OS:'ios',get isPad(){return isPad;}},View:'View',StyleSheet:{create:x=>x}}:name.includes('/board')?{POSITIONS:[]}:name.includes('app-ui')?{palette:{}}:{}});
const tree=field.DefensiveDiamond({board:{players:[]},positions:{},onPosition(){}});assert.equal(tree.props.style.aspectRatio,420/460);assert.equal(tree.props.onLayout,undefined);assert.equal(tree.props.children[0].props.transition,0);
console.log('PASS: Defense retains a distinct native container across mode changes, is hidden/noninteractive off-mode, and uses one-pass field sizing. Native visual transition still needs device verification.');

mode='defense';
for(const width of [600,744,834,1024,1194,1366]){viewport=width;const actions=find(exports.LineupBoard({board:{players:[{id:'p'}],games:[{id:'g'}],activeGameId:'g'},scroll:{}}),'lineup-actions');assert.equal(actions.props.style.flexDirection,'row');assert.equal(actions.props.children[0].props.style.flex,1);assert.equal(actions.props.children[1].props.style.flex,1);}
viewport=390;assert.equal(find(exports.LineupBoard({board:{players:[{id:'p'}],games:[{id:'g'}],activeGameId:'g'},scroll:{}}),'lineup-actions').props.style.flexDirection,'column');
isPad=false;viewport=834;assert.equal(find(exports.LineupBoard({board:{players:[{id:'p'}],games:[{id:'g'}],activeGameId:'g'},scroll:{}}),'lineup-actions').props.style.flexDirection,'column');
console.log('PASS iPad actions share equal widths at mini/11/13 portrait and landscape widths; phone actions remain stacked.');
