import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const jsx=(type,props)=>({type,props});const state=initial=>[typeof initial==='function'?initial():initial,()=>{}];
const palette=new Proxy({},{get:(_target,key)=>String(key)});const ui={label:{},rowTitle:{},input:{}};
function load(file,extras={}){const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:name=>extras[name]??(name==='react'?{useState:state}:name==='react/jsx-runtime'?{jsx,jsxs:jsx}:name==='react-native'?{View:'View',Text:'Text',Pressable:'Pressable',Platform:{OS:'web'},StyleSheet:{create:x=>x}}:name==='./app-ui'?{palette,ui}:{})});return exports;}
const coaching=load('../src/components/coaching-ui.tsx');const {c}=coaching;
const date=load('../src/components/date-field.tsx',{'./coaching-ui':coaching,'@/lib/coaching/calendar':{dateKey:()=>'',parseCalendarDate:()=>new Date(2026,9,30),monthCells:()=>[],displayDate:()=>''}});
const time=load('../src/components/time-field.tsx',{'./coaching-ui':coaching,'@/lib/coaching/practice-time':{timeParts:()=>({hour:17,minute:0}),timeLabel:()=> '5:00 PM'}});
const choice=coaching.Choice({label:'Duration',value:'90',options:[{value:'90',label:'90 minutes'}],onChange(){}}).props.children[0];
const dateCard=date.DateField({label:'Date',value:'',compact:true,onChange(){}}).props.children[1];
const timeCard=time.TimeField({value:'17:00',onChange(){}}).props.children[0];
assert.equal(dateCard.props.style,c.choice);assert.equal(choice.props.style[0],c.choice);assert.equal(timeCard.props.style,c.choice);
assert.equal(c.choice.minHeight,76);assert.equal(c.choice.padding,14);assert.equal(c.choiceValue.lineHeight,20);
const equipment=coaching.Choice({label:'Nets',value:'0',options:[],onChange(){},fill:true}).props.children[0];assert.equal(equipment.props.style[1].minHeight,c.choice.minHeight);
console.log('PASS: date, duration, time and equipment selectors share card height, padding, surface and value styling.');
