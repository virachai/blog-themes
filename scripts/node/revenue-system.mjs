#!/usr/bin/env node
/**
 * Meefunblog Revenue System — manual-first operating CLI.
 * Zero dependencies. AI/agent runtime is not required.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const REV = join(ROOT, '04-revenue-system');
const LAYERS = [
  ['01', 'Discovery', '01-discovery/opportunities.csv'],
  ['02', 'Asset Factory', '02-assets/assets.csv'],
  ['03', 'Distribution', '03-distribution/runs.csv'],
  ['04', 'Monetization', '04-monetization/plans.csv'],
  ['05', 'Measurement', '05-measurement/snapshots.csv'],
  ['06', 'Optimization', '06-optimization/decisions.csv'],
];

function fail(message) {
  console.error('REVENUE-ERROR: ' + message);
  process.exitCode = 1;
}

function csvRows(relative) {
  const path = join(REV, relative);
  if (!existsSync(path)) throw new Error('missing ' + path);
  const lines = readFileSync(path, 'utf8').trim().split(/\r?\n/);
  return Math.max(0, lines.length - 1);
}

function check() {
  const errors = [];
  for (const [number, name, file] of LAYERS) {
    const path = join(REV, file);
    if (!existsSync(path)) errors.push('L' + number + ' ' + name + ': missing ' + file);
    else if (csvRows(file) < 1) errors.push('L' + number + ' ' + name + ': ledger has no rows');
  }
  const readmes = [
    'README.md', '04-01-runbook.md',
    ...LAYERS.map(([, , file]) => file.replace(/[^/]+$/, 'README.md')),
  ];
  for (const file of readmes) {
    if (!existsSync(join(REV, file))) errors.push('missing documentation: ' + file);
  }
  if (errors.length) {
    console.log('REVENUE-CHECK: FAIL');
    errors.forEach((e) => console.log('- ' + e));
    return false;
  }
  console.log('REVENUE-CHECK: PASS (6 layers, ledgers, runbook)');
  return true;
}

function status() {
  console.log('REVENUE SYSTEM: manual-first');
  console.log('ROOT: ' + REV);
  for (const [number, name, file] of LAYERS) {
    console.log('L' + number + ' ' + name.padEnd(16) + ' records=' + csvRows(file));
  }
  console.log('LOOP: Discovery -> Asset -> Distribution -> Monetization -> Measurement -> Optimization -> Discovery');
}

function next() {
  const checks = [
    ['L01', 'Discovery', 'Add or review one opportunity in 04-revenue-system/01-discovery/opportunities.csv'],
    ['L02', 'Asset Factory', 'Turn one ready opportunity into an asset in 04-revenue-system/02-assets/assets.csv'],
    ['L03', 'Distribution', 'Publish one ready asset and record its canonical URL in 04-revenue-system/03-distribution/runs.csv'],
    ['L04', 'Monetization', 'Confirm the revenue mechanism and tracking in 04-revenue-system/04-monetization/plans.csv'],
    ['L05', 'Measurement', 'Record a comparable measurement snapshot in 04-revenue-system/05-measurement/snapshots.csv'],
    ['L06', 'Optimization', 'Make one evidence-backed decision in 04-revenue-system/06-optimization/decisions.csv'],
  ];
  console.log('NEXT MANUAL ACTIONS');
  checks.forEach(([id, layer, action]) => console.log(id + ' ' + layer + ': ' + action));
}

function dashboard() {
  console.log('# Revenue Dashboard');
  console.log('');
  console.log('| Layer | Records | File |');
  console.log('| :-- | --: | :-- |');
  for (const [number, name, file] of LAYERS) {
    console.log('| L' + number + ' ' + name + ' | ' + csvRows(file) + ' | ' + file + ' |');
  }
  console.log('');
  console.log('Run: node scripts/node/revenue-system.mjs check');
}

const [command = 'status'] = process.argv.slice(2);
try {
  if (command === 'status') status();
  else if (command === 'check') { if (!check()) process.exitCode = 1; }
  else if (command === 'next') next();
  else if (command === 'dashboard') dashboard();
  else throw new Error('unknown command: ' + command + '; use status, check, next, or dashboard');
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
