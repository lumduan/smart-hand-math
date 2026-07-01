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

// Lesson prose is keyed by lesson/step id so it is indexable at runtime
// (`resolveStep` in src/utils/lessonsContent.ts). Typed as Record (not `as
// const`) on purpose, so arbitrary id lookups typecheck. Thai pass = data-only.
const lessonTitles: Record<string, string> = {
  'counting-fingers': 'Your counting fingers',
  'magic-thumb': 'The magic thumb',
  'five-and-more': 'Five and more',
  'all-the-numbers': 'All the numbers',
  'adding-is-more': 'Adding is more',
  'part-and-whole': 'Part and whole',
  'bigger-adds': 'Bigger adds',
  'taking-away': 'Taking away',
  'how-many-left': 'How many are left?',
  'bigger-take-aways': 'Bigger take-aways',
}

const lessonObjectives: Record<string, string> = {
  'counting-fingers': 'Learn to show 1, 2, 3 and 4 with your fingers.',
  'magic-thumb': 'Discover that the thumb means five.',
  'five-and-more': 'Make 6, 7, 8 and 9 — five and a few more fingers.',
  'all-the-numbers': 'Show any number from 0 to 9.',
  'adding-is-more': 'Add 1 and 2 — adding makes more.',
  'part-and-whole': 'Put parts together to make 5.',
  'bigger-adds': 'Add up to sums of 9 using your thumb.',
  'taking-away': 'Take away 1 and 2 — count back.',
  'how-many-left': 'Subtract within 5. How many are left?',
  'bigger-take-aways': 'Take away bigger numbers, up to 9.',
}

// Per-step narration. `watch` steps need an entry; other kinds fall back to a
// kind-based prompt (showMePrompt / solvePrompt / …) in `resolveStep`.
const lessonSteps: Record<string, string> = {
  'cf-watch-1': 'Each finger is ONE! Pointer up is one. Add the middle finger for two.',
  'cf-watch-2': 'One, two, three, four — four fingers. Great counting!',
  'mt-watch-1':
    "Here's the magic: the THUMB is worth FIVE! That is how we show big numbers on one hand.",
  'mt-watch-2': 'Thumb equals five. Remember this — it is the secret of finger math!',

  // Unit 2 (cont.) — 6–9 and full recall (showMe steps use "Show me N!").
  'fm-watch-1': 'Six is five and one more! Open your thumb, then add one finger.',
  'fm-watch-2': 'Six, seven, eight, nine — five and more. You did it!',
  'an-watch-1': 'You know them all now, zero all the way to nine. Amazing!',

  // Unit 3 — addition. `solve` steps speak the problem for pre-readers.
  'am-watch-1': 'When we add, we put groups together to make more.',
  'am-solve-1': 'One, and one more. How many? Show me!',
  'am-solve-2': 'Three, and one more. Show me the answer!',
  'am-solve-3': 'Two, and two more. Show me!',
  'am-watch-2': 'Adding always makes the number bigger.',
  'pw-watch-1': 'Two and three make five. Little parts join into a whole.',
  'pw-solve-1': 'Two, and three more. Show me!',
  'pw-solve-2': 'One, and four more. Show me!',
  'pw-choose-1': 'One plus what makes four? Tap the answer!',
  'pw-solve-3': 'Zero, and five more. Show me!',
  'ba-watch-1': 'Five and two more is seven. Use your thumb for five!',
  'ba-solve-1': 'Five, and one more. Show me!',
  'ba-solve-2': 'Six, and two more. Show me!',
  'ba-solve-3': 'Four, and three more. Show me!',
  'ba-solve-4': 'Five, and four more. Show me!',

  // Unit 4 — subtraction.
  'ta-watch-1': 'When we take away, there are fewer left.',
  'ta-solve-1': 'Three, take away one. How many are left? Show me!',
  'ta-solve-2': 'Four, take away one. Show me!',
  'ta-solve-3': 'Five, take away two. Show me!',
  'ta-watch-2': 'Taking away always makes the number smaller.',
  'hl-watch-1': 'Five take away one leaves four. How many are left?',
  'hl-solve-1': 'Five, take away one. Show me!',
  'hl-solve-2': 'Four, take away two. Show me!',
  'hl-solve-3': 'Five, take away five. Make a fist for zero!',
  'hl-solve-4': 'Three, take away three. Show me zero!',
  'bt-watch-1': 'Nine take away four is five. Count back!',
  'bt-solve-1': 'Nine, take away two. Show me!',
  'bt-solve-2': 'Eight, take away three. Show me!',
  'bt-solve-3': 'Seven, take away five. Show me!',
  'bt-solve-4': 'Nine, take away nine. Show me zero!',
}

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
    lessons: 'Lessons',
    mirrorOn: 'Mirror on',
    mirrorOff: 'Mirror off',
    mirrorAria: 'Toggle mirror',
    muted: 'Muted',
    soundOn: 'Sound on',
    soundAria: 'Toggle sound',
    cameraSizeAria: 'Camera size',
    cameraSizeSm: 'Small',
    cameraSizeMd: 'Medium',
    cameraSizeLg: 'Large',
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
    autoPrompt: (n: number) => `Submitting ${n}…`,
    autoPromptCancel: 'Change your hand to cancel',
    autoPromptAria: (n: number) => `Submitting ${n}. Change your hand to cancel.`,
    correct: (expected: number) => `✅ Correct! It's ${expected}`,
    wrong: (given: number, expected: number) =>
      `❌ Oops, you showed ${given}. It's ${expected}`,
    padTitle: 'No camera? Type your answer (0–99):',
    padPlaceholder: '?',
    padAria: 'Type your answer',
    padSubmit: 'Submit',
    padHelper:
      'With the camera, hold a finger value steady and a ring counts down to submit it (change your hand to cancel). Left hand = tens, right hand = ones (e.g. 3 on the left + 7 on the right = 37).',
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

  lessons: {
    navLabel: 'Lessons',
    listTitle: 'Pick a lesson',
    listSubtitle: 'Learn step by step. Finish a lesson to unlock the next!',
    start: 'Start',
    continue: 'Continue',
    replay: '🔁 Hear it again',
    next: 'Next ➡️',
    listen: '🎧 Listen…',
    locked: '🔒 Locked',
    complete: '✅ Done',
    // Kind-based prompt fallbacks (indexed by resolveStep).
    showMePrompt: (n: number) => `Show me ${n}!`,
    countPrompt: 'Tap each one, then pick how many',
    choosePrompt: 'Tap the answer',
    comparePrompt: 'Which has more?',
    solvePrompt: 'Show the answer with your fingers',
    tryAgain: 'Try again!',
    assessmentTitle: 'Quick check',
    passed: '🎉 Lesson complete!',
    failed: 'Good try! Want another go?',
    // Spoken (TTS) variants — emoji-free so the voice reads cleanly (Phase 8.3-B).
    spokenGreat: 'Great job!',
    spokenPassed: 'You did it! Lesson complete.',
    spokenFailed: "Good try! Let's do it again.",
    scoreLabel: (score: number, total: number) => `You got ${score} out of ${total}`,
    starsLabel: (s: number) => `${s} star${s === 1 ? '' : 's'}`,
    playAgain: '🔁 Try again',
    back: '🏠 Back to lessons',
    // No-camera fallback for camera steps (single-hand answers are 0–9).
    padTitle: 'No camera? Type the answer (0–9)',
    padAria: 'Type the answer',
    padSubmit: 'Check',
    // Keyed prose (looked up by lesson/step id at runtime).
    titles: lessonTitles,
    objectives: lessonObjectives,
    steps: lessonSteps,
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
