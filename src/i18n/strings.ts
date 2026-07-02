/**
 * Centralized, typed user-facing strings (Phase 4 i18n).
 *
 * Every translatable string lives here; components read it via `useStrings()`.
 * Adding a language is a DATA-ONLY change: add a new locale to `STRINGS` typed
 * `Strings` (the type enforces key + interpolation-param parity). `en` is the
 * reference locale; `th` is a full Thai translation (Phase 8.4). `en` is
 * intentionally NOT `as const` so sibling locales may hold different string
 * values while `Strings` still requires identical keys and function signatures.
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
  'how-many': 'How many?',
  'more-or-fewer': 'More or fewer?',
  'zero-means-none': 'Zero means none',
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
  'tens-and-ones': 'Tens and ones',
  'all-the-way-to-99': 'All the way to 99',
  'adding-big': 'Adding big numbers',
  'taking-from-big': 'Taking away big numbers',
}

const lessonObjectives: Record<string, string> = {
  'how-many': 'Count things and say how many there are.',
  'more-or-fewer': 'Compare two groups — which one has more?',
  'zero-means-none': 'Zero means none — an empty hand is 0.',
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
  'tens-and-ones': 'Use two hands — left for tens, right for ones.',
  'all-the-way-to-99': 'Show any number from 0 to 99 with two hands.',
  'adding-big': 'Add bigger numbers, all the way to 99.',
  'taking-from-big': 'Take away bigger numbers, all the way to 99.',
}

// Per-step narration. `watch` steps need an entry; other kinds fall back to a
// kind-based prompt (showMePrompt / solvePrompt / …) in `resolveStep`.
const lessonSteps: Record<string, string> = {
  // Unit 1 — number sense (count / compare / zero).
  'hm-watch-1': "Let's count! Point to each one and say a number: one, two, three.",
  'hm-count-3': 'Tap each apple to count it, then pick how many. One, two, three!',
  'hm-count-5': 'Now the stars. Tap each one and count. How many are there?',
  'hm-show-3': 'Now show three with your fingers!',
  'hm-watch-2': 'The last number you say is how many there are. Great counting!',
  'mf-watch-1': 'Which group has more? The one with more things is bigger!',
  'mf-compare-1': 'Which side has more? Tap the bigger group!',
  'mf-compare-2': 'Compare again — tap the group that has more.',
  'mf-choose-1': 'Which is more, two or four? Tap it!',
  'mf-watch-2': 'More is a bigger number. Fewer is less. Same means they are equal!',
  'zm-watch-1': 'Zero means none — nothing at all. A closed fist shows zero!',
  'zm-count-0': 'How many cookies are here? There are none. That is zero!',
  'zm-show-0': 'Show me zero — make a fist!',
  'zm-choose-0': 'The plate is empty. How many? Tap zero!',

  // Unit 2 — Soroban digits.
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

  // Unit 5 — two-hand place value 0–99 (showMe steps use "Show me N!").
  'tao-watch-1': 'Now use BOTH hands! Your LEFT hand counts tens, your right hand counts ones.',
  'tao-watch-2': 'Left hand is tens, right hand is ones — two hands make bigger numbers!',
  'atw-watch-1': 'Four on the left and seven on the right makes forty-seven!',
  'atw-watch-2': 'You can show every number, all the way to ninety-nine!',
  'ab-watch-1': 'Ten and five more is fifteen. Show it with two hands!',
  'ab-solve-1': 'Ten, and five more. Show me with two hands!',
  'ab-solve-2': 'Twenty, and thirteen more. Show me!',
  'ab-solve-3': 'Thirty, and twenty-five more. Show me!',
  'ab-watch-2': 'Adding big numbers — use both hands for the answer.',
  'tb-watch-1': 'Fifteen take away five leaves ten. Show it with two hands!',
  'tb-solve-1': 'Fifteen, take away five. Show me with two hands!',
  'tb-solve-2': 'Thirty, take away ten. Show me!',
  'tb-solve-3': 'Forty-five, take away twenty-three. Show me!',
  'tb-watch-2': 'Taking away big numbers — show the answer on two hands.',
}

// Worded watch-step visuals — localized (keyed by step id, like the maps above).
// Pure glyph/number/emoji visuals stay inline on the step in src/content/lessons.ts;
// only visuals that contain WORDS live here so they translate. WatchView prefers
// `lessons.visuals[id]` and falls back to the step's inline `visual`.
const lessonVisuals: Record<string, string> = {
  'zm-watch-1': '✊ = 0   (none!)',
  'mf-watch-2': 'more  ·  fewer  ·  same',
  'mt-watch-2': 'Thumb = 5  ⭐',
  'am-watch-2': 'Adding makes more ➕',
  'ta-watch-2': 'Taking away makes fewer ➖',
  'tao-watch-1': '✋ tens   ·   ✋ ones',
  'tao-watch-2': 'Left = tens   ·   Right = ones',
  'ab-watch-2': 'Big adds ➕',
  'tb-watch-2': 'Big take-aways ➖',
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
    ctaLessons: '🎓 Start lessons',
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
    comparePrompt: 'Which group has more? Tap it!',
    same: '🟰 Same',
    countObjectAria: 'Tap to count',
    compareLeftAria: 'Tap the left group',
    compareRightAria: 'Tap the right group',
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
    visuals: lessonVisuals,
  },

  common: {
    close: 'Close',
    closeAria: 'Close modal',
    errorTitle: 'Oops! Something broke',
    errorBody: "Let's start fresh — tap the button to reload the page.",
    errorReload: '🔄 Start over',
  },
}

// Shape of a complete locale. Derived from `en` (the reference); because `en` is
// not `as const`, string props widen to `string`, so `th` may differ in value
// while every key + function signature must still match (compile-enforced).
export type Strings = typeof en

/** Supported locales. `en` is the reference; `th` is a full translation. */
export type Locale = 'en' | 'th'

// ===========================================================================
// Thai (`th`) — full translation (Phase 8.4). Warm, child-appropriate register
// for 5–6-year-olds; the child is addressed as "หนู". Math glyphs / digits /
// emoji stay code-side (untouched). Keyed prose mirrors the English maps above
// key-for-key (the parity test recurses into these Records). Rendered in Mitr
// (the Thai fallback in the `display` font stack); TTS reads it with the
// device's Thai voice (see src/hooks/useTts.ts).
// ===========================================================================

const lessonTitlesTh: Record<string, string> = {
  'how-many': 'มีกี่อัน?',
  'more-or-fewer': 'มากกว่าหรือน้อยกว่า?',
  'zero-means-none': 'ศูนย์แปลว่าไม่มี',
  'counting-fingers': 'นิ้วนับเลขของหนู',
  'magic-thumb': 'นิ้วโป้งวิเศษ',
  'five-and-more': 'ห้าและมากกว่า',
  'all-the-numbers': 'ครบทุกจำนวน',
  'adding-is-more': 'บวกคือเพิ่มขึ้น',
  'part-and-whole': 'ส่วนย่อยและทั้งหมด',
  'bigger-adds': 'บวกให้มากขึ้น',
  'taking-away': 'การเอาออก',
  'how-many-left': 'เหลือกี่อัน?',
  'bigger-take-aways': 'ลบจำนวนที่มากขึ้น',
  'tens-and-ones': 'หลักสิบและหลักหน่วย',
  'all-the-way-to-99': 'ไปจนถึง 99',
  'adding-big': 'บวกจำนวนใหญ่',
  'taking-from-big': 'ลบจำนวนใหญ่',
}

const lessonObjectivesTh: Record<string, string> = {
  'how-many': 'นับสิ่งของแล้วบอกว่ามีทั้งหมดกี่อัน',
  'more-or-fewer': 'เปรียบเทียบสองกลุ่ม — กลุ่มไหนมีมากกว่ากัน?',
  'zero-means-none': 'ศูนย์แปลว่าไม่มี — มือเปล่าคือ 0',
  'counting-fingers': 'หัดชู 1, 2, 3 และ 4 ด้วยนิ้วมือ',
  'magic-thumb': 'มารู้จักนิ้วโป้งที่มีค่าเท่ากับห้า',
  'five-and-more': 'ทำ 6, 7, 8 และ 9 — ห้าบวกอีกไม่กี่นิ้ว',
  'all-the-numbers': 'ชูจำนวนใดก็ได้ตั้งแต่ 0 ถึง 9',
  'adding-is-more': 'บวก 1 และ 2 — บวกแล้วมากขึ้น',
  'part-and-whole': 'นำส่วนย่อยมารวมกันให้เป็น 5',
  'bigger-adds': 'บวกให้ได้ผลรวมถึง 9 โดยใช้นิ้วโป้ง',
  'taking-away': 'เอาออก 1 และ 2 — นับถอยหลัง',
  'how-many-left': 'ลบภายใน 5 แล้วเหลือกี่อัน?',
  'bigger-take-aways': 'เอาออกจำนวนที่มากขึ้น ได้ถึง 9',
  'tens-and-ones': 'ใช้สองมือ — มือซ้ายเป็นหลักสิบ มือขวาเป็นหลักหน่วย',
  'all-the-way-to-99': 'ชูจำนวนใดก็ได้ตั้งแต่ 0 ถึง 99 ด้วยสองมือ',
  'adding-big': 'บวกจำนวนที่ใหญ่ขึ้น ไปจนถึง 99',
  'taking-from-big': 'เอาออกจำนวนที่ใหญ่ขึ้น ไปจนถึง 99',
}

const lessonStepsTh: Record<string, string> = {
  // หน่วย 1 — ความรู้สึกเชิงจำนวน (นับ / เปรียบเทียบ / ศูนย์)
  'hm-watch-1': 'มานับกันเถอะ! ชี้ไปที่แต่ละอันแล้วพูดจำนวน หนึ่ง สอง สาม',
  'hm-count-3': 'แตะแอปเปิลทีละลูกเพื่อนับ แล้วเลือกว่ามีกี่ลูก หนึ่ง สอง สาม!',
  'hm-count-5': 'ทีนี้มาที่ดวงดาว แตะทีละดวงแล้วนับ มีทั้งหมดกี่ดวง?',
  'hm-show-3': 'ทีนี้ชูสามด้วยนิ้วมือสิ!',
  'hm-watch-2': 'จำนวนสุดท้ายที่พูดคือจำนวนทั้งหมด นับเก่งมาก!',
  'mf-watch-1': 'กลุ่มไหนมีมากกว่า? กลุ่มที่มีของมากกว่าคือกลุ่มที่ใหญ่กว่า!',
  'mf-compare-1': 'ฝั่งไหนมีมากกว่า? แตะกลุ่มที่มากกว่าสิ!',
  'mf-compare-2': 'เปรียบเทียบอีกครั้ง — แตะกลุ่มที่มีมากกว่า',
  'mf-choose-1': 'อะไรมากกว่ากัน สองหรือสี่? แตะเลย!',
  'mf-watch-2': 'มากกว่าคือจำนวนที่ใหญ่กว่า น้อยกว่าคือจำนวนที่น้อยกว่า เท่ากันคือมีจำนวนเท่ากัน!',
  'zm-watch-1': 'ศูนย์แปลว่าไม่มี — ไม่มีอะไรเลย กำมือไว้คือศูนย์!',
  'zm-count-0': 'ตรงนี้มีคุกกี้กี่ชิ้น? ไม่มีเลย นั่นคือศูนย์!',
  'zm-show-0': 'ชูศูนย์ให้ดูหน่อย — กำมือสิ!',
  'zm-choose-0': 'จานว่างเปล่า มีกี่ชิ้น? แตะศูนย์!',

  // หน่วย 2 — เลขโซโรบัน
  'cf-watch-1': 'แต่ละนิ้วคือหนึ่ง! ชูนิ้วชี้คือหนึ่ง เพิ่มนิ้วกลางเป็นสอง',
  'cf-watch-2': 'หนึ่ง สอง สาม สี่ — สี่นิ้ว นับเก่งมาก!',
  'mt-watch-1': 'นี่คือความวิเศษ นิ้วโป้งมีค่าเท่ากับห้า! เราจึงชูจำนวนใหญ่ๆ ได้ด้วยมือเดียว',
  'mt-watch-2': 'นิ้วโป้งเท่ากับห้า จำไว้นะ — นี่คือเคล็ดลับของการนับนิ้ว!',

  // หน่วย 2 (ต่อ) — 6–9 และทบทวนทั้งหมด
  'fm-watch-1': 'หกคือห้าบวกอีกหนึ่ง! กางนิ้วโป้งออก แล้วเพิ่มอีกหนึ่งนิ้ว',
  'fm-watch-2': 'หก เจ็ด แปด เก้า — ห้าและมากกว่า หนูทำได้แล้ว!',
  'an-watch-1': 'ตอนนี้หนูรู้ครบหมดแล้ว ตั้งแต่ศูนย์ไปจนถึงเก้า เยี่ยมไปเลย!',

  // หน่วย 3 — การบวก
  'am-watch-1': 'เวลาบวก เรานำกลุ่มมารวมกันให้มากขึ้น',
  'am-solve-1': 'หนึ่ง บวกอีกหนึ่ง ได้เท่าไร? ชูให้ดูหน่อย!',
  'am-solve-2': 'สาม บวกอีกหนึ่ง ชูคำตอบให้ดูหน่อย!',
  'am-solve-3': 'สอง บวกอีกสอง ชูให้ดูหน่อย!',
  'am-watch-2': 'บวกแล้วจำนวนจะใหญ่ขึ้นเสมอ',
  'pw-watch-1': 'สองกับสามรวมกันเป็นห้า ส่วนเล็กๆ มารวมกันเป็นทั้งหมด',
  'pw-solve-1': 'สอง บวกอีกสาม ชูให้ดูหน่อย!',
  'pw-solve-2': 'หนึ่ง บวกอีกสี่ ชูให้ดูหน่อย!',
  'pw-choose-1': 'หนึ่งบวกกับอะไรได้สี่? แตะคำตอบ!',
  'pw-solve-3': 'ศูนย์ บวกอีกห้า ชูให้ดูหน่อย!',
  'ba-watch-1': 'ห้าบวกอีกสองเป็นเจ็ด ใช้นิ้วโป้งแทนห้าสิ!',
  'ba-solve-1': 'ห้า บวกอีกหนึ่ง ชูให้ดูหน่อย!',
  'ba-solve-2': 'หก บวกอีกสอง ชูให้ดูหน่อย!',
  'ba-solve-3': 'สี่ บวกอีกสาม ชูให้ดูหน่อย!',
  'ba-solve-4': 'ห้า บวกอีกสี่ ชูให้ดูหน่อย!',

  // หน่วย 4 — การลบ
  'ta-watch-1': 'เวลาเอาออก จะเหลือน้อยลง',
  'ta-solve-1': 'สาม เอาออกหนึ่ง เหลือเท่าไร? ชูให้ดูหน่อย!',
  'ta-solve-2': 'สี่ เอาออกหนึ่ง ชูให้ดูหน่อย!',
  'ta-solve-3': 'ห้า เอาออกสอง ชูให้ดูหน่อย!',
  'ta-watch-2': 'เอาออกแล้วจำนวนจะเล็กลงเสมอ',
  'hl-watch-1': 'ห้าเอาออกหนึ่งเหลือสี่ เหลือเท่าไร?',
  'hl-solve-1': 'ห้า เอาออกหนึ่ง ชูให้ดูหน่อย!',
  'hl-solve-2': 'สี่ เอาออกสอง ชูให้ดูหน่อย!',
  'hl-solve-3': 'ห้า เอาออกห้า กำมือเป็นศูนย์!',
  'hl-solve-4': 'สาม เอาออกสาม ชูศูนย์ให้ดูหน่อย!',
  'bt-watch-1': 'เก้าเอาออกสี่เป็นห้า นับถอยหลังสิ!',
  'bt-solve-1': 'เก้า เอาออกสอง ชูให้ดูหน่อย!',
  'bt-solve-2': 'แปด เอาออกสาม ชูให้ดูหน่อย!',
  'bt-solve-3': 'เจ็ด เอาออกห้า ชูให้ดูหน่อย!',
  'bt-solve-4': 'เก้า เอาออกเก้า ชูศูนย์ให้ดูหน่อย!',

  // หน่วย 5 — สองมือ ค่าประจำหลัก 0–99
  'tao-watch-1': 'ทีนี้ใช้ทั้งสองมือ! มือซ้ายนับหลักสิบ มือขวานับหลักหน่วย',
  'tao-watch-2': 'มือซ้ายคือหลักสิบ มือขวาคือหลักหน่วย — สองมือทำจำนวนที่ใหญ่ขึ้นได้!',
  'atw-watch-1': 'สี่ที่มือซ้ายกับเจ็ดที่มือขวา เป็นสี่สิบเจ็ด!',
  'atw-watch-2': 'หนูชูได้ทุกจำนวนเลย ไปจนถึงเก้าสิบเก้า!',
  'ab-watch-1': 'สิบบวกอีกห้าเป็นสิบห้า ชูด้วยสองมือสิ!',
  'ab-solve-1': 'สิบ บวกอีกห้า ชูด้วยสองมือให้ดูหน่อย!',
  'ab-solve-2': 'ยี่สิบ บวกอีกสิบสาม ชูให้ดูหน่อย!',
  'ab-solve-3': 'สามสิบ บวกอีกยี่สิบห้า ชูให้ดูหน่อย!',
  'ab-watch-2': 'บวกจำนวนใหญ่ — ใช้สองมือชูคำตอบ',
  'tb-watch-1': 'สิบห้าเอาออกห้าเหลือสิบ ชูด้วยสองมือสิ!',
  'tb-solve-1': 'สิบห้า เอาออกห้า ชูด้วยสองมือให้ดูหน่อย!',
  'tb-solve-2': 'สามสิบ เอาออกสิบ ชูให้ดูหน่อย!',
  'tb-solve-3': 'สี่สิบห้า เอาออกยี่สิบสาม ชูให้ดูหน่อย!',
  'tb-watch-2': 'ลบจำนวนใหญ่ — ชูคำตอบด้วยสองมือ',
}

const lessonVisualsTh: Record<string, string> = {
  'zm-watch-1': '✊ = 0   (ไม่มีเลย!)',
  'mf-watch-2': 'มากกว่า  ·  น้อยกว่า  ·  เท่ากัน',
  'mt-watch-2': 'นิ้วโป้ง = 5  ⭐',
  'am-watch-2': 'บวกแล้วยิ่งมากขึ้น ➕',
  'ta-watch-2': 'ลบแล้วยิ่งน้อยลง ➖',
  'tao-watch-1': '✋ หลักสิบ   ·   ✋ หลักหน่วย',
  'tao-watch-2': 'ซ้าย = หลักสิบ   ·   ขวา = หลักหน่วย',
  'ab-watch-2': 'บวกจำนวนใหญ่ ➕',
  'tb-watch-2': 'ลบจำนวนใหญ่ ➖',
}

const th: Strings = {
  doc: {
    title: 'SmartHand Math ✋🧮',
    description:
      'SmartHand Math — เกมคณิตคิดในใจแสนสนุกสำหรับเด็ก ไม่ต้องใช้มือกดเลย! ชูนิ้วให้กล้องเห็นเพื่อตอบ',
    lang: 'th',
  },

  nav: {
    brand: 'SmartHand Math',
    home: 'หน้าแรก',
    learn: 'เรียนรู้',
    play: 'เล่น',
    lessons: 'บทเรียน',
    mirrorOn: 'เปิดกระจก',
    mirrorOff: 'ปิดกระจก',
    mirrorAria: 'สลับภาพกระจก',
    muted: 'ปิดเสียง',
    soundOn: 'เปิดเสียง',
    soundAria: 'สลับเสียง',
    cameraSizeAria: 'ขนาดกล้อง',
    cameraSizeSm: 'เล็ก',
    cameraSizeMd: 'กลาง',
    cameraSizeLg: 'ใหญ่',
    localeAria: 'เปลี่ยนภาษา',
    skipToContent: 'ข้ามไปที่เนื้อหา',
    footer: 'สร้างด้วย React · Vite · MediaPipe · Tailwind + DaisyUI',
  },

  home: {
    heroLead: 'คณิตศาสตร์ที่หนู',
    heroEmphasis: 'ชูขึ้นได้',
    heroSuffix: ' ✋',
    heroSubtitle:
      'SmartHand Math เปลี่ยนกล้องเว็บแคมให้กลายเป็นตัวควบคุม ตอบโจทย์คณิตคิดในใจด้วยการชูนิ้วให้กล้องเห็น — ไม่ต้องใช้แป้นพิมพ์ ไม่ต้องใช้เมาส์ ใช้แค่มือ',
    ctaPlay: '▶️ เล่นเลย',
    ctaLearn: '✋ เรียนท่ามือ',
    ctaLessons: '🎓 เริ่มบทเรียน',
    features: [
      {
        title: 'ชูด้วยนิ้วมือ',
        text: 'ชูมือขึ้นมา แล้วกล้องจะอ่านจำนวนนิ้วได้ทันที',
      },
      {
        title: 'คณิตคิดในใจ',
        text: 'บวก ลบ และสูตรคูณ ที่จะยากขึ้นเมื่อหนูทำคะแนนได้มากขึ้น',
      },
      {
        title: 'เป็นมิตรและสนุก',
        text: 'สีสันสดใส เสียงน่ารัก และเหรียญรางวัล ออกแบบมาเพื่อเด็กและห้องเรียน',
      },
    ],
    onboarding: {
      title: 'ใช้งานยังไง',
      bodyStart: 'แตะ ',
      bodyEmphasis1: 'เริ่ม',
      bodyMid: ' ที่หน้าเล่นหรือหน้าเรียนรู้เพื่อเปิดกล้อง ทุกอย่างทำงานอยู่ในเบราว์เซอร์ของหนูเอง — ',
      bodyEmphasis2: 'วิดีโอไม่ออกจากเครื่องของหนูเลย',
      bodyEnd: ' (การใช้กล้องต้องใช้ HTTPS หรือ localhost)',
      dismissAria: 'ปิด',
    },
  },

  learn: {
    title: 'เรียนท่ามือ',
    subtitle: 'เปิดกล้องแล้วชูนิ้วขึ้นมา ลองทำแต่ละจำนวนตั้งแต่ 0 ถึง 10 ดูสิ!',
    showing: 'หนูกำลังชู',
    feedbackEmpty: 'หันมือเข้าหากล้องสิ…',
    feedbackOne: 'หนึ่งนิ้ว — เยี่ยมมาก!',
    feedbackMany: 'เก่งมาก! ลองฝึกจำนวนอื่นๆ ต่อไปนะ',
  },

  play: {
    idleTitle: 'พร้อมเล่นหรือยัง?',
    idleBody: (lives: number) =>
      `เลือกโหมด แล้วตอบแต่ละข้อด้วยการชูนิ้วให้ถูกจำนวน หนูมี ${lives} ชีวิต`,
    prompt: 'ชูคำตอบด้วยนิ้วมือ',
    promptBigger: 'ชูจำนวนที่มากกว่า',
    promptNext: 'ชูจำนวนถัดไป',
    modeEndless: 'ไม่รู้จบ',
    modeEndlessDesc: 'เล่นจนกว่าชีวิตจะหมด หนูจะทำคะแนนได้สูงแค่ไหน?',
    modeTimed: 'จับเวลา',
    modeTimedDesc: (seconds: number) => `ตอบให้ได้มากที่สุดภายใน ${seconds} วินาที`,
    modeMissions: 'ภารกิจ',
    modeMissionsDesc: (goal: number) => `ตอบให้ถูก ${goal} ข้อเพื่อชนะ!`,
    goalProgress: (done: number, total: number) => `🎯 ${done} / ${total}`,
    livesLabel: (lives: number) => `เหลืออีก ${lives} ชีวิต`,
    waiting: '✋ กำลังรอมือของหนู…',
    showing: (detected: number) => `หนูกำลังชู ${detected}`,
    autoPrompt: (n: number) => `กำลังส่งคำตอบ ${n}…`,
    autoPromptCancel: 'เปลี่ยนมือเพื่อยกเลิก',
    autoPromptAria: (n: number) => `กำลังส่งคำตอบ ${n} เปลี่ยนมือเพื่อยกเลิก`,
    correct: (expected: number) => `✅ ถูกต้อง! คำตอบคือ ${expected}`,
    wrong: (given: number, expected: number) => `❌ อุ๊ปส์ หนูชู ${given} คำตอบคือ ${expected}`,
    padTitle: 'ไม่มีกล้อง? พิมพ์คำตอบ (0–99):',
    padPlaceholder: '?',
    padAria: 'พิมพ์คำตอบ',
    padSubmit: 'ส่งคำตอบ',
    padHelper:
      'เมื่อใช้กล้อง ให้ชูค่านิ้วค้างไว้ให้นิ่ง แล้ววงแหวนจะนับถอยหลังเพื่อส่งคำตอบ (เปลี่ยนมือเพื่อยกเลิก) มือซ้าย = หลักสิบ มือขวา = หลักหน่วย (เช่น 3 ที่มือซ้าย + 7 ที่มือขวา = 37)',
    modalWon: '🎉 หนูชนะแล้ว!',
    modalLost: '💀 จบเกม',
    youScored: 'หนูได้คะแนน',
    bestLabel: (best: number) => `สูงสุด: ${best}`,
    playAgain: '🔁 เล่นอีกครั้ง',
    home: '🏠 หน้าแรก',
  },

  camera: {
    off: '📷 กล้องปิด',
    loading: '⏳ กำลังโหลด…',
    ready: '● กำลังติดตาม',
    blocked: '⛔ กล้องถูกบล็อก',
    startAria: 'เปิดกล้อง',
    stopAria: 'ปิดกล้อง',
    videoAria: 'ภาพจากกล้องสำหรับนับนิ้ว',
    errorTitle: '⛔ กล้องถูกบล็อก',
    errorBody: (error: string) =>
      `${error} กรุณาอนุญาตให้ใช้กล้องในเบราว์เซอร์ แล้วแตะ ▶️ เพื่อลองอีกครั้ง (กล้องต้องใช้ HTTPS หรือ localhost)`,
  },

  game: {
    level: (level: number) => `ระดับ ${level}`,
    difficultyEasy: 'ง่าย',
    difficultyMedium: 'ปานกลาง',
    difficultyHard: 'ยาก',
    timer: (remaining: number) => `⏱ ${remaining} วิ`,
    timerAria: 'ตัวจับเวลาถอยหลัง',
  },

  lessons: {
    navLabel: 'บทเรียน',
    listTitle: 'เลือกบทเรียน',
    listSubtitle: 'เรียนไปทีละขั้น เรียนจบหนึ่งบทเพื่อปลดล็อกบทต่อไป!',
    start: 'เริ่ม',
    continue: 'เรียนต่อ',
    replay: '🔁 ฟังอีกครั้ง',
    next: 'ถัดไป ➡️',
    listen: '🎧 กำลังฟัง…',
    locked: '🔒 ล็อกอยู่',
    complete: '✅ เสร็จแล้ว',
    showMePrompt: (n: number) => `ชู ${n} ให้ดูหน่อย!`,
    countPrompt: 'แตะทีละอัน แล้วเลือกว่ามีกี่อัน',
    choosePrompt: 'แตะคำตอบ',
    comparePrompt: 'กลุ่มไหนมีมากกว่า? แตะเลย!',
    same: '🟰 เท่ากัน',
    countObjectAria: 'แตะเพื่อนับ',
    compareLeftAria: 'แตะกลุ่มด้านซ้าย',
    compareRightAria: 'แตะกลุ่มด้านขวา',
    solvePrompt: 'ชูคำตอบด้วยนิ้วมือ',
    tryAgain: 'ลองอีกครั้ง!',
    assessmentTitle: 'ตรวจสอบเร็วๆ',
    passed: '🎉 เรียนจบบทแล้ว!',
    failed: 'พยายามได้ดีมาก! อยากลองอีกครั้งไหม?',
    spokenGreat: 'เก่งมาก!',
    spokenPassed: 'หนูทำได้! เรียนจบบทแล้ว',
    spokenFailed: 'พยายามได้ดีมาก! มาลองอีกครั้งกันนะ',
    scoreLabel: (score: number, total: number) => `หนูทำได้ ${score} จาก ${total}`,
    starsLabel: (s: number) => `${s} ดาว`,
    playAgain: '🔁 ลองอีกครั้ง',
    back: '🏠 กลับไปหน้าบทเรียน',
    padTitle: 'ไม่มีกล้อง? พิมพ์คำตอบ (0–9)',
    padAria: 'พิมพ์คำตอบ',
    padSubmit: 'ตรวจคำตอบ',
    titles: lessonTitlesTh,
    objectives: lessonObjectivesTh,
    steps: lessonStepsTh,
    visuals: lessonVisualsTh,
  },

  common: {
    close: 'ปิด',
    closeAria: 'ปิดหน้าต่าง',
    errorTitle: 'อุ๊ปส์! มีบางอย่างผิดพลาด',
    errorBody: 'มาเริ่มกันใหม่นะ — แตะปุ่มเพื่อโหลดหน้านี้ใหม่',
    errorReload: '🔄 เริ่มใหม่',
  },
}

export const STRINGS: Record<Locale, Strings> = { en, th }

/** All supported locale codes (used to validate persisted/user input). */
export const LOCALES: readonly Locale[] = ['en', 'th']

/** Coerce an arbitrary stored string to a valid `Locale` (default `en`). */
export function toLocale(value: unknown): Locale {
  return LOCALES.includes(value as Locale) ? (value as Locale) : 'en'
}
