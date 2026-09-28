#!/usr/bin/env node
/** Stage 34 — Cognitive Contradiction & Resolution Runtime. */
import { existsSync, readFileSync, appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const ROOT=process.cwd(), MEMORY_ROOT=join(ROOT,'04-revenue-system/07-intelligence/cognitive-memory');
const TYPES=['beliefs','lessons','procedures'];
const CONFLICTS=join(MEMORY_ROOT,'contradictions.jsonl');
function fail(m){console.error('COGNITIVE-CONFLICT: ERROR '+m);process.exitCode=1;}
function load(t){const f=join(MEMORY_ROOT,t+'.jsonl');if(!existsSync(f))return [];return readFileSync(f,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);}
function text(r){return String(r.claim??r.trigger??r.failure??r.correction??r.steps??'').toLowerCase();}
function tokens(r){return [...new Set(text(r).split(/[^a-z0-9ก-๙]+/i).filter(x=>x.length>2))];}
function overlap(a,b){const A=tokens(a),B=new Set(tokens(b));return A.length?A.filter(x=>B.has(x)).length/Math.max(A.length,tokens(b).length):0;}
function opposite(a,b){const s=(text(a)+' '+text(b));return /not|never|avoid|false|fail|failed|reject|contradict|ห้าม|ไม่/.test(s);}
function detect(){const rows=Object.fromEntries(TYPES.map(t=>[t,load(t)])),items=TYPES.flatMap(t=>rows[t].map(r=>({type:t,id:r.id,data:r}))),found=[];
 for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){const a=items[i],b=items[j];const o=overlap(a.data,b.data);if(o>=0.45&&opposite(a.data,b.data))found.push({left:{type:a.type,id:a.id},right:{type:b.type,id:b.id},similarity:Math.round(o*100)/100,status:'CONTRADICTION_CANDIDATE'});}
 return found;}
function review(){const c=detect();console.log(JSON.stringify({runtime:'cognitive-conflict-runtime-v1',stage:34,status:'REVIEW',count:c.length,contradictions:c,authority:{detection:true,resolution_proposal:true,belief_update:false,procedure_update:false,decision_authority:false}},null,2));}
function save(){mkdirSync(MEMORY_ROOT,{recursive:true});const rows=detect();for(const r of rows)appendFileSync(CONFLICTS,JSON.stringify({id:'CONFLICT-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),created_at:new Date().toISOString(),...r,authority:false,status:'PROPOSED'})+'\n');console.log(JSON.stringify({runtime:'cognitive-conflict-runtime-v1',status:'RESOLUTION_PROPOSALS_CREATED',count:rows.length,authority:{resolution_proposal:true,belief_update:false,procedure_update:false}},null,2));}
const [cmd]=process.argv.slice(2);
try{if(cmd==='status')console.log(JSON.stringify({runtime:'cognitive-conflict-runtime-v1',stage:34,status:'READY',sources:TYPES,authority:{detection:true,resolution_proposal:true,belief_update:false,procedure_update:false,decision_authority:false}},null,2));else if(cmd==='detect'||cmd==='review')review();else if(cmd==='propose')save();else throw new Error('usage: cognitive-conflict-runtime.mjs status|detect|review|propose');}catch(e){fail(e instanceof Error?e.message:String(e));}
