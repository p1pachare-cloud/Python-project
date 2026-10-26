# PyQuest Architecture Decision Records (ADRs) and Decision Register

**Status:** Living & Auditable Document  
**Last Updated:** 2026-10-26  
**Context:** Phase 1 — Project Architecture & Specification  

---

## 1. ADR Lifecycle & Governance

All architecture decision records in this project are subject to lifecycle management. Decisions are auditable and changeable; they must never be treated as immutable.

### Status Schema
- `PROPOSED`: Under evaluation, open for review and input.
- `ACCEPTED`: Agreed upon and active as the architectural standard.
- `AMENDED`: Modified by a subsequent decision with preserved revision history.
- `SUPERSEDED`: Replaced entirely by a newer decision record (must reference replacing ADR).
- `DEPRECATED`: No longer applicable; preserved for historical audit.
- `PENDING`: Undecided product or legal choice requiring external review or authorization.

---

## 2. Core Architecture Decision Records

### ADR-001: Three-Tier Grading Model and Reward Integrity
- **Status:** ACCEPTED (Revision R1)
- **Date:** 2026-10-26
- **Context:** PyQuest executes Python code in the learner's browser via Pyodide to maintain a near-₹0 infrastructure cost. Code, test cases, and execution feedback run on client hardware. Consequently, client-reported outputs can be spoofed, inspected, or manipulated via browser developer tools.
- **Decision:** Establish three explicit tiers of grading and trust:
  1. **Tier A — Practice Check (Browser, Untrusted):**
     - Runs in Pyodide Web Worker.
     - Bundled tests (including edge-case checks) ship with content and are readable by learners.
     - Results are strictly labeled "Practice Check" in the UI. The terms "Verified", "Hidden", or "Graded" are prohibited in client copy.
  2. **Tier B — Self-Reported Completion Claim (Server-Recorded):**
     - Client posts `{ attemptId, checks: { passed, total }, durationMs, codeHash }` to `/api/exercises/:type/:id/claim`.
     - Server validates authenticated session, rate limits, schema, and minimum elapsed time (`minSeconds`).
     - Inserts record into append-only PostgreSQL ledger `xp_events` with `trust_level = 'self_reported'`.
     - **Explicit Boundary:** Idempotency, minimum duration checks, and server-configured reward amounts verify that the claim was structurally well-formed, timely, and recorded once. **They do not prove that the code actually solved the challenge.** Tier B is personal motivational progress, not an accredited credential.
  3. **Tier C — Trusted Grading (Isolated Server Judge, Post-MVP):**
     - Executes untrusted code inside an isolated containerized sandbox with secret test cases.
     - Records `trust_level = 'trusted'`.
     - Mandatory prerequisite before public leaderboards, verified certificates, or competitions.
- **Rationale:** Embraces honest architectural constraints rather than security-through-obscurity (such as client-side test encryption).
- **Consequences:** Eliminates server execution costs and remote code execution vulnerabilities on our servers for MVP; restricts MVP gamification to personal self-paced learning.
- **Revision History:**
  - 2026-10-26: Initial draft assumed hidden tests in browser. Amended in R1 to eliminate hidden tests and establish Tier A/B/C boundaries.

---

### ADR-002: AI Tutor Capabilities & Scope
- **Status:** ACCEPTED (Revision R1)
- **Date:** 2026-10-26
- **Context:** Early concepts proposed a conversational LLM tutor. For MVP, LLM API calls introduce variable operational costs, quota abuse risks, token costs, and privacy exposure for student code.
- **Decision:** The MVP AI Tutor is implemented strictly as a client-side **Help Panel** with authored, rule-based content:
  1. Progressive authored hints (1 to 3 tiers per exercise, revealed sequentially, free of XP cost).
  2. Static Python error mapper (`content/errors.json`) mapping standard exceptions (`SyntaxError`, `IndentationError`, `ZeroDivisionError`, timeouts) to plain-language guidance.
  3. Per-test fail messages (`feedbackOnFail`) authored into challenge test cases.
  4. Curated concept glossary.
  - Zero network requests to third-party LLMs at launch. Conversational LLMs are deferred to post-MVP behind an explicit feature flag and adult-only gate.
- **Rationale:** Ensures zero ongoing token costs, deterministic educational guidance, and zero student data transmission to AI vendors.
- **Consequences:** Limits tutor interaction to structured pre-written nudges; eliminates AI latency, hallucination, and prompt-injection risks.
- **Revision History:**
  - 2026-10-26: Replaced conversational LLM endpoint with static Help Panel in Revision R1.

---

### ADR-003: Content Architecture as Versioned Data
- **Status:** ACCEPTED
- **Date:** 2026-10-26
- **Context:** Educational platforms frequently suffer from tight coupling between content definitions and UI components, or require complex database CMS architectures.
- **Decision:** Content is managed as versioned JSON and Markdown files inside the Git repository under `/content/`:
  - Hierarchy: Course → Module → Lesson / Challenge.
  - Validated at build time and in CI using Zod schemas via `content:check`.
  - Reference solutions are excluded from client bundles and served only via authenticated API after completion or repeated attempts.
  - Zero database tables for course content; database tables store only user progress and per-user state.
- **Rationale:** Provides free versioning, branch reviews, rollbacks, and zero CMS database hosting overhead.
- **Consequences:** Content updates require repository commits and deployment builds, which aligns with the planned CI pipeline.

---

### ADR-004: Package Manager Selection
- **Status:** ACCEPTED
- **Date:** 2026-10-26
- **Context:** Phase 2 evaluated package managers (`npm`, `pnpm`, `yarn`, `bun`) for local developer onboarding, lockfile determinism, and CI pipeline support.
- **Decision:** Select `npm` (version 11.x paired with Node.js v24.x) as the sole package manager, committing `package-lock.json` to version control.
- **Rationale:** `npm` is installed out-of-the-box with Node.js, eliminating the need for developers or CI environments to bootstrap secondary package management binaries. Next.js 16.4.3 and Turbopack resolve cleanly via `npm` with 0 vulnerabilities and 3.2s production compilation.
- **Consequences:** All contributors and agents must use `npm` (`npm install`, `npm run <script>`). Lockfile format is `package-lock.json`.

---

## 3. Decisions Register (D1 – D17)

| ID | Topic | Status | Decision Summary / Current Baseline | Target Phase |
| :--- | :--- | :--- | :--- | :--- |
| **D1** | Under-18 Account Model & Consent | **PENDING** | Undecided. Evaluating Model A (Local-Only), Model B (Consented Accounts), and Model C (Staged Guest-First). Requires qualified legal review. | Phase 6 |
| **D2** | Tier C Trusted Grading Provider | **DEFERRED** | Post-launch. No server judge in MVP. Leaderboards blocked until D2 resolution. | Post-MVP |
| **D3** | Vercel Hobby Terms & Commercial Use | **ACCEPTED** | Non-commercial personal educational baseline permitted on Hobby. Budget Vercel Pro if monetized or sponsored. | Pre-Deploy |
| **D4** | Pyodide Delivery (CDN vs. Self-Hosted) | **PROPOSED** | Pin Pyodide version. Delivery mechanism (public CDN vs. self-hosted) decided after Phase 4 loading spike. | Phase 4 |
| **D5** | Code Editor Responsive Breakpoint | **ACCEPTED** | Monaco Editor on screens ≥1024px; accessible monospace `<textarea>` on screens <1024px and by user preference. | Phase 4 |
| **D6** | Product Name & Domain | **PROPOSED** | "PyQuest" working placeholder. Final domain and branding to be finalized before public release. | Phase 2 |
| **D7** | Launch Course Scope | **ACCEPTED** | 1 beginner course: ~12 lessons, 8 challenges. Single authoring pipeline. | Phase 3 |
| **D8** | Mobile Testing Reference Device | **PROPOSED** | Android physical device in the ₹10,000–₹15,000 class (Slow 4G profile). | Phase 4 |
| **D9** | Route Rate-Limit Thresholds | **ACCEPTED** | Baseline limits defined in TRD R1-E (Signup: 5/hr/IP; Claim: 30/min/user; Reset: 3/hr/email). Tunable after beta. | Phase 6 |
| **D10** | Supabase Remote Hosting Region | **PENDING** | Deferred until remote database provisioning. Local development runs on Docker CLI. Candidate: `ap-south-1` (Mumbai). | Phase 11 |
| **D11** | Minimum Attempt Duration (`minSeconds`) | **ACCEPTED** | 20 seconds baseline. Used as a structural plausibility filter, not proof of code correctness. | Phase 5 |
| **D12** | Database Backup Strategy | **ACCEPTED** | Automated daily `pg_dump` scheduled export to encrypted storage (required for Supabase Free tier). | Phase 11 |
| **D13** | Feature Revisit Triggers | **ACCEPTED** | Revisit streak freezes and Google OAuth after 2 months of post-launch retention data. | Post-MVP |
| **D14** | Processor Data Retention Rules | **PROPOSED** | User account data: until deletion (12-month inactivity notice); Security logs: 30 days; Backups: 30 days. | Phase 11 |
| **D15** | Analytics Vendor at Launch | **ACCEPTED** | Zero third-party analytics SDKs or behavioral trackers. Essential session cookies only. | Phase 2 |
| **D16** | Error Monitoring Strategy | **PROPOSED** | Server logs enabled; client error reporting off at launch, optional Sentry free tier evaluated at Phase 11. | Phase 11 |
| **D17** | Package Manager Standard | **ACCEPTED** | `npm` (v11.x) with committed `package-lock.json`. Evaluated during Phase 2 scaffolding. | Phase 2 |

---

## 4. Revisions and Amendments Procedure

When modifying any decision in this register:
1. Update `Status` (`AMENDED` or `SUPERSEDED`).
2. Do not overwrite past rationale; add a dated entry under `Revision History`.
3. If an ADR replaces another, record `Supersedes: ADR-XXX` in the new ADR and update the original to `SUPERSEDED by ADR-YYY`.
