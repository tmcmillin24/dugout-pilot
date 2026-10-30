import assert from 'node:assert/strict';
import {drillLibrary} from '../src/lib/coaching/drill-library.js';
import {drillExamples} from '../src/lib/coaching/drill-examples.js';
import {drillGuide} from '../src/lib/coaching/drill-guide.js';
assert.equal(Object.keys(drillExamples).length,120);assert.equal(new Set(Object.values(drillExamples)).size,120);
for(const drill of drillLibrary){const guide=drillGuide(drill.id);assert.ok(guide);assert.equal(guide.name,drill.name);assert.ok(guide.example.length>80);assert.ok(guide.steps.length>=1);assert.equal(guide.cue,drill.cue);assert.ok(guide.setup.length>50);assert.ok(guide.equipment.length);assert.equal(drillGuide(undefined,drill.name).id,drill.id);}
assert.equal(drillGuide('custom','Unknown old practice'),null);assert.match(drillGuide('hitting-14').example,/without a bat|bat outside|nobody swings/i);assert.match(drillGuide('catching-01').safety,/complete.*catcher protection/i);assert.match(drillGuide('infield-02').example,/out front/);assert.match(drillGuide('team-03').example,/walk|mandatory/);assert.match(drillGuide('running-06').example,/division|illegal/);
console.log('PASS: all 120 drills have unique concrete examples, steps, setup, equipment and original cues; legacy-name lookup, unknown-block fallback and drill-specific activity constraints.');

for(const kind of ['warmup','intro','team','wrap']){const guide=drillGuide(undefined,undefined,kind);assert.ok(guide.steps.length>=3);assert.ok(guide.example.length>80);assert.equal(drillGuide(undefined,guide.name).name,guide.name);}
console.log('PASS: all standard session blocks resolve by kind and saved title.');
