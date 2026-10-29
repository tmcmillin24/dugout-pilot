import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const actions=[];let uploads=0;
const context={crop:value=>actions.push({crop:value}),resize:value=>actions.push(value),renderAsync:async()=>({saveAsync:async()=>({base64:'aGk='})})};
const storage={upload:async()=>{uploads++;return{error:null};},remove:async()=>({})};
const exports={};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/lib/team-logos.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,atob,Uint8Array,require:name=>name==='expo-image-manipulator'?{ImageManipulator:{manipulate:()=>context},SaveFormat:{PNG:'png'}}:name==='expo-crypto'?{randomUUID:()=> 'new-logo'}:{supabase:{rpc:async()=>({data:null,error:null}),storage:{from:()=>storage}}}});
for(const [width,height,expected]of [[2000,1000,{width:1024}],[1000,2000,{height:1024}],[2000,2000,{width:1024}],[400,200,null]]){
 actions.length=0;await exports.uploadTeamLogo('team',{uri:'file://image',width,height});
 assert.equal(JSON.stringify(actions),JSON.stringify(expected?[expected]:[]));
}
assert.equal(uploads,4);
actions.length=0;await exports.uploadTeamLogo('team',{uri:'file://image',width:2000,height:1000},{originX:500,originY:100,width:600,height:600});
assert.equal(JSON.stringify(actions),JSON.stringify([{crop:{originX:500,originY:100,width:600,height:600}}]));
assert.equal(uploads,5);
await assert.rejects(exports.uploadTeamLogo('team',{uri:'file://image',width:2000,height:1000},{originX:1900,originY:0,width:600,height:600}));
for(const [width,height]of [[0,10],[10,0],[NaN,10],[10,Infinity]])await assert.rejects(exports.uploadTeamLogo('team',{uri:'file://image',width,height}));
assert.equal(uploads,5);
console.log('PASS: wide, tall, square and small logos upload without crop or aspect distortion; invalid dimensions rejected.');

const geometry={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/lib/logo-crop.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:geometry});
for(const [width,height]of [[2000,1000],[1000,2000],[1024,1024]])for(const zoom of [1,1.1,2,4])for(const x of [-1,0,1])for(const y of [-1,0,1]){const crop=geometry.logoCrop(width,height,{zoom,x,y});assert.ok(crop.originX>=0&&crop.originY>=0);assert.ok(crop.originX+crop.width<=width&&crop.originY+crop.height<=height);assert.equal(crop.width,crop.height);const scale=300/crop.width;assert.equal(-crop.originX*scale+crop.originX*scale,0);assert.ok(Math.abs(crop.width*scale-300)<0.0001);}
assert.equal(geometry.logoCrop(2000,1000,{zoom:1,x:1,y:0}).originX,0);
assert.equal(geometry.logoCrop(2000,1000,{zoom:1,x:-1,y:0}).originX,1000);
console.log('PASS: explicit framing survives upload unchanged; crop bounds and preview/export scale agree across wide, tall and square images.');
