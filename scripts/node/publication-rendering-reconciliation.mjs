#!/usr/bin/env node
/** Stage 63 — public-post rendering reconciliation. Read-side only. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CdpSession } from './cdp-runtime/cdp-session.mjs';
import { loadDotEnv } from './dotenv.mjs';
loadDotEnv();
const ROOT = process.cwd();
const RUNS = join(ROOT, '04-revenue-system/07-intelligence/runs');
const json = f => existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null;
const save = (d,n,v) => writeFileSync(join(d,n), JSON.stringify(v,null,2)+'\n');
const norm = s => String(s||'').replace(/\s+/g,' ').trim();
async function main(){
  const [cmd,runId] = process.argv.slice(2);
  if(cmd!=='reconcile'||!runId) throw new Error('usage: publication-rendering-reconciliation.mjs reconcile <run_id>');
  const dir=join(RUNS,runId), obs=json(join(dir,'email-publication-observation.json')), msg=json(join(dir,'email-publication-message.json'));
  if(!obs?.public_post_url) throw new Error('public post URL missing');
  const targetId=(process.env.BLOGGER_TARGET_ID||'').trim();
  if(!targetId) throw new Error('BLOGGER_TARGET_ID missing');
  const s=new CdpSession({endpoint:process.env.CDP_ENDPOINT||'http://127.0.0.1:9222',targetId});
  await s.connect();
  try {
    const probe=JSON.parse(await s.evaluate(`JSON.stringify({url:location.href,title:document.title,text:document.body?.innerText||'',html:document.documentElement?.outerHTML||'',postCount:document.querySelectorAll('.post').length,checks:{h1:document.querySelectorAll('.post h1').length,h2:document.querySelectorAll('.post h2').length,ul:document.querySelectorAll('.post ul').length,li:document.querySelectorAll('.post li').length,blockquote:document.querySelectorAll('.post blockquote').length}})`));
    const expected=norm(obs.expected_title).toLowerCase();
    const body=probe.text.toLowerCase();
    const titleOk=probe.url===obs.public_post_url && body.includes(expected);
    const markdownLiteral=/(^|\n)#{1,6} |\*\*[^\n]+\*\*|(^|\n)> /m.test(probe.text);
    const rendered=probe.checks.h2>0 && probe.checks.ul>0 && !markdownLiteral;
    const status=rendered?'RENDERING_OK':titleOk?'RENDERING_DEGRADED':'UNVERIFIED';
    const result={runtime:'publication-rendering-reconciliation-v1',stage:63,run_id:runId,status,publication_status:titleOk?'PUBLISHED':'UNVERIFIED',rendering_status:status,public_post_url:obs.public_post_url,title_match:titleOk,markdown_literal_detected:markdownLiteral,dom:probe.checks,observed_at:new Date().toISOString(),cdp_target_id:targetId,external_side_effect:false,next_action:status==='RENDERING_DEGRADED'?'replace/repair publication through an authenticated Blogger write path; do not resend Mail-to-Blogger':'feed rendering result into measurement and learning'};
    save(dir,'publication-rendering-reconciliation.json',result);
    console.log(JSON.stringify(result,null,2));
    if(status==='UNVERIFIED') process.exitCode=2;
  } finally { s.close(); }
}
main().catch(e=>{console.error('PUBLICATION-RENDERING-RECONCILIATION: ERROR '+e.message);process.exitCode=1});
