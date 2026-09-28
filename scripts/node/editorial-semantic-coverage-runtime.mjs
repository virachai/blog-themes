#!/usr/bin/env node
/** Stage 27 — Editorial Semantic Coverage Runtime. Deterministic intent/subtopic coverage gate. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function stripHtml(input) {
  return input.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
function headings(source) {
  return /** @type {string[]} */ ((source.match(/<h[1-6][^>]*>[^<]+<\/h[1-6]>/gi) || []).map(x => x.replace(/<[^>]+>/g, '').trim()));
}
function paragraphs(source) {
  return /** @type {string[]} */ ((source.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || []).map(x => stripHtml(x)));
}
function keywords(text) {
  return [...new Set((text.toLowerCase().match(/[a-z0-9ก-๙]{4,}/gi) || []).filter(x => !/^(about|with|from|that|this|และ|ของ|เป็น|การ|ที่|ได้|ให้|แล้ว|หรือ|แต่|จาก|ใน|กับ)$/.test(x)))];
}
function analyze(source, file) {
  const text = stripHtml(source);
  const hs = headings(source);
  const ps = paragraphs(source);
  const words = keywords(text);
  const intentSignals = /(วิธี|how to|guide|ขั้นตอน|วิธีการ|ทำไม|why|best|เปรียบเทียบ|compare|ราคา|price|ข้อดี|ข้อเสีย|review|รีวิว|แก้ปัญหา|problem|คำแนะนำ|tips)/i.test(text);
  const questionSignals = (text.match(/\?/g) || []).length;
  const headingCoverage = hs.length >= 3;
  const sectionDepth = hs.length > 0 && ps.length >= hs.length;
  const topicRepetition = words.length > 0 && new Set(words).size / words.length >= 0.35;
  const checks = [
    { id: 'intent_signal', pass: intentSignals, value: intentSignals, target: 'article exposes a recognizable user-intent signal' },
    { id: 'question_or_problem_signal', pass: questionSignals > 0 || /\b(?:problem|solution|need|goal|issue)\b/i.test(text), value: questionSignals, target: 'user question/problem is explicit' },
    { id: 'heading_coverage', pass: headingCoverage, value: hs.length, target: '>= 3 semantic sections' },
    { id: 'section_depth', pass: sectionDepth, value: ps.length, target: 'paragraph coverage across sections' },
    { id: 'topic_coherence', pass: topicRepetition, value: words.length, target: 'sufficient recurring vocabulary for topic coherence' },
  ];
  const blockers = checks.filter(x => !x.pass).map(x => x.id);
  return {
    runtime: 'editorial-semantic-coverage-runtime-v1', file,
    heading_count: hs.length, paragraph_count: ps.length, keyword_count: words.length,
    intent_signal: intentSignals, question_signal_count: questionSignals,
    headings: hs, checks,
    coverage_score: Math.round(checks.filter(x => x.pass).length / checks.length * 100),
    status: blockers.length ? 'REVISE' : 'PASS', blockers,
    semantic_coverage_authority: false, editorial_authority: false, release_authority: false,
    release_gate: 'seo-quality-gate'
  };
}
const [command='check', file, ...rest] = process.argv.slice(2);
const json = rest.includes('--json');
const outputPath = rest.find(x => x.startsWith('--write='))?.slice(8);
try {
  if (command !== 'check' || !file) throw new Error('usage: editorial-semantic-coverage-runtime.mjs check <article-file> [--json] [--write=<ledger.json>]');
  const path = resolve(file);
  if (!existsSync(path)) throw new Error('article file not found: ' + file);
  const report = analyze(readFileSync(path, 'utf8'), file);
  if (outputPath) writeFileSync(resolve(outputPath), JSON.stringify(report, null, 2) + '\n');
  if (json) console.log(JSON.stringify(report, null, 2));
  else {
    console.log('EDITORIAL-SEMANTIC-COVERAGE: ' + report.status);
    console.log('SCORE: ' + report.coverage_score + '/100');
    console.log('HEADINGS: ' + report.heading_count);
    console.log('PARAGRAPHS: ' + report.paragraph_count);
    console.log('INTENT SIGNAL: ' + (report.intent_signal ? 'yes' : 'no'));
    if (report.blockers.length) console.log('BLOCKERS: ' + report.blockers.join(', '));
  }
  if (report.status !== 'PASS') process.exitCode = 2;
} catch (error) {
  console.error('EDITORIAL-SEMANTIC-COVERAGE: ERROR ' + (error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
}
