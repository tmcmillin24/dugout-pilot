import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports={};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/lib/coaching/batting-display.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports});
const {nextBatterIndex}=exports;
assert.equal(nextBatterIndex([]),-1);
assert.equal(nextBatterIndex(['a']),0);
assert.equal(nextBatterIndex(['a'],'a'),0);
assert.equal(nextBatterIndex(['a','b','c']),0);
assert.equal(nextBatterIndex(['a','b','c'],'b'),2);
assert.equal(nextBatterIndex(['a','b','c'],'c'),0);
assert.equal(nextBatterIndex(['a','c'],'removed'),0);
assert.equal(nextBatterIndex(['c','b','a'],'b'),2,'Reordering preserves the last batter by ID, not their old position');
const lineup=Array.from({length:18},(_,i)=>String(i));let last;
for(let turn=0;turn<54;turn++){const index=nextBatterIndex(lineup,last);assert.equal(index,turn%18);last=lineup[index];}
console.log('PASS: empty, one-player, reset, removed last batter, reordered lineup and three full 18-player rotations.');
