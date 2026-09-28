#!/usr/bin/env node
/** Stage 33 — Cognitive Consolidation & Knowledge Graph Runtime. */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const ROOT=process.cwd(), MEMORY_ROOT=join(ROOT,'04-revenue-system/07-intelligence/cognitive-memory');
const TYPES=['episodes','beliefs','decisions','lessons','procedures','evaluations'];
const GRAPH=join(MEMORY_ROOT,'knowledge-graph.json');
function fail(m){console.error('COGNITIVE-GRAPH: ERROR '+m);process.exitCode=1;}
function load(type){const f=join(MEMORY_ROOT,type+'.jsonl');if(!existsSync(f))return [];return readFileSync(f,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);}
function node(type,r){return {id:type+':'+r.id,type,source_id:r.id,claim:r.claim??r.event??r.decision??r.trigger??''};}
function addEdge(edges,from,to,relation){if(from&&to&&from!==to)edges.push({from,to,relation});}
function build(){const rows=Object.fromEntries(TYPES.map(t=>[t,load(t)]));const nodes=TYPES.flatMap(t=>rows[t].map(r=>node(t,r)));const ids=new Set(nodes.map(n=>n.type+':'+n.source_id));const edges=[];
 for(const r of rows.evaluations){const e='evaluations:'+r.id,b='beliefs:'+r.belief_id;if(ids.has(e)&&ids.has(b))addEdge(edges,e,b,'evaluates');}
 for(const r of rows.decisions){const d='decisions:'+r.id;for(const k of ['belief_id','episode_id','lesson_id','procedure_id']){const t=k.replace('_id','s'),target=t+':'+r[k];if(r[k]&&ids.has(d)&&ids.has(target))addEdge(edges,d,target,k.replace('_id',''));}}
 for(const r of rows.lessons){const l='lessons:'+r.id;for(const k of ['episode_id','belief_id','procedure_id']){const t=k.replace('_id','s'),target=t+':'+r[k];if(r[k]&&ids.has(l)&&ids.has(target))addEdge(edges,l,target,k.replace('_id',''));}}
 for(const r of rows.procedures){const p='procedures:'+r.id;if(r.lesson_id&&ids.has(p)&&ids.has('lessons:'+r.lesson_id))addEdge(edges,p,'lessons:'+r.lesson_id,'derived_from');}
 return {runtime:'cognitive-graph-runtime-v1',stage:33,nodes,edges,stats:{nodes:nodes.length,edges:edges.length,by_type:Object.fromEntries(TYPES.map(t=>[t,rows[t].length]))},authority:{consolidation:true,graph_build:true,belief_update:false,decision_authority:false,mission_creation:false}};
}
function run(write){const out=build();if(write){mkdirSync(join(ROOT,write,'..'),{recursive:true});writeFileSync(join(ROOT,write),JSON.stringify(out,null,2)+'\n');}console.log(JSON.stringify(out,null,2));}
const [cmd,...a]=process.argv.slice(2);
try{if(cmd==='status')console.log(JSON.stringify({runtime:'cognitive-graph-runtime-v1',stage:33,status:'READY',sources:TYPES,authority:{consolidation:true,graph_build:true,belief_update:false,decision_authority:false,mission_creation:false}},null,2));else if(cmd==='build')run('04-revenue-system/07-intelligence/cognitive-memory/knowledge-graph.json');else if(cmd==='query'){const q=String(a.join(' ')).toLowerCase();const g=build();console.log(JSON.stringify({runtime:g.runtime,query:q,nodes:g.nodes.filter(n=>JSON.stringify(n).toLowerCase().includes(q)),edges:g.edges.filter(e=>JSON.stringify(e).toLowerCase().includes(q)),authority:g.authority},null,2));}else throw new Error('usage: cognitive-graph-runtime.mjs status|build|query <term>');}catch(e){fail(e instanceof Error?e.message:String(e));}
