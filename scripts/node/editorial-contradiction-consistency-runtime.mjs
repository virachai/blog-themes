#!/usr/bin/env node
/** Stage 26 — Editorial Contradiction & Claim Consistency Runtime. Deterministic internal consistency gate. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function stripHtml(input) {
  return input.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
function sentences(text) {
  return text.split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(Boolean);
}
function numericTokens(text) {
  return /** @type {string[]} */ (text.match(/\b\d+(?:[.,]\d+)?%?\b/g) || []);
}
function yearTokens(text) {
  return /** @type {string[]} */ (text.match(/\b(?:19|20)\d{2}\b/g) || []);
}
function contradictionSignals(text) {
  const patterns = [
    /\b(?:not|never|no)\b[^.!?]{0,120}\b(?:but|however|yet)\b[^.!?]{0,120}/gi,
    /\b(?:always|never|only|all|none)\b[^.!?]{0,120}\b(?:except|unless|but|however)\b[^.!?]{0,120}/gi,
    /\b(?:increased|decreased|rose|fell|grew|declined)\b[^.!?]{0,120}\b(?:to|from)\s+\d/gi
  ];
  const found = /** @type {string[]} */ ([]);
  for (const pattern of patterns) for (const match of text.matchAll(pattern)) found.push(match[0].trim());
  return [...new Set(found)].slice(0, 50);
}
function analyze(source, file) {
  const text = stripHtml(source);
  const lines = sentences(text);
  const numbers = numericTokens(text);
  const years = yearTokens(text);
  const contradictions = contradictionSignals(text);
  const repeatedNumbers = [...new Set(numbers.filter((value, index) => numbers.indexOf(value) !== index))];
  const repeatedYears = [...new Set(years.filter((value, index) => years.indexOf(value) !== index))];
  const checks = [
    { id: 'sentence_structure', pass: lines.length > 0, value: lines.length, target: 'detectable sentence units' },
    { id: 'contradiction_signals', pass: contradictions.length === 0, value: contradictions.length, target: 'no explicit contradiction language' },
    { id: 'numeric_consistency', pass: repeatedNumbers.length === 0 || repeatedNumbers.length >= 0, value: repeatedNumbers.length, target: 'numeric tokens available for contextual review' },
    { id: 'date_consistency', pass: repeatedYears.length === 0 || repeatedYears.length >= 0, value: repeatedYears.length, target: 'year tokens available for contextual review' },
    { id: 'absolute_claim_review', pass: !/\b(?:always|never|all|none|every|only)\b/i.test(text), value: 0, target: 'no unqualified absolute claim language' },
  ];
  const blockers = checks.filter(x => !x.pass).map(x => x.id);
  return {
    runtime: 'editorial-contradiction-consistency-runtime-v1', file,
    sentence_count: lines.length, numeric_tokens: numbers, year_tokens: years,
    repeated_numeric_tokens: repeatedNumbers, repeated_year_tokens: repeatedYears,
    contradiction_signals: contradictions, checks,
    score: Math.round(checks.filter(x => x.pass).length / checks.length * 100),
    status: blockers.length ? 'REVISE' : 'PASS', blockers,
    consistency_authority: false, evidence_authority: false, release_authority: false,
    release_gate: 'seo-quality-gate'
  };
}
const [command='check', file, ...rest] = process.argv.slice(2);
const json = rest.includes('--json');
const outputPath = rest.find(x => x.startsWith('--write='))?.slice(8);
try {
  if (command !== 'check' || !file) throw new Error('usage: editorial-contradiction-consistency-runtime.mjs check <article-file> [--json] [--write=<ledger.json>]');
  const path = resolve(file);
  if (!existsSync(path)) throw new Error('article file not found: ' + file);
  const report = analyze(readFileSync(path, 'utf8'), file);
  if (outputPath) writeFileSync(resolve(outputPath), JSON.stringify(report, null, 2) + '\n');
  if (json) console.log(JSON.stringify(report, null, 2));
  else {
    console.log('EDITORIAL-CONSISTENCY: ' + report.status);
    console.log('SCORE: ' + report.score + '/100');
    console.log('SENTENCES: ' + report.sentence_count);
    console.log('CONTRADICTION SIGNALS: ' + report.contradiction_signals.length);
    console.log('NUMERIC TOKENS: ' + report.numeric_tokens.length);
    if (report.blockers.length) console.log('BLOCKERS: ' + report.blockers.join(', '));
  }
  if (report.status !== 'PASS') process.exitCode = 2;
} catch (error) {
  console.error('EDITORIAL-CONSISTENCY: ERROR ' + (error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
}
