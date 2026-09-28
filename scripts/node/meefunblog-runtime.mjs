#!/usr/bin/env node
/** Meefunblog Agent Runtime Layer v2. */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRuntimePlan } from './cdp-runtime/runtime-plan.mjs';

const ROOT = process.cwd();
const REGISTRY_PATHS = [join(ROOT, '.agents/skills/meefunblog-registry.yaml'), join(ROOT, '.claude/skills/meefunblog-registry.yaml')];
const SKILL_ROOTS = [join(ROOT, '.agents/skills'), join(ROOT, '.claude/skills')];
const CANONICAL_COUNT = 15;
const RELEASE_GATE = 'seo-quality-gate';

function fail(message) { console.error('RUNTIME-ERROR: ' + message); process.exitCode = 1; }

function parseRegistry(text) {
  const header = {};
  const skills = new Map();
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line === 'skills:') continue;
    const headerMatch = line.match(/^(version|project|routing|release_gate):\s*(.+)$/);
    if (headerMatch) { header[headerMatch[1]] = headerMatch[2].replace(/^['"]|['"]$/g, ''); continue; }
    const skillMatch = line.match(/^([a-z0-9-]+):\s*\{depends_on:\s*\[([^\]]*)\],\s*trigger:\s*"([^"]*)"\}$/);
    if (!skillMatch) continue;
    const name = skillMatch[1];
    const deps = skillMatch[2].trim() ? skillMatch[2].split(',').map((x) => x.trim()).filter(Boolean) : [];
    skills.set(name, { name, depends_on: deps, trigger: skillMatch[3] });
  }
  return { ...header, skills };
}

function loadRegistry() {
  const existing = REGISTRY_PATHS.filter(existsSync);
  if (!existing.length) throw new Error('No meefunblog registry found.');
  return existing.map((path) => ({ path, registry: parseRegistry(readFileSync(path, 'utf8')) }));
}

function registrySkillNames(root) {
  const path = join(root, 'meefunblog-registry.yaml');
  if (!existsSync(path)) return new Set();
  return new Set(readFileSync(path, 'utf8').split(/\r?\n/).map((line) => line.match(/^  ([a-z0-9-]+):\s*\{/)).filter(Boolean).map((m) => m[1]));
}

function validate() {
  const errors = [];
  const registries = loadRegistry();
  const canonical = registries[0].registry;
  if (canonical.skills.size !== CANONICAL_COUNT) errors.push('canonical registry has ' + canonical.skills.size + ' skills; expected ' + CANONICAL_COUNT);
  if (canonical.release_gate !== RELEASE_GATE) errors.push('release_gate is ' + canonical.release_gate + '; expected ' + RELEASE_GATE);
  for (const item of registries) {
    const registry = item.registry;
    if (registry.skills.size !== canonical.skills.size) errors.push(item.path + ': skill count differs from canonical registry');
    for (const [name, skill] of canonical.skills) {
      const candidate = registry.skills.get(name);
      if (!candidate) { errors.push(item.path + ': missing skill ' + name); continue; }
      if (candidate.trigger !== skill.trigger || candidate.depends_on.join(',') !== skill.depends_on.join(',')) errors.push(item.path + ': definition drift for ' + name);
    }
  }
  for (const root of SKILL_ROOTS) {
    for (const name of canonical.skills.keys()) {
      const skillFile = join(root, name, 'SKILL.md');
      if (!existsSync(skillFile)) errors.push(skillFile + ': missing SKILL.md');
      else {
        const text = readFileSync(skillFile, 'utf8');
        const frontmatter = text.match(/^---\n([\s\S]*?)\n---/);
        const declared = frontmatter && frontmatter[1].match(/^name:\s*([^\n]+)$/m)?.[1]?.trim();
        if (declared !== name) errors.push(skillFile + ': frontmatter name is ' + (declared || 'missing'));
      }
    }
    if (registrySkillNames(root).size !== canonical.skills.size) errors.push(root + ': registry directory count mismatch');
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(name, stack = []) {
    if (visiting.has(name)) { errors.push('dependency cycle: ' + [...stack, name].join(' -> ')); return; }
    if (visited.has(name)) return;
    const skill = canonical.skills.get(name);
    if (!skill) { errors.push('unknown dependency: ' + name); return; }
    visiting.add(name);
    for (const dep of skill.depends_on) visit(dep, [...stack, name]);
    visiting.delete(name);
    visited.add(name);
  }
  for (const name of canonical.skills.keys()) visit(name);
  if (errors.length) { console.log('RUNTIME-VALIDATION: FAIL'); errors.forEach((x) => console.log('- ' + x)); return false; }
  console.log('RUNTIME-VALIDATION: PASS (' + canonical.skills.size + ' skills, mirrored registries, dependency graph, SKILL.md presence)');
  return true;
}

function normalize(text) { return text.toLowerCase().replace(/[^a-z0-9\u0E00-\u0E7F]+/gi, ' ').trim(); }
function scoreSkill(task, skill) {
  const haystack = normalize(task);
  const trigger = normalize(skill.trigger);
  const identity = normalize(skill.name.replaceAll('-', ' '));
  const triggerWords = trigger.split(/\s+/).filter((word) => word.length >= 3);
  const identityWords = identity.split(/\s+/).filter((word) => word.length >= 4);
  const triggerHits = triggerWords.filter((word) => haystack.includes(word)).length;
  const identityHits = identityWords.filter((word) => haystack.includes(word)).length;
  const phraseHit = trigger.length >= 8 && haystack.includes(trigger);
  return triggerHits + identityHits + (phraseHit ? 3 : 0);
}
function resolveClosure(registry, seeds) {
  const ordered = []; const seen = new Set();
  function visit(name) {
    if (seen.has(name)) return;
    const skill = registry.skills.get(name);
    if (!skill) throw new Error('Unknown skill ' + name);
    for (const dep of skill.depends_on) visit(dep);
    seen.add(name); ordered.push(name);
  }
  seeds.forEach(visit); return ordered;
}
function route(task) {
  const registry = loadRegistry()[0].registry;
  const scored = [...registry.skills.values()].filter((skill) => skill.name !== RELEASE_GATE).map((skill) => ({ name: skill.name, score: scoreSkill(task, skill), trigger: skill.trigger })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const topScore = scored[0]?.score ?? 0;
  const selected = topScore > 0 ? scored.filter((item) => item.score >= Math.max(1, topScore - 1)).map((item) => item.name) : [];
  const chain = resolveClosure(registry, selected);
  const needsGate = /\b(publish|release|deploy|live|material)\b/i.test(task) || selected.length > 0;
  if (needsGate && !chain.includes(RELEASE_GATE)) chain.push(RELEASE_GATE);
  return { runtime: 'meefunblog-agent-runtime-v2', task, selected, candidates: scored.slice(0, 5), chain, release_gate: RELEASE_GATE, confidence: scored.length ? Math.min(0.99, 0.45 + scored[0].score * 0.12) : 0 };
}
function buildTaskContract(task) {
  const plan = route(task);
  return {
    contract_version: 1,
    runtime: plan.runtime,
    objective: task,
    mode: /\b(publish|release|deploy|live)\b/i.test(task) ? 'RELEASE' : 'BUILD',
    change_class: /\b(publish|release|deploy|live|material)\b/i.test(task) ? 'C3' : 'C2',
    selected_skills: plan.selected,
    execution_chain: plan.chain,
    confidence: plan.confidence,
    evidence: [],
    handoffs: plan.chain.map((skill, index) => ({ from: index ? plan.chain[index - 1] : 'runtime', to: skill, status: 'PENDING' })),
    gates: [{ gate: 'G0', status: 'PENDING' }, { gate: 'G1', status: 'PENDING' }, { gate: 'G2', status: 'PENDING' }, { gate: 'G3', status: 'PENDING' }, { gate: 'G4', status: plan.chain.includes(RELEASE_GATE) ? 'PENDING' : 'NOT_APPLICABLE' }],
    release_gate: RELEASE_GATE,
    rollback_required: true,
    status: 'PLANNED',
  };
}
function output(value, json) {
  if (json) console.log(JSON.stringify(value, null, 2));
  else {
    console.log('RUNTIME: ' + value.runtime);
    console.log('TASK: ' + value.task);
    console.log('SELECTED: ' + (value.selected.join(' -> ') || 'none'));
    console.log('CHAIN: ' + (value.chain.join(' -> ') || 'none'));
    console.log('CONFIDENCE: ' + value.confidence.toFixed(2));
    if (value.candidates?.length) { console.log('CANDIDATES:'); value.candidates.forEach((x) => console.log('- ' + x.name + ' [' + x.score + '] — ' + x.trigger)); }
  }
}
const [command = 'validate', ...args] = process.argv.slice(2);
const json = args.includes('--json');
const task = args.filter((arg) => arg !== '--json').join(' ').trim();
try {
  if (command === 'validate') { if (!validate()) process.exitCode = 1; }
  else if (command === 'route' || command === 'plan') { if (!task) throw new Error(command + ' requires a task description'); output(route(task), json); }
  else if (command === 'contract') { if (!task) throw new Error('contract requires a task description'); console.log(JSON.stringify(buildTaskContract(task), null, 2)); }
  else throw new Error('unknown command: ' + command + '; use validate, route, or plan');
} catch (error) { fail(error instanceof Error ? error.message : String(error)); }