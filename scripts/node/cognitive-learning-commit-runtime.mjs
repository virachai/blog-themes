#!/usr/bin/env node
/** Lean Cognitive Learning Commit Runtime.
 *
 * One runtime owns learning commit, lineage verification, provenance, integrity,
 * and downstream authorization. Separate post-commit integrity/enforcement/
 * attestation runtimes are deprecated.
 */
import { existsSync, readFileSync, appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const M = join(process.cwd(), '04-revenue-system/07-intelligence/cognitive-memory');
const FILES = {
  feedback: join(M, 'policy-feedback.jsonl'),
  beliefs: join(M, 'beliefs.jsonl'),
  lessons: join(M, 'lessons.jsonl'),
  commits: join(M, 'learning-commits.jsonl'),
  gates: join(M, 'learning-eligibility-gates.jsonl'),
  attribution: join(M, 'policy-outcome-attributions.jsonl'),
  outcomes: join(M, 'policy-outcomes.jsonl'),
  evidence: join(M, 'policy-execution-evidence.jsonl')
};

function fail(message) {
  console.error('COGNITIVE-LEARNING-COMMIT: ERROR ' + message);
  process.exitCode = 1;
}
function ensure() {
  mkdirSync(M, { recursive: true });
  for (const path of Object.values(FILES)) if (!existsSync(path)) writeFileSync(path, '');
}
function read(path) {
  ensure();
  return readFileSync(path, 'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);
}
function append(path, row) {
  appendFileSync(path, JSON.stringify({
    id: row.id || 'REC-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    created_at: new Date().toISOString(),
    authority: false,
    ...row
  }) + '\n');
}
function lineage(feedbackId) {
  const feedback = read(FILES.feedback).find(x => x.id === feedbackId);
  if (!feedback) throw new Error('unknown feedback id: ' + feedbackId);
  const gate = read(FILES.gates)
    .filter(x => x.feedback_id === feedback.id || x.execution_id === feedback.execution_id).at(-1);
  const attribution = read(FILES.attribution)
    .filter(x => x.execution_id === feedback.execution_id).at(-1);
  const outcomeIds = attribution?.outcome_ids || feedback.outcome_ids || [];
  const outcomes = read(FILES.outcomes)
    .filter(x => outcomeIds.includes(x.outcome_id) || outcomeIds.includes(x.id));
  const evidence = read(FILES.evidence)
    .filter(x => x.execution_id === feedback.execution_id).at(-1);
  const findings = [];
  if (!gate || gate.gate !== 'PASS' || gate.status !== 'LEARNING_ELIGIBLE')
    findings.push('LEARNING_GATE_NOT_PASSED');
  if (!attribution || attribution.gate !== 'PASS' || attribution.learning_eligible !== true)
    findings.push('ATTRIBUTION_NOT_VERIFIED');
  if (!outcomes.length) findings.push('OUTCOME_PROVENANCE_MISSING');
  if (!evidence) findings.push('EVIDENCE_PROVENANCE_MISSING');
  return {
    feedback,
    gate,
    attribution,
    outcome_ids: outcomes.map(x => x.outcome_id || x.id),
    evidence,
    findings
  };
}
function commit(args) {
  const [feedbackId, target = 'lesson', claim = '', confidenceDelta = '0'] = args;
  if (!feedbackId || !['lesson', 'belief'].includes(target) || !claim)
    throw new Error('usage: commit <feedback_id> <lesson|belief> <claim> [confidence_delta]');
  const chain = lineage(feedbackId);
  if (chain.findings.length)
    throw new Error('LEARNING_COMMIT_BLOCKED: ' + chain.findings.join(','));
  const delta = Number(confidenceDelta);
  if (!Number.isFinite(delta) || delta < -1 || delta > 1)
    throw new Error('confidence_delta must be -1..1');
  const prior = target === 'belief' ? read(FILES.beliefs).find(x => x.claim === claim) : null;
  const next = target === 'belief'
    ? Math.max(0, Math.min(1, Number(prior?.confidence ?? 0) + delta))
    : null;
  const record = {
    feedback_id: feedbackId,
    target,
    claim,
    confidence_delta: delta,
    prior_confidence: prior?.confidence ?? null,
    proposed_confidence: next,
    evidence: chain.feedback.evidence,
    outcome_ids: chain.outcome_ids,
    provenance: {
      execution_id: chain.feedback.execution_id,
      attribution_id: chain.attribution?.id ?? null,
      eligibility_gate_id: chain.gate?.id ?? null,
      evidence_id: chain.evidence?.id ?? null
    },
    status: 'COMMITTED'
  };
  append(FILES.commits, record);
  if (target === 'belief') {
    append(FILES.beliefs, {
      claim,
      confidence: next,
      source_feedback_id: feedbackId,
      version: (prior?.version ?? 0) + 1,
      evidence: chain.outcome_ids,
      status: 'LEARNED'
    });
  } else {
    append(FILES.lessons, {
      trigger: chain.feedback.assessment,
      failure: delta < 0 ? chain.feedback.assessment : '',
      correction: claim,
      source_feedback_id: feedbackId,
      status: 'LEARNED'
    });
  }
  console.log(JSON.stringify({
    runtime: 'cognitive-learning-commit-runtime-v2',
    status: 'LEARNING_COMMITTED',
    commit: record,
    authority: {
      learning_commit: true,
      provenance_verified: true,
      integrity_verified: true,
      downstream_authorized: true,
      policy_edit: false,
      policy_activation: false,
      mission_creation: false
    }
  }, null, 2));
}
function rollback(commitId) {
  const c = read(FILES.commits).find(x => x.id === commitId);
  if (!c) throw new Error('unknown commit id: ' + commitId);
  if (c.target !== 'belief') throw new Error('rollback currently requires a belief commit');
  const b = read(FILES.beliefs).filter(x => x.source_feedback_id === c.feedback_id && x.claim === c.claim).at(-1);
  if (!b) throw new Error('no committed belief found');
  const prior = b.prior_confidence ?? c.prior_confidence ?? 0;
  append(FILES.commits, {
    rollback_of: commitId,
    target: 'belief',
    claim: c.claim,
    confidence_delta: prior - (b.confidence ?? 0),
    prior_confidence: b.confidence,
    proposed_confidence: prior,
    status: 'ROLLED_BACK'
  });
  append(FILES.beliefs, {
    claim: c.claim,
    confidence: prior,
    source_feedback_id: c.feedback_id,
    version: (b.version ?? 0) + 1,
    evidence: c.outcome_ids,
    status: 'ROLLBACK'
  });
  console.log(JSON.stringify({
    runtime: 'cognitive-learning-commit-runtime-v2',
    status: 'LEARNING_ROLLED_BACK',
    rollback_of: commitId,
    claim: c.claim,
    restored_confidence: prior
  }, null, 2));
}
function review(id) {
  const rows = read(FILES.commits).filter(x => !id || x.id === id);
  console.log(JSON.stringify({
    runtime: 'cognitive-learning-commit-runtime-v2',
    status: 'COMMIT_REVIEW',
    count: rows.length,
    commits: rows,
    authority: { review_only: true }
  }, null, 2));
}
function status() {
  ensure();
  console.log(JSON.stringify({
    runtime: 'cognitive-learning-commit-runtime-v2',
    status: 'READY',
    commits: read(FILES.commits).length,
    beliefs: read(FILES.beliefs).length,
    lessons: read(FILES.lessons).length,
    authority: {
      learning_commit: true,
      provenance_verification: true,
      integrity_verification: true,
      downstream_authorization: true
    }
  }, null, 2));
}

const [cmd, ...args] = process.argv.slice(2);
try {
  if (cmd === 'init' || cmd === 'status') { if (cmd === 'init') ensure(); status(); }
  else if (cmd === 'commit') commit(args);
  else if (cmd === 'rollback') rollback(args[0]);
  else if (cmd === 'review') review(args[0]);
  else throw new Error('usage: cognitive-learning-commit-runtime.mjs init|status|commit <feedback_id> <lesson|belief> <claim> [confidence_delta]|rollback <commit_id>|review [id]');
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
