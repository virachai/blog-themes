#!/usr/bin/env node
/** Stage 28 — Editorial Brief Contract Runtime. Deterministic article-to-brief contract gate. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function stripHtml(input) { return input.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
function normalize(input) { return String(input ?? '').toLowerCase().replace(/[^a-z0-9ก-๙\s]/gi, ' ').replace(/\s+/g, ' ').trim(); }
function tokens(input) { return new Set(normalize(input).split(/\s+/).filter(x => x.length >= 3)); }
function overlap(a, b) { const left = tokens(a), right = tokens(b); if (!left.size || !right.size) return 0; let hits = 0; for (const token of left) if (right.has(token)) hits++; return hits / left.size; }
function extractMarkdownContract(source) {
  const clean = source.replace(/^---[\s\S]*?---\s*/m, '').trim();
  const section = (name) => { const match = clean.match(new RegExp('^#{1,3}\\s*' + name + '\\s*$([\\s\\S]*?)(?=^#{1,3}\\s+|$)', 'im')); return match ? match[1].trim() : ''; };
  const list = (name) => section(name).split(/\n/).map(x => x.replace(/^[-*]\s*/, '').trim()).filter(Boolean);
  return { intent: section('Intent'), audience: section('Audience'), required_subtopics: list('Required Subtopics'), evidence_requirements: list('Evidence Requirements'), success_criteria: list('Success Criteria'), must_include: list('Must Include'), must_avoid: list('Must Avoid') };
}
function loadContract(file) { const source = readFileSync(resolve(file), 'utf8'); try { return JSON.parse(source); } catch { return extractMarkdownContract(source); } }
function itemChecks(items, article, idPrefix, target) { return items.map((item, index) => { const score = overlap(item, article); return { id: idPrefix + '-' + (index + 1), item, pass: score >= 0.2, overlap: Math.round(score * 100) / 100, target }; }); }
function analyze(articleSource, brief, file, briefFile) {
  const article = stripHtml(articleSource);
  const required = ['intent', 'audience', 'required_subtopics', 'evidence_requirements', 'success_criteria'];
  const missing = required.filter(key => { const value = brief[key]; return Array.isArray(value) ? value.length === 0 : !String(value ?? '').trim(); });
  const intentScore = overlap(brief.intent || '', article), audienceScore = overlap(brief.audience || '', article);
  const intent = [{ id:'intent', item:brief.intent || '', pass:intentScore >= 0.2, overlap:Math.round(intentScore * 100) / 100, target:'article reflects brief intent' }];
  const audience = [{ id:'audience', item:brief.audience || '', pass:audienceScore >= 0.15, overlap:Math.round(audienceScore * 100) / 100, target:'article contains audience/context signals' }];
  const subtopics = itemChecks(brief.required_subtopics || [], article, 'subtopic', 'each required subtopic has lexical coverage');
  const evidence = itemChecks(brief.evidence_requirements || [], articleSource + ' ' + article, 'evidence', 'each evidence requirement has a detectable article/source signal');
  const success = itemChecks(brief.success_criteria || [], article, 'success', 'each success criterion has an observable article signal');
  const mustInclude = itemChecks(brief.must_include || [], article, 'must-include', 'required phrase/topic is present');
  const mustAvoid = (brief.must_avoid || []).map((item, index) => { const score = overlap(item, article); return { id:'must-avoid-' + (index + 1), item, pass:score === 0, overlap:Math.round(score * 100) / 100, target:'avoidance term is absent' }; });
  const checks = [...intent, ...audience, ...subtopics, ...evidence, ...success, ...mustInclude, ...mustAvoid];
  const blockers = [...missing.map(x => 'missing_' + x), ...checks.filter(x => !x.pass).map(x => x.id)];
  const score = checks.length ? Math.round(checks.filter(x => x.pass).length / checks.length * 100) : 0;
  return { runtime:'editorial-brief-contract-runtime-v1', file, brief_file:briefFile, contract_schema:'editorial-brief-v1', required_fields:required, missing_fields:missing, checks:{intent, audience, required_subtopics:subtopics, evidence_requirements:evidence, success_criteria:success, must_include:mustInclude, must_avoid:mustAvoid}, coverage_score:score, status:blockers.length ? 'REVISE' : 'PASS', blockers, brief_contract_authority:false, editorial_authority:false, release_authority:false, release_gate:'seo-quality-gate' };
}
const [command='check', file, briefFile, ...rest] = process.argv.slice(2);
const json = rest.includes('--json');
const outputPath = rest.find(x => x.startsWith('--write='))?.slice(8);
try {
  if (command !== 'check' || !file || !briefFile) throw new Error('usage: editorial-brief-contract-runtime.mjs check <article-file> <brief-file> [--json] [--write=<ledger.json>]');
  if (!existsSync(resolve(file))) throw new Error('article file not found: ' + file);
  if (!existsSync(resolve(briefFile))) throw new Error('brief file not found: ' + briefFile);
  const report = analyze(readFileSync(resolve(file), 'utf8'), loadContract(briefFile), file, briefFile);
  if (outputPath) writeFileSync(resolve(outputPath), JSON.stringify(report, null, 2) + '\n');
  if (json) console.log(JSON.stringify(report, null, 2)); else { console.log('EDITORIAL-BRIEF-CONTRACT: ' + report.status); console.log('SCORE: ' + report.coverage_score + '/100'); console.log('MISSING FIELDS: ' + (report.missing_fields.join(', ') || 'none')); if (report.blockers.length) console.log('BLOCKERS: ' + report.blockers.join(', ')); }
  if (report.status !== 'PASS') process.exitCode = 2;
} catch (error) { console.error('EDITORIAL-BRIEF-CONTRACT: ERROR ' + (error instanceof Error ? error.message : String(error))); process.exitCode = 1; }
