#!/usr/bin/env node
/** Stage 23 — Editorial Fact & Freshness Runtime. Deterministic freshness/conflict gate. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function stripHtml(input) {
  return input.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
function sourcesOf(source) {
  return /** @type {string[]} */ (source.match(/https?:\/\/[^\s"'<>]+/gi) || []);
}
function yearsOf(text) {
  return [...new Set((text.match(/\b(?:19|20)\d{2}\b/g) || []).map(Number))].sort((a, b) => a - b);
}
function numericClaimsOf(text) {
  return [...new Set((text.match(/\b\d+(?:[.,]\d+)?(?:%|\s*(?:million|billion|thousand))?\b/gi) || []).map(x => x.trim()))].slice(0, 100);
}
function dateSignalsOf(text) {
  return (text.match(/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\b|\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b/gi) || []).slice(0, 100);
}
function analyze(source, file, referenceYear = new Date().getUTCFullYear()) {
  const text = stripHtml(source), sources = sourcesOf(source), years = yearsOf(text);
  const numericClaims = numericClaimsOf(text), dates = dateSignalsOf(text);
  const staleYears = years.filter(year => referenceYear - year >= 3);
  const checks = [
    { id: 'freshness_metadata', pass: years.length > 0 || dates.length > 0, value: years.length + dates.length, target: 'explicit date/year signal' },
    { id: 'stale_years', pass: staleYears.length === 0, value: staleYears, target: 'no year >=3 years older than reference year without review' },
    { id: 'numeric_claims_review', pass: numericClaims.length === 0 || sources.length > 0, value: numericClaims.length, target: 'numeric claims have source signals' },
    { id: 'source_date_signal', pass: sources.length === 0 || years.length > 0 || dates.length > 0, value: sources.length, target: 'sources paired with date/year context' },
    { id: 'conflict_signal', pass: !/\b(?:vs\.?|versus|compared with|from .* to .*|between .* and .*|respectively)\b/i.test(text), value: 0, target: 'no unresolved explicit comparison/conflict signal' },
  ];
  const blockers = checks.filter(x => !x.pass).map(x => x.id);
  return { runtime: 'editorial-fact-freshness-runtime-v1', file, reference_year: referenceYear, years, dates, stale_years: staleYears, numeric_claims: numericClaims, source_count: sources.length, sources, checks, score: Math.round(checks.filter(x => x.pass).length / checks.length * 100), status: blockers.length ? 'REVISE' : 'PASS', blockers, freshness_authority: false, evidence_authority: false, release_authority: false, release_gate: 'seo-quality-gate' };
}
const [command='check', file, ...rest] = process.argv.slice(2);
const json = rest.includes('--json');
const outputPath = rest.find(x => x.startsWith('--write='))?.slice(8);
const yearArg = rest.find(x => x.startsWith('--year='))?.slice(7);
try {
  if (command !== 'check' || !file) throw new Error('usage: editorial-fact-freshness-runtime.mjs check <article-file> [--json] [--year=YYYY] [--write=<ledger.json>]');
  const path = resolve(file);
  if (!existsSync(path)) throw new Error('article file not found: ' + file);
  const report = analyze(readFileSync(path, 'utf8'), file, yearArg ? Number(yearArg) : undefined);
  if (outputPath) writeFileSync(resolve(outputPath), JSON.stringify(report, null, 2) + '\n');
  if (json) console.log(JSON.stringify(report, null, 2));
  else { console.log('EDITORIAL-FACT-FRESHNESS: ' + report.status); console.log('SCORE: ' + report.score + '/100'); console.log('YEARS: ' + report.years.join(', ')); console.log('STALE YEARS: ' + (report.stale_years.join(', ') || 'none')); console.log('NUMERIC CLAIMS: ' + report.numeric_claims.length); if (report.blockers.length) console.log('BLOCKERS: ' + report.blockers.join(', ')); }
  if (report.status !== 'PASS') process.exitCode = 2;
} catch (error) { console.error('EDITORIAL-FACT-FRESHNESS: ERROR ' + (error instanceof Error ? error.message : String(error))); process.exitCode = 1; }
