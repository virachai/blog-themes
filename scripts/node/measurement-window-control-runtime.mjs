#!/usr/bin/env node
/** Stage 66 — Measurement Window Control Runtime. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertAuthoritativeReceipt } from './publication-receipt.mjs';

const ROOT = process.cwd();
const RUNS = join(ROOT, '04-revenue-system/07-intelligence/runs');
const json = f => existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null;
const save = (d, n, v) => writeFileSync(join(d, n), JSON.stringify(v, null, 2) + '\n');

function load(runId) {
  const dir = join(RUNS, runId);
  const manifest = json(join(dir, 'manifest.json'));
  if (!manifest) throw new Error('run not found: ' + runId);
  return {
    dir,
    manifest,
    intake: json(join(dir, 'publication-measurement-intake.json')),
    receipt: json(join(dir, 'publication-receipt.json')),
    observation: json(join(dir, 'email-publication-observation.json')),
    plan: json(join(dir, 'measurement-plan.json')),
    window: json(join(dir, 'measurement-window.json')),
  };
}

function authoritative(receipt) {
  try { assertAuthoritativeReceipt(receipt); return true; } catch { return false; }
}

function observationTime(observation) {
  const raw = observation?.observed_at || observation?.verified_at || '';
  const time = Date.parse(raw);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

function inspect(runId, now = new Date()) {
  const r = load(runId);
  const blockers = [];
  if (r.intake?.status !== 'READY_FOR_MEASUREMENT') blockers.push('measurement_intake_not_ready');
  if (!authoritative(r.receipt)) blockers.push('authoritative_publication_receipt_missing');
  const anchor = observationTime(r.observation);
  if (!anchor) blockers.push('publication_observation_time_missing');
  const days = Number(r.plan?.observation_days);
  if (!(days > 0)) blockers.push('measurement_window_invalid');
  if (blockers.length) return {
    runtime: 'measurement-window-control-runtime-v1', stage: 66, run_id: runId,
    status: 'BLOCKED', blockers, external_side_effect: false,
  };
  const startMs = Date.parse(anchor);
  const dueMs = startMs + days * 86400000;
  const nowMs = now.getTime();
  const state = nowMs >= dueMs ? 'READY_TO_MEASURE' : 'WAITING_FOR_WINDOW';
  return {
    runtime: 'measurement-window-control-runtime-v1', stage: 66, run_id: runId,
    status: state, blockers: [], external_side_effect: false,
    window: {
      metric: r.plan.metric,
      observation_days: days,
      anchored_at: anchor,
      due_at: new Date(dueMs).toISOString(),
      checked_at: now.toISOString(),
    },
    next_action: state === 'READY_TO_MEASURE'
      ? 'collect real measurement observations and pass them to Stage 65'
      : 'wait until due_at; do not record outcome yet',
  };
}

function init(runId) {
  const r = load(runId);
  if (r.window) throw new Error('measurement-window.json already exists; use check');
  const result = inspect(runId);
  if (result.status === 'BLOCKED') throw new Error(result.blockers.join(', '));
  const window = { ...result, immutable_anchor: true };
  save(r.dir, 'measurement-window.json', window);
  console.log(JSON.stringify(window, null, 2));
}

function check(runId) {
  const r = load(runId);
  const result = inspect(runId);
  if (r.window?.window) {
    const anchored = r.window.window;
    if (result.status !== 'BLOCKED' && (anchored.anchored_at !== result.window.anchored_at || anchored.due_at !== result.window.due_at)) {
      result.status = 'BLOCKED';
      result.blockers = ['measurement_window_anchor_changed'];
    }
  }
  save(r.dir, 'measurement-window-status.json', result);
  console.log(JSON.stringify(result, null, 2));
  if (result.status === 'BLOCKED') process.exitCode = 2;
}

const [cmd, runId] = process.argv.slice(2);
try {
  if (!runId || !['init', 'check'].includes(cmd)) throw new Error('usage: measurement-window-control-runtime.mjs init|check <run_id>');
  if (cmd === 'init') init(runId); else check(runId);
} catch (error) {
  console.error('MEASUREMENT-WINDOW: ERROR ' + error.message);
  process.exitCode = 1;
}
