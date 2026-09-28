#!/usr/bin/env node
/** Stage 32 — Cognitive Evaluation & Belief Update Runtime. */
import { existsSync, readFileSync, appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const ROOT=process.cwd(), MEMORY_ROOT=join(ROOT,'04-revenue-system/07-intelligence/cognitive-memory');
const BELIEFS=join(MEMORY_ROOT,'beliefs.jsonl'), EVALS=join(MEMORY_ROOT,'evaluations.jsonl');
function fail(m){console.error('COGNITIVE-EVAL: ERROR '+m);process.exitCode=1;}
function ensure(){mkdirSync(MEMORY_ROOT,{recursive:true});for(const f of [BELIEFS,EVALS])if(!existsSync(f))writeFileSync(f,'');}
function read(f){ensure();return readFileSync(f,'utf8').split('\\n').filter(Boolean).map(JSON.parse);}
function append(f,r,p){const x={id:p+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),created_at:new Date().toISOString(),...r};appendFileSync(f,JSON.stringify(x)+'\\n');return x;}
function clamp(v){return Math.max(0,Math.min(1,v));}
function evaluate(id,observed){
 const b=read(BELIEFS).find(x=>x.id===id);if(!b)throw new Error('belief not found: '+id);
 const prior=Number(b.confidence);if(!Number.isFinite(prior))throw new Error('belief confidence invalid');
 const o=String(observed).toLowerCase(), pos=['supported','confirmed','success','true','yes'].includes(o), neg=['contradicted','failed','false','no','rejected'].includes(o);
 if(!pos&&!neg)throw new Error('observed must be supported|confirmed|success|true|yes|contradicted|failed|false|no|rejected');
 const delta=pos?0.10:-0.10, proposed=clamp(prior+delta);
 const e=append(EVALS,{belief_id:id,claim:b.claim,prior_confidence:prior,observed:o,confidence_delta:delta,proposed_confidence:proposed,evidence_status:pos?'SUPPORTING':'CONTRADICTING',authority:false,status:'PROPOSED'},'EVAL');
 console.log(JSON.stringify({runtime:'cognitive-evaluation-runtime-v1',status:'BELIEF_UPDATE_PROPOSED',evaluation:e,rule:'fixed bounded confidence adjustment',authority:{evaluation:true,belief_update:false,operational_rule_update:false}},null,2));
}
function review(id){const rows=read(EVALS).filter(x=>!id||x.belief_id===id);console.log(JSON.stringify({runtime:'cognitive-evaluation-runtime-v1',status:'REVIEW',count:rows.length,evaluations:rows,authority:{belief_update:false,operational_rule_update:false}},null,2));}
function status(){ensure();console.log(JSON.stringify({runtime:'cognitive-evaluation-runtime-v1',stage:32,status:'READY',beliefs:read(BELIEFS).length,evaluations:read(EVALS).length,authority:{evaluation:true,belief_update:false,operational_rule_update:false}},null,2));}
const [cmd,...a]=process.argv.slice(2);
try{if(cmd==='init'||cmd==='status'){if(cmd==='init')ensure();status();}else if(cmd==='evaluate'){if(!a[0]||!a[1])throw new Error('usage: evaluate <belief_id> <observed>');evaluate(a[0],a[1]);}else if(cmd==='review')review(a[0]);else throw new Error('usage: cognitive-evaluation-runtime.mjs init|status|evaluate <belief_id> <observed>|review [belief_id]');}catch(e){fail(e instanceof Error?e.message:String(e));}
