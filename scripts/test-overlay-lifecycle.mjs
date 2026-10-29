import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
let cursor=0,dirty=false,tree,pending=[],animations=[];const slots=[];
const react={memo:component=>component,useState(initial){const index=cursor++;if(!slots[index])slots[index]={value:typeof initial==='function'?initial():initial};return[slots[index].value,value=>{const next=typeof value==='function'?value(slots[index].value):value;if(next!==slots[index].value){slots[index].value=next;dirty=true;}}];},useEffect(effect,deps){const index=cursor++;const old=slots[index];if(!old||deps.some((value,i)=>value!==old.deps[i]))pending.push(()=>{old?.cleanup?.();slots[index]={deps,cleanup:effect()};});}};
const rn={AccessibilityInfo:{isReduceMotionEnabled:async()=>false,addEventListener:()=>({remove(){}})},Animated:{Value:class{setValue(value){this.value=value;}},View:'AnimatedView',timing(value,config){assert.equal(tree.props.visible,true,'Never start an animation without a visible modal');const animation={config,start(callback){this.callback=callback;animations.push(this);},stop(){this.stopped=true;this.callback?.({finished:false});}};return animation;}},Easing:{out:x=>x,in:x=>x,cubic:'cubic',quad:'quad'},Modal:'Modal',StyleSheet:{create:x=>x}};
const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/components/overlay-modal.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:name=>name==='react'?react:name==='react-native'?rn:{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})}});
async function render(open){let loops=0;do{dirty=false;cursor=0;pending=[];tree=exports.OverlayModal({open,onClose(){},children:'content'});pending.forEach(effect=>effect());await Promise.resolve();assert.ok(++loops<10);}while(dirty);}
await render(false);assert.equal(animations.length,0);
await render(true);assert.equal(animations.length,1);assert.equal(animations[0].config.toValue,1);
await render(false);assert.equal(animations.length,2);assert.equal(tree.props.visible,true);assert.equal(animations[1].config.toValue,0);
animations[1].callback({finished:true});await render(false);assert.equal(tree.props.visible,false);assert.equal(animations.length,2,'Closing must not start another animation after hiding');
await render(true);assert.equal(animations.length,3);await render(false);const leaving=animations.at(-1);await render(true);assert.equal(leaving.stopped,true);assert.equal(tree.props.visible,true);
slots.forEach(slot=>slot?.cleanup?.());assert.equal(animations.at(-1).stopped,true);
console.log('PASS: hidden sheets never animate; mount-before-entry, retained exit view, close completion, rapid reopen and unmount cleanup. Native event delivery is not simulated.');
