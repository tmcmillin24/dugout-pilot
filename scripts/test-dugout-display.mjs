import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const positions=['LF','CF','RF','SS','2B','3B','P','1B','C'];
let state=[],cursor=0,gesture,dimensions={width:1194,height:834};
const node=(type,props)=>({type,props:props??{}});
const react={useState(initial){const i=cursor++;if(!(i in state))state[i]=initial;return[state[i],value=>{state[i]=typeof value==='function'?value(state[i]):value;}];},useMemo:fn=>fn()};
const native={View:'View',Text:'Text',Pressable:'Pressable',ScrollView:'ScrollView',StyleSheet:{create:v=>v,absoluteFill:{}},useWindowDimensions:()=>dimensions,PanResponder:{create:handlers=>{gesture=handlers;return{panHandlers:{}};}}};
const logic={};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/lib/coaching/batting-display.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:logic});
const exports={};
const source=readFileSync(new URL('../src/components/batting-display.tsx',import.meta.url),'utf8')+'\nexport { Display };';
const mocks={react,'react/jsx-runtime':{jsx:node,jsxs:node,Fragment:'Fragment'},'react-native':native,'expo-image':{Image:'Image'},'expo-keep-awake':{useKeepAwake(){}},'react-native-safe-area-context':{useSafeAreaInsets:()=>({top:24,bottom:20,left:0,right:0})},'./overlay-modal':{OverlayModal:'Modal'},'./app-ui':{Button:'Button',palette:{}},'./coaching-ui':{Sheet:({open,children})=>open?node('Sheet',{children}):null,c:{}},'./sports-type':{DisplayText:'Text'},'./defensive-diamond':{FIELD_POINTS:Object.fromEntries(positions.map(p=>[p,[50,50]]))},'@/lib/coaching/player-display':{formatPlayerName:name=>name??'—'},'@/lib/coaching/batting-display':logic,'@/lib/coaching/board':{POSITIONS:positions}};
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:key=>{if(key.endsWith('.svg'))return'field';assert.ok(key in mocks,key);return mocks[key];}});
function flatten(tree){if(tree==null||typeof tree==='boolean')return[];if(Array.isArray(tree))return tree.flatMap(flatten);if(typeof tree!=='object')return[tree];if(typeof tree.type==='function')return flatten(tree.type(tree.props));return[tree,...flatten(tree.props.children)];}
const board={players:Array.from({length:18},(_,i)=>({id:String(i),name:`Player ${i}`,number:String(i+1)}))};
const game={lineup:['0','1','2'],label:'Game 1',opponent:'Visitors',positions:{P:'0',C:'1'}};
let writes=0;
const props={board,game,writable:true,onClose(){},update:async()=>{writes++;return true;}};
function render(){cursor=0;return flatten(exports.Display(props));}
function text(tree){return tree.filter(n=>typeof n!=='object').join(' ').replace(/\s+/g,' ');}
let tree=render();assert.match(text(tree),/AT BAT/);assert.match(text(tree),/ON DECK/);
assert.equal(gesture.onMoveShouldSetPanResponderCapture(null,{dx:5,dy:80}),false);
assert.equal(gesture.onMoveShouldSetPanResponderCapture(null,{dx:-80,dy:5}),true);
gesture.onPanResponderRelease(null,{dx:-80,dy:5});tree=render();
assert.match(text(tree),/BENCH · 16/);assert.match(text(tree),/Unassigned/);assert.doesNotMatch(text(tree),/BATTER FINISHED/);assert.equal(writes,0);
for(const position of positions)assert.ok(text(tree).includes(position));
gesture.onPanResponderRelease(null,{dx:80,dy:5});tree=render();assert.match(text(tree),/BATTER FINISHED/);
const defenseTab=tree.find(n=>n?.props?.accessibilityRole==='tab'&&text(flatten(n)).includes('DEFENSE'));defenseTab.props.onPress();assert.match(text(render()),/BENCH · 16/);
for(const size of [{width:393,height:852},{width:834,height:1194},{width:1366,height:1024}]){dimensions=size;assert.match(text(render()),/BENCH · 16/);}
state=[];props.game={...game,lineup:[]};assert.match(text(render()),/BENCH · 16/);
let disabled;cursor=0;state=[];exports.BattingDisplay({...props,renderTrigger:(_open,value)=>{disabled=value;return null;}});assert.equal(disabled,false);
assert.equal(writes,0);
console.log('PASS: swipe and tab navigation, vertical-scroll discrimination, read-only defensive field, 18-player bench, phone/iPad orientations and defense without a batting order.');
