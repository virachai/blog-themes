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

const CONTEXT_TYPES=['episodes','beliefs','decisions','lessons','procedures'];
function readOptional(name){const f=join(MEMORY_ROOT,name+'.jsonl');if(!existsSync(f))return [];return readFileSync(f,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);}
function contextRun(query,limit=5){const q=String(query||'').toLowerCase().trim();if(!q)throw new Error('query is required');const tokens=[...new Set(q.split(/[^a-z0-9ก-๙]+/i).filter(x=>x.length>1))];const rows=CONTEXT_TYPES.flatMap(type=>read(type).map(record=>({memory_type:type,record,score:tokens.filter(t=>JSON.stringify(record).toLowerCase().includes(t)).length/(tokens.length||1)}))).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,Math.max(1,Math.min(25,Number(limit)||5)));console.log(JSON.stringify({runtime:'cognitive-memory-runtime-v2',stage:31,query:q,retrieval:{algorithm:'token-overlap',limit,matched:rows.length},context:Object.fromEntries(CONTEXT_TYPES.map(t=>[t,rows.filter(x=>x.memory_type===t).map(x=>x.record)])),provenance:rows.map(x=>({memory_type:x.memory_type,id:x.record.id,score:Math.round(x.score*100)/100})),authority:{retrieval:true,context_assembly:true,belief_update:false,decision_authority:false}},null,2));}
function graphBuild(){const types=[...CONTEXT_TYPES,'evaluations'],rows=Object.fromEntries(types.map(t=>[t,t==='evaluations'?readOptional(t):read(t)])),nodes=types.flatMap(type=>rows[type].map(r=>({id:type+':'+r.id,type,source_id:r.id,claim:r.claim??r.event??r.decision??r.trigger??''}))),ids=new Set(nodes.map(n=>n.id)),edges=[];const edge=(a,b,r)=>{if(ids.has(a)&&ids.has(b)&&a!==b)edges.push({from:a,to:b,relation:r})};for(const r of rows.evaluations)edge('evaluations:'+r.id,'beliefs:'+r.belief_id,'evaluates');for(const r of rows.decisions)for(const k of ['belief_id','episode_id','lesson_id','procedure_id'])if(r[k])edge('decisions:'+r.id,k.replace('_id','s')+':'+r[k],k.replace('_id',''));for(const r of rows.lessons)for(const k of ['episode_id','belief_id','procedure_id'])if(r[k])edge('lessons:'+r.id,k.replace('_id','s')+':'+r[k],k.replace('_id',''));return {runtime:'cognitive-memory-runtime-v2',stage:33,nodes,edges,stats:{nodes:nodes.length,edges:edges.length},authority:{graph_build:true,belief_update:false,decision_authority:false}};}
function graphRun(args){const g=graphBuild();if(args[0]==='build'){writeFileSync(join(MEMORY_ROOT,'knowledge-graph.json'),JSON.stringify(g,null,2)+'\n');console.log(JSON.stringify(g,null,2));return;}const q=String(args.slice(1).join(' ')||args[0]||'').toLowerCase();console.log(JSON.stringify({...g,query:q,nodes:g.nodes.filter(n=>JSON.stringify(n).toLowerCase().includes(q)),edges:g.edges.filter(e=>JSON.stringify(e).toLowerCase().includes(q))},null,2));}
function conflictDetect(){const types=['beliefs','lessons','procedures'],items=types.flatMap(type=>read(type).map(data=>({type,id:data.id,data}))),text=r=>String(r.claim??r.trigger??r.failure??r.correction??r.steps??'').toLowerCase(),tokens=r=>[...new Set(text(r).split(/[^a-z0-9ก-๙]+/i).filter(x=>x.length>2))],found=[];for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){const a=tokens(items[i].data),b=new Set(tokens(items[j].data)),o=a.length?a.filter(x=>b.has(x)).length/Math.max(a.length,tokens(items[j].data).length):0;if(o>=.45&&/not|never|avoid|false|fail|failed|reject|contradict|ห้าม|ไม่/.test(text(items[i].data)+' '+text(items[j].data)))found.push({left:{type:items[i].type,id:items[i].id},right:{type:items[j].type,id:items[j].id},similarity:Math.round(o*100)/100,status:'CONTRADICTION_CANDIDATE'});}return found;}
function conflictRun(command){const rows=conflictDetect();if(command==='propose'){const f=join(MEMORY_ROOT,'contradictions.jsonl');mkdirSync(MEMORY_ROOT,{recursive:true});for(const r of rows)appendFileSync(f,JSON.stringify({id:'CONFLICT-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),created_at:new Date().toISOString(),...r,authority:false,status:'PROPOSED'})+'\n');}console.log(JSON.stringify({runtime:'cognitive-memory-runtime-v2',stage:34,status:command==='propose'?'RESOLUTION_PROPOSALS_CREATED':'REVIEW',count:rows.length,contradictions:rows,authority:{detection:true,resolution_proposal:command==='propose',belief_update:false}},null,2));}
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
 console.log(JSON.stringify({runtime:'cognitive-memory-runtime-v2',query:q,count:hits.length,memories:hits},null,2));
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
 console.log(JSON.stringify({runtime:'cognitive-memory-runtime-v2',status:'LESSON_PROPOSED',lesson_id:lesson.id,evidence_count:evidence.length,authority:false},null,2));
}
function status(){
 ensure();
 const counts=Object.fromEntries(Object.entries(FILES).map(([k,v])=>[k,readFileSync(v,'utf8').split('\n').filter(Boolean).length]));
 console.log(JSON.stringify({runtime:'cognitive-memory-runtime-v2',stage:30,status:'READY',memory_root:MEMORY_ROOT.replace(ROOT+'/',''),counts,authority:{memory_write:true,belief_update:false,decision_authority:false,mission_creation:false}},null,2));
}
const args=process.argv.slice(2); const command=args.shift();
try{
 if(command==='init'){ ensure(); console.log('COGNITIVE-MEMORY: INITIALIZED'); console.log('ROOT: '+MEMORY_ROOT.replace(ROOT+'/','')); }
 else if(command==='status'){ status(); }
 else if(command==='remember'){
   const [kind,json]=args; if(!FILES[kind]) throw new Error('kind must be episodes|beliefs|decisions|lessons|procedures'); if(!json) throw new Error('usage: remember <kind> <json>');
   const item=remember(kind,parseJson(json,'payload')); console.log(JSON.stringify({runtime:'cognitive-memory-runtime-v2',status:'RECORDED',memory_type:kind,item},null,2));
 } else if(command==='recall'){ recall(args.join(' ')); }
 else if(command==='learn'){ learn(args.join(' ')); }
 else if(command==='retrieve'){ contextRun(args.join(' ')); }
 else if(command==='assemble'){ contextRun(args[0],args[1]||5); }
 else if(command==='graph'){ graphRun(args); }
 else if(command==='conflict'){ if(['detect','review','propose'].includes(args[0])) conflictRun(args[0]); else throw new Error('usage: conflict detect|review|propose'); }
 else throw new Error('usage: cognitive-memory-runtime.mjs init|status|remember|recall|learn|retrieve|assemble|graph|conflict');
}catch(e){ fail(e instanceof Error?e.message:String(e)); }
