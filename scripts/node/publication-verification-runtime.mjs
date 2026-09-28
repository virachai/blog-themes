#!/usr/bin/env node
/**
 * Stage 63 — Publication Verification & Feedback Runtime.
 * Read-side only. Never publishes and never creates publication-receipt.json.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertAuthoritativeReceipt } from './publication-receipt.mjs';
import { verifyEvidenceLedger, assertEvidenceSupportsPublication } from './cdp-runtime/adversarial-verifier.mjs';

const ROOT = process.cwd();
const RUNS = join(ROOT, '04-revenue-system/07-intelligence/runs');
const RECEIPT_FILE = 'publication-receipt.json';
const json = file => existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
const save = (dir, name, value) => writeFileSync(join(dir, name), JSON.stringify(value, null, 2) + '\n');

function load(runId) {
  const dir = join(RUNS, runId);
  const manifest = json(join(dir, 'manifest.json'));
  if (!manifest) throw new Error('run not found: ' + runId);
  return {
    dir,
    manifest,
    observation: json(join(dir, 'email-publication-observation.json')),
    receipt: json(join(dir, RECEIPT_FILE)),
    ledger: json(join(dir, 'ledger.json')),
  };
}

function verify(run, runId) {
  const findings = [];
  const fail = (id, message) => findings.push({ id, severity: 'BLOCK', message });
  const pass = (id, message) => findings.push({ id, severity: 'PASS', message });

  if (!run.receipt) {
    fail('V63-001', 'authoritative publication receipt is missing');
  } else {
    try {
      assertAuthoritativeReceipt(run.receipt);
      pass('V63-001', 'authoritative Stage 61 publication receipt is present');
    } catch (error) {
      fail('V63-001', error.message);
    }
  }

  const observation = run.observation;
  if (!observation) fail('V63-002', 'Stage 62 observation is missing');
  else if (observation.status !== 'OBSERVED') fail('V63-002', 'observation status is ' + (observation.status ?? 'MISSING') + ', expected OBSERVED');
  else pass('V63-002', 'Stage 62 observation is OBSERVED');

  if (observation && observation.page_state !== 'PUBLISHED_CANDIDATE') fail('V63-003', 'observation page_state is ' + (observation.page_state ?? 'MISSING') + ', not PUBLISHED_CANDIDATE');
  else if (observation) pass('V63-003', 'observation identifies a public-post candidate');

  if (run.receipt && observation) {
    const receiptUrl = String(run.receipt.publication?.url ?? '').trim();
    const observedUrl = String(observation.public_post_url ?? '').trim();
    if (!receiptUrl || !observedUrl || receiptUrl !== observedUrl) fail('V63-004', 'receipt URL and observed public post URL do not match exactly');
    else pass('V63-004', 'receipt URL matches observed public post URL');

    const externalId = String(run.receipt.publication?.external_id ?? '').trim();
    if (!externalId) fail('V63-005', 'receipt external_id is empty');
    else pass('V63-005', 'receipt contains a non-empty external_id');

    if (run.receipt.publication?.page_state !== observation.page_state) fail('V63-006', 'receipt page_state and observation page_state disagree');
    else pass('V63-006', 'receipt and observation page_state agree');
  }

  if (observation?.evidence_id && run.ledger?.records) {
    const record = run.ledger.records.find(item => item.id === observation.evidence_id);
    if (!record) {
      fail('V63-007', 'observation evidence_id is not present in ledger');
    } else {
      const verifier = verifyEvidenceLedger([record]);
      const blocking = verifier.filter(item => item.severity === 'BLOCK');
      if (blocking.length) fail('V63-007', 'observation evidence is blocked by adversarial verifier: ' + blocking.map(item => item.id).join(', '));
      else {
        try { assertEvidenceSupportsPublication(record); pass('V63-007', 'observation evidence supports publication verification'); }
        catch (error) { fail('V63-007', error.message); }
      }
    }
  } else if (observation) {
    fail('V63-007', 'observation has no evidence_id or ledger');
  }

  const blocked = findings.filter(item => item.severity === 'BLOCK');
  const status = blocked.length ? 'BLOCKED' : 'PASS';
  const feedbackState = status === 'PASS'
    ? 'PUBLISHED_VERIFIED'
    : !run.receipt
      ? 'AWAITING_PUBLICATION'
      : observation?.status !== 'OBSERVED'
        ? 'AWAITING_VERIFICATION'
        : 'REVIEW_REQUIRED';

  return {
    runtime: 'publication-verification-runtime-v1',
    stage: 63,
    run_id: runId,
    status,
    verified: status === 'PASS',
    publication_status: status === 'PASS' ? 'PUBLISHED_VERIFIED' : 'UNVERIFIED',
    feedback_state: feedbackState,
    findings,
    external_side_effect: false,
    receipt_writer: status === 'PASS' ? 'blogger-publication-adapter-v1' : null,
    boundary: 'Read-side verification only. This runtime never creates publication-receipt.json and never performs external publication.',
    verified_at: status === 'PASS' ? new Date().toISOString() : null,
  };
}

async function main() {
  const [command, runId] = process.argv.slice(2);
  if (command !== 'verify' || !runId) throw new Error('usage: publication-verification-runtime.mjs verify <run_id>');
  const run = load(runId);
  const result = verify(run, runId);
  save(run.dir, 'publication-verification.json', result);
  save(run.dir, 'publication-feedback.json', {
    runtime: 'publication-verification-runtime-v1',
    stage: 63,
    run_id: runId,
    feedback_state: result.feedback_state,
    publication_status: result.publication_status,
    verified: result.verified,
    next_action: result.feedback_state === 'PUBLISHED_VERIFIED'
      ? 'feed verified publication into measurement and learning'
      : result.feedback_state === 'AWAITING_PUBLICATION'
        ? 'execute the separately gated publication path when explicitly authorized'
        : result.feedback_state === 'AWAITING_VERIFICATION'
          ? 'complete a fresh Stage 62 observation'
          : 'inspect conflicting publication evidence',
    source_verification: 'publication-verification.json',
    external_side_effect: false,
  });
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== 'PASS') process.exitCode = 2;
}
main().catch(error => { console.error('PUBLICATION-VERIFICATION: ERROR ' + error.message); process.exitCode = 1; });
