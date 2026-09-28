const ALLOWED_SKILLS = new Set(['blog-strategy','topic-research','keyword-intent','topical-authority','content-production','onpage-seo','internal-linking','structured-data','technical-seo','blogger-template-engineering','blogger-performance','adsense-ux','revenue-analytics','content-refresh','seo-quality-gate']);

export function createSkillInvocation({ skill, objective, evidence = [] }) {
  if (!ALLOWED_SKILLS.has(skill)) throw new Error(`Skill is not in canonical registry: ${skill}`);
  return { version: 1, skill, objective, evidence_ids: evidence.map(e => e.id).filter(Boolean), status: 'READY', authority: 'RUNTIME_HANDOFF_ONLY' };
}

export function validateSkillInvocation(invocation) {
  return ALLOWED_SKILLS.has(invocation.skill) && invocation.status === 'READY' && invocation.authority === 'RUNTIME_HANDOFF_ONLY';
}
