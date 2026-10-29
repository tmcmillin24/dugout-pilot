import {readFileSync,writeFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(url){const path=new URL(url,import.meta.url);if(path.pathname.endsWith('.json'))return JSON.parse(readFileSync(path,'utf8'));const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,{exports,require:name=>load(new URL(name.endsWith('.json')?name:`${name}.ts`,path))});return exports;}
const {localReferences}=load('../src/lib/coaching/local-rules.ts');
const context={sport:'baseball',organization:'usssa',age:'',season:''};
const general=localReferences(context);const eleven=localReferences({...context,age:'11U',season:'2026'}).filter(ref=>ref.id.startsWith('usssa-2026-11u-'));const bats={};
for(const season of ['2026','2027'])for(const age of ['11U','12U'])bats[`${season}-${age}`]=localReferences({...context,age,season}).filter(ref=>ref.id.endsWith('-bats'));
writeFileSync(new URL('../supabase/functions/rules-assistant/references.json',import.meta.url),JSON.stringify({general,eleven,bats},null,2)+'\n');
console.log('Generated versioned server reference library from the shared app sources.');
