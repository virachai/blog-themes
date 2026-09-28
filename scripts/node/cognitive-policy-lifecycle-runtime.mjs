#!/usr/bin/env node
/** Stage 36 — Cognitive Policy Activation & Lifecycle Runtime. */
import { existsSync, readFileSync, appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT=process.cwd();
const MEMORY_ROOT=join(ROOT,'04-revenue-system/07-intelligence/cognitive-memory');
const POLICIES=join(MEMORY_ROOT,'policies.jsonl');
const EVENTS=join(MEMORY_ROOT,'policy-events.jsonl');
const STATES=new Set(['PROPOSED','ACTIVE','SUSPENDED','RETIRED']);

function fail(m){console.error('COGNITIVE-POLICY-LIFECYCLE: ERROR '+m);process.exitCode=1;}
function ensure(){
  mkdirSync(MEMORY_ROOT,{recursive:true});
  if(!existsSync(POLICIES))writeFileSync(POLICIES,'');
  if(!existsSync(EVENTS))writeFileSync(EVENTS,'');
}
function read(path){ensure();return readFileSync(path,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);}
function policies(){return read(POLICIES);}
function events(){return read(EVENTS);}
function appendEvent(policy_id,event,extra={}){
  const row={id:'PEVENT-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),created_at:new Date().toISOString(),policy_id,event,authority:true,...extra};
  appendFileSync(EVENTS,JSON.stringify(row)+'\n'); return row;
}
function derive(policy){
  const ev=events().filter(x=>x.policy_id===policy.id);
  let state=policy.status||'PROPOSED', version=0, last=null;
  for(const e of ev){
    if(e.event==='ACTIVATE'){state='ACTIVE';version=e.version??version+1;}
    else if(e.event==='SUSPEND' && state==='ACTIVE')state='SUSPENDED';
    else if(e.event==='RESUME' && state==='SUSPENDED')state='ACTIVE';
    else if(e.event==='RETIRE')state='RETIRED';
    else if(e.event==='ROLLBACK')state=e.restore_state||'PROPOSED';
    last=e;
  }
  if(state==='ACTIVE' && policy.expires_at && new Date(policy.expires_at).getTime()<=Date.now()) state='SUSPENDED';
  return {...policy,status:state,version,last_event:last?.event??null,event_count:ev.length};
}
function find(id){
  const p=policies().find(x=>x.id===id);
  if(!p)throw new Error('unknown policy id: '+id);
  return derive(p);
}
function requireState(p,allowed){if(!allowed.includes(p.status))throw new Error('policy '+p.id+' is '+p.status+'; expected '+allowed.join(' or '));}
function activate(args){
  const [id,expiresAt='']=args; const p=find(id); requireState(p,['PROPOSED','SUSPENDED']);
  if(expiresAt && Number.isNaN(new Date(expiresAt).getTime()))throw new Error('invalid expires_at');
  const version=p.version+1;
  const e=appendEvent(id,'ACTIVATE',{version,expires_at:expiresAt||p.expires_at||null});
  console.log(JSON.stringify({runtime:'cognitive-policy-lifecycle-runtime-v1',status:'POLICY_ACTIVE',policy:derive(policies().find(x=>x.id===id)),event:e,authority:{explicit_activation:true,policy_edit:false,mission_creation:false}},null,2));
}
function transition(id,event,allowed){
  const p=find(id); requireState(p,allowed);
  const extra=event==='ROLLBACK'?{restore_state:'PROPOSED'}:{};
  const e=appendEvent(id,event,extra);
  console.log(JSON.stringify({runtime:'cognitive-policy-lifecycle-runtime-v1',status:'POLICY_'+event,policy:derive(policies().find(x=>x.id===id)),event:e,authority:{lifecycle_transition:true,belief_update:false,mission_creation:false}},null,2));
}
function status(){
  const rows=policies().map(derive);
  console.log(JSON.stringify({runtime:'cognitive-policy-lifecycle-runtime-v1',stage:36,status:'READY',policies:rows.length,active:rows.filter(x=>x.status==='ACTIVE').length,suspended:rows.filter(x=>x.status==='SUSPENDED').length,retired:rows.filter(x=>x.status==='RETIRED').length,events:events().length,authority:{policy_activation:true,policy_lifecycle:true,policy_edit:false,belief_update:false,mission_creation:false}},null,2));
}
function review(id){const rows=policies().map(derive).filter(x=>!id||x.id===id);console.log(JSON.stringify({runtime:'cognitive-policy-lifecycle-runtime-v1',status:'REVIEW',count:rows.length,policies:rows,authority:{policy_activation:true,policy_edit:false,mission_creation:false}},null,2));}
function evaluate(){
  const rows=policies().map(derive);
  console.log(JSON.stringify({runtime:'cognitive-policy-lifecycle-runtime-v1',status:'ACTIVE_POLICY_SET',count:rows.filter(x=>x.status==='ACTIVE').length,policies:rows.filter(x=>x.status==='ACTIVE'),authority:{evaluation_only:true,automatic_activation:false,belief_update:false,mission_creation:false}},null,2));
}
const [cmd,...a]=process.argv.slice(2);
try{
  if(cmd==='init'||cmd==='status'){if(cmd==='init')ensure();status();}
  else if(cmd==='activate')activate(a);
  else if(cmd==='suspend')transition(a[0],'SUSPEND',['ACTIVE']);
  else if(cmd==='resume')transition(a[0],'RESUME',['SUSPENDED']);
  else if(cmd==='retire')transition(a[0],'RETIRE',['ACTIVE','SUSPENDED','PROPOSED']);
  else if(cmd==='rollback')transition(a[0],'ROLLBACK',['ACTIVE','SUSPENDED']);
  else if(cmd==='review')review(a[0]);
  else if(cmd==='evaluate')evaluate();
  else throw new Error('usage: cognitive-policy-lifecycle-runtime.mjs init|status|activate <id> [expires_at]|suspend <id>|resume <id>|retire <id>|rollback <id>|review [id]|evaluate');
}catch(e){fail(e instanceof Error?e.message:String(e));}
