import { createHash } from 'node:crypto';
import { verifyCheckpoint } from './task-state.mjs';
import { validateHandoff } from './handoff-contract.mjs';
import { validateSkillInvocation } from './skill-invocation.mjs';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const hashText = value => createHash('sha256').update(String(value)).digest('hex');

function finding(id, severity, check, detail) {
  return { id, severity, check, detail };
}

export function verifyEvidenceLedger(records = []) {
  const findings = [];
  const ids = new Set();
  for (const record of records) {
    if (!record?.id) findings.push(finding('E001', 'BLOCK', 'evidence-id', 'Evidence record has no stable id'));
    if (record?.id && ids.has(record.id)) findings.push(finding('E002', 'BLOCK', 'evidence-duplicate', `Duplicate evidence id: ${record.id}`));
    if (record?.id) ids.add(record.id);
    if (!record?.claim || !record?.observed_at) findings.push(finding('E003', 'BLOCK', 'evidence-completeness', 'Evidence must contain claim and observed_at'));
    if (record?.content_hash && record?.content_hash !== hashText(JSON.stringify({ claim: record.claim, sourceUrl: record.source_url, selector: record.selector, snapshot: record.snapshot }))) {
      findings.push(finding('E004', 'BLOCK', 'evidence-integrity', `Content hash mismatch: ${record.id ?? 'unknown'}`));
    }
  }
  return findings;
}

export function adversarialVerify({ state, evidence = [], handoffs = [], invocations = [], requiredEvidenceIds = [], expectedToSkills = [] } = {}) {
  const findings = [
    ...verifyEvidenceLedger(evidence),
  ];

  const evidenceIds = new Set(evidence.map(e => e?.id).filter(Boolean));
  for (const id of requiredEvidenceIds) {
    if (!evidenceIds.has(id)) findings.push(finding('E005', 'BLOCK', 'required-evidence', `Required evidence is missing: ${id}`));
  }

  if (!state) {
    findings.push(finding('T001', 'BLOCK', 'task-state', 'Task state is missing'));
  } else {
    const checkpoint = state.checkpoints?.at(-1);
    if (checkpoint && !verifyCheckpoint(state, checkpoint)) findings.push(finding('T002', 'BLOCK', 'checkpoint-integrity', 'Latest checkpoint failed integrity verification'));
    if (checkpoint && checkpoint.revision !== state.revision) findings.push(finding('T003', 'BLOCK', 'checkpoint-cursor', 'State revision does not match latest checkpoint revision'));
    for (const id of state.evidence_ids ?? []) if (!evidenceIds.has(id)) findings.push(finding('T004', 'BLOCK', 'state-evidence', `State references unavailable evidence: ${id}`));
  }

  for (const handoff of handoffs) {
    const expected = expectedToSkills.shift() ?? null;
    const result = validateHandoff(handoff, { taskId: state?.task_id, expectedToSkill: expected, availableEvidenceIds: [...evidenceIds] });
    if (!result.valid) findings.push(finding('H001', 'BLOCK', 'handoff-validation', `${result.reason}${result.missingEvidence ? `: ${result.missingEvidence.join(',')}` : ''}`));
  }

  for (const invocation of invocations) {
    if (!validateSkillInvocation(invocation)) findings.push(finding('I001', 'BLOCK', 'skill-invocation', `Invalid invocation for ${invocation?.skill ?? 'unknown skill'}`));
  }

  return {
    status: findings.length ? 'BLOCKED' : 'PASS',
    findings,
    checked_at: new Date().toISOString(),
    verification_version: 1
  };
}

export function canContinue(report) {
  return report?.status === 'PASS' && !(report.findings ?? []).some(f => f.severity === 'BLOCK');
}
