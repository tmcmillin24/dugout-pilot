import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const actions=[];let uploads=0;
const context={resize:value=>actions.push(value),renderAsync:async()=>({saveAsync:async()=>({base64:'aGk='})})};
const storage={upload:async()=>{uploads++;return{error:null};},remove:async()=>({})};
const exports={};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/lib/team-logos.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,atob,Uint8Array,require:name=>name==='expo-image-manipulator'?{ImageManipulator:{manipulate:()=>context},SaveFormat:{PNG:'png'}}:name==='expo-crypto'?{randomUUID:()=> 'new-logo'}:{supabase:{rpc:async()=>({data:null,error:null}),storage:{from:()=>storage}}}});
for(const [width,height,expected]of [[2000,1000,{width:1024}],[1000,2000,{height:1024}],[2000,2000,{width:1024}],[400,200,null]]){
 actions.length=0;await exports.uploadTeamLogo('team',{uri:'file://image',width,height});
 assert.equal(JSON.stringify(actions),JSON.stringify(expected?[expected]:[]));
}
assert.equal(uploads,4);
for(const [width,height]of [[0,10],[10,0],[NaN,10],[10,Infinity]])await assert.rejects(exports.uploadTeamLogo('team',{uri:'file://image',width,height}));
assert.equal(uploads,4);
console.log('PASS: wide, tall, square and small logos upload without crop or aspect distortion; invalid dimensions rejected.');
