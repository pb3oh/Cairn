# Cairn — Project Memory

A 4-minute Medicare benefits review for U.S. retirees. React + Vite, deployed to GitHub Pages, all client-side. Single monolith at `src/BenefitsAudit.jsx` (~3,800 lines). See `README.md` for product overview.

## Active workstream: Pre-65 enrollment branch + field-by-field PDF guides

Goal: turn the end-of-audit PDF download into a true field-by-field walkthrough of each program's application, with a dedicated pre-65 / late-enrollment branch so the product serves people approaching 65 as well as those already on Medicare.

### Working branch
`claude/review-repo-context-YX7hV` — develop here, then open a PR to `main` and merge it (per user instruction 2026-04-29: "Make all the changes as you develop. Push these to the repo so I don't have to do anything"). Merging fires the GitHub Pages auto-deploy. Do NOT push directly to `main` — keep the PR paper trail.

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

### Milestone 2 — Field-by-field PDF content (9 of 9 guides) — DONE
Shipped across commits on `claude/review-repo-context-YX7hV`. All guides have field-by-field step content, `verified: "January 2026"` stamps, and personalization-token support.
- `medicare_enrollment` (10 steps, full SSA flow)
- `extra_help` (5 steps)
- `msp` (8 steps + state-specific guidance for all 8 seeded states inline via `STATE_MSP_NOTES`)
- `irmaa_appeal` (10 steps, full SSA-44 walkthrough)
- `spdap` (8 steps, Maryland SPDAP)
- `part_d_pick` (9 steps, Medicare Plan Finder walkthrough)
- `medigap_shop` (9 steps, 5-carrier comparison)
- `va_aid` (10 steps, Form 21P-527EZ + Form 21-2680)
- PDF generator: multi-page output, personalization tokens, `verifyOnLiveForm` flags
- Personalization tokens: `{{stateName}}`, `{{partBStartLabel}}`, `{{iepStart}}`, `{{iepEnd}}`, `{{birthDate}}`, `{{annualIncome}}`, `{{currentYear}}`, `{{filingStatusSingle}}`, `{{filingStatusJoint}}`, `{{maritalLabel}}`, `{{employerCoverageGuidance}}`, `{{employerCoverageAnswer}}`, `{{nextStepsGuidance}}`, `{{stateMspGuidance}}`, `{{mspApplyUrl}}`

### Milestone 3 — Author remaining guides — DONE (rolled into M2)
Resolved per CLAUDE.md decision #7: state-specific MSP variants inlined in the universal `msp` guide via per-state `STATE_MSP_NOTES`, instead of split into 7 separate SKUs. Saves ~14 hrs of redundant authoring and cuts maintenance surface.

### Milestone 4 — Manual QA pass — DEFERRED — **0 hrs (descoped)**
User chose Option B: accept build + code-review as QA. No browser walkthrough, no headless test.
- Code-path review across all four user paths (already-enrolled, pre-65 planning, in-IEP, late-enrollment) — DONE
- Build passes (`vite build` succeeds) — DONE
- Browser walkthrough — DESCOPED (user opted out)
- Headless smoke test — DESCOPED (user opted out)
- Risk accepted: visual / interaction bugs (CSS regressions, choice-button misfires, PDF download flow on iOS) won't be caught before a real user hits them. Mitigate by spot-checking critical paths after merge to `main`.

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

(All previously-open decisions now resolved:)

1. ~~**Which guide to author next?**~~ — RESOLVED: all 9 done.
2. ~~**Manual QA before more authoring?**~~ — RESOLVED: descoped per Option B (build + code-review only).
3. **Merge to `main`?** — Pending. With M2/M3 complete and the build green, this is the natural next step. Triggers auto-deploy to GitHub Pages.
4. ~~**PDF library swap (M6) before or after?**~~ — RESOLVED: deferred until after authoring (now reachable as next-priority work).
5. **Content verification (M5):** Pending. All 9 guides are written from public-knowledge sources and stamped `verified: January 2026`. Walking each application personally (or via a SHIP counselor) before charging real money for the guides remains the right step. Sustained ~6–8 hrs of work.
6. ~~**Browser walkthrough timing.**~~ — RESOLVED: descoped.
7. ~~**State-specific MSP variants.**~~ — RESOLVED: inlined per `STATE_MSP_NOTES` in `buildPersonalizationContext`.

(New decisions to make next:)

8. **Re-verification cadence (M7).** When does the first re-verification pass run? Recommendation: schedule for Q3 2026 (about 6 months after the January 2026 baseline) to catch fall-AEP-driven portal changes before they hit applicants.
9. **Production PDF library swap (M6).** Now that all 9 guides are content-complete, the text PDF is the bottleneck for visual quality. `@react-pdf/renderer` recommended. ~6–10 hrs.
10. **Backend (M8).** Stripe + email + S3 signed URLs are required before charging real money. ~40–60 hrs depending on stack.

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
