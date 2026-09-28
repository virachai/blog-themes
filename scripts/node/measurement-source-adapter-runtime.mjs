#!/usr/bin/env node
/** Stage 67 — Measurement Source Adapter & Evidence Capture Runtime. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertAuthoritativeReceipt } from './publication-receipt.mjs';

const ROOT = process.cwd();
const RUNS = join(ROOT, '04-revenue-system/07-intelligence/runs');
const json = f => existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null;
const save = (d, n, v) => writeFileSync(join(d, n), JSON.stringify(v, null, 2) + '\n');
function load(id) {
  const dir=join(RUNS,id), manifest=json(join(dir,'manifest.json'));
  if(!manifest) throw new Error('run not found: '+id);
  return {dir,manifest,intake:json(join(dir,'publication-measurement-intake.json')),receipt:json(join(dir,'publication-receipt.json')),window:json(join(dir,'measurement-window.json')),plan:json(join(dir,'measurement-plan.json')),capture:json(join(dir,'measurement-source-evidence.json'))};
}
function validReceipt(r){try{assertAuthoritativeReceipt(r);return true}catch{return false}}
function inspect(id, now=new Date()) {
  const r=load(id), b=[];
  if(r.intake?.status!=='READY_FOR_MEASUREMENT') b.push('measurement_intake_not_ready');
  if(!validReceipt(r.receipt)) b.push('authoritative_publication_receipt_missing');
  if(r.window?.status && r.window.status!=='READY_TO_MEASURE') b.push('measurement_window_not_ready');
  const c=r.capture;
  if(!c) b.push('measurement_source_evidence_missing');
  else {
    if(c.capture_mode!=='operator_captured') b.push('capture_mode_invalid');
    if(c.metric!==r.plan?.metric) b.push('metric_mismatch');
    if(String(c.publication_url||'')!==String(r.receipt?.url||'')) b.push('publication_url_mismatch');
    if(!String(c.value??'').trim()) b.push('measured_value_missing');
    if(!String(c.unit||'').trim()) b.push('unit_missing');
    if(!String(c.baseline??'').trim()) b.push('baseline_missing');
    if(!String(c.target??'').trim()) b.push('target_missing');
    if(!Array.isArray(c.sources)||!c.sources.length||c.sources.some(s=>!/^https:\/\//i.test(String(s)))) b.push('source_missing_or_invalid');
    const checked=Date.parse(c.checked_at||'');
    const published=Date.parse(r.window?.window?.anchored_at||r.receipt?.verified_at||'');
    if(!Number.isFinite(checked)) b.push('checked_at_invalid');
    else if(checked>now.getTime()) b.push('checked_at_in_future');
    if(Number.isFinite(published)&&Number.isFinite(checked)&&checked<published) b.push('checked_before_publication');
    if(!String(c.source_reference||'').trim()) b.push('source_reference_missing');
  }
  return {runtime:'measurement-source-adapter-runtime-v1',stage:67,run_id:id,mission_id:r.manifest.mission_id,status:b.length?'BLOCKED':'MEASUREMENT_EVIDENCE_READY',blockers:b,measurement_authority:false,external_side_effect:false};
}
function init(id){const r=load(id);if(r.capture) throw new Error('measurement-source-evidence.json already exists');save(r.dir,'measurement-source-evidence.json',{run_id:id,metric:r.plan?.metric||'',publication_url:r.receipt?.url||'',capture_mode:'operator_captured',value:'',unit:'',baseline:'',target:'',checked_at:'',sources:[],source_reference:'',notes:''});console.log('STAGE-67: CAPTURE CONTRACT INITIALIZED')}
function validate(id){const r=load(id),result=inspect(id);save(r.dir,'measurement-source-evidence-status.json',result);console.log(JSON.stringify(result,null,2));if(result.status!=='MEASUREMENT_EVIDENCE_READY')process.exitCode=2}
const [cmd,id]=process.argv.slice(2);try{if(!id||!['init','validate'].includes(cmd))throw new Error('usage: measurement-source-adapter-runtime.mjs init|validate <run_id>');cmd==='init'?init(id):validate(id)}catch(e){console.error('STAGE-67: ERROR '+e.message);process.exitCode=1}
