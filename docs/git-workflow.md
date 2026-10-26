# PyQuest Git Workflow, Repository Hygiene & Quality Gates

**Status:** Living Engineering Standard  
**Last Updated:** 2026-10-26  

---

## 1. Quality Gates: Active vs. Planned

To maintain verifiable delivery standards, checks that can be executed today on the host toolchain are strictly distinguished from planned application quality gates that depend on the Phase 2 application scaffold.

### 1.1 Currently Executable Quality Gates (Active Now)
*These checks have been run and verified on the local host machine during Phase 0 and Phase 2:*

| Tool / Check | Command Executed | Result / Output | Verification Status |
| :--- | :--- | :--- | :--- |
| **Node.js Runtime** | `node -v` | `v24.16.0` | **VERIFIED (Active)** |
| **Package Manager** | `npm -v` | `11.13.0` | **VERIFIED (Active)** |
| **Version Control** | `git --version` | `git version 2.53.0.windows.1` | **VERIFIED (Active)** |
| **Color Contrast Calculation** | `node -e "<WCAG script>"` | Calculated exact ratios (e.g., `#042F2E` on `#14B8A6` = 5.81:1) | **VERIFIED (Active)** |
| **Gate 1: Typecheck** | `npm run typecheck` (`tsc --noEmit`) | Exited code 0, zero type errors (`strict: true`) | **VERIFIED (Active)** |
| **Gate 2: Lint** | `npm run lint` (`eslint .`) | Exited code 0, zero ESLint errors | **VERIFIED (Active)** |
| **Gate 3: Content Validation** | `npm run content:check` | Exited code 0, all content validated via Zod | **VERIFIED (Active)** |
| **Gate 4: Unit Testing** | `npm run test` | Exited code 0, 11 tests passed in node:test | **VERIFIED (Active)** |
| **Gate 6: Production Build** | `npm run build` (`next build`) | Exited code 0, static pages generated | **VERIFIED (Active)** |

---

### 1.2 Planned Quality Gates (Deferred to Phase 4 & 10)
*These gates will be mapped to concrete npm scripts as Pyodide execution and axe-core accessibility suites are added.*

| Gate Name | Intended npm Script | Target Command | Scope & Pass Criteria | Phase Activated |
| :--- | :--- | :--- | :--- | :--- |
| **Gate 5: Automated Accessibility** | `npm run test:a11y` | `vitest run --testNamePattern=a11y` | Automated `axe-core` analysis; zero critical WCAG 2.2 AA violations. | Phase 4 |

---

## 2. Git Branching & Workflow Rules

1. **Default Branch (`main`):**
   - Represents production-ready code.
   - Direct commits to `main` are prohibited after Phase 2 scaffolding. All updates proceed via pull requests or verified feature branches.
2. **Branch Naming Conventions:**
   - `feat/<short-description>`: New functional features or modules (e.g., `feat/pyodide-worker`).
   - `fix/<short-description>`: Bug fixes or corrections (e.g., `fix/streak-timezone-rollover`).
   - `docs/<topic>`: Documentation updates, ADR additions, and specifications (e.g., `docs/design-tokens`).
   - `chore/<task>`: Toolchain updates, dependency maintenance, or CI adjustments (e.g., `chore/setup-eslint`).
3. **Commit Message Format (Conventional Commits):**
   Commits must follow the conventional commit structure:
   `<type>(<scope>): <short imperative description>`
   - Examples:
     - `feat(editor): implement web worker watchdog timeout`
     - `fix(ledger): prevent duplicate XP insertion on parallel claims`
     - `docs(adr): record decision on monaco editor responsive breakpoint`
     - `style(tokens): adjust mint primary button text contrast`

---

## 3. Comprehensive `.gitignore` Plan

When Git is initialized in Phase 2, the following `.gitignore` specification will be applied immediately:

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Next.js Build Output
.next/
out/
build/
dist/

# Environment Files (CRITICAL: Never commit secrets)
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
*.env

# Testing & Coverage
coverage/
test-results/
playwright-report/
blob-report/
playwright/.cache/

# IDE & Editor Configurations
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
.idea/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Operating System Files
.DS_Store
Thumbs.db
ehthumbs.db

# Supabase Local State
supabase/.temp/
```

---

## 4. Phase 1 Verification Summary

No git repository has been initialized and no packages have been installed during Phase 1. All work has been strictly limited to architectural specifications and documentation files within the existing workspace directory.
