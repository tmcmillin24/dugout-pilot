import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import ts from 'typescript';
const jsx=(type,props)=>({type,props});
const source=readFileSync(new URL('../src/components/app-status-bar.tsx',import.meta.url),'utf8');
for(const OS of ['ios','android','web']){
 const exports={};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:name=>name==='react-native'?{Platform:{OS}}:name==='expo-status-bar'?{StatusBar:'ExpoStatusBar'}:{jsx,jsxs:jsx}});
 const tree=exports.AppStatusBar();if(OS==='ios')assert.equal(tree,null,'iOS must not mount the UIApplication-based override');else{assert.equal(tree.type,'ExpoStatusBar');assert.equal(tree.props.style,'dark');}
}
const json=process.argv[2]?readFileSync(process.argv[2],'utf8'):execFileSync(process.execPath,['node_modules/expo/bin/cli','config','--type','introspect','--json'],{encoding:'utf8',maxBuffer:10*1024*1024});
const config=JSON.parse(json);const plist=config._internal.modResults.ios.infoPlist;
assert.equal(plist.UIViewControllerBasedStatusBarAppearance,true,'Generated native project must use view-controller status bars');assert.equal(plist.UIStatusBarStyle,'UIStatusBarStyleDarkContent');
assert.ok(plist.UISupportedInterfaceOrientations.includes('UIInterfaceOrientationPortrait'));
console.log('PASS: iOS has no global JS status-bar override; Android/web retain it; generated Info.plist opts into controller-based appearance. Native tab-switch warnings still need a rebuilt-device check.');
