/** Lean Cognitive Learning Commit Runtime v3.
 *
 * One runtime owns learning commit, provenance, integrity, attestation,
 * enforcement, rollback, and review. Historical Stage 52-57 runtimes
 * are intentionally retired to keep one authority surface.
 */
import { existsSync, readFileSync, appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const M = join(process.cwd(), '04-revenue-system/07-intelligence/cognitive-memory');
const FILES = {
  feedback: join(M, 'policy-feedback.jsonl'),
  beliefs: join(M, 'beliefs.jsonl'),
  lessons: join(M, 'lessons.jsonl'),
  commits: join(M, 'learning-commits.jsonl'),
  gates: join(M, 'learning-eligibility-gates.jsonl'),
  attribution: join(M, 'policy-outcome-attributions.jsonl'),
  outcomes: join(M, 'policy-outcomes.jsonl'),
  evidence: join(M, 'policy-execution-evidence.jsonl'),
  provenance: join(M, 'learning-commit-provenance.jsonl'),
  integrity: join(M, 'learning-provenance-integrity.jsonl'),
  attestations: join(M, 'learning-provenance-attestations.jsonl'),
  enforcement: join(M, 'learning-provenance-enforcement.jsonl'),
  validations: join(M, 'learning-validations.jsonl'),
  promotions: join(M, 'learning-promotions.jsonl')
};

const CHAIN = ['OUTCOME', 'EVIDENCE', 'ATTRIBUTION', 'FEEDBACK', 'ELIGIBILITY_GATE', 'LEARNING_COMMIT'];

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
function append(path, row, prefix = 'REC') {
  appendFileSync(path, JSON.stringify({
    id: row.id || prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    created_at: new Date().toISOString(),
    authority: false,
    ...row
  }) + '\n');
}
function canonical(v) {
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  if (v && typeof v === 'object')
    return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
  return JSON.stringify(v);
}
function digest(v) {
  return createHash('sha256').update(canonical(v)).digest('hex');
}

function resolveLineage(feedbackId) {
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
  return { feedback, gate, attribution, outcome_ids: outcomes.map(x => x.outcome_id || x.id), outcomes, evidence, findings };
}

function buildProvenance(commit) {
  const chain = resolveLineage(commit.feedback_id);
  const row = {
    commit_id: commit.id,
    feedback_id: chain.feedback.id,
    execution_id: chain.feedback.execution_id,
    attribution_id: chain.attribution?.id ?? null,
    outcome_ids: chain.outcome_ids,
    evidence_id: chain.evidence?.id ?? null,
    eligibility_gate_id: chain.gate?.id ?? null,
    findings: chain.findings,
    gate: chain.findings.length ? 'BLOCK' : 'PASS',
    status: chain.findings.length ? 'PROVENANCE_INCOMPLETE' : 'PROVENANCE_VERIFIED',
    chain: CHAIN
  };
  append(FILES.provenance, row, 'PROV');
  return { row, chain };
}

function resolveProvenance(p) {
  const commit = read(FILES.commits).find(x => x.id === p.commit_id);
  const feedback = read(FILES.feedback).find(x => x.id === p.feedback_id);
  const gate = read(FILES.gates).find(x => x.id === p.eligibility_gate_id);
  const attribution = read(FILES.attribution).find(x => x.id === p.attribution_id);
  const evidence = read(FILES.evidence).find(x => x.id === p.evidence_id);
  const outcomes = read(FILES.outcomes)
    .filter(x => (p.outcome_ids || []).includes(x.outcome_id) || (p.outcome_ids || []).includes(x.id));
  const findings = [];
  if (!commit) findings.push('COMMIT_MISSING');
  if (!feedback || feedback.execution_id !== p.execution_id || feedback.id !== p.feedback_id)
    findings.push('FEEDBACK_LINEAGE_MISMATCH');
  if (!gate || gate.execution_id !== p.execution_id || gate.feedback_id !== p.feedback_id ||
      gate.gate !== 'PASS' || gate.status !== 'LEARNING_ELIGIBLE')
    findings.push('ELIGIBILITY_GATE_INVALID');
  if (!attribution || attribution.execution_id !== p.execution_id ||
      attribution.gate !== 'PASS' || attribution.learning_eligible !== true)
    findings.push('ATTRIBUTION_INVALID');
  if (outcomes.length !== (p.outcome_ids || []).length || !outcomes.length)
    findings.push('OUTCOME_PROVENANCE_INVALID');
  if (!evidence || evidence.execution_id !== p.execution_id)
    findings.push('EVIDENCE_PROVENANCE_INVALID');
  if (canonical(p.chain) !== canonical(CHAIN)) findings.push('CHAIN_INVALID');
  const snapshot = { commit: commit || null, feedback: feedback || null, gate: gate || null,
    attribution: attribution || null, outcomes, evidence: evidence || null, chain: p.chain || null };
  return { snapshot, findings, source_digest: digest(snapshot) };
}

function verifyIntegrity(provenance) {
  const r = resolveProvenance(provenance);
  const prior = read(FILES.integrity).filter(x => x.provenance_id === provenance.id).at(-1);
  const drift = prior?.source_digest && prior.source_digest !== r.source_digest;
  const findings = [...r.findings];
  if (drift) findings.push('SOURCE_DIGEST_DRIFT');
  const status = findings.length
    ? (drift ? 'TAMPER_DETECTED' : 'PROVENANCE_BROKEN')
    : (prior ? 'INTEGRITY_VERIFIED' : 'BASELINE_ESTABLISHED');
  const row = {
    provenance_id: provenance.id, commit_id: provenance.commit_id,
    source_digest: r.source_digest, baseline: !prior, findings,
    gate: findings.length ? 'BLOCK' : 'PASS', status, chain: provenance.chain
  };
  append(FILES.integrity, row, 'INT');
  return row;
}

function attest(provenance, integrity) {
  const findings = [];
  if (!integrity || !['BASELINE_ESTABLISHED', 'INTEGRITY_VERIFIED'].includes(integrity.status) || integrity.gate !== 'PASS')
    findings.push('INTEGRITY_NOT_VERIFIED');
  if (!integrity?.source_digest) findings.push('MISSING_INTEGRITY_DIGEST');
  const payload = {
    provenance_id: provenance.id, commit_id: provenance.commit_id,
    provenance_created_at: provenance.created_at,
    source_digest: integrity?.source_digest || null, chain: provenance.chain || null
  };
  const row = {
    provenance_id: provenance.id, commit_id: provenance.commit_id,
    source_digest: integrity?.source_digest || null,
    attestation_digest: digest(payload), findings,
    gate: findings.length ? 'BLOCK' : 'PASS',
    status: findings.length ? 'ATTESTATION_BLOCKED' : 'ATTESTED',
    chain: provenance.chain || null
  };
  append(FILES.attestations, row, 'ATT');
  return row;
}

function enforce(provenance, attestation) {
  const findings = [];
  if (!attestation || attestation.status !== 'ATTESTED' || attestation.gate !== 'PASS')
    findings.push('ATTESTATION_REQUIRED');
  if (attestation?.commit_id !== provenance.commit_id)
    findings.push('ATTESTATION_LINEAGE_MISMATCH');
  const row = {
    provenance_id: provenance.id, commit_id: provenance.commit_id,
    attestation_id: attestation?.id || null, findings,
    gate: findings.length ? 'BLOCK' : 'PASS',
    status: findings.length ? 'DOWNSTREAM_BLOCKED' : 'DOWNSTREAM_AUTHORIZED',
    next_action: findings.length ? 'attest_or_repair' : 'usable_downstream'
  };
  append(FILES.enforcement, row, 'ENF');
  return row;
}

function finalizeLearningCommit(commit) {
  const { row: provenance } = buildProvenance(commit);
  const integrity = verifyIntegrity(provenance);
  const attestation = attest(provenance, integrity);
  const enforcement = enforce(provenance, attestation);
  if (enforcement.gate !== 'PASS')
    throw new Error('PROVENANCE_ENFORCEMENT_BLOCKED: ' + enforcement.findings.join(','));
  return { provenance, integrity, attestation, enforcement };
}

function commit(args) {
  const [feedbackId, target = 'lesson', claim = '', confidenceDelta = '0'] = args;
  if (!feedbackId || !['lesson', 'belief'].includes(target) || !claim)
    throw new Error('usage: commit <feedback_id> <lesson|belief> <claim> [confidence_delta]');
  const chain = resolveLineage(feedbackId);
  if (chain.findings.length)
    throw new Error('LEARNING_COMMIT_BLOCKED: ' + chain.findings.join(','));
  const delta = Number(confidenceDelta);
  if (!Number.isFinite(delta) || delta < -1 || delta > 1)
    throw new Error('confidence_delta must be -1..1');
  const prior = target === 'belief' ? read(FILES.beliefs).find(x => x.claim === claim) : null;
  const next = target === 'belief' ? Math.max(0, Math.min(1, Number(prior?.confidence ?? 0) + delta)) : null;
  const record = {
    feedback_id: feedbackId, target, claim, confidence_delta: delta,
    prior_confidence: prior?.confidence ?? null, proposed_confidence: next,
    evidence: chain.feedback.evidence, outcome_ids: chain.outcome_ids,
    provenance: null, status: 'COMMITTED'
  };
  append(FILES.commits, record);
  const committed = read(FILES.commits).at(-1);
  try {
    const lineage = finalizeLearningCommit(committed);
    const records = read(FILES.commits);
    const current = records.at(-1);
    if (current?.id === committed.id) {
      current.provenance = {
        execution_id: lineage.provenance.execution_id,
        attribution_id: lineage.provenance.attribution_id,
        eligibility_gate_id: lineage.provenance.eligibility_gate_id,
        evidence_id: lineage.provenance.evidence_id
      };
      // Keep the source ledger append-only: record the authoritative provenance separately.
      append(FILES.commits, { supersedes_commit_id: committed.id, provenance: current.provenance, status: 'PROVENANCE_BOUND' });
    }
    if (target === 'belief') {
      append(FILES.beliefs, { claim, confidence: next, source_feedback_id: feedbackId,
        version: (prior?.version ?? 0) + 1, evidence: chain.outcome_ids, status: 'LEARNED' });
    } else {
      append(FILES.lessons, { trigger: chain.feedback.assessment,
        failure: delta < 0 ? chain.feedback.assessment : '', correction: claim,
        source_feedback_id: feedbackId, status: 'LEARNED' });
    }
    console.log(JSON.stringify({
      runtime: 'cognitive-learning-commit-runtime-v3', status: 'LEARNING_COMMITTED',
      commit: committed, provenance: lineage, authority: {
        learning_commit: true, provenance_verified: true, integrity_verified: true,
        attestation_verified: true, downstream_authorized: true,
        policy_edit: false, policy_activation: false, mission_creation: false
      }
    }, null, 2));
  } catch (error) {
    append(FILES.commits, { supersedes_commit_id: committed.id, status: 'PROVENANCE_BINDING_FAILED', error: error.message });
    throw error;
  }
}

function validateCommit(args) {
  const [commitId, expected = 'neutral'] = args;
  if (!commitId || !['positive', 'neutral', 'negative'].includes(expected))
    throw new Error('usage: validate <commit_id> [positive|neutral|negative]');
  const commit = read(FILES.commits).find(x => x.id === commitId);
  if (!commit) throw new Error('unknown commit id: ' + commitId);
  const feedback = read(FILES.feedback).find(x => x.id === commit.feedback_id);
  if (!feedback) throw new Error('missing source feedback: ' + commit.feedback_id);
  const delta = Number(commit.confidence_delta ?? 0);
  const regression = expected === 'negative' || (expected === 'positive' && delta < 0);
  const row = {
    commit_id: commitId, feedback_id: commit.feedback_id, target: commit.target,
    expected, confidence_delta: delta,
    result: regression ? 'REGRESSION_FLAG' : 'VALIDATED',
    gate: regression ? 'BLOCK' : 'PASS', status: 'REVIEW_REQUIRED'
  };
  append(FILES.validations, row, 'VALIDATION');
  console.log(JSON.stringify({ runtime: 'cognitive-learning-commit-runtime-v3', status: row.result,
    validation: row, authority: { validation: true, regression_detection: true, learning_reversal: false } }, null, 2));
}

function drift(claim) {
  const rows = read(FILES.beliefs).filter(x => !claim || x.claim === claim);
  const deltas = rows.slice(1).map((x, i) => Number(x.confidence) - Number(rows[i].confidence));
  const negative = deltas.filter(x => x < 0).length;
  console.log(JSON.stringify({ runtime: 'cognitive-learning-commit-runtime-v3', status: 'DRIFT_SCAN',
    claim: claim || null, versions: rows.length, deltas, negative_transitions: negative,
    drift: negative > 1 ? 'DETECTED' : 'NONE', authority: { detection_only: true } }, null, 2));
}

function gate(args) {
  const [executionId, reviewer = 'learning-gate', notes = ''] = args;
  if (!executionId) throw new Error('usage: gate <execution_id> [reviewer] [notes]');
  const attribution = read(FILES.attribution).filter(x => x.execution_id === executionId).at(-1);
  const feedback = read(FILES.feedback).filter(x => x.execution_id === executionId).at(-1);
  const validations = feedback ? read(FILES.validations).filter(x => x.feedback_id === feedback.id) : [];
  const findings = [];
  if (!attribution) findings.push('MISSING_ATTRIBUTION');
  else if (attribution.gate !== 'PASS' || attribution.learning_eligible !== true) findings.push('ATTRIBUTION_NOT_LEARNING_ELIGIBLE');
  if (!feedback) findings.push('MISSING_FEEDBACK');
  else if (feedback.status !== 'PROPOSED_LEARNING') findings.push('FEEDBACK_NOT_PROPOSED');
  if (validations.some(x => x.gate === 'BLOCK' || x.result === 'REGRESSION_FLAG')) findings.push('REGRESSION_BLOCK');
  const row = {
    execution_id: executionId, attribution_id: attribution?.id || null, feedback_id: feedback?.id || null,
    validation_ids: validations.map(x => x.id), reviewer, notes, findings,
    gate: findings.length ? 'BLOCK' : 'PASS',
    status: findings.length ? 'LEARNING_BLOCKED' : 'LEARNING_ELIGIBLE',
    next_action: findings.length ? 'review' : 'eligible_for_commit'
  };
  append(FILES.gates, row, 'LEARNGATE');
  console.log(JSON.stringify({ runtime: 'cognitive-learning-commit-runtime-v3', status: row.status,
    gate: row, authority: { learning_eligibility_gate: true, learning_commit: false } }, null, 2));
}

function promote(args) {
  const [commitId, reviewer = 'reviewed', evidence = 'validated-learning'] = args;
  if (!commitId) throw new Error('usage: promote <commit_id> [reviewer] [evidence]');
  const commit = read(FILES.commits).find(x => x.id === commitId);
  if (!commit) throw new Error('unknown commit id: ' + commitId);
  const validations = read(FILES.validations).filter(x => x.commit_id === commitId);
  if (!validations.length) throw new Error('promotion requires validation for commit: ' + commitId);
  if (validations.some(x => x.gate === 'BLOCK')) throw new Error('promotion blocked by regression validation');
  const row = { commit_id: commitId, target: commit.target, reviewer, evidence,
    validation_ids: validations.map(x => x.id), status: 'PROMOTION_PROPOSED', trust: 'CANDIDATE' };
  append(FILES.promotions, row, 'PROMOTION');
  console.log(JSON.stringify({ runtime: 'cognitive-learning-commit-runtime-v3', status: row.status,
    promotion: row, authority: { promotion_proposal: true, trust_upgrade: false } }, null, 2));
}

function trust(promotionId) {
  const p = read(FILES.promotions).find(x => x.id === promotionId);
  if (!p) throw new Error('unknown promotion id: ' + promotionId);
  if (p.status !== 'PROMOTION_PROPOSED') throw new Error('promotion must be PROPOSED');
  const row = { promotion_of: promotionId, commit_id: p.commit_id, target: p.target,
    reviewer: p.reviewer, evidence: p.evidence, validation_ids: p.validation_ids,
    status: 'TRUSTED', trust: 'TRUSTED', previous_status: p.status };
  append(FILES.promotions, row, 'PROMOTION');
  console.log(JSON.stringify({ runtime: 'cognitive-learning-commit-runtime-v3', status: 'LEARNING_TRUSTED',
    promotion: row, authority: { trust_promotion: true, belief_update: false } }, null, 2));
}

function audit() {
  const ps = read(FILES.provenance);
  const results = ps.map(p => {
    const integrity = verifyIntegrity(p);
    const attestation = attest(p, integrity);
    const enforcement = enforce(p, attestation);
    return { provenance_id: p.id, integrity: integrity.status, attestation: attestation.status, enforcement: enforcement.status };
  });
  console.log(JSON.stringify({
    runtime: 'cognitive-learning-commit-runtime-v3',
    status: results.some(x => x.enforcement !== 'DOWNSTREAM_AUTHORIZED') ? 'PROVENANCE_FINDINGS' : 'PROVENANCE_CLEAN',
    provenance_records: results.length, results,
    authority: { audit_only: true, learning_commit: false }
  }, null, 2));
}

function review(id) {
  const commits = read(FILES.commits).filter(x => !id || x.id === id || x.supersedes_commit_id === id);
  const provenance = read(FILES.provenance).filter(x => !id || x.id === id || x.commit_id === id);
  const integrity = read(FILES.integrity).filter(x => !id || x.id === id || x.provenance_id === id || x.commit_id === id);
  const attestations = read(FILES.attestations).filter(x => !id || x.id === id || x.provenance_id === id || x.commit_id === id);
  const enforcement = read(FILES.enforcement).filter(x => !id || x.id === id || x.provenance_id === id || x.commit_id === id);
  console.log(JSON.stringify({ runtime: 'cognitive-learning-commit-runtime-v3', status: 'COMMIT_REVIEW',
    commits, provenance, integrity, attestations, enforcement, authority: { review_only: true } }, null, 2));
}

function rollback(commitId) {
  const c = read(FILES.commits).find(x => x.id === commitId);
  if (!c) throw new Error('unknown commit id: ' + commitId);
  if (c.target !== 'belief') throw new Error('rollback currently requires a belief commit');
  const b = read(FILES.beliefs).filter(x => x.source_feedback_id === c.feedback_id && x.claim === c.claim).at(-1);
  if (!b) throw new Error('no committed belief found');
  const prior = b.prior_confidence ?? c.prior_confidence ?? 0;
  append(FILES.commits, { rollback_of: commitId, target: 'belief', claim: c.claim,
    confidence_delta: prior - (b.confidence ?? 0), prior_confidence: b.confidence,
    proposed_confidence: prior, status: 'ROLLED_BACK' });
  append(FILES.beliefs, { claim: c.claim, confidence: prior, source_feedback_id: c.feedback_id,
    version: (b.version ?? 0) + 1, evidence: c.outcome_ids, status: 'ROLLBACK' });
  console.log(JSON.stringify({ runtime: 'cognitive-learning-commit-runtime-v3',
    status: 'LEARNING_ROLLED_BACK', rollback_of: commitId, claim: c.claim,
    restored_confidence: prior }, null, 2));
}

function status() {
  ensure();
  console.log(JSON.stringify({
    runtime: 'cognitive-learning-commit-runtime-v3', status: 'READY',
    commits: read(FILES.commits).length, beliefs: read(FILES.beliefs).length,
    lessons: read(FILES.lessons).length, provenance: read(FILES.provenance).length,
    integrity: read(FILES.integrity).length, attestations: read(FILES.attestations).length,
    enforcement: read(FILES.enforcement).length,
    validations: read(FILES.validations).length, promotions: read(FILES.promotions).length,
    authority: { learning_commit: true, provenance_verification: true,
      integrity_verification: true, attestation_verification: true, downstream_authorization: true }
  }, null, 2));
}

const [cmd, ...args] = process.argv.slice(2);
try {
  if (cmd === 'init' || cmd === 'status') { if (cmd === 'init') ensure(); status(); }
  else if (cmd === 'commit') commit(args);
  else if (cmd === 'rollback') rollback(args[0]);
  else if (cmd === 'review') review(args[0]);
  else if (cmd === 'audit') audit();
  else if (cmd === 'validate') validateCommit(args);
  else if (cmd === 'drift') drift(args[0]);
  else if (cmd === 'gate') gate(args);
  else if (cmd === 'promote') promote(args);
  else if (cmd === 'trust') trust(args[0]);
  else if (cmd === 'provenance') {
    const c = read(FILES.commits).find(x => x.id === args[0]);
    if (!c) throw new Error('unknown commit id: ' + args[0]);
    const { provenance, integrity, attestation, enforcement } = finalizeLearningCommit(c);
    console.log(JSON.stringify({ runtime: 'cognitive-learning-commit-runtime-v3',
      status: enforcement.status, provenance, integrity, attestation, enforcement }, null, 2));
  } else {
    throw new Error('usage: cognitive-learning-commit-runtime.mjs init|status|commit ...|rollback <commit_id>|validate <commit_id> [positive|neutral|negative]|drift [claim]|gate <execution_id> [reviewer] [notes]|promote <commit_id> [reviewer] [evidence]|trust <promotion_id>|review [id]|audit|provenance <commit_id>');
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
