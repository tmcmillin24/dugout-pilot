// Read-only: real official-host downloads, using the exact server download code.
// No Gemini key, account session, database writes or model calls are needed.
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';
function load(path){if(path.pathname.endsWith('.json'))return JSON.parse(readFileSync(path,'utf8'));const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,{exports,Request,Response,URL,AbortSignal,Date,JSON,TextEncoder,TextDecoder,setTimeout,crypto:webcrypto,require:name=>load(new URL(name,path))});return exports;}
const {rulebooksFor}=load(new URL('../supabase/functions/rules-assistant/index.ts',import.meta.url));
const {downloadPDF,digest}=load(new URL('../supabase/functions/rules-assistant/documents.ts',import.meta.url));
const contexts=[['baseball','2026'],['baseball','2027'],['fastpitch','2026'],['slowpitch','2026']].map(([sport,season])=>({sport,season,age:'11U',organization:'usssa'}));
const books=[...new Map(contexts.flatMap(rulebooksFor).map(book=>[book.id,book])).values()];
const results=await Promise.allSettled(books.map(async book=>{const bytes=await downloadPDF(fetch,book.sources[0].url);return {id:book.id,bytes:bytes.byteLength,sha256:await digest(bytes)};}));
for(let i=0;i<results.length;i++){const result=results[i];if(result.status==='fulfilled')console.log(JSON.stringify(result.value));else {process.exitCode=1;console.error(JSON.stringify({id:books[i].id,error:result.reason.message}));}}
