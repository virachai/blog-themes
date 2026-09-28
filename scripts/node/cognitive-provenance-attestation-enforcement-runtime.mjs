#!/usr/bin/env node
/** Stage 57 — Cognitive Provenance Attestation Enforcement Runtime. */
import { existsSync,readFileSync,appendFileSync,mkdirSync,writeFileSync } from 'node:fs';
import { join } from 'node:path';
const M=join(process.cwd(),'04-revenue-system/07-intelligence/cognitive-memory');
const PROV=join(M,'learning-commit-provenance.jsonl'), ATT=join(M,'learning-provenance-attestations.jsonl'), ENF=join(M,'learning-provenance-enforcement.jsonl');
function ensure(){mkdirSync(M,{recursive:true});for(const p of [PROV,ATT,ENF])if(!existsSync(p))writeFileSync(p,'');}
function read(p){ensure();return readFileSync(p,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);}
function add(row){appendFileSync(ENF,JSON.stringify({id:'ENF-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),created_at:new Date().toISOString(),authority:false,...row})+'\n');}
function check(id){
 const p=read(PROV).find(x=>x.id===id||x.commit_id===id);if(!p)throw Error('unknown provenance id: '+id);
 const a=read(ATT).filter(x=>x.provenance_id===p.id).at(-1), findings=[];
 if(!a||a.status!=='ATTESTED'||a.gate!=='PASS')findings.push('ATTESTATION_REQUIRED');
 if(a?.commit_id!==p.commit_id)findings.push('ATTESTATION_LINEAGE_MISMATCH');
 const row={provenance_id:p.id,commit_id:p.commit_id,attestation_id:a?.id||null,findings,gate:findings.length?'BLOCK':'PASS',status:findings.length?'DOWNSTREAM_BLOCKED':'DOWNSTREAM_AUTHORIZED',next_action:findings.length?'attest_or_repair':'usable_downstream'};
 add(row);console.log(JSON.stringify({runtime:'cognitive-provenance-attestation-enforcement-runtime-v1',stage:57,status:row.status,enforcement:row,authority:{attestation_enforcement:true,learning_commit:false,belief_update:false,policy_edit:false,mission_creation:false}},null,2));
}
function audit(){const ps=read(PROV),a=read(ATT),results=ps.map(p=>{const x=a.filter(z=>z.provenance_id===p.id).at(-1);return {provenance_id:p.id,status:x?.status==='ATTESTED'&&x?.gate==='PASS'?'AUTHORIZED':'BLOCKED'}});console.log(JSON.stringify({runtime:'cognitive-provenance-attestation-enforcement-runtime-v1',stage:57,status:results.some(x=>x.status==='BLOCKED')?'ENFORCEMENT_FINDINGS':'ENFORCEMENT_CLEAN',provenance_records:results.length,authorized:results.filter(x=>x.status==='AUTHORIZED').length,blocked:results.filter(x=>x.status==='BLOCKED').length,results},null,2));}
function status(){const r=read(ENF);console.log(JSON.stringify({runtime:'cognitive-provenance-attestation-enforcement-runtime-v1',stage:57,status:'READY',enforcement_records:r.length,authorized:r.filter(x=>x.status==='DOWNSTREAM_AUTHORIZED').length,blocked:r.filter(x=>x.status==='DOWNSTREAM_BLOCKED').length,authority:{attestation_enforcement:true,learning_commit:false,belief_update:false,policy_edit:false,mission_creation:false}},null,2));}
function review(id){const r=read(ENF).filter(x=>!id||x.id===id||x.provenance_id===id||x.commit_id===id);console.log(JSON.stringify({runtime:'cognitive-provenance-attestation-enforcement-runtime-v1',status:'ENFORCEMENT_REVIEW',count:r.length,records:r},null,2));}
const [cmd,...a]=process.argv.slice(2);try{if(cmd==='init'||cmd==='status'){if(cmd==='init')ensure();status();}else if(cmd==='check')check(a[0]);else if(cmd==='audit')audit();else if(cmd==='review')review(a[0]);else throw Error('usage: init|status|check <provenance_id>|audit|review [id]')}catch(e){console.error('COGNITIVE-PROVENANCE-ENFORCEMENT: ERROR '+e.message);process.exitCode=1}
