# Lessons / curriculum — guided "First Numbers" track for ages 5–6 (Phase 8.3)

> Part of [Phase 8 — Enhancement / Future Vision](../ROADMAP.md#phase-8--enhancement--future-vision).
> Status: **planned** (this README + [RFC-0004](../rfc/RFC-0004-lessons-curriculum.md) resolve the
> scope / age band / assessment model §8.3 deferred). ADR-0009 after build.
> Tech: React (new context + pages + content layer) + Web SpeechSynthesis; **no new runtime deps**.

## Goal

Add a third surface — **Lessons** — that *teaches* a child who cannot yet count, recognize digits,
or do arithmetic. Today the app only has **Learn** (free sandbox) and **Play** (random scored
drill); nothing scaffolds a true beginner. This phase turns the §8.3 framework into a real
curriculum: a guided, spoken, mastery-gated track for **5–6 year-olds who have never learned
addition or subtraction**, taking them from "what is a number" to first +/−, using the app's
Soroban finger system.

Scope decision ([RFC-0004](../rfc/RFC-0004-lessons-curriculum.md)): **cap at single-hand 0–9.**
Every answer is showable on one hand; two-hand place value (0–99) is a separate, larger concept and
the natural *next* unit (deferred).

## Age band & pedagogy

- **New age band: 5–6 (pre-reader).** The FRD persona is age 7; this introduces a younger band.
  Because they cannot read, **every instruction is spoken** via the browser's
  `window.speechSynthesis` (100% client-side — an OS service, not app egress; privacy-compatible
  with [ADR-0001](../adr/ADR-0001-client-side-no-backend.md)).
- **CRA progression:** Concrete objects → finger Representation → number symbols.
- **Explicit Soroban "5-structure":** the thumb = 5 is the key insight; 6–9 = "5 and more." This is
  what makes Asian mental math fast and is taught deliberately (not assumed).
- **Gentle mastery:** finish teaching steps + pass a 4/5 quick-check to complete a lesson and unlock
  the next. **Never punitive** (no lives lost; wrong = "try again"). Matches the §8 tone.

## Curriculum — "First Numbers" (13 lessons, 4 units)

Step kinds: `watch` (narrated demo) · `showMe` (hold up N fingers, camera-validated) · `count`
(tap objects → choose total) · `choose` (multiple choice) · `compare` (more/fewer/equal) · `solve`
(arithmetic, show answer with fingers). Each lesson ≈ 4–6 teaching steps + a 5-question assessment
(4 to pass).

### Unit 1 — Number Sense (what numbers mean) · 3 lessons
Counting, one-to-one correspondence, cardinality, comparison, zero. Objects & tapping; light finger
use. No arithmetic.

| # | Lesson | Objective | Key steps | Range | Assessment |
|---|--------|-----------|-----------|-------|------------|
| 1.1 | How Many? | Count 1–5; last count = "how many" | watch → count(3) → count(5) → showMe(3) → watch | 1–5 | 5 count/choose |
| 1.2 | More or Fewer? | Compare; order 1–5 | watch → compare → compare → choose(order) → watch | 1–5 | 5 compare/order |
| 1.3 | Zero Means None | Zero = none; a fist = 0 | watch → count(0) → showMe(0) → choose(0) | 0–1 | 5 incl. zero |

### Unit 2 — Finger Numbers (the Soroban system, 0–9) · 4 lessons  *(core skill)*
Progressive digit formation: 1–4 (one finger each) → 5 (the thumb) → 6–9 (5 + fingers). Heavy
camera `showMe`.

| # | Lesson | Objective | Key steps | Range | Assessment |
|---|--------|-----------|-----------|-------|------------|
| 2.1 | Your Counting Fingers | 1 finger = 1; make 1–4 | watch → showMe(1→4) → watch | 1–4 | 5 showMe |
| 2.2 | The Magic Thumb | **Thumb = 5** | watch → showMe(5) → count→choose(5) → showMe(5) → watch | 5 | 5, mix 0–5 |
| 2.3 | Five and More | 6–9 = thumb + fingers | watch(6=5+1) → showMe(6→9) → watch | 6–9 | 5 showMe |
| 2.4 | All the Numbers | Recall 0–9 fluently | showMe ×5 review → watch | 0–9 | 5 showMe (gate) |

### Unit 3 — Putting Together (addition) · 3 lessons
Addition as joining/adding-to; counting on; part-part-whole. Show the sum with fingers.

| # | Lesson | Objective | Key steps | Sum ≤ | Assessment |
|---|--------|-----------|-----------|-------|------------|
| 3.1 | Adding Is More | +1, +2; count on | watch → solve(1+1) → solve(3+1) → solve(2+2) → watch | 4 | 5 add |
| 3.2 | Part and Whole | Compose within 5 | watch → solve(2+3) → solve(1+4) → choose(4=1+?) → solve(0+5) | 5 | 5 add |
| 3.3 | Bigger Adds | Sums to 9 via 5-structure | watch(5+2=7) → solve(5+1,6+2,4+3,5+4) | 9 | 5 add |

### Unit 4 — Taking Away (subtraction) · 3 lessons
Subtraction as taking away; "how many left?" Show the answer with fingers.

| # | Lesson | Objective | Key steps | ≤ | Assessment |
|---|--------|-----------|-----------|---|------------|
| 4.1 | Taking Away | −1, −2; count back | watch → solve(3−1) → solve(4−1) → solve(5−2) → watch | 4 | 5 sub |
| 4.2 | How Many Left? | Subtract within 5 | watch → solve(5−1) → solve(4−2) → solve(5−5→0) → solve(3−3) | 5 | 5 sub |
| 4.3 | Bigger Take-Aways | Subtract within 9 | watch(9−4=5) → solve(9−2,8−3,7−5,9−9) | 9 | 5 sub |

**Totals:** 13 lessons · ~65 teaching steps · assessments generated on the fly (13 × 5 items).
**End state:** a non-reader can count, read Soroban digits 0–9, and add/subtract within 9 — all on
one hand.

## Data model (`src/content/lessons.ts`)

Authoring a lesson is **data-only** (one `Lesson` object + its strings) — zero per-lesson component
code. Structural fields live here; translatable prose (title/objective/narration) lives in
[`strings.ts`](../../src/i18n/strings.ts) under a `lessons` block keyed by id, so a future Thai pass
is pure translation (honors [CLAUDE.md §2.3](../../CLAUDE.md)).

```ts
export type LessonStepKind = 'watch'|'showMe'|'count'|'choose'|'compare'|'solve'
export type LessonUnit = 'number-sense'|'soroban-0-9'|'addition'|'subtraction'

interface BaseStep { id: string; kind: LessonStepKind; promptKey?: string }

export interface WatchStep  extends BaseStep { kind:'watch';  visual: string|readonly string[]; autoAdvance?: boolean; minDurationMs?: number }
export interface ShowMeStep  extends BaseStep { kind:'showMe'; target: number; numHands?: 1|2; promptMs?: number; confirmMs?: number }
export interface CountStep   extends BaseStep { kind:'count';  object: string; count: number }
export interface ChooseStep  extends BaseStep { kind:'choose'; display: string; options: readonly number[]; answer: number }
export interface CompareStep extends BaseStep { kind:'compare'; left:{object:string;count:number}; right:{object:string;count:number}; answer:'more'|'fewer'|'equal' }
export interface SolveStep   extends BaseStep { kind:'solve';  display: string; answer: number; numHands?: 1|2; promptMs?: number; confirmMs?: number }

export type LessonStep = WatchStep|ShowMeStep|CountStep|ChooseStep|CompareStep|SolveStep

export interface Assessment {
  questions: number
  passThreshold: number                 // 4 of 5
  generator:
    | { kind:'showMe';     maxAnswer: number; numHands?: 1|2 }
    | { kind:'addition';   maxAnswer: number }
    | { kind:'subtraction';maxAnswer: number }
    | { kind:'mixed'; ops:('+'|'-')[]; maxAnswer: number }
}

export interface Lesson {
  id: string            // url segment 'magic-thumb'
  unit: LessonUnit
  order: number
  titleKey: string      // t.lessons.titles[id]
  objectiveKey: string  // t.lessons.objectives[id]
  targetNumbers?: readonly number[]
  steps: readonly LessonStep[]
  assessment: Assessment
}

export const CURRICULUM: readonly Lesson[] = [ /* 13 lessons, ordered */ ] as const
export const LESSON_MAP: Readonly<Record<string, Lesson>> = Object.fromEntries(CURRICULUM.map(l => [l.id, l]))
```

`CURRICULUM` is the single source of truth for ordering + unlocks: `[0]` is always unlocked;
`[i+1]` unlocks when `[i]` is `complete`.

## Reuse strategy (verified against source)

**Reusable as-is:** [`CameraView`](../../src/components/camera/CameraView.tsx) (denoised 0–99 or −1;
pass `numHands={1}`), [`fingerMathLogic`](../../src/utils/fingerMathLogic.ts) (`handValue`,
`handsToNumber`, `getFingerStates`), [`useAutoSubmit`](../../src/hooks/useAutoSubmit.ts),
[`Card`](../../src/components/common/Card.tsx)/[`Button`](../../src/components/common/Button.tsx)/[`Modal`](../../src/components/common/Modal.tsx),
[`LevelBadge`](../../src/components/game/LevelBadge.tsx)/[`Timer`](../../src/components/game/Timer.tsx),
[`useAudio`](../../src/hooks/useAudio.ts), `burst`/`celebrate`/`finale`
([`confetti.ts`](../../src/utils/confetti.ts)), the i18n pipeline, the lazy-route + `NAV_ROUTES` +
provider pattern, and [`Play.tsx`](../../src/pages/Play.tsx) as copy-source for the `submit`/
number-pad/`radial-progress` ring.

**Key reuse pattern — teaching steps gate `useAutoSubmit` on correctness.**
`useAutoSubmit` is answer-agnostic (commits any held value). For `showMe` and teaching-`solve`, set
`canSubmit: detected === step.target` so the hold prompt only ever appears for the **correct**
value; `questionId: step.id` resets the hold per step. Assessment-`solve` instead uses
`canSubmit: detected >= 0` and grades inside `commit(n)`.

```ts
const pending = useAutoSubmit({
  enabled: autoSubmitEnabled,
  promptMs: step.promptMs ?? LESSON_PROMPT_MS,
  confirmMs: step.confirmMs ?? LESSON_CONFIRM_MS,
  detected,
  canSubmit: !doneRef.current && detected === step.target, // ← gate on target
  questionId: step.id,                                      // ← reset per step
  commit: () => { doneRef.current = true; audio.playCorrect(); burst(); onComplete() },
})
```

**`CameraView.digitMode` (additive prop — Risk 1).** With `numHands=1`, `handsToNumber` assigns a
**left** hand to the tens column, so a left-handed kid's "3" reads as **30**. The fix is an
opt-in `digitMode?: boolean`: when true, report `hands.length ? handValue(hands[0].landmarks) : -1`
(0–9, handedness-independent). Defaults off → Play/Learn unchanged. **Every lesson `CameraView`
sets `digitMode`.**

## `LessonsContext` (`src/context/LessonsContext.tsx`)

Parallel to [`GameContext`](../../src/context/GameContext.tsx) — **do not overload it** (it is
score/lives/difficulty-coupled). Same shape: `useReducer` + `useCallback` dispatchers + `useLessons()`
(throws outside provider) + localStorage `smartmath.lessons`.

```ts
export type LessonStatus = 'locked'|'unlocked'|'inProgress'|'complete'
export interface LessonProgress { status: LessonStatus; stars: 0|1|2|3; bestAssessment: number; completedAt?: number }
export type LessonPhase = 'teach'|'assess'|'complete'
export interface ActiveLesson { lessonId: string; phase: LessonPhase; stepIndex: number; assessmentIndex: number; assessmentScore: number; attempts: number }
export interface LessonsState { progress: Record<string, LessonProgress>; active: ActiveLesson | null }
```

Actions: `START_LESSON | STEP_COMPLETE | ASSESS_ANSWER | NEXT_ASSESS | FINISH_LESSON | EXIT_LESSON`.
`FINISH_LESSON {passed}` records stars + `bestAssessment`, and on pass unlocks `CURRICULUM[idx+1]`.
Persist `progress` only (not `active`); entering `/lessons/:id` re-runs `START_LESSON`. First lesson
seeded `unlocked`; everything else starts `locked`. Mounted in
[`main.tsx`](../../src/main.tsx) as a sibling of `GameProvider`, inside `AppSettingsProvider`.

## `useTts` (`src/hooks/useTts.ts`)

`useTts(): { speak(text, opts?), cancel(), speaking, supported }`. Guards on
`'speechSynthesis' in window` (no-op in jsdom → tests trivial). Reads `muted`/`volume` from
`useAppSettings`; if muted, cancels + returns. Picks an English `localService===true` voice (cache
it; listen for `voiceschanged`). Arms the Chrome ~15 s pause-bug workaround (`resume()` every ~10 s
while speaking). `rate 0.9`, `pitch 1.05` (slower/brighter for kids). Cancels on unmount.
`watch` steps: speak on mount, Replay button, Next enables on `onEnd` (or `minDurationMs` if
unsupported).

## Step UI

**`<LessonStep>`** (`src/components/lessons/LessonStep.tsx`) dispatches on `step.kind`; receives
`onComplete()` + `onAttempt(correct)`; does not own advancement (the runner page does).

| kind | render | input | "done" |
|---|---|---|---|
| `watch` | `Card` + big `visual`; TTS on mount | Next / Replay | Next (or autoAdvance after `onEnd`+`minDurationMs`) → `onComplete` |
| `showMe` | `CameraView digitMode numHands=1` + `HoldRing` + target glyph | camera hold | `useAutoSubmit` commit (gated `=== target`) → `onComplete` |
| `count` | render `object` × `count`; tap toggles + `playTick` | tap, then `choose` row | correct total → `onComplete` |
| `choose` | `display` + option `Button`s | click | correct → `playCorrect`+`onComplete`; wrong → `playTryAgain`, retry |
| `compare` | two emoji groups + relation buttons | click | correct relation → `onComplete` |
| `solve` | `display` + `CameraView` + `HoldRing` + number-pad fallback | hold / pad | correct → `onComplete`; wrong → shake+retry (assessment: a miss) |

**`<StepProgress>`** (`src/components/lessons/StepProgress.tsx`, net-new): a row of DaisyUI `badge`
dots (`done`=success ✓ / `current`=primary ring / `future`=ghost) + a 🎯 checkpoint pill during
assessment. **`<HoldRing>`** (`src/components/lessons/HoldRing.tsx`): shared `radial-progress` ring
copied from `Play.tsx`'s inline ring (`--value/--size/--thickness`).

## i18n (`src/i18n/strings.ts`)

Add `nav.lessons` and a `lessons` block: chrome (`navLabel`, `start`, `continue`, `next`,
`replay`, `locked`, `showMePrompt(n)`, `countPrompt`, `choosePrompt`, `comparePrompt`,
`solvePrompt`, `tryAgain`, `assessmentTitle`, `passed`, `failed`, `starsLabel(s)`) + keyed prose
(`titles`, `objectives`, `steps` indexed by lesson/step id). `steps` values are
`string | ((...args:number[]) => string)`, resolved via `resolveStep(step)`. The `th` locale aliases
`en` (stub), so the parity test stays green; a real Thai pass is data-only (Phase 8.4).

## Audio (`src/hooks/useAudio.ts`)

Add three `SoundName`s (synthesized, [ADR-0007](../adr/ADR-0007-web-audio-synthesis.md) style):
`stepComplete` (C5→E5 rise), `tryAgain` (soft 392 Hz triangle blip — gentle, not the harsh `wrong`),
`lessonComplete` (C5–E5–G5–C6–E6 fanfare, paired with `finale()`).

## Implementation parameters

**Timing (ms):** `WATCH_MIN_MS 2500` · `LESSON_PROMPT_MS 1000` (gentler than Play's 1500) ·
`LESSON_CONFIRM_MS 800` (Play uses 1000; total 1.8 s) · `CORRECT_PAUSE_MS 900` · `TRY_AGAIN_MS 1200`
· `ADVANCE_DELAY_MS 400` · per-step `promptMs?`/`confirmMs?` override on `ShowMeStep`/`SolveStep`.

**Mastery / counts:** assessment = 5 questions; pass = **4 of 5 (80%)**; **stars** 3★ (pass, 0
retries + 5/5) · 2★ (pass, ≤2 retries or 4/5) · 1★ (pass) · 0★ (fail, stays `inProgress`); `choose`
= 3 options (2 in number-sense); `numHands=1` and `digitMode=true` everywhere; reuse
`DENOISE_FRAMES=6`.

**Per-lesson ranges** (`targetNumbers`/assessment `maxAnswer`): Sense 1.1 `1–5`, 1.2 `1–5`, 1.3
`0–1` · Fingers 2.1 `1–4`, 2.2 `5`, 2.3 `6–9`, 2.4 `0–9` · Add 3.1 `≤4`, 3.2 `≤5`, 3.3 `≤9` · Sub
4.1 `≤4`, 4.2 `≤5`, 4.3 `≤9`.

**TTS:** rate `0.9`, pitch `1.05`, volume from settings, English `localService` voice;
`supported=false` → text-only, Next still enables on `WATCH_MIN_MS`.

## Phased build order

- **A — Spine + one lesson end-to-end (no TTS).** Types + `CURRICULUM` with lesson 2.1 only;
  `LessonsContext`; `LessonRunner`; `LessonStep` (`watch`/`showMe`/`choose`); `Lessons` list;
  `StepProgress`; `HoldRing`; edits to `App`/`MainLayout`/`main`/`strings`/`CameraView`(`digitMode`)/
  `mathGenerator`. Exit: start → finish steps → pass 4/5 → unlock lesson 2 (stub) → persists across
  reload.
- **B — TTS.** `useTts`; speak on mount + Replay + `watch` Next-enable on `onEnd`; assessment
  feedback. Exit: all prompts spoken; Chrome bug handled; degrades when unsupported.
- **C — Full curriculum + remaining step kinds.** All 13 lessons; `count` + `compare` views; new
  sounds; stars/attempts accounting.
- **D — Polish + docs.** Home CTA; per-step timing tuning; `<LessonComplete>` with `finale()` +
  stars; reduced-motion audit; tests; flip ROADMAP §8.3 status; write ADR-0009.

## Files to touch

**Create:** `src/content/lessons.ts`, `src/context/LessonsContext.tsx`, `src/hooks/useTts.ts`,
`src/pages/Lessons.tsx`, `src/pages/LessonRunner.tsx`,
`src/components/lessons/{LessonStep,StepProgress,HoldRing,LessonComplete}.tsx`,
`src/utils/lessonsContent.ts`, and co-located `*.test.ts(x)`.

**Modify (additive):** `src/App.tsx` (+2 lazy routes), `src/layouts/MainLayout.tsx` (+1
`NAV_ROUTES`), `src/main.tsx` (`<LessonsProvider>`), `src/i18n/strings.ts` (+`lessons` + `nav.lessons`),
`src/hooks/useAudio.ts` (+3 sounds), `src/utils/mathGenerator.ts` (export
`generateAddition`/`generateSubtraction` — promote existing internals, non-breaking),
`src/components/camera/CameraView.tsx` (+`digitMode`), `src/pages/Home.tsx` (optional CTA).

No changes to `fingerMathLogic.ts`, `useAutoSubmit.ts`, `GameContext.tsx`, or
`AppSettingsContext.tsx`.

## Risks

1. **`handsToNumber` place-value quirk (HIGH).** `numHands=1` + a left hand → reads as tens ("3" →
   30). Fix = `CameraView.digitMode` prop (above). Phase-A expedient if deferred: consumer normalize
   `v <= 9 ? v : v/10` (safe only in single-hand mode) — recommend the prop before shipping digit
   lessons.
2. **`showMe` 0 vs −1 (LOW).** A held fist = submittable 0; no hand = −1 (cancels). A steady fist is
   awkward for a 5 y/o → shorter confirm + "make a fist!" narration for target 0.
3. **SpeechSynthesis voice availability (MED).** OS-dependent; some "remote" voices need a first-use
   network download (mild offline tension, but an OS service, not app egress). `supported` degrades
   to text-only. Recommend OS voices for Phase A.
4. **Pre-reader solo use (MED).** If TTS is unavailable, an adult is needed. Mitigation: every step
   has a clear glyph (not narration-only) + a persistent "🔊 Hear it again" button.
5. **Hold timing for small children (MED).** Lesson holds set gentler (1.0 + 0.8 s); per-step
   override available if kids can't hold still.

## Exit criteria

- A 5–6 y/o can complete lesson 2.1 solo: `watch` narrates & Next enables after speech; each
  `showMe` commits only on the **correct** held digit (`digitMode` makes a left-hand "3" read as 3);
  wrong = gentle "try again" with no penalty; 4/5 → lesson complete + stars + unlock + `finale()`;
  reload → progress + unlock persist under `smartmath.lessons`.
- `npm run lint && npm run typecheck && npm run build` green; `npm test` green (existing 136
  unaffected — all edits additive, `digitMode` defaults off).
- Full 13-lesson track playable end-to-end (Phase C).

## RFC / ADR?

[RFC-0004](../rfc/RFC-0004-lessons-curriculum.md) (resolves §8.3's deferred scope/age/assessment).
ADR-0009 after the build records the architecture (LessonsContext, data-only authoring, `digitMode`,
TTS). This README + RFC are the planning step; no `src/` code until Phase A.
