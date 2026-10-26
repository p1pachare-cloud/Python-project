# AGENTS.md — Contributor and AI Agent Guidelines

**Project:** PyQuest (Gamified Python Learning Platform)  
**Standard:** Strict Adherence Mandate  
**Last Updated:** 2026-10-26  

---

## 1. Core Operating Workflow

1. **Pre-Task Inspection:** Always inspect the repository, check existing file structure, read `docs/decisions.md`, and verify active conventions before making changes.
2. **Small Reviewable Increments:** Make targeted, minimal changes. State a concise plan, implement changes cleanly, and run applicable quality checks before reporting completion.
3. **Never Falsify Verification:** Never claim a test, build, lint, or accessibility check passed unless you actually ran the exact command and verified the output. Always report the exact command and terminal output.
4. **Preserve Integrity:** Never delete, rename, or overwrite working files or test fixtures without inspecting their dependencies and receiving user approval.
5. **Approval Gates:** You must request explicit user approval before:
   - Deleting or renaming existing files or database tables.
   - Introducing external packages or npm dependencies not listed in the TRD.
   - Provisioning paid cloud services, connecting third-party APIs, or altering deployment configurations.
   - Modifying security-critical functions or Row-Level Security policies.

---

## 2. Code Quality & Architecture Standards

1. **Strict TypeScript:**
   - Strict mode is mandatory (`"strict": true` in `tsconfig.json`).
   - The use of `any` is strictly prohibited. If an untyped boundary is unavoidable, use `unknown` with a type guard or Zod schema; any exception requires an explicit explanatory comment.
2. **Runtime Validation with Zod:**
   - Every external boundary (API request bodies, query parameters, route segments, environment variables, and learning content JSON files) must be validated with Zod schemas.
3. **Architectural Separation:**
   - **UI Components (`src/components/`):** Must remain strictly presentational. They receive data and event handlers via props.
   - **Domain Logic (`src/features/` & `src/lib/`):** Business logic, streak calculations, XP math, and rate-limiting stores live here, isolated from UI markup.
   - **Learning Content (`/content/`):** Content is data. Never hardcode lessons, exercises, or hints inside React components or database tables.

---

## 3. Security, Privacy & Data Integrity

1. **Secret Isolation:**
   - Secrets (`SUPABASE_SERVICE_ROLE_KEY`, private tokens) must only exist in server-side runtime environments.
   - Only variables explicitly prefixed with `NEXT_PUBLIC_` may be bundled for client consumption.
   - All `.env*` files must be strictly gitignored.
2. **Reward & Progress Authority:**
   - Clients must **never** supply reward amounts, XP values, or streak counts.
   - XP amounts are derived strictly from versioned server configuration.
   - Reward writes must execute via atomic PostgreSQL functions (RPCs) located in a private database schema, with `EXECUTE` revoked from both `anon` and `authenticated` roles.
3. **Grading Model & Honest Limitations:**
   - Python code execution runs in the learner's browser via Pyodide in a Web Worker.
   - All tests run in the browser and are readable by the user. They are untrusted practice checks (Tier A).
   - Server-side claim validation (Tier B) records self-reported progress in an append-only ledger (`xp_events`).
   - **Critical Rule:** Minimum duration checks (`minSeconds`), idempotency keys, and server-side XP lookups verify only that a claim is unique, structurally valid, and timely. **They do not prove that the code actually solved the challenge.** Never describe client-evaluated exercises as "cheat-proof", "verified", or "anti-cheat secured".
4. **Database Authorization (RLS):**
   - Every table must have Row-Level Security (RLS) enabled with default-deny policies.
   - Automated authorization tests must verify that `authenticated` users can only read their own rows and cannot directly insert into `xp_events`, `activity_days`, or `user_badges`.
5. **Data Minimization:**
   - Never collect real names, phone numbers, avatars with photos, or exact location data.
   - All display names must use generated pseudonyms (e.g., Adjective + Animal + Number).
   - Zero third-party advertising or behavioral tracking scripts may be added.

---

## 4. UI/UX, Design Tokens & Accessibility

1. **Design System Tokens:**
   - All styling must use defined tokens from `docs/design-tokens.md` and `tokens.css`.
   - Ad-hoc one-off hex colors, arbitrary spacing values, and custom shadow classes are prohibited.
2. **Accessible Contrast Ratios (WCAG 2.2 AA):**
   - Normal text must achieve at least 4.5:1 contrast against its background.
   - Large text (≥18px bold or ≥24px regular) and UI components must achieve at least 3.0:1 contrast.
   - **Strict Rule:** White text on Mint primary (`#14B8A6`) and White text on Coral accent (`#FF6B5E`) fail WCAG AA and are strictly prohibited. Always use dark ink over Mint (`#042F2E` or `#0F172A`) and deep maroon over Coral (`#4C0519`).
3. **Keyboard & Screen-Reader Operability:**
   - Monaco Editor must provide a documented keyboard escape shortcut (e.g., `Esc` followed by `Tab`).
   - On viewports <1024px or by user preference, provide an accessible monospace `<textarea>` alternative with standard tab navigation.
   - All async actions must provide explicit loading, empty, and error states.
   - Code execution status and test results must be announced via polite `aria-live` regions.
   - Respect `prefers-reduced-motion` by disabling celebratory count-up animations and badge transitions.

---

## 5. Testing & Verification Mandates

1. **Test-Driven Delivery:**
   - New domain logic (streak arithmetic, level curves, content loaders) must ship with unit tests.
   - Bug fixes must be accompanied by regression tests reproducing the issue.
2. **Quality Gates Hierarchy:**
   - **Host Checks (Active Now):** Node.js `v24.x`, npm `11.x`, Git `2.53+`.
   - **Planned Application Gates (Phase 2+):** Typecheck (`tsc --noEmit`), Lint (`eslint .`), Content Validation (`content:check`), Unit Tests (`vitest run`), Accessibility Tests (`vitest` + `axe-core`), and Production Build (`next build`).
3. **Explicit Output Reporting:**
   - When presenting test results, include the exact command executed, exit code, and test runner summary.
