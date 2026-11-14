import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const config=JSON.parse(readFileSync(new URL('../app.json',import.meta.url),'utf8')).expo;
const splash=config.plugins.find(plugin=>Array.isArray(plugin)&&plugin[0]==='expo-splash-screen')[1];
const jsx=(type,props)=>({type,props});
const sizes=JSON.parse(readFileSync(new URL('../config/launch-layout.json',import.meta.url),'utf8'));
const geometry={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/lib/launch-layout.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,{exports:geometry,require:()=>sizes});
const fixtures=[[393,852,false,300],[744,1133,true,483.6],[834,1194,true,542.1],[1032,1376,true,640],[507,1032,true,300],[852,393,false,300]];
for(const [width,height,isPad,expected]of fixtures){
 const brand={};
 vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/components/brand-loading.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports:brand,require:name=>name==='react-native'?{Platform:{OS:'ios',isPad},useWindowDimensions:()=>({width,height}),View:'View',StyleSheet:{create:x=>x}}:name==='react/jsx-runtime'?{jsx,jsxs:jsx}:name==='expo-image'?{Image:'Image'}:name.includes('launch-layout')?geometry:name});
 const tree=brand.BrandLoading();const actual=tree.props.children.props.style[1].width;
 assert.ok(Math.abs(actual-expected)<.001);
 assert.equal(actual,geometry.launchLogoWidth(height,width,isPad),'Rotation keeps the logo size');
 assert.equal(tree.props.style.backgroundColor,splash.backgroundColor);
}
assert.ok(splash.imageWidth>=sizes.tabletMaxWidth,'Native assets must be rendered at tablet resolution');
let loading=true,hides=0;const exports={};const effect=fn=>fn();
const source=readFileSync(new URL('../src/app/_layout.tsx',import.meta.url),'utf8').replace('function AuthGate()', 'export function AuthGate()');
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:name=>{
 if(name==='react')return{useEffect:effect};
 if(name==='react/jsx-runtime')return{jsx,jsxs:jsx};
 if(name==='expo-splash-screen')return{preventAutoHideAsync:async()=>{},hideAsync:async()=>{hides++;}};
 if(name.includes('auth-provider'))return{useAuth:()=>({session:null,loading,error:'',retry(){}})};
 if(name.includes('/lib/supabase'))return{supabaseConfigured:true};
 return{};
}});
exports.AuthGate();assert.equal(hides,0,'Do not expose the intermediate loader before auth restoration finishes');
loading=false;exports.AuthGate();assert.equal(hides,1,'Release splash for a ready signed-out screen');
console.log('PASS: phone/mini/11/13 launch sizing, rotation, asset resolution and auth-ready handoff.');

// Exercise the real SDK storyboard transform, then the project's config plugin.
const {createRequire}=await import('node:module');const require=createRequire(import.meta.url);const path=await import('node:path');
const pluginRoot=path.dirname(require.resolve('expo-splash-screen/package.json'));
const {getTemplateAsync}=require(path.join(pluginRoot,'plugin/build/withIosSplashScreenStoryboard.js'));
const {applySplashScreenStoryboard}=require(path.join(pluginRoot,'plugin/build/withIosSplashScreenStoryboardImage.js'));
const {applyResponsiveLaunch}=require('../plugins/with-responsive-launch.js');
const document=applyResponsiveLaunch(applySplashScreenStoryboard(await getTemplateAsync(),{image:splash.image,imageWidth:splash.imageWidth,backgroundColor:splash.backgroundColor,resizeMode:splash.resizeMode}));
const before=JSON.stringify(document);applyResponsiveLaunch(document);assert.equal(JSON.stringify(document),before,'Plugin is idempotent');
const view=document.document.scenes[0].scene[0].objects[0].viewController[0].view[0];
const constraints=view.constraints[0].constraint.map(item=>item.$);
const phone=constraints.find(item=>item.id==='DP-Launch-Phone');assert.equal(Number(phone.constant),sizes.phoneWidth);
const cap=constraints.find(item=>item.id==='DP-Launch-TabletCap');assert.equal(Number(cap.constant),sizes.tabletMaxWidth);
const bounds=constraints.filter(item=>item.multiplier);assert.equal(bounds.length,2);assert.ok(bounds.every(item=>item.relation==='lessThanOrEqual'&&Number(item.multiplier)===sizes.tabletFraction));
for(const [width,height,isPad,expected]of fixtures){const native=isPad&&Math.min(width,height)>=600?Math.min(Number(cap.constant),...bounds.map(item=>Number(item.multiplier)*(item.secondAttribute==='width'?width:height))):Number(phone.constant);assert.ok(Math.abs(native-expected)<.001);}
const regular=view.variation.find(item=>item.$.key==='heightClass=regular-widthClass=regular').mask[0];assert.equal(regular.exclude[0].$.reference,phone.id);assert.equal(regular.include.length,4);
console.log('PASS: SDK-generated storyboard constraints match React sizing and regular-size-class activation; Xcode/device validation is still required.');
