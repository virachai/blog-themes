import { createHash } from 'node:crypto';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function createHandoff({ taskId, fromSkill, toSkill, objective, evidenceIds = [], checkpointRevision = 0, gateState = null }) {
  if (!taskId || !fromSkill || !toSkill || !objective) throw new Error('taskId, fromSkill, toSkill and objective are required');
  const payload = { version: 1, task_id: taskId, from_skill: fromSkill, to_skill: toSkill, objective, evidence_ids: [...evidenceIds], checkpoint_revision: checkpointRevision, gate_state: gateState, created_at: new Date().toISOString() };
  return { ...payload, id: hash(payload).slice(0, 16) };
}

export function validateHandoff(handoff, { taskId, expectedToSkill = null, availableEvidenceIds = [] } = {}) {
  if (!handoff || handoff.version !== 1 || !handoff.id || !handoff.task_id) return { valid: false, reason: 'malformed-handoff' };
  if (taskId && handoff.task_id !== taskId) return { valid: false, reason: 'task-mismatch' };
  if (expectedToSkill && handoff.to_skill !== expectedToSkill) return { valid: false, reason: 'destination-mismatch' };
  const available = new Set(availableEvidenceIds);
  const missingEvidence = handoff.evidence_ids.filter(id => !available.has(id));
  if (missingEvidence.length) return { valid: false, reason: 'missing-evidence', missingEvidence };
  const { id, ...payload } = handoff;
  if (id !== hash(payload).slice(0, 16)) return { valid: false, reason: 'integrity-failure' };
  return { valid: true };
}
