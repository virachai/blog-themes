# meefunblog Skill QA v1

## Purpose

Regression specification for the 15-skill meefunblog routing system.

## Canonical Skill Set

1. blog-strategy
2. topic-research
3. keyword-intent
4. topical-authority
5. content-production
6. onpage-seo
7. internal-linking
8. structured-data
9. technical-seo
10. blogger-template-engineering
11. blogger-performance
12. adsense-ux
13. revenue-analytics
14. content-refresh
15. seo-quality-gate

## Adversarial Routing Matrix

| Case | User intent                                              | Expected primary skill       | Required downstream                                           |
| ---- | -------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------- |
| R01  | Define blog niche and monetization boundaries            | blog-strategy                | topic-research                                                |
| R02  | Find topics from demand, SERPs and content gaps          | topic-research               | keyword-intent                                                |
| R03  | Map queries to search intent and page type               | keyword-intent               | topical-authority                                             |
| R04  | Build a topical cluster and identify gaps                | topical-authority            | content-production                                            |
| R05  | Draft a useful original article                          | content-production           | onpage-seo                                                    |
| R06  | Optimize title, headings, metadata and article SEO       | onpage-seo                   | internal-linking / structured-data                            |
| R07  | Add contextual internal links                            | internal-linking             | seo-quality-gate                                              |
| R08  | Add schema only when supported by visible content        | structured-data              | technical-seo                                                 |
| R09  | Diagnose crawlability, canonicals, robots or duplication | technical-seo                | blogger-template-engineering when template changes are needed |
| R10  | Modify Blogger XML/widgets/template safely               | blogger-template-engineering | blogger-performance                                           |
| R11  | Diagnose CWV, loading, CSS/JS/fonts or third parties     | blogger-performance          | adsense-ux when monetization is affected                      |
| R12  | Review ad placement and monetization UX                  | adsense-ux                   | seo-quality-gate                                              |
| R13  | Analyze Search Console/Analytics/AdSense data            | revenue-analytics            | content-refresh when declining content is identified          |
| R14  | Refresh stale or declining content                       | content-refresh              | seo-quality-gate                                              |
| R15  | Publish or make a material site/content change           | seo-quality-gate             | release decision                                              |

## Collision Tests

- “Improve article SEO” routes to onpage-seo, not directly to the final gate.
- “Fix Blogger XML template” routes to blogger-template-engineering, not generic frontend work.
- “Improve page speed” routes to blogger-performance for Blogger-specific work.
- “Add schema” routes to structured-data; crawl/index/canonical concerns belong to technical-seo.
- “Refresh declining article” routes to content-refresh, not content-production.
- “Choose profitable topics” starts with topic-research when blog strategy already exists; use blog-strategy only when strategy is undefined.
- Any publish/material-change request terminates at seo-quality-gate.

## Invariants

1. Registry contains exactly 15 canonical skills.
2. .agents/skills and .claude/skills contain exactly the registry set.
3. Every canonical skill has SKILL.md.
4. Every non-gate skill explicitly hands off toward seo-quality-gate.
5. Registry dependencies contain no unknown nodes and no cycles.
6. Quarantined third-party skills are not routable.
7. skills-lock.json must not advertise skills absent from the canonical set.

## QA Command

Use the repository normal validation/check workflow and verify all invariants above before release.
