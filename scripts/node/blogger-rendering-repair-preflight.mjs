#!/usr/bin/env node
/** Stage 63 — authenticated Blogger rendering-repair preflight. Read-side only. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CdpSession } from './cdp-runtime/cdp-session.mjs';
import { loadDotEnv } from './dotenv.mjs';
loadDotEnv();
const ROOT=process.cwd(), RUNS=join(ROOT,'04-revenue-system/07-intelligence/runs');
const json=f=>existsSync(f)?JSON.parse(readFileSync(f,'utf8')):null;
const save=(d,n,v)=>writeFileSync(join(d,n),JSON.stringify(v,null,2)+'\n');
async function main(){
 const [cmd,runId]=process.argv.slice(2); if(cmd!=='preflight'||!runId) throw new Error('usage: blogger-rendering-repair-preflight.mjs preflight <run_id>');
 const dir=join(RUNS,runId), rec=json(join(dir,'publication-rendering-reconciliation.json'));
 if(!rec) throw new Error('rendering reconciliation missing');
 const endpoint=process.env.CDP_ENDPOINT||'http://127.0.0.1:9222', targetId=(process.env.BLOGGER_REPAIR_TARGET_ID||'').trim();
 const result={runtime:'blogger-rendering-repair-preflight-v1',stage:63,run_id:runId,status:'BLOCKED',external_side_effect:false,rendering_status:rec.rendering_status,requirements:{authenticated_blogger_editor_target:false,explicit_repair_consent:false,html_payload_path:false},target:null,next_action:'open an authenticated Blogger editor target, set BLOGGER_REPAIR_TARGET_ID, then run this preflight again; do not resend Mail-to-Blogger'};
 if(rec.rendering_status!=='RENDERING_DEGRADED'){result.status='NOT_REQUIRED'; result.next_action='no rendering repair required'; save(dir,'blogger-rendering-repair-preflight.json',result); console.log(JSON.stringify(result,null,2)); return;}
 if(!targetId){save(dir,'blogger-rendering-repair-preflight.json',result); console.log(JSON.stringify(result,null,2)); return;}
 const s=new CdpSession({endpoint,targetId,targetPolicy:'required'});
 try { await s.connect(); const info=JSON.parse(await s.evaluate(`JSON.stringify({url:location.href,title:document.title,contenteditable:document.querySelectorAll('[contenteditable="true"]').length,login:(/accounts\\.google\\.com|signin/i.test(location.href)||/sign in|sign-in/i.test(document.body?.innerText||''))})`)); result.target={target_id:targetId,...info}; result.requirements.authenticated_blogger_editor_target=/blogger\\.com\\//i.test(info.url)&&!info.login&&info.contenteditable>0; result.status=result.requirements.authenticated_blogger_editor_target?'READY_FOR_OPERATOR_CONSENT':'BLOCKED'; result.next_action=result.status==='READY_FOR_OPERATOR_CONSENT'?'set explicit repair consent before any external edit; preflight still performs no edit':'target is not an authenticated Blogger editor'; }
 finally{s.close()}
 save(dir,'blogger-rendering-repair-preflight.json',result); console.log(JSON.stringify(result,null,2));
}
main().catch(e=>{console.error('BLOGGER-RENDERING-REPAIR-PREFLIGHT: ERROR '+e.message);process.exitCode=1});
