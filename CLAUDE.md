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

### Milestone 2 — Field-by-field PDF content (5 of 9 guides) — IN PROGRESS
Shipped across commits on `claude/review-repo-context-YX7hV`.
- `medicare_enrollment` (10 steps, full SSA flow) — DONE
- `extra_help` (5 steps) — DONE
- `msp` (8 steps, Medicare Savings Programs) — DONE
- `irmaa_appeal` (10 steps, full SSA-44 walkthrough) — DONE
- `spdap` (8 steps, Maryland SPDAP) — DONE
- PDF generator rewritten for multi-page output — DONE
- Personalization tokens (`{{stateName}}`, `{{partBStartLabel}}`, `{{birthDate}}`, `{{annualIncome}}`, `{{currentYear}}`, `{{filingStatusSingle}}`, `{{filingStatusJoint}}`, `{{maritalLabel}}`, etc.) substitute from audit answers — DONE
- `verified: "January 2026"` stamp on title page — DONE
- `verifyOnLiveForm: true` flag at field level for content that warrants live-form double-check — DONE

### Milestone 3 — Author remaining 4 guides — NOT STARTED
Estimated ~15-17 hours. Order suggested by impact/effort ratio:
1. `part_d_pick` (Medicare Plan Finder walkthrough) — **~4 hrs**
2. `medigap_shop` (5-carrier comparison flow) — **~5 hrs**
3. `va_aid` (VA Aid & Attendance) — paperwork-heavy, multi-form — **~6 hrs**
4. State-specific MSP variants for the 7 other seeded states (CA, NY, FL, TX, PA, VA, DC) — **~2 hrs each, ~14 hrs total** (could also be deferred and handled by per-state notes inside the universal MSP guide)

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

(Status of the original 5 decisions after this session's work:)

1. ~~**Which guide to author next?**~~ — RESOLVED: `irmaa_appeal` and `spdap` both authored. Next: `part_d_pick`.
2. ~~**Manual QA before more authoring?**~~ — PARTIAL: code-path review done; browser walkthrough still needed (user action).
3. **Merge to `main`?** — Still pending, but M4 is now descoped. Updated recommendation: it's safe to merge after each guide's content lands, since the build+code-review-only QA bar is the same bar future commits will pass. Risk is borne in production.
4. ~~**PDF library swap (M6) before or after?**~~ — RESOLVED: deferred until all 9 guides are authored.
5. **Content verification (M5):** Still pending. Two `verifyOnLiveForm: true` flags planted in irmaa_appeal — these are the highest-priority field labels to confirm against the live SSA-44 form when verification happens.

(New decisions surfaced this session:)

6. ~~**Browser walkthrough timing.**~~ — RESOLVED: descoped per Option B.
7. **State-specific MSP variants** (sub-task of M3): inline as state notes inside the universal `msp` guide, or split into 7 separate guides? Recommendation: inline — fewer SKUs, easier maintenance, and the universal MSP already personalizes via `{{stateName}}` and `{{mspApplyUrl}}`.

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
