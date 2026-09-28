import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';

export const TASK_STATES = Object.freeze([
  'PLANNED', 'RUNNING', 'PAUSED', 'FAILED', 'COMPLETED', 'CANCELLED'
]);

const TRANSITIONS = Object.freeze({
  PLANNED: ['RUNNING', 'CANCELLED'],
  RUNNING: ['PAUSED', 'FAILED', 'COMPLETED', 'CANCELLED'],
  PAUSED: ['RUNNING', 'CANCELLED'],
  FAILED: ['RUNNING', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: []
});

const now = () => new Date().toISOString();
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function createTaskState({ taskId, objective, mode = 'interactive', plan = null, metadata = {} }) {
  if (!taskId || !objective) throw new Error('taskId and objective are required');
  return {
    version: 1,
    task_id: taskId,
    objective,
    mode,
    lifecycle: 'PLANNED',
    revision: 0,
    created_at: now(),
    updated_at: now(),
    plan,
    cursor: { phase: null, skill: null, step: null },
    session: null,
    evidence_ids: [],
    handoffs: [],
    gates: {},
    checkpoints: [],
    metadata
  };
}

export function transitionTask(state, nextState, reason = null) {
  if (!TASK_STATES.includes(nextState)) throw new Error(`Unknown task state: ${nextState}`);
  if (!TRANSITIONS[state.lifecycle]?.includes(nextState)) {
    throw new Error(`Invalid task transition: ${state.lifecycle} -> ${nextState}`);
  }
  return { ...state, lifecycle: nextState, updated_at: now(), transition_reason: reason };
}

export function checkpointTask(state, { cursor = state.cursor, session = state.session, evidenceIds = state.evidence_ids, handoffs = state.handoffs, gates = state.gates, note = null } = {}) {
  const nextRevision = state.revision + 1;
  const checkpoint = {
    revision: nextRevision,
    created_at: now(),
    lifecycle: state.lifecycle,
    cursor,
    session,
    evidence_ids: [...evidenceIds],
    handoffs: [...handoffs],
    gates: { ...gates },
    note
  };
  const checkpointHash = hash(checkpoint);
  return {
    ...state,
    revision: nextRevision,
    updated_at: checkpoint.created_at,
    cursor,
    session,
    evidence_ids: [...evidenceIds],
    handoffs: [...handoffs],
    gates: { ...gates },
    checkpoints: [...state.checkpoints, { ...checkpoint, hash: checkpointHash }]
  };
}

export function latestCheckpoint(state) {
  return state.checkpoints.at(-1) ?? null;
}

export function verifyCheckpoint(state, checkpoint = latestCheckpoint(state)) {
  if (!checkpoint) return false;
  const { hash: expected, ...payload } = checkpoint;
  return expected === hash(payload);
}

export class TaskStateStore {
  constructor(dir) { this.dir = dir; }

  path(taskId) { return join(this.dir, `${taskId}.json`); }

  async save(state) {
    await mkdir(this.dir, { recursive: true });
    const path = this.path(state.task_id);
    const temp = `${path}.tmp-${process.pid}`;
    await writeFile(temp, JSON.stringify(state, null, 2) + '\n', 'utf8');
    await rename(temp, path);
    return path;
  }

  async load(taskId) {
    const state = JSON.parse(await readFile(this.path(taskId), 'utf8'));
    if (state.version !== 1) throw new Error(`Unsupported task state version: ${state.version}`);
    return state;
  }

  async checkpoint(state, options = {}) {
    const next = checkpointTask(state, options);
    await this.save(next);
    return next;
  }

  async resume(taskId) {
    const state = await this.load(taskId);
    const checkpoint = latestCheckpoint(state);
    if (!checkpoint || !verifyCheckpoint(state, checkpoint)) {
      throw new Error(`Checkpoint integrity failure for task ${taskId}`);
    }
    if (!['PAUSED', 'FAILED'].includes(state.lifecycle)) {
      throw new Error(`Task ${taskId} is not resumable from ${state.lifecycle}`);
    }
    return transitionTask(state, 'RUNNING', 'resume-from-checkpoint');
  }
}
