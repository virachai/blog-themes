/** Lean Stages 43-47 Cognitive Policy Governance Runtime. */
import { existsSync, readFileSync, appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const M = join(process.cwd(), "04-revenue-system/07-intelligence/cognitive-memory");
const F = {
  knowledge: "knowledge-eligibility.jsonl",
  bindings: "policy-evidence-bindings.jsonl",
  eligibility: "policy-proposal-eligibility.jsonl",
  policies: "policies.jsonl",
  events: "policy-events.jsonl",
  verifications: "policy-verifications.jsonl",
  gates: "policy-activation-gates.jsonl",
};
const path = (k) => join(M, F[k]);
function ensure() {
  mkdirSync(M, { recursive: true });
  F.events = "policy-events.jsonl";
  for (const k of Object.keys(F)) if (!existsSync(path(k))) writeFileSync(path(k), "");
}
function read(k) {
  ensure();
  return readFileSync(path(k), "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
}
function add(k, row, prefix) {
  appendFileSync(
    path(k),
    JSON.stringify({
      id: prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      created_at: new Date().toISOString(),
      authority: false,
      ...row,
    }) + "\n"
  );
}
function bind(a) {
  const [
    knowledgeId,
    policyScope = "policy",
    purpose = "policy-proposal",
    claim = "derived-from-eligible-knowledge",
    evidence = "eligibility-record",
  ] = a;
  if (!knowledgeId)
    throw Error("usage: bind <eligibility_id> [policy_scope] [purpose] [claim] [evidence]");
  const x = read("knowledge").find((v) => v.id === knowledgeId);
  if (!x) throw Error("unknown eligibility id: " + knowledgeId);
  if (x.eligibility !== "ELIGIBLE" || x.status !== "ELIGIBLE")
    throw Error("binding requires ELIGIBLE knowledge");
  const row = {
    knowledge_id: knowledgeId,
    policy_scope: policyScope,
    purpose,
    claim,
    evidence,
    status: "BOUND_PROPOSAL",
    gate: "EVIDENCE_BOUND",
  };
  add("bindings", row, "BIND");
  console.log(
    JSON.stringify(
      {
        runtime: "cognitive-policy-governance-runtime-v2",
        stage: 43,
        status: row.status,
        binding: row,
      },
      null,
      2
    )
  );
}
function proposalAssess(a) {
  const [
    bindingId,
    reviewer = "review",
    rationale = "evidence-binding-reviewed",
    threshold = "required-lineage",
  ] = a;
  if (!bindingId) throw Error("usage: assess <binding_id> [reviewer] [rationale] [threshold]");
  const b = read("bindings").find((x) => x.id === bindingId);
  if (!b) throw Error("unknown binding id: " + bindingId);
  if (b.gate !== "EVIDENCE_BOUND" || b.status !== "BOUND_PROPOSAL")
    throw Error("proposal eligibility requires EVIDENCE_BOUND binding");
  const row = {
    binding_id: bindingId,
    knowledge_id: b.knowledge_id,
    reviewer,
    rationale,
    threshold,
    status: "PROPOSAL_ELIGIBILITY_PROPOSED",
    eligibility: "CANDIDATE",
    gate: "REVIEW_REQUIRED",
  };
  add("eligibility", row, "PPE");
  console.log(
    JSON.stringify(
      {
        runtime: "cognitive-policy-governance-runtime-v2",
        stage: 44,
        status: row.status,
        eligibility: row,
      },
      null,
      2
    )
  );
}
function proposalApprove(id) {
  const x = read("eligibility").find((v) => v.id === id);
  if (!x) throw Error("unknown proposal eligibility id: " + id);
  if (x.eligibility !== "CANDIDATE") throw Error("eligibility is not CANDIDATE");
  const row = {
    binding_id: x.binding_id,
    knowledge_id: x.knowledge_id,
    reviewer: x.reviewer,
    rationale: x.rationale,
    threshold: x.threshold,
    status: "PROPOSAL_ELIGIBLE",
    eligibility: "ELIGIBLE",
    gate: "PASSED",
    approved_from: id,
  };
  add("eligibility", row, "PPE");
  console.log(
    JSON.stringify(
      {
        runtime: "cognitive-policy-governance-runtime-v2",
        stage: 44,
        status: row.status,
        proposal_eligibility: row,
      },
      null,
      2
    )
  );
}
function propose(a) {
  const [
    eligibilityId,
    name,
    scope,
    condition,
    action,
    confidence = "0.5",
    source = "stage-45-evidence-lineage",
    preconditions = "review-required",
    expiresAt = "",
    rollback = "manual-review",
  ] = a;
  if (!eligibilityId || !name || !scope || !condition || !action)
    throw Error(
      "usage: propose <eligibility_id> <name> <scope> <condition> <action> [confidence] [source] [preconditions] [expires_at] [rollback]"
    );
  const e = read("eligibility").find((x) => x.id === eligibilityId);
  if (!e) throw Error("unknown proposal eligibility id: " + eligibilityId);
  if (e.eligibility !== "ELIGIBLE" || e.status !== "PROPOSAL_ELIGIBLE")
    throw Error("policy proposal requires PROPOSAL_ELIGIBLE evidence");
  const c = Number(confidence);
  if (!Number.isFinite(c) || c < 0 || c > 1) throw Error("confidence must be 0..1");
  const row = {
    name,
    scope,
    condition,
    action,
    confidence: c,
    source,
    preconditions,
    expires_at: expiresAt || null,
    rollback,
    evidence_lineage: {
      proposal_eligibility_id: eligibilityId,
      binding_id: e.binding_id,
      knowledge_id: e.knowledge_id,
    },
    status: "PROPOSED",
  };
  appendFileSync(
    path("policies"),
    JSON.stringify({
      id: "POL-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      created_at: new Date().toISOString(),
      lifecycle: "PROPOSED",
      authority: false,
      ...row,
    }) + "\n"
  );
  console.log(
    JSON.stringify(
      {
        runtime: "cognitive-policy-governance-runtime-v2",
        stage: 45,
        status: "PROPOSED",
        policy: row,
      },
      null,
      2
    )
  );
}
function verify(a) {
  const [id, attack = "standard", reviewer = "verification-runtime", notes = "adversarial-check"] =
    a;
  if (!id) throw Error("usage: verify <policy_id> [attack] [reviewer] [notes]");
  const p = read("policies").find((x) => x.id === id);
  if (!p) throw Error("unknown policy id: " + id);
  const l = p.evidence_lineage || {},
    findings = [];
  for (const k of ["proposal_eligibility_id", "binding_id", "knowledge_id"])
    if (!l[k]) findings.push("MISSING_" + k.toUpperCase());
  if (!p.condition) findings.push("MISSING_CONDITION");
  if (!p.action) findings.push("MISSING_ACTION");
  if (!p.rollback) findings.push("MISSING_ROLLBACK");
  const gate = findings.length ? "BLOCK" : "PASS";
  const row = {
    policy_id: id,
    policy_version: p.version || 1,
    attack,
    reviewer,
    notes,
    findings,
    gate,
    status: gate === "PASS" ? "VERIFIED" : "REGRESSION_FLAG",
  };
  add("verifications", row, "VERIFY");
  console.log(
    JSON.stringify(
      {
        runtime: "cognitive-policy-governance-runtime-v2",
        stage: 46,
        status: row.status,
        verification: row,
      },
      null,
      2
    )
  );
}
function gate(a) {
  const [policyId, reviewer = "activation-gate", notes = "pre-activation-gate"] = a;
  if (!policyId) throw Error("usage: gate <policy_id> [reviewer] [notes]");
  const p = read("policies").find((x) => x.id === policyId);
  if (!p) throw Error("unknown policy id: " + policyId);
  const lineage = p.evidence_lineage || {},
    vs = read("verifications").filter((x) => x.policy_id === policyId),
    findings = [];
  for (const k of ["proposal_eligibility_id", "binding_id", "knowledge_id"])
    if (!lineage[k]) findings.push("MISSING_" + k.toUpperCase());
  if (!vs.length) findings.push("MISSING_ADVERSARIAL_VERIFICATION");
  if (vs.length && !vs.some((x) => x.gate === "PASS" && x.status === "VERIFIED"))
    findings.push("NO_PASSING_VERIFICATION");
  const g = findings.length ? "BLOCK" : "PASS";
  const row = {
    policy_id: policyId,
    reviewer,
    notes,
    verification_ids: vs.map((x) => x.id),
    findings,
    gate: g,
    status: g === "PASS" ? "ACTIVATION_ELIGIBLE" : "ACTIVATION_BLOCKED",
  };
  add("gates", row, "ACTG");
  console.log(
    JSON.stringify(
      {
        runtime: "cognitive-policy-governance-runtime-v2",
        stage: 47,
        status: row.status,
        gate: row,
      },
      null,
      2
    )
  );
}
function policies() {
  return read("policies");
}
function events() {
  return read("events");
}
function appendEvent(policy_id, event, extra = {}) {
  const row = {
    id: "PEVENT-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
    created_at: new Date().toISOString(),
    policy_id,
    event,
    authority: true,
    ...extra,
  };
  appendFileSync(path("events"), JSON.stringify(row) + "\n");
  return row;
}
function derive(policy) {
  const ev = events().filter((x) => x.policy_id === policy.id);
  let status = policy.status || "PROPOSED",
    version = 0,
    last = null;
  for (const e of ev) {
    if (e.event === "ACTIVATE") {
      status = "ACTIVE";
      version = e.version ?? version + 1;
    } else if (e.event === "SUSPEND" && status === "ACTIVE") status = "SUSPENDED";
    else if (e.event === "RESUME" && status === "SUSPENDED") status = "ACTIVE";
    else if (e.event === "RETIRE") status = "RETIRED";
    else if (e.event === "ROLLBACK") status = e.restore_state || "PROPOSED";
    last = e;
  }
  if (
    status === "ACTIVE" &&
    policy.expires_at &&
    new Date(policy.expires_at).getTime() <= Date.now()
  )
    status = "SUSPENDED";
  return { ...policy, status, version, last_event: last?.event ?? null, event_count: ev.length };
}
function findPolicy(id) {
  const p = policies().find((x) => x.id === id);
  if (!p) throw Error("unknown policy id: " + id);
  return derive(p);
}
function requireState(p, allowed) {
  if (!allowed.includes(p.status))
    throw Error("policy " + p.id + " is " + p.status + "; expected " + allowed.join(" or "));
}
function activate(a) {
  const [id, expiresAt = ""] = a,
    p = findPolicy(id);
  requireState(p, ["PROPOSED", "SUSPENDED"]);
  if (expiresAt && Number.isNaN(new Date(expiresAt).getTime())) throw Error("invalid expires_at");
  const e = appendEvent(id, "ACTIVATE", {
    version: p.version + 1,
    expires_at: expiresAt || p.expires_at || null,
  });
  console.log(
    JSON.stringify(
      {
        runtime: "cognitive-policy-governance-runtime-v2",
        stage: 36,
        status: "POLICY_ACTIVE",
        policy: findPolicy(id),
        event: e,
        authority: { explicit_activation: true, policy_edit: false },
      },
      null,
      2
    )
  );
}
function transition(id, event, allowed) {
  const p = findPolicy(id);
  requireState(p, allowed);
  const e = appendEvent(id, event, event === "ROLLBACK" ? { restore_state: "PROPOSED" } : {});
  console.log(
    JSON.stringify(
      {
        runtime: "cognitive-policy-governance-runtime-v2",
        stage: 36,
        status: "POLICY_" + event,
        policy: findPolicy(id),
        event: e,
        authority: { lifecycle_transition: true, policy_edit: false },
      },
      null,
      2
    )
  );
}
function lifecycleStatus() {
  const rows = policies().map(derive);
  console.log(
    JSON.stringify(
      {
        runtime: "cognitive-policy-governance-runtime-v2",
        stage: "36-47",
        status: "READY",
        policies: rows.length,
        active: rows.filter((x) => x.status === "ACTIVE").length,
        suspended: rows.filter((x) => x.status === "SUSPENDED").length,
        retired: rows.filter((x) => x.status === "RETIRED").length,
        events: events().length,
        authority: { policy_activation: true, policy_lifecycle: true, policy_edit: false },
      },
      null,
      2
    )
  );
}
function lifecycleReview(id) {
  const rows = policies()
    .map(derive)
    .filter((x) => !id || x.id === id);
  console.log(
    JSON.stringify(
      {
        runtime: "cognitive-policy-governance-runtime-v2",
        status: "POLICY_LIFECYCLE_REVIEW",
        count: rows.length,
        policies: rows,
      },
      null,
      2
    )
  );
}
function evaluateActive() {
  const rows = policies().map(derive);
  console.log(
    JSON.stringify(
      {
        runtime: "cognitive-policy-governance-runtime-v2",
        status: "ACTIVE_POLICY_SET",
        count: rows.filter((x) => x.status === "ACTIVE").length,
        policies: rows.filter((x) => x.status === "ACTIVE"),
      },
      null,
      2
    )
  );
}

function review(id) {
  const q = (k) =>
    read(k).filter((x) => !id || x.id === id || x.policy_id === id || x.binding_id === id);
  console.log(
    JSON.stringify(
      {
        runtime: "cognitive-policy-governance-runtime-v2",
        status: "GOVERNANCE_REVIEW",
        bindings: q("bindings"),
        eligibility: q("eligibility"),
        policies: q("policies"),
        verifications: q("verifications"),
        gates: q("gates"),
      },
      null,
      2
    )
  );
}
function status() {
  ensure();
  console.log(
    JSON.stringify(
      {
        runtime: "cognitive-policy-governance-runtime-v2",
        stages: "36-47",
        status: "READY",
        bindings: read("bindings").length,
        eligibility: read("eligibility").length,
        policies: read("policies").length,
        verifications: read("verifications").length,
        gates: read("gates").length,
        authority: {
          evidence_binding: true,
          proposal_eligibility: true,
          policy_proposal: true,
          adversarial_verification: true,
          activation_gate: true,
          policy_activation: false,
        },
      },
      null,
      2
    )
  );
}
function knowledgeAssess(a) {
  const [promotionId, scope = 'policy', purpose = 'decision-support', evidence = 'trusted-learning'] = a;
  if (!promotionId) throw Error('usage: knowledge-assess <promotion_id> [scope] [purpose] [evidence]');
  const p = read('promotions').find(x => x.id === promotionId);
  if (!p) throw Error('unknown promotion id: ' + promotionId);
  if (p.trust !== 'TRUSTED' || p.status !== 'TRUSTED') throw Error('eligibility requires TRUSTED knowledge');
  const row = { knowledge_id: promotionId, scope, purpose, evidence, status: 'ELIGIBILITY_PROPOSED', eligibility: 'CANDIDATE', gate: 'REVIEW_REQUIRED' };
  add('knowledge', row, 'ELIG');
  console.log(JSON.stringify({ runtime: 'cognitive-policy-governance-runtime-v2', stage: 42, status: row.status, eligibility: row }, null, 2));
}
function knowledgeApprove(id) {
  const x = read('knowledge').find(v => v.id === id);
  if (!x) throw Error('unknown knowledge eligibility id: ' + id);
  if (x.eligibility !== 'CANDIDATE') throw Error('eligibility is not CANDIDATE');
  const row = { knowledge_id: x.knowledge_id, scope: x.scope, purpose: x.purpose, evidence: x.evidence, status: 'ELIGIBLE', eligibility: 'ELIGIBLE', gate: 'PASSED', approved_from: id };
  add('knowledge', row, 'ELIG');
  console.log(JSON.stringify({ runtime: 'cognitive-policy-governance-runtime-v2', stage: 42, status: row.status, eligibility: row }, null, 2));
}
function knowledgeReview(id) {
  const rows = read('knowledge').filter(x => !id || x.id === id || x.knowledge_id === id);
  console.log(JSON.stringify({ runtime: 'cognitive-policy-governance-runtime-v2', stage: 42, status: 'KNOWLEDGE_ELIGIBILITY_REVIEW', count: rows.length, records: rows }, null, 2));
}

const [cmd, ...a] = process.argv.slice(2);
try {
  if (cmd === "init" || cmd === "status") {
    if (cmd === "init") ensure();
    status();
  } else if (cmd === "bind") bind(a);
  else if (cmd === "assess") proposalAssess(a);
  else if (cmd === "approve") approve(a[0]);
  else if (cmd === "propose") propose(a);
  else if (cmd === "verify") verify(a);
  else if (cmd === "gate") gate(a);
  else if (cmd === "activate") activate(a);
  else if (cmd === "suspend") transition(a[0], "SUSPEND", ["ACTIVE"]);
  else if (cmd === "resume") transition(a[0], "RESUME", ["SUSPENDED"]);
  else if (cmd === "retire") transition(a[0], "RETIRE", ["ACTIVE", "SUSPENDED", "PROPOSED"]);
  else if (cmd === "rollback") transition(a[0], "ROLLBACK", ["ACTIVE", "SUSPENDED"]);
  else if (cmd === "lifecycle-review") lifecycleReview(a[0]);
  else if (cmd === "evaluate-active") evaluateActive();
  else if (cmd === "review") review(a[0]);
  else
    throw Error(
      "usage: init|status|bind|assess|approve|propose|verify|gate|activate|suspend|resume|retire|rollback|lifecycle-review|evaluate-active|review"
    );
} catch (e) {
  console.error("COGNITIVE-POLICY-GOVERNANCE: ERROR " + e.message);
  process.exitCode = 1;
}
