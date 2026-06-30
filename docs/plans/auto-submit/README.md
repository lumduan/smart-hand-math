# Auto-submit — gesture-held answer commit (Phase 8.2)

> Part of [Phase 8 — Enhancement / Future Vision](../ROADMAP.md#phase-8--enhancement--future-vision).
> Status: **planned**. Related: [RFC-0003](../rfc/RFC-0003-auto-submit.md).
> Tech: React (hook) + framer-motion (prompt); no new deps.

## Goal

When the player holds a finger number still, show a visible prompt, then commit
it after a short confirm window — a predictable, fair submit path with a chance
to correct, replacing today's silent 500ms correct-only auto-commit. Timing must
be tunable so we can find the optimal value before setting a default.

## Core decision: REPLACE the 500ms fast-commit

Today ([`Play.tsx:78-88`](../../src/pages/Play.tsx), `ANSWER_HOLD_MS = 500`) only
a held CORRECT answer auto-commits at 500ms; wrong gestures held forever never
commit. AutoSubmit (T1 prompt + T2 commit) becomes the only gesture-commit path;
remove `ANSWER_HOLD_MS` (`Play.tsx:22`), `confirmStartedAt` (`:57`), and the
commit effect (`:78-88`). `autoSubmitEnabled=false` falls back to the legacy
500ms silent hold. See [RFC-0003](../rfc/RFC-0003-auto-submit.md) for rationale.

## Two-stage design

- T1 (`autoSubmitPromptMs`, default 1500): hand held on the SAME number → prompt.
- T2 (`autoSubmitConfirmMs`, default 1000): keep holding the SAME number → commit.
- Gesture changes or hand leaves frame (`-1`) → cancel immediately, restart.
- Keys off the already-denoised `detected` (6-frame mode filter in `CameraView`).
  No extra smoothing. `-1` never starts the timer.

## Timer model — `useAutoSubmit` hook (new `src/hooks/useAutoSubmit.ts`)

- Refs: `stableSinceRef`, `promptAtRef`, `pendingValueRef`, `detectedRef`,
  `lastValueRef`.
- One rAF / `setInterval` loop armed only while
  `status==='playing' && !lastAnswer`. Raises the prompt at T1, commits at T1+T2.
- State `pending { value, progress }` drives the UI / ring.
- Reset on `currentQuestion.id` change; cancel the loop in cleanup.
- Calls the same `submit(n)` ([`Play.tsx:61`](../../src/pages/Play.tsx)) so the
  `submittedFor` dedupe holds.
- Does NOT rely on the "effect re-fires because `detected` changed" pattern
  (jitter-dependent; unreliable for timing — see RFC-0003).

```ts
useAutoSubmit({
  enabled, promptMs, confirmMs, // from useAppSettings()
  detected,                     // denoised value from CameraView
  canSubmit,                    // status==='playing' && !lastAnswer && currentQuestion
  questionId,                   // for reset-on-change
  commit,                       // wraps Play.submit()
}): { pending: { value: number; progress: number } | null }
```

## Prompt UI

- Inline `motion.div` REPLACING the "showing/waiting" badge
  ([`Play.tsx:210-214`](../../src/pages/Play.tsx)) when pending. No new Toast
  component (matches the inline-transient idiom; `Modal.tsx` is too heavy).
- Shows the number being submitted + a framer-motion progress ring filling over
  T2 (the "hold-to-commit ring" noted in [animations/README](../animations/README.md)).
- `role="status"` + `aria-live="polite"`.

## i18n (`src/i18n/strings.ts` → `play` block)

- `autoPrompt: (n) => \`Submitting ${n}…\``
- `autoPromptCancel: 'Change your hand to cancel'`
- `autoPromptAria: (n) => \`Submitting ${n}. Change your hand to cancel.\``
- **Edit `play.padHelper`** (`strings.ts:106-107`) — currently advertises a
  "~½ second" hold, which will be wrong after REPLACE.

## Settings (`AppSettingsContext`) — tunable

- `autoSubmitEnabled: boolean` (default `true`; `false` = legacy 500ms hold).
- `autoSubmitPromptMs: number` (default 1500).
- `autoSubmitConfirmMs: number` (default 1000).
- Persisted (forward-compatible merge); per-field setters matching the file idiom.

## Tuning / experimentation

- Temporary `?tune` floating panel (`src/components/dev/TunePanel.tsx`, mounted in
  `MainLayout.tsx`) with two range inputs + enable toggle (+ a `cameraScale`
  stepper, shared with §8.1). Query-param-gated so it works in the deployed PWA.
- Plan: A/B `promptMs × confirmMs` (e.g. 1000/800, 1500/1000, 800/600) across a
  few sessions; pick the value that keeps Timed-mode pacing tolerable while
  giving kids enough correction time. Record the winner in ADR-0008; hard-code as
  default; delete the panel.

## Edge cases

- Question change mid-hold → reset (depend on `currentQuestion.id`).
- `lastAnswer` set (post-submit, pre-`NEXT`) → hook idle.
- `status !== 'playing'` → hook idle.
- No camera / keypad → `detected` stays `-1`; keypad still routes through
  `submit()` / `submittedFor` dedupe, so no double-submit.
- Hand leaves frame or gesture changes during T2 → cancel + restart.

## Files to touch

- `src/pages/Play.tsx:21-22` (remove `ANSWER_HOLD_MS`), `:57` (`confirmStartedAt`),
  `:78-88` (replace effect with the hook), `:210-214` (prompt UI).
- New `src/hooks/useAutoSubmit.ts`.
- `src/context/AppSettingsContext.tsx` — 3 fields + setters.
- `src/i18n/strings.ts` (`play` block) — new strings + `padHelper` edit.
- `src/components/dev/TunePanel.tsx` + mount in `src/layouts/MainLayout.tsx`.
- Tests: hook unit tests (prompt / commit / cancel / reset-on-question) + Play
  integration.

## Exit criteria

- Held gesture → prompt at T1 → commit at T1+T2; cancel on change / `-1`.
- Timing tunable via persisted settings; defaults chosen from tuning.
- Legacy 500ms reachable via `autoSubmitEnabled = false`.
- Tests green; no new runtime dependencies.

## RFC / ADR?

[RFC-0003](../rfc/RFC-0003-auto-submit.md) (this change). ADR-0008 after tuning
(records the chosen defaults + the replace decision).
