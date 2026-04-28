# Cairn — Project Memory

A 4-minute Medicare benefits review for U.S. retirees. React + Vite, deployed to GitHub Pages, all client-side. Single monolith at `src/BenefitsAudit.jsx` (~3,800 lines). See `README.md` for product overview.

## Active workstream: Pre-65 enrollment branch + field-by-field PDF guides

Goal: turn the end-of-audit PDF download into a true field-by-field walkthrough of each program's application, with a dedicated pre-65 / late-enrollment branch so the product serves people approaching 65 as well as those already on Medicare.

### Working branch
`claude/review-repo-context-YX7hV` — push here, do not push to `main` without explicit user approval (main auto-deploys to GitHub Pages).

---

## Roadmap and status

### Milestone 1 — Pre-65 enrollment plumbing — DONE
Shipped in commit b702420 on branch `claude/review-repo-context-YX7hV`.
- `age` question replaced with `birth_month` + `birth_year`
- `getAge()` and `getIEPWindow()` helpers compute hard IEP dates
- Three conditional questions added (`drawing_ss`, `employer_coverage`, `creditable_rx`), gated by `medicare_status === "not_yet"` via `showIf` predicate
- `Audit` component filters QUESTIONS by `showIf` so conditional questions skip automatically
- Late-enrollment branch (`age >= 66 + not_yet`) with Part B penalty math and CMS-L564 SEP guidance
- In-IEP branch (`age 64-65 + not_yet`) renders the user's actual IEP window dates
- `generateWatchouts` updated with hard-date IEP, late-enrollment %, and Part D penalty alerts

### Milestone 2 — Field-by-field PDF content (3 of 9 guides) — DONE
Shipped in same commit.
- `medicare_enrollment` (10 steps, full SSA flow)
- `extra_help` (5 steps)
- `msp` (8 steps, Medicare Savings Programs)
- PDF generator rewritten for multi-page output
- Personalization tokens (`{{stateName}}`, `{{partBStartLabel}}`, `{{birthDate}}`, etc.) substitute from audit answers
- `verified: "January 2026"` stamp on title page

### Milestone 3 — Author remaining 6 guides — NOT STARTED
Estimated ~20-25 hours of content authoring work. Order suggested by impact/effort ratio:
1. `spdap` (Maryland SPDAP) — small flow, single state — **~3 hrs**
2. `irmaa_appeal` (Form SSA-44) — single PDF form, well-documented — **~3 hrs**
3. `part_d_pick` (Medicare Plan Finder walkthrough) — **~4 hrs**
4. `medigap_shop` (5-carrier comparison flow) — **~5 hrs**
5. `va_aid` (VA Aid & Attendance) — paperwork-heavy, multi-form — **~6 hrs**
6. State-specific MSP variants for the 7 other seeded states (CA, NY, FL, TX, PA, VA, DC) — **~2 hrs each, ~14 hrs total** (could also be deferred and handled by per-state notes inside the universal MSP guide)

### Milestone 4 — Manual QA pass — NOT STARTED — **~2 hrs**
Done from a real browser, not just a build check.
- Click through pre-65 / in-IEP / late-enrollment / already-enrolled flows end-to-end
- Generate each of the 3 authored PDFs and confirm they open + render correctly
- Verify personalization tokens fill correctly for users in each seeded state
- Verify conditional questions hide / appear correctly when changing `medicare_status` answer

### Milestone 5 — Content verification against live forms — NOT STARTED — **~6-8 hrs**
The field lists in the 3 authored guides are based on general knowledge of SSA/state Medicaid flows. Before shipping as a paid product, walk each application personally (or have a SHIP counselor review) and reconcile against the live screens. Update field labels, default values, and notes where they diverge.

### Milestone 6 — Production PDF rendering — NOT STARTED — **~6-10 hrs**
Current PDF generator is pure-text and produces ugly output. Options:
- `@react-pdf/renderer` (declarative React-style) — best fit for project's React stack
- `pdf-lib` (lower-level, supports image embed for screenshots)
Either swap unblocks: annotated screenshots per step, page numbers, real typography, per-buyer watermarking.

### Milestone 7 — Re-verification cadence — NOT STARTED — **~2 hrs setup, ongoing quarterly review**
Without a process, guides go stale and become a liability. Needed:
- Surface `verified` date on the guide store and PDF cover
- Stale warning UI when verified date is >120 days old
- Quarterly calendar reminder + checklist of what to re-check per guide

### Milestone 8 — Backend-required features (per README) — DEFERRED
None of these block Milestones 3-7. Required before charging real money:
- Stripe payment processing (replace demo form)
- Email delivery (SendGrid / Resend / Postmark)
- Pre-generated, watermarked PDFs hosted on S3 with signed URLs
- Persistent accounts and order history
Estimated ~40-60 hrs depending on stack choice.

---

## Open decisions for the user

1. **Which guide to author next?** Recommendation: `spdap` (smallest scope, validates the schema for state-specific guides) or `irmaa_appeal` (universal, single SSA form, highest accuracy possible from public documentation).
2. **Manual QA before more authoring?** Recommendation: yes — Milestone 4 catches problems with the framework before more content is written against it.
3. **Merge to `main`?** Triggers auto-deploy to GitHub Pages. Only do this once Milestone 4 is complete; otherwise broken flows ship to production.
4. **PDF library swap (Milestone 6) before or after authoring the remaining 6 guides?** Recommendation: after — the current text PDF is good enough to validate content and personalization. Authoring all 9 guides first means only one rewrite of the rendering code.
5. **Content verification (Milestone 5):** SHIP counselor review or walk-through self-verification? SHIP review is more authoritative but requires scheduling.

## Conventions for ongoing work

- All Medicare/state thresholds (`FPL_2026`, `THRESHOLDS`, MSP / LIS / SNAP limits, Part B premium) update each January — flag in PR if a year boundary is crossed mid-task.
- Each authored guide must have a `verified` date matching when its content was last reconciled to live application screens.
- Personalization tokens go in `buildPersonalizationContext()` in `BenefitsAudit.jsx`. Add new tokens there, not inline.
- New questions: add to `QUESTIONS` array; use `showIf(answers)` for conditionals; reference via the existing question types (`number`, `choice`, `zip`).
- Do NOT push to `main` without explicit user approval.

## How to give the user ongoing updates

When resuming this workstream in a future session:
1. Check `git log` against the last "DONE" milestone entry above.
2. Re-run `npm run build` to confirm baseline is green.
3. Pick the next NOT STARTED milestone the user picked in "Open decisions."
4. Update this file when a milestone moves status (DONE / IN PROGRESS / BLOCKED). Include commit SHA for completed work.
5. If a milestone takes materially longer or shorter than estimated, update the estimate so the next session has accurate numbers.
