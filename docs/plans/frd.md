# Functional Requirements Document (FRD)

> **What the product must do** (not how). The "how" lives in
> [`hld.md`](./hld.md) and the [`adr/`](./adr/) records; task breakdown in
> [`wbs.md`](./wbs.md); phased plan in [`ROADMAP.md`](./ROADMAP.md).

---

## 1. Product Summary

SmartHand Math is a gamified, highly visual web app that uses **client-side
computer vision** (the webcam + MediaPipe) to track hand gestures and count
fingers using the **Soroban / Asian** system, then matches the resulting number
against live mental-math challenges. It is **100% client-side** with **no
backend** (see [ADR-0001](./adr/ADR-0001-client-side-no-backend.md)) and
**playable without a camera** via a number-pad fallback.

Three surfaces: **Home** (intro), **Learn** (free-practice playground), **Play**
(timed scored game).

---

## 2. Personas

### 2.1 Kid — *Maya, age 7* (PRIMARY)
Learning Soroban / Asian finger math at school or at home. Pre- to early-reader;
needs large text, emoji iconography, instant encouraging feedback, and a
playful, non-punitive tone. Wants to feel clever and have fun.

### 2.2 Parent — *Niran*
Wants the child to practice mental math safely. Cares **deeply** that no video
or personal data leaves the device, that there are no ads/accounts, and that
the child can play without supervision. May occasionally check the best score.

### 2.3 Teacher — *Kru Ann*
Uses the app as a warm-up or center activity for finger-math practice. Needs it
to work on a classroom device without setup, to be playable without a webcam
(shared device / privacy), and to scale difficulty across a range of ability.

---

## 3. User Stories

**Kid**
- "I can practice showing a number with my hand and see what number it is,
  without being scored." → **Learn**
- "I can answer a math question by holding up the right fingers, and the app
  cheers me on." → **Play**
- "If my device has no camera, I can still play by typing the answer." → number-pad
- "I can see my best score and beat it next time." → `best`

**Parent**
- "I can trust that no video or data leaves my child's device." → privacy model
- "I can mute the sound and it stays muted." → `muted` persistence

**Teacher**
- "I can project/use it on any classroom device with no account or install." →
  static site, no backend
- "The difficulty rises as a stronger student keeps answering correctly." →
  adaptive difficulty

---

## 4. Functional Requirements

> IDs are stable for cross-referencing from the WBS and ADRs.

| ID | Requirement |
|----|-------------|
| **FR-01** | The app requests camera access **only on a user gesture** (Start), never on page load. |
| **FR-02** | The app tracks **1–2 hands** in real time via MediaPipe `HandLandmarker` (VIDEO mode, GPU with CPU fallback) and reports the 21-landmark skeleton overlay mirrored with the video. |
| **FR-03** | The app decodes hands into a number **0–99** using the Soroban system (thumb=5, four fingers=1 each; left hand = tens, right hand = units). |
| **FR-04** | Raw per-frame numbers are **denoised** (rolling-window majority vote) before being shown or committed, and a **−1 sentinel** distinguishes "no hand" from a true `0`. |
| **FR-05** | **Learn** shows the live decoded number with friendly coaching copy and **no scoring**. |
| **FR-06** | **Play** presents a mental-math question and accepts the answer only after the decoded number **equals the answer and is held for ~500 ms** (`ANSWER_HOLD_MS`). |
| **FR-07** | Questions are **difficulty-scaled** and answers are always physically representable: **easy 0–9, medium 0–50, hard 0–99** (operators: `+`, `−`, `×`; medium/hard may use missing-number). |
| **FR-08** | The game tracks **score, streak, lives (`STARTING_LIVES = 3`), and level**; a wrong answer costs a life and `lives ≤ 0` ends the game (status `lost`). |
| **FR-09** | The game is **fully playable without a camera** via an on-screen number pad (0–99) + Submit. |
| **FR-10** | The app provides **audio feedback** hooks (correct / wrong / click / win / lose / tick) respecting mute & volume; missing audio must never crash the app. |
| **FR-11** | The app persists **best score** and **settings** (volume, muted, mirrored) to `localStorage` on the user's device. |
| **FR-12** | The UI offers **mirror** (selfie) and **mute** toggles that persist across sessions. |
| **FR-13** | On a wrong answer, the app **shows the expected answer** (encouraging, non-punitive tone). |
| **FR-14** | All user-facing strings are **centralized** (i18n-ready) so a future localization is data-only *(Phase 4 migration — currently inlined; tracked as a gap)*. |

---

## 5. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| **NFR-01 (Performance)** | Detection runs via `requestAnimationFrame`, calling `detectForVideo` **only on new frames** with a strictly-increasing timestamp; target ~60 fps on capable devices, with a CPU fallback when the GPU delegate is unavailable. |
| **NFR-02 (Privacy)** | **Zero network egress** of video, landmarks, or model inputs. Only fetches are the MediaPipe model/wasm assets (CDN by default, self-hostable). Persistence is `localStorage`-only. *(Architecture-level; see HLD §7.)* |
| **NFR-03 (i18n-readiness)** | English in Phase 1; structure must allow Thai (and others) as a **data-only** addition later. |
| **NFR-04 (Compatibility)** | Runs on modern evergreen browsers; camera requires a **secure context** (HTTPS or `localhost`). |
| **NFR-05 (Offline-capable)** | Designed to be runnable fully offline once the model is self-hosted (forward — Phase 6 PWA). |
| **NFR-06 (Quality gate)** | `lint` → `typecheck` → `build` stay green on every push (CI). A test runner is added in Phase 2. |
| **NFR-07 (Deployability)** | One command for dev (HMR) and one for production (static nginx) via Docker. |

---

## 6. Accessibility Requirements

| ID | Requirement |
|----|-------------|
| **A11Y-01** | The game is **playable without a camera** (number-pad fallback) — also serves devices without webcams and automated testing. |
| **A11Y-02** | Feedback is **never color-only** — always paired with an icon + text + sound (e.g., correct vs. wrong). |
| **A11Y-03** | **Large touch targets**, rounded shapes, generous spacing; viewport locked to prevent accidental zoom for small users. |
| **A11Y-04** | The number pad is **keyboard-operable**. |
| **A11Y-05** | Target **WCAG AA** contrast and focus order; honor `prefers-reduced-motion` *(full audit in Phase 6)*. |

---

## 7. Privacy Requirements

| ID | Requirement |
|----|-------------|
| **PR-01** | **No data leaves the device.** No video, landmarks, or model inputs are transmitted; no analytics or telemetry; no accounts. |
| **PR-02** | The Home page **documents the privacy posture** to parents/teachers in plain language. |
| **PR-03** | Camera capture begins **only after an explicit user gesture**. |
| **PR-04** | All persisted data is **on-device `localStorage`** (best score, settings) — nothing server-side. |
| **PR-05** | Optional **self-hosting** of the MediaPipe model (env-var override) for maximum-privacy / offline use. |
| **PR-06** | A **parent/teacher data-handling note** confirms zero egress *(produced in Phase 6)*. |

---

## 8. Out of Scope (Phase 1)

These are explicitly **not** Phase 1 deliverables (see [`ROADMAP.md`](./ROADMAP.md)):

- Cross-device sync, user accounts, parent/teacher dashboard (Phase 8).
- A win condition (the `won` status exists in the type but is currently
  unreachable) and a timed mode (Phase 5).
- Thai localization content (Phase 4 stubs structure; Phase 8 ships content).
- Test suite, audio assets, `framer-motion`, pastel theme, full WCAG audit,
  PWA/offline, nginx hardening, CI/CD deploy (Phases 2–7).
