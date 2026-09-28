#!/usr/bin/env node
/** Stage 31 — Cognitive Retrieval & Context Assembly Runtime. */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
const ROOT=process.cwd();
const MEMORY_ROOT=join(ROOT,'04-revenue-system/07-intelligence/cognitive-memory');
const TYPES=['episodes','beliefs','decisions','lessons','procedures'];
function fail(m){console.error('COGNITIVE-CONTEXT: ERROR '+m);process.exitCode=1;}
function load(kind){const f=join(MEMORY_ROOT,kind+'.jsonl');if(!existsSync(f))return [];return readFileSync(f,'utf8').split('\n').filter(Boolean).map(JSON.parse);}
function tokenize(v){return String(v??'').toLowerCase().split(/[^a-z0-9ก-๙]+/i).filter(x=>x.length>1);}
function score(record,tokens){const text=JSON.stringify(record).toLowerCase();return tokens.filter(t=>text.includes(t)).length/(tokens.length||1);}
function assemble(query,limit){const tokens=[...new Set(tokenize(query))];const all=TYPES.flatMap(type=>load(type).map(record=>({memory_type:type,record,score:score(record,tokens)})));const matches=all.filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,limit);const context=Object.fromEntries(TYPES.map(t=>[t,matches.filter(x=>x.memory_type===t).map(x=>x.record)]));return {runtime:'cognitive-context-runtime-v1',stage:31,query,retrieval:{algorithm:'token-overlap',limit,matched:matches.length},context,provenance:matches.map(x=>({memory_type:x.memory_type,id:x.record.id,score:Math.round(x.score*100)/100})),authority:{retrieval:true,context_assembly:true,belief_update:false,decision_authority:false,mission_creation:false}};}
function run(query,limit=5,writePath=''){if(!String(query).trim())throw new Error('query is required');const out=assemble(query,Math.max(1,Math.min(25,Number(limit)||5)));if(writePath){mkdirSync(dirname(join(ROOT,writePath)),{recursive:true});writeFileSync(join(ROOT,writePath),JSON.stringify(out,null,2)+'\n');}console.log(JSON.stringify(out,null,2));}
const [command,...args]=process.argv.slice(2);
try{if(command==='status')console.log(JSON.stringify({runtime:'cognitive-context-runtime-v1',stage:31,status:'READY',sources:TYPES,authority:{retrieval:true,context_assembly:true,belief_update:false,decision_authority:false,mission_creation:false}},null,2));else if(command==='retrieve')run(args.join(' '));else if(command==='assemble'){const write=args.find(x=>x.startsWith('--write='))?.slice(8)||'';run(args[0],args[1]||5,write);}else throw new Error('usage: cognitive-context-runtime.mjs status|retrieve <query>|assemble <query> [limit] [--write=path]');}catch(e){fail(e instanceof Error?e.message:String(e));}
