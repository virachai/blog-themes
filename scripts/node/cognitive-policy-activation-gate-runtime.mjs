#!/usr/bin/env node
/** Stage 47 — Cognitive Policy Activation Gate Runtime. */
import {existsSync,readFileSync,appendFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const M=join(process.cwd(),'04-revenue-system/07-intelligence/cognitive-memory');
const P=join(M,'policies.jsonl'),V=join(M,'policy-verifications.jsonl'),G=join(M,'policy-activation-gates.jsonl');
function ensure(){mkdirSync(M,{recursive:true});for(const p of [P,V,G])if(!existsSync(p))writeFileSync(p,'');}
function read(p){ensure();return readFileSync(p,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);}
function add(x){appendFileSync(G,JSON.stringify({id:'ACTG-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),created_at:new Date().toISOString(),authority:false,...x})+'\n');}
function check(a){const [policyId,reviewer='activation-gate',notes='pre-activation-gate']=a;if(!policyId)throw Error('usage: check <policy_id> [reviewer] [notes]');
 const p=read(P).find(x=>x.id===policyId);if(!p)throw Error('unknown policy id: '+policyId);
 const lineage=p.evidence_lineage||{}, vs=read(V).filter(x=>x.policy_id===policyId);
 const findings=[];
 if(!lineage.proposal_eligibility_id)findings.push('MISSING_PROPOSAL_ELIGIBILITY');
 if(!lineage.binding_id)findings.push('MISSING_EVIDENCE_BINDING');
 if(!lineage.knowledge_id)findings.push('MISSING_KNOWLEDGE_LINEAGE');
 if(!vs.length)findings.push('MISSING_ADVERSARIAL_VERIFICATION');
 if(vs.length&&!vs.some(x=>x.gate==='PASS'&&x.status==='VERIFIED'))findings.push('NO_PASSING_VERIFICATION');
 const gate=findings.length?'BLOCK':'PASS';
 const row={policy_id:policyId,reviewer,notes,verification_ids:vs.map(x=>x.id),findings,gate,status:gate==='PASS'?'ACTIVATION_ELIGIBLE':'ACTIVATION_BLOCKED'};
 add(row);console.log(JSON.stringify({runtime:'cognitive-policy-activation-gate-runtime-v1',status:row.status,gate:row,authority:{activation_gate:true,policy_activation:false,policy_edit:false,belief_update:false,mission_creation:false}},null,2));}
function review(id){const r=read(G).filter(x=>!id||x.id===id);console.log(JSON.stringify({runtime:'cognitive-policy-activation-gate-runtime-v1',status:'ACTIVATION_GATE_REVIEW',count:r.length,gates:r,authority:{review_only:true,policy_activation:false}},null,2));}
function status(){ensure();const r=read(G);console.log(JSON.stringify({runtime:'cognitive-policy-activation-gate-runtime-v1',stage:47,status:'READY',gates:r.length,eligible:r.filter(x=>x.gate==='PASS').length,blocked:r.filter(x=>x.gate==='BLOCK').length,authority:{activation_gate:true,policy_activation:false,policy_edit:false,belief_update:false,mission_creation:false}},null,2));}
const [cmd,...a]=process.argv.slice(2);try{if(cmd==='init'||cmd==='status'){ensure();status()}else if(cmd==='check')check(a);else if(cmd==='review')review(a[0]);else throw Error('usage: ... init|status|check <policy_id> [reviewer] [notes]|review [id]')}catch(e){console.error('COGNITIVE-POLICY-ACTIVATION-GATE: ERROR '+e.message);process.exitCode=1}
