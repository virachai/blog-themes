#!/usr/bin/env node
/** Stage 56 — Cognitive Provenance Chain Attestation Runtime. */
import { existsSync,readFileSync,appendFileSync,mkdirSync,writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
const M=join(process.cwd(),'04-revenue-system/07-intelligence/cognitive-memory');
const PROV=join(M,'learning-commit-provenance.jsonl'), INT=join(M,'learning-provenance-integrity.jsonl'), ATT=join(M,'learning-provenance-attestations.jsonl');
function ensure(){mkdirSync(M,{recursive:true});for(const p of [PROV,INT,ATT])if(!existsSync(p))writeFileSync(p,'');}
function read(p){ensure();return readFileSync(p,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);}
function canonical(v){if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';return JSON.stringify(v);}
function sha(v){return createHash('sha256').update(canonical(v)).digest('hex');}
function add(row){appendFileSync(ATT,JSON.stringify({id:'ATT-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),created_at:new Date().toISOString(),authority:false,...row})+'\n');}
function attest(id){
 const p=read(PROV).find(x=>x.id===id||x.commit_id===id);if(!p)throw Error('unknown provenance id: '+id);
 const ir=read(INT).filter(x=>x.provenance_id===p.id).at(-1), findings=[];
 if(!ir||!['BASELINE_ESTABLISHED','INTEGRITY_VERIFIED'].includes(ir.status)||ir.gate!=='PASS')findings.push('INTEGRITY_NOT_VERIFIED');
 if(ir?.source_digest){
   const current=read(INT).filter(x=>x.provenance_id===p.id).at(-1)?.source_digest;
   if(current!==ir.source_digest)findings.push('INTEGRITY_DIGEST_CHANGED');
 } else findings.push('MISSING_INTEGRITY_DIGEST');
 const payload={provenance_id:p.id,commit_id:p.commit_id,provenance_created_at:p.created_at,source_digest:ir?.source_digest||null,chain:p.chain||null};
 const status=findings.length?'ATTESTATION_BLOCKED':'ATTESTED';
 add({provenance_id:p.id,commit_id:p.commit_id,source_digest:ir?.source_digest||null,attestation_digest:sha(payload),findings,gate:findings.length?'BLOCK':'PASS',status,chain:p.chain||null});
 console.log(JSON.stringify({runtime:'cognitive-provenance-attestation-runtime-v1',stage:56,status,attestation_payload:payload,authority:{attestation_verification:true,learning_commit:false,belief_update:false,policy_edit:false,mission_creation:false}},null,2));
}
function audit(){const ps=read(PROV),ats=read(ATT),results=ps.map(p=>{const a=ats.filter(x=>x.provenance_id===p.id).at(-1);return {provenance_id:p.id,status:a?.status||'UNATTESTED',gate:a?.gate||'BLOCK'}});console.log(JSON.stringify({runtime:'cognitive-provenance-attestation-runtime-v1',stage:56,status:results.some(x=>x.gate==='BLOCK')?'ATTESTATION_FINDINGS':'ATTESTATION_CLEAN',provenance_records:results.length,attested:results.filter(x=>x.status==='ATTESTED').length,blocked:results.filter(x=>x.gate==='BLOCK').length,results},null,2));}
function status(){const r=read(ATT);console.log(JSON.stringify({runtime:'cognitive-provenance-attestation-runtime-v1',stage:56,status:'READY',attestations:r.length,attested:r.filter(x=>x.status==='ATTESTED').length,blocked:r.filter(x=>x.status==='ATTESTATION_BLOCKED').length,authority:{attestation_verification:true,learning_commit:false,belief_update:false,policy_edit:false,mission_creation:false}},null,2));}
function review(id){const r=read(ATT).filter(x=>!id||x.id===id||x.provenance_id===id||x.commit_id===id);console.log(JSON.stringify({runtime:'cognitive-provenance-attestation-runtime-v1',status:'ATTESTATION_REVIEW',count:r.length,records:r},null,2));}
const [cmd,...a]=process.argv.slice(2);try{if(cmd==='init'||cmd==='status'){if(cmd==='init')ensure();status();}else if(cmd==='attest')attest(a[0]);else if(cmd==='audit')audit();else if(cmd==='review')review(a[0]);else throw Error('usage: init|status|attest <provenance_id>|audit|review [id]')}catch(e){console.error('COGNITIVE-PROVENANCE-ATTESTATION: ERROR '+e.message);process.exitCode=1}
