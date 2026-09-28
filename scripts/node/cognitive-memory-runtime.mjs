#!/usr/bin/env node
/** Stage 30 — Cognitive Memory & Learning Runtime. Durable memory, beliefs, decisions, lessons, and learning loop. */
import { existsSync, mkdirSync, readFileSync, appendFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const MEMORY_ROOT = join(ROOT, '04-revenue-system/07-intelligence/cognitive-memory');
const FILES = {
  episodes: join(MEMORY_ROOT, 'episodes.jsonl'),
  beliefs: join(MEMORY_ROOT, 'beliefs.jsonl'),
  decisions: join(MEMORY_ROOT, 'decisions.jsonl'),
  lessons: join(MEMORY_ROOT, 'lessons.jsonl'),
  procedures: join(MEMORY_ROOT, 'procedures.jsonl')
};

function fail(message){ console.error('COGNITIVE-MEMORY: ERROR '+message); process.exitCode=1; }
function ensure(){ mkdirSync(MEMORY_ROOT,{recursive:true}); for(const file of Object.values(FILES)) if(!existsSync(file)) writeFileSync(file,''); }
function required(v){ return v !== undefined && v !== null && String(v).trim() !== ''; }
function parseJson(value,label){ try{return JSON.parse(value);}catch{throw new Error(label+' must be valid JSON');} }
function append(kind, record){ ensure(); const item={id:kind.toUpperCase()+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,7), created_at:new Date().toISOString(), ...record}; appendFileSync(FILES[kind],JSON.stringify(item)+'\n'); return item; }
function read(kind){ ensure(); return readFileSync(FILES[kind],'utf8').split('\n').filter(Boolean).map(JSON.parse); }
function remember(kind,payload){
 const requiredBy={
  episodes:['event','outcome'],
  beliefs:['claim','confidence'],
  decisions:['decision','reason','expected_outcome'],
  lessons:['trigger','failure','correction'],
  procedures:['trigger','steps']
 }[kind];
 for(const key of requiredBy) if(!required(payload[key])) throw new Error(kind+' requires '+key);
 if(kind==='beliefs'){
  const c=Number(payload.confidence);
  if(!Number.isFinite(c)||c<0||c>1) throw new Error('belief confidence must be between 0 and 1');
 }
 return append(kind,payload);
}
function recall(query){
 const q=String(query||'').toLowerCase();
 const rows=Object.entries(FILES).flatMap(([kind])=>read(kind).map(x=>({...x,memory_type:kind})));
 const hits=rows.filter(x=>JSON.stringify(x).toLowerCase().includes(q)).slice(-25);
 console.log(JSON.stringify({runtime:'cognitive-memory-runtime-v1',query:q,count:hits.length,memories:hits},null,2));
}
function learn(input){
 const evidence=read('episodes').filter(x=>!input || JSON.stringify(x).toLowerCase().includes(String(input).toLowerCase()));
 if(!evidence.length) throw new Error('no matching episodes found');
 const lesson=append('lessons',{
  trigger:'derived from '+evidence.length+' episode(s)',
  failure:'',
  correction:'',
  evidence_ids:evidence.map(x=>x.id),
  scope:'explicitly limited to matching episodes',
  confidence:'requires human/editorial review',
  authority:false,
  status:'PROPOSED'
 });
 console.log(JSON.stringify({runtime:'cognitive-memory-runtime-v1',status:'LESSON_PROPOSED',lesson_id:lesson.id,evidence_count:evidence.length,authority:false},null,2));
}
function status(){
 ensure();
 const counts=Object.fromEntries(Object.entries(FILES).map(([k,v])=>[k,readFileSync(v,'utf8').split('\n').filter(Boolean).length]));
 console.log(JSON.stringify({runtime:'cognitive-memory-runtime-v1',stage:30,status:'READY',memory_root:MEMORY_ROOT.replace(ROOT+'/',''),counts,authority:{memory_write:true,belief_update:false,decision_authority:false,mission_creation:false}},null,2));
}
const args=process.argv.slice(2); const command=args.shift();
try{
 if(command==='init'){ ensure(); console.log('COGNITIVE-MEMORY: INITIALIZED'); console.log('ROOT: '+MEMORY_ROOT.replace(ROOT+'/','')); }
 else if(command==='status'){ status(); }
 else if(command==='remember'){
   const [kind,json]=args; if(!FILES[kind]) throw new Error('kind must be episodes|beliefs|decisions|lessons|procedures'); if(!json) throw new Error('usage: remember <kind> <json>');
   const item=remember(kind,parseJson(json,'payload')); console.log(JSON.stringify({runtime:'cognitive-memory-runtime-v1',status:'RECORDED',memory_type:kind,item},null,2));
 } else if(command==='recall'){ recall(args.join(' ')); }
 else if(command==='learn'){ learn(args.join(' ')); }
 else throw new Error('usage: cognitive-memory-runtime.mjs init|status|remember|recall|learn');
}catch(e){ fail(e instanceof Error?e.message:String(e)); }
