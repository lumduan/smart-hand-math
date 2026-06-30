/**
 * Centralized, typed user-facing strings (Phase 4 i18n).
 *
 * Every translatable string lives here; components read it via `useStrings()`.
 * Adding a language is a DATA-ONLY change: add a new locale to `STRINGS` typed
 * `Strings` (the type enforces key parity). Thai (`th`) is currently a structural
 * stub that mirrors `en`; real Thai copy arrives in Phase 8.
 *
 * NOTE: mathematical notation (`+`, `−` U+2212, `×` U+00D7, `?`, `=`) and
 * digits/emoji are universal and stay code-side (in `mathGenerator.ts`), not
 * here — only `play.answerSuffix` is surfaced so the prompt renders with no
 * other inline literals. Interpolated strings are typed functions.
 */

const en = {
  doc: {
    title: 'SmartHand Math ✋🧮',
    description:
      'SmartHand Math — a fun, hands-free mental-math game for kids. Show fingers to the camera to answer!',
    lang: 'en',
  },

  nav: {
    brand: 'SmartHand Math',
    home: 'Home',
    learn: 'Learn',
    play: 'Play',
    mirrorOn: 'Mirror on',
    mirrorOff: 'Mirror off',
    mirrorAria: 'Toggle mirror',
    muted: 'Muted',
    soundOn: 'Sound on',
    soundAria: 'Toggle sound',
    localeAria: 'Change language',
    skipToContent: 'Skip to content',
    footer: 'Built with React · Vite · MediaPipe · Tailwind + DaisyUI',
  },

  home: {
    heroLead: 'Math you can ',
    heroEmphasis: 'hold up',
    heroSuffix: ' ✋',
    heroSubtitle:
      'SmartHand Math turns your webcam into a controller. Answer mental-math questions by showing fingers to the camera — no keyboard, no mouse, just hands.',
    ctaPlay: '▶️ Play now',
    ctaLearn: '✋ Learn the gestures',
    features: [
      {
        title: 'Show with fingers',
        text: 'Hold up your hand and the camera reads the number of fingers in real time.',
      },
      {
        title: 'Mental math',
        text: 'Addition, subtraction and times tables that grow harder as you score more.',
      },
      {
        title: 'Friendly & fun',
        text: 'Cheerful colors, sounds and badges designed for kids and classrooms.',
      },
    ],
    onboarding: {
      title: 'How it works',
      bodyStart: 'Tap ',
      bodyEmphasis1: 'Start',
      bodyMid:
        ' on the Play or Learn page to turn on your camera. Everything runs right here in your browser — ',
      bodyEmphasis2: 'the video never leaves your device.',
      bodyEnd: ' (Camera access needs HTTPS or localhost.)',
      dismissAria: 'Dismiss',
    },
  },

  learn: {
    title: 'Learn the gestures',
    subtitle: 'Turn on the camera and hold up your fingers. Try to make each number from 0 to 10!',
    showing: "You're showing",
    feedbackEmpty: 'Point your hand at the camera…',
    feedbackOne: 'One finger — great!',
    feedbackMany: 'Nice! Keep practicing different numbers.',
  },

  play: {
    idleTitle: 'Ready to play?',
    idleBody: (lives: number) =>
      `Pick a mode, then answer each question by holding up the right number of fingers. You have ${lives} lives.`,
    prompt: 'Show the answer with your fingers',
    promptBigger: 'Show the bigger number',
    promptNext: 'Show the next number',
    modeEndless: 'Endless',
    modeEndlessDesc: 'Play until you run out of lives. How high can you score?',
    modeTimed: 'Timed',
    modeTimedDesc: (seconds: number) => `Answer as many as you can in ${seconds} seconds.`,
    modeMissions: 'Missions',
    modeMissionsDesc: (goal: number) => `Answer ${goal} correctly to win!`,
    goalProgress: (done: number, total: number) => `🎯 ${done} / ${total}`,
    livesLabel: (lives: number) => `${lives} lives remaining`,
    waiting: '✋ Waiting for your hand…',
    showing: (detected: number) => `You're showing ${detected}`,
    correct: (expected: number) => `✅ Correct! It's ${expected}`,
    wrong: (given: number, expected: number) =>
      `❌ Oops, you showed ${given}. It's ${expected}`,
    padTitle: 'No camera? Type your answer (0–99):',
    padPlaceholder: '?',
    padAria: 'Type your answer',
    padSubmit: 'Submit',
    padHelper:
      'With the camera, hold the right finger value in view for ~½ second to auto-answer. Left hand = tens, right hand = ones (e.g. 3 on the left + 7 on the right = 37).',
    modalWon: '🎉 You won!',
    modalLost: '💀 Game over',
    youScored: 'You scored',
    bestLabel: (best: number) => `Best: ${best}`,
    playAgain: '🔁 Play again',
    home: '🏠 Home',
  },

  camera: {
    off: '📷 Camera off',
    loading: '⏳ Loading…',
    ready: '● Tracking',
    blocked: '⛔ Camera blocked',
    startAria: 'Start camera',
    stopAria: 'Stop camera',
    videoAria: 'Webcam preview for finger counting',
    errorTitle: '⛔ Camera blocked',
    errorBody: (error: string) =>
      `${error}. Allow camera access in your browser, then tap ▶️ to try again. (Camera needs HTTPS or localhost.)`,
  },

  game: {
    level: (level: number) => `Level ${level}`,
    difficultyEasy: 'Easy',
    difficultyMedium: 'Medium',
    difficultyHard: 'Hard',
    timer: (remaining: number) => `⏱ ${remaining}s`,
    timerAria: 'Countdown timer',
  },

  common: {
    close: 'Close',
    closeAria: 'Close modal',
  },
} as const

export type Strings = typeof en

/** Supported locales. `th` is a structural stub (= `en`) until Phase 8. */
export type Locale = 'en' | 'th'

export const STRINGS: Record<Locale, Strings> = {
  en,
  // Phase 8: replace this stub with a real Thai translation (typed `Strings`).
  th: en,
}

/** All supported locale codes (used to validate persisted/user input). */
export const LOCALES: readonly Locale[] = ['en', 'th']

/** Coerce an arbitrary stored string to a valid `Locale` (default `en`). */
export function toLocale(value: unknown): Locale {
  return LOCALES.includes(value as Locale) ? (value as Locale) : 'en'
}
