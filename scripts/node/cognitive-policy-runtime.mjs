#!/usr/bin/env node
/** Stage 35 — Cognitive Decision Policy Runtime. */
import { existsSync, readFileSync, appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const ROOT=process.cwd(), MEMORY_ROOT=join(ROOT,'04-revenue-system/07-intelligence/cognitive-memory');
const POLICIES=join(MEMORY_ROOT,'policies.jsonl');
function fail(m){console.error('COGNITIVE-POLICY: ERROR '+m);process.exitCode=1;}
function ensure(){mkdirSync(MEMORY_ROOT,{recursive:true});if(!existsSync(POLICIES))writeFileSync(POLICIES,'');}
function read(){ensure();return readFileSync(POLICIES,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);}
function append(r){const x={id:'POLICY-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),created_at:new Date().toISOString(),status:'PROPOSED',authority:false,...r};appendFileSync(POLICIES,JSON.stringify(x)+'\n');return x;}
function propose(args){
 const [name,scope,condition,action,confidence,source='reviewed-memory']=args;
 if(!name||!scope||!condition||!action||confidence===undefined)throw new Error('usage: propose <name> <scope> <condition> <action> <confidence> [source]');
 const c=Number(confidence);if(!Number.isFinite(c)||c<0||c>1)throw new Error('confidence must be 0..1');
 const p=append({name,scope,condition,action,confidence:c,source,preconditions:[condition],expires_at:null,rollback:'disable policy and restore prior behavior'});
 console.log(JSON.stringify({runtime:'cognitive-policy-runtime-v1',status:'POLICY_PROPOSED',policy:p,authority:{policy_proposal:true,policy_activation:false,mission_creation:false}},null,2));
}
function review(id){const rows=read().filter(x=>!id||x.id===id);console.log(JSON.stringify({runtime:'cognitive-policy-runtime-v1',status:'REVIEW',count:rows.length,policies:rows,authority:{policy_activation:false,mission_creation:false}},null,2));}
function status(){ensure();console.log(JSON.stringify({runtime:'cognitive-policy-runtime-v1',stage:35,status:'READY',policies:read().length,authority:{policy_proposal:true,policy_activation:false,policy_edit:false,mission_creation:false}},null,2));}
const [cmd,...a]=process.argv.slice(2);
try{if(cmd==='init'||cmd==='status'){if(cmd==='init')ensure();status();}else if(cmd==='propose')propose(a);else if(cmd==='review')review(a[0]);else throw new Error('usage: cognitive-policy-runtime.mjs init|status|propose <name> <scope> <condition> <action> <confidence> [source]|review [id]');}catch(e){fail(e instanceof Error?e.message:String(e));}
