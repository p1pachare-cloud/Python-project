# PyQuest Provisional Privacy Policy Outline

> **PROVISIONAL DRAFT OUTLINE — SUBJECT TO QUALIFIED LEGAL COUNSEL REVIEW**  
> This document specifies engineering-level data collection, storage, and retention boundaries. It does not constitute formal legal advice or verified compliance with India's Digital Personal Data Protection (DPDP) Act, 2023, the DPDP Rules, 2025, or any other privacy regulation. All data categories, retention periods, and consent workflows herein are provisional and require review by qualified legal counsel prior to public deployment.

---

## 1. Core Engineering Privacy Commitments

1. **Data Minimization:** We collect only the minimum data required to deliver coding lessons and track personal learning progress.
2. **Zero Commercial Surveillance:** Zero third-party advertising SDKs, zero behavioral trackers, and zero session-recording scripts (e.g., Hotjar, FullStory).
3. **Transparent Execution:** Python code execution takes place in the learner's own browser via Pyodide. User code is not sent to our servers for evaluation during standard practice.
4. **No Third-Party AI Data Transfer:** For MVP, all hints and explanations are authored locally. No learner code, prompts, or personal data are transmitted to any AI model vendor.

---

## 2. Explicit Data Inventory & Transmission Details

### 2.1 Provisional Account Data (Registered Users — 18+)
*All fields below are provisional, pending account model finalization.*

| Data Field | Storage Location | Purpose | Client-Editable? |
| :--- | :--- | :--- | :--- |
| `email` | Supabase Auth (`auth.users`) | Authentication, password reset, account recovery | Yes (via auth flow) |
| `display_name` | Public profile table (`profiles`) | Personal greeting, UI personalization. Generated pseudonym (e.g., `SwiftFalcon42`). Free-text names discouraged. | Yes |
| `avatar` | Public profile table (`profiles`) | Curated avatar selection (SVG icons only, no user uploads) | Yes |
| `timezone` | Public profile table (`profiles`) | Local daily streak calculation | Yes |
| `age_band` | Public profile table (`profiles`) | Age-gate compliance verification (`18+` vs `<18`) | **No** (Set at signup) |
| `xp_events` | Append-only ledger | Record of self-reported progress and achievements | **No** (Server RPC only) |
| `submissions` | Submissions table | Retains latest 3 challenge attempts (capped at 20 KB code) | **No** (Pruned automatically) |

### 2.2 Provisional Guest & Minor Data (<18 — Pending Decision D1)
*Under-18 account model remains **PENDING** product and legal decision.*

- **If Model A (Local-Only):**
  - Application data (lesson progress, XP, streaks, code drafts) is stored exclusively in client-side `localStorage` or `IndexedDB`.
  - Zero account records, usernames, or emails are created on or transmitted to the database server.
  - **Notice on Privacy Scope:** Local-only storage prevents database storage of personal profiles, but does not alter standard network-level traffic (see Section 2.3). Legal classification under privacy statutes remains subject to counsel review.
- **If Model B (Consented Accounts):**
  - Minor account creation requires verifiable parental or guardian consent before activation.
  - Guardian email, timestamp of consent, and policy version are recorded in `consent_records`.
- **If Model C (Staged Guest-First):**
  - All users start in local storage; parental consent flow is triggered only if/when cloud synchronization is requested.

### 2.3 Infrastructure & Network-Level Data Transmission
Regardless of account status, standard HTTP/HTTPS requests to our hosting infrastructure transmit:
- **IP Addresses:** Processed ephemerally by Vercel and CDN edge servers for DDoS mitigation, edge routing, and rate limiting.
- **User-Agent & Request Headers:** Processed for browser compatibility checks and asset delivery.
- **Server Rate-Limit Counters:** IP addresses used for authentication rate limiting are hashed and retained only for the duration of the rate-limit window.

---

## 3. Provisional Data Retention Schedules

All retention windows are engineering estimates and remain **provisional pending legal review**:

| Category | Provisional Retention Rule | Technical Disposal Method |
| :--- | :--- | :--- |
| **Active User Account Data** | Retained until explicit user account deletion. | Immediate cascading hard delete across all user-keyed tables. |
| **Inactive Accounts** | Accounts with zero activity for 12 consecutive months receive an email notice, followed by scheduled deletion after 30 days. | Automated background deletion job. |
| **Security Event Logs** | Flagged anomalies, rate-limit violations, and suspicious claims retained for 30 days. | Rolling partition purge (records >30 days removed). |
| **Rate-Limit Counters** | Retained strictly for the sliding window duration (e.g., 1 hour to 24 hours). | Redis / PostgreSQL upsert counter TTL expiry. |
| **Offline Database Backups** | Encrypted snapshots retained for 30 days for disaster recovery. | Scheduled storage bucket lifecycle deletion policy. |

---

## 4. Third-Party Service Providers (Data Processors)

| Processor | Role in MVP | Data Exposed | Processing Region |
| :--- | :--- | :--- | :--- |
| **Supabase Inc.** | PostgreSQL database, Auth, and session cookies | Email, pseudonymous profile, learning progress, hashed passwords | Provisional target: `ap-south-1` (Mumbai, India) — Pending D10 |
| **Vercel Inc.** | Web application hosting, Serverless edge routing | Transient IP addresses, HTTP request logs, static asset requests | Global Edge Network |
| **Pyodide CDN** | WebAssembly runtime delivery | HTTP request logs, IP address for file download | Public CDN (e.g., jsDelivr / cdnjs) |

---

## 5. Learner Rights & Self-Service Data Tools

1. **Right to Access & Data Portability (`POST /api/account/export`):**
   - Registered users may trigger a self-service machine-readable export (JSON format) containing all stored profile data, progress records, submissions, and XP events.
2. **Right to Erasure / Deletion (`DELETE /api/account`):**
   - Self-service account deletion permanently deletes the user record from `auth.users`, triggering a cascade across `profiles`, `xp_events`, `submissions`, `lesson_progress`, `user_badges`, and `activity_days`.
   - Associated session cookies are immediately invalidated.
3. **Grievance Contact & Escalation:**
   - A dedicated grievance contact email (e.g., `privacy@pyquest.example`) will be designated prior to public deployment to address access or correction requests.
