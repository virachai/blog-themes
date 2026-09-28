#!/usr/bin/env node
/** Stage 48 — Cognitive Policy Activation & Execution Integrity Runtime. */
import { existsSync, readFileSync, appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const M=join(process.cwd(),'04-revenue-system/07-intelligence/cognitive-memory');
const P=join(M,'policies.jsonl');
const E=join(M,'policy-events.jsonl');
const G=join(M,'policy-activation-gates.jsonl');
const A=join(M,'policy-execution-authorizations.jsonl');

function ensure(){mkdirSync(M,{recursive:true});for(const p of [P,E,G,A])if(!existsSync(p))writeFileSync(p,'');}
function read(p){ensure();return readFileSync(p,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);}
function add(row){appendFileSync(A,JSON.stringify({id:'EXAUTH-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),created_at:new Date().toISOString(),authority:false,...row})+'\n');}
function policy(id){
  const p=read(P).find(x=>x.id===id);if(!p)throw Error('unknown policy id: '+id);
  const ev=read(E).filter(x=>x.policy_id===id);let status=p.status||'PROPOSED',version=0;
  for(const e of ev){if(e.event==='ACTIVATE'){status='ACTIVE';version=e.version??version+1;}else if(e.event==='SUSPEND'&&status==='ACTIVE')status='SUSPENDED';else if(e.event==='RESUME'&&status==='SUSPENDED')status='ACTIVE';else if(e.event==='RETIRE')status='RETIRED';else if(e.event==='ROLLBACK')status='PROPOSED';}
  if(status==='ACTIVE'&&p.expires_at&&new Date(p.expires_at).getTime()<=Date.now())status='SUSPENDED';
  return {...p,status,version};
}
function gate(id){
  const rows=read(G).filter(x=>x.policy_id===id);
  return rows.at(-1)||null;
}
function authorize(args){
  const [policyId,reviewer='execution-integrity',notes='pre-execution-integrity-check']=args;
  if(!policyId)throw Error('usage: authorize <policy_id> [reviewer] [notes]');
  const p=policy(policyId),g=gate(policyId),findings=[];
  if(p.status!=='ACTIVE')findings.push('POLICY_NOT_ACTIVE');
  if(!g||g.gate!=='PASS'||g.status!=='ACTIVATION_ELIGIBLE')findings.push('ACTIVATION_GATE_NOT_PASSING');
  if(!g?.verification_ids?.length)findings.push('MISSING_VERIFICATION_LINEAGE');
  if(!p.evidence_lineage?.proposal_eligibility_id)findings.push('MISSING_PROPOSAL_ELIGIBILITY');
  if(!p.evidence_lineage?.binding_id)findings.push('MISSING_EVIDENCE_BINDING');
  if(!p.evidence_lineage?.knowledge_id)findings.push('MISSING_KNOWLEDGE_LINEAGE');
  const row={policy_id:policyId,policy_version:p.version,activation_gate_id:g?.id||null,verification_ids:g?.verification_ids||[],evidence_lineage:p.evidence_lineage||{},reviewer,notes,findings,gate:findings.length?'BLOCK':'PASS',status:findings.length?'EXECUTION_BLOCKED':'EXECUTION_AUTHORIZED'};
  add(row);
  console.log(JSON.stringify({runtime:'cognitive-policy-execution-integrity-runtime-v1',status:row.status,authorization:row,authority:{execution_authorization:true,policy_activation:false,policy_edit:false,belief_update:false,mission_creation:false}},null,2));
}
function currentAuthorization(policyId,version){
  return read(A).filter(x=>x.policy_id===policyId&&x.policy_version===version&&x.gate==='PASS'&&x.status==='EXECUTION_AUTHORIZED').at(-1)||null;
}
function checkExecution(executionId){
  const xs=readFileSync(join(M,'policy-executions.jsonl'),'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);
  const e=xs.find(x=>x.execution_id===executionId);if(!e)throw Error('unknown execution id: '+executionId);
  const p=policy(e.policy_id),a=currentAuthorization(e.policy_id,e.policy_version),findings=[];
  if(p.status!=='ACTIVE')findings.push('POLICY_NO_LONGER_ACTIVE');
  if(p.version!==e.policy_version)findings.push('POLICY_VERSION_MISMATCH');
  if(!a)findings.push('MISSING_MATCHING_EXECUTION_AUTHORIZATION');
  const status=findings.length?'INTEGRITY_BLOCK':'INTEGRITY_PASS';
  console.log(JSON.stringify({runtime:'cognitive-policy-execution-integrity-runtime-v1',status,execution_id:executionId,policy:{id:p.id,status:p.status,current_version:p.version},execution_version:e.policy_version,authorization_id:a?.id||null,findings,authority:{integrity_verification:true,policy_activation:false,policy_edit:false,belief_update:false,mission_creation:false}},null,2));
}
function review(id){const r=read(A).filter(x=>!id||x.id===id||x.policy_id===id);console.log(JSON.stringify({runtime:'cognitive-policy-execution-integrity-runtime-v1',status:'EXECUTION_INTEGRITY_REVIEW',count:r.length,authorizations:r,authority:{review_only:true,policy_activation:false}},null,2));}
function status(){ensure();const r=read(A);console.log(JSON.stringify({runtime:'cognitive-policy-execution-integrity-runtime-v1',stage:48,status:'READY',authorizations:r.length,authorized:r.filter(x=>x.gate==='PASS').length,blocked:r.filter(x=>x.gate==='BLOCK').length,authority:{execution_authorization:true,integrity_verification:true,policy_activation:false,policy_edit:false,belief_update:false,mission_creation:false}},null,2));}
const [cmd,...a]=process.argv.slice(2);
try{if(cmd==='init'||cmd==='status'){if(cmd==='init')ensure();status();}else if(cmd==='authorize')authorize(a);else if(cmd==='check')checkExecution(a[0]);else if(cmd==='review')review(a[0]);else throw Error('usage: ... init|status|authorize <policy_id> [reviewer] [notes]|check <execution_id>|review [id]');}catch(e){console.error('COGNITIVE-POLICY-EXECUTION-INTEGRITY: ERROR '+e.message);process.exitCode=1}
