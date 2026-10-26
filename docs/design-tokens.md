# PyQuest Design System Specification & Verified Tokens

**Status:** Living Design Specification  
**Accessibility Target:** WCAG 2.2 Level AA Compliance  
**Last Updated:** 2026-10-26  

---

## 1. Visual Identity & Design Principles

PyQuest uses an approachable, professional aesthetic designed for sustained reading and coding comfort:
- **Primary Color:** Teal-leaning Mint family for primary calls-to-action, navigation accents, and progress indicators.
- **Accent Color:** Warm Coral family reserved strictly for rewards, streak flames, and critical emphasis.
- **Neutrals:** Warm gray scale from 50 to 900. Near-white page canvas (`#FAFAF9`), avoiding stark `#FFFFFF` and harsh `#000000`.
- **Restraint:** Zero heavy multi-stop gradients, zero glassmorphism, low-elevation shadows only, and restrained celebratory motion.

---

## 2. Color Palette & Contrast Calculations

All contrast ratios below were **mathematically calculated** using the standard WCAG relative luminance formula:
$L = 0.2126 \times R + 0.7152 \times G + 0.0722 \times B$ (with gamma expansion).

### 2.1 Core Brand Colors & Text Combinations

| Token / Surface | Target Background | Foreground / Text Element | Foreground Hex | Calculated Contrast Ratio | WCAG 2.2 AA Result | Usage Rule / Enforcement |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `mint-primary` | `#14B8A6` (Mint 500) | White Text | `#FFFFFF` | **2.49:1** | **FAILS (< 4.5:1)** | **PROHIBITED.** Never place white text on `#14B8A6`. |
| `mint-primary` | `#14B8A6` (Mint 500) | Dark Slate Ink | `#042F2E` (Teal 950) | **5.81:1** | **PASSES (AA)** | **APPROVED.** Standard button text over Mint surfaces. |
| `mint-primary` | `#14B8A6` (Mint 500) | Slate 900 Ink | `#0F172A` | **7.17:1** | **PASSES (AAA)** | **APPROVED.** High-contrast alternative for primary buttons. |
| `mint-primary` | `#14B8A6` (Mint 500) | Teal 900 Ink | `#134E4A` | **3.81:1** | **FAILS (< 4.5:1)** | **PROHIBITED.** Fails normal text threshold. |
| `coral-accent` | `#FF6B5E` (Coral 500) | White Text | `#FFFFFF` | **2.79:1** | **FAILS (< 4.5:1)** | **PROHIBITED.** Never place white text on `#FF6B5E`. |
| `coral-accent` | `#FF6B5E` (Coral 500) | Warm Black | `#1C1917` (Stone 900) | **6.26:1** | **PASSES (AA)** | **APPROVED.** Standard text for Coral badges and pills. |
| `coral-accent` | `#FF6B5E` (Coral 500) | Deep Maroon | `#4C0519` (Rose 950) | **5.60:1** | **PASSES (AA)** | **APPROVED.** Accent text on celebratory cards. |

---

### 2.2 Neutral Canvas & Body Text Combinations

| Surface Token | Surface Hex | Foreground Token | Foreground Hex | Calculated Contrast Ratio | WCAG 2.2 AA Result | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `bg-canvas` | `#FAFAF9` (Stone 50) | `text-primary` | `#1C1917` (Stone 900) | **16.74:1** | **PASSES (AAA)** | Primary body text, headings, lesson content. |
| `bg-canvas` | `#FAFAF9` (Stone 50) | `text-secondary` | `#57534E` (Stone 600) | **7.30:1** | **PASSES (AAA)** | Secondary text, captions, metadata. |
| `bg-canvas` | `#FAFAF9` (Stone 50) | `text-muted` | `#78716C` (Stone 500) | **4.59:1** | **PASSES (AA)** | Borderline threshold. Use `#57534E` for body readability. |
| `bg-surface` | `#FFFFFF` (Card) | `text-primary` | `#1C1917` (Stone 900) | **17.20:1** | **PASSES (AAA)** | Card containers and interactive modal dialogs. |
| `bg-surface` | `#FFFFFF` (Card) | `text-secondary` | `#57534E` (Stone 600) | **7.51:1** | **PASSES (AAA)** | Card descriptions and instructional subheaders. |

---

### 2.3 Semantic & Feedback States (Over Canvas `#FAFAF9`)

*All semantic feedback must pair color with text and distinct iconography.*

| State Token | Token Hex | Contrast Ratio vs `#FAFAF9` | Text Usage vs UI Border | Icon & Text Pairing Requirement |
| :--- | :--- | :--- | :--- | :--- |
| `color-success` | `#15803D` (Green 700) | **4.80:1** (Passes AA) | Safe for text, icons, and borders. | Checkmark icon + "Success / Passed" label. |
| `color-error` | `#BE123C` (Rose 700) | **6.02:1** (Passes AA) | Safe for text, icons, and borders. | Alert triangle icon + "Failed / Error" label. |
| `color-warning` | `#B45309` (Amber 700) | **4.81:1** (Passes AA) | Safe for text, icons, and borders. | Warning circle icon + "Caution" label. |
| `color-info` | `#0F766E` (Teal 700) | **5.24:1** (Passes AA) | Safe for text, icons, and borders. | Info 'i' icon + "Note" label. |

*(Note: `#0D9488` Teal 600 achieves only 3.59:1 on `#FAFAF9` and is restricted to UI borders or icons ≥3:1; textual labels must use `#0F766E` Teal 700).*

---

### 2.4 Editor Canvas Combinations (Dark Theme Baseline)

| Surface | Surface Hex | Foreground Element | Hex | Calculated Contrast Ratio | WCAG 2.2 AA Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `editor-canvas` | `#0F172A` (Slate 900) | Code text (default) | `#F8FAFC` (Slate 50) | **17.06:1** | **PASSES (AAA)** |
| `editor-canvas` | `#0F172A` (Slate 900) | Keywords (Mint tint) | `#5EEAD4` (Teal 300) | **12.65:1** | **PASSES (AAA)** |
| `editor-canvas` | `#0F172A` (Slate 900) | Strings (Amber tint) | `#FDE68A` (Amber 200) | **15.22:1** | **PASSES (AAA)** |
| `editor-canvas` | `#0F172A` (Slate 900) | Comments (Muted) | `#94A3B8` (Slate 400) | **6.67:1** | **PASSES (AA)** |

---

## 3. Typography Scale

- **UI Sans Font:** Inter, system sans-serif fallback.
- **Monospace Code Font:** JetBrains Mono, Fira Code, system monospace fallback.
- **Baseline Line Height:** 1.5 for all body and instruction blocks.

| Token | Size | Line Height | Tracking | Recommended Use |
| :--- | :--- | :--- | :--- | :--- |
| `type-xs` | 12px | 16px | +0.02em | Badges, timestamps, test status chips |
| `type-sm` | 14px | 20px | 0 | Secondary descriptions, button labels, sidebar items |
| `type-base` | 16px | 24px | 0 | Standard body copy, lesson instructions, editor text |
| `type-lg` | 18px | 28px | -0.01em | Subheadings, card titles, exercise prompts |
| `type-xl` | 24px | 32px | -0.015em | Module headers, modal titles |
| `type-2xl` | 32px | 40px | -0.02em | Page headers, course titles |
| `type-3xl` | 44px | 52px | -0.025em | Landing hero headline |

---

## 4. Spacing, Sizing, and Elevation

- **Base Modular Unit:** 4px grid.
- **Spacing Scale:**
  - `space-1`: 4px
  - `space-2`: 8px
  - `space-3`: 12px
  - `space-4`: 16px
  - `space-6`: 24px
  - `space-8`: 32px
  - `space-12`: 48px
  - `space-16`: 64px
- **Border Radius:**
  - `radius-sm`: 4px (tags, code chips)
  - `radius-md`: 6px (buttons, input fields, dropdown menus)
  - `radius-lg`: 10px (content cards, challenge panels, modal dialogs)
  - `radius-full`: 9999px (avatar frames, pill badges)
- **Elevation & Shadows:**
  - `elevation-none`: Border only (`1px solid #E7E5E4`).
  - `elevation-low`: `0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)` (cards).
  - `elevation-modal`: `0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05)` (dialogs).
  - *Glassmorphism (`backdrop-blur` with high transparency) and high-elevation drop shadows are strictly prohibited.*

---

## 5. Motion and Animation Tokens

- **Timing Constants:**
  - `duration-fast`: 120ms (button hover, tooltip trigger).
  - `duration-normal`: 180ms (card expansion, tab switch).
  - `duration-reward`: 250ms (XP count-up, badge reveal).
- **Reduced-Motion Mandate:**
  - When `prefers-reduced-motion: reduce` is detected:
    - Set all durations to `0ms`.
    - Replace count-up animations with instant state transitions.
    - Suppress celebratory particles and pulse effects.
