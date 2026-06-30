/**
 * mathGenerator
 * -------------
 * Generates mental-math questions keyed off a difficulty level.
 *
 * Answers are bounded so the player can always *show* them with fingers using
 * the Soroban system:
 *   • easy   → single-hand digits, answer 0..9
 *   • medium → up to two hands, answer 0..50
 *   • hard   → two hands,         answer 0..99
 *
 * `text` carries the FULL display string (including any " = ?" / "?"). Operators
 * are universal mathematical notation, not translatable; any surrounding WORDS
 * (e.g. "show the bigger number") live in the i18n prompt, not here.
 */

export type Difficulty = 'easy' | 'medium' | 'hard'

export type Operator = '+' | '-' | '×' | '÷' | 'seq' | 'compare'

export interface MathQuestion {
  id: string
  text: string
  answer: number
  op: Operator
  difficulty: Difficulty
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function newId(): string {
  return Math.random().toString(36).slice(2, 10)
}

/** Map a running score to a difficulty curve. */
export function difficultyForScore(score: number): Difficulty {
  if (score < 5) return 'easy'
  if (score < 15) return 'medium'
  return 'hard'
}

/** Difficulty tier implied by a per-difficulty max answer. */
function tierOf(maxAnswer: number): Difficulty {
  return maxAnswer <= 9 ? 'easy' : maxAnswer <= 50 ? 'medium' : 'hard'
}

// --- per-range builders ---------------------------------------------------

function addition(maxAnswer: number): MathQuestion {
  const a = randInt(0, maxAnswer)
  const b = randInt(0, maxAnswer - a)
  return { id: newId(), text: `${a} + ${b} = ?`, answer: a + b, op: '+', difficulty: tierOf(maxAnswer) }
}

function subtraction(maxAnswer: number): MathQuestion {
  const a = randInt(0, maxAnswer)
  const b = randInt(0, a)
  return { id: newId(), text: `${a} − ${b} = ?`, answer: a - b, op: '-', difficulty: tierOf(maxAnswer) }
}

function multiplication(maxAnswer: number): MathQuestion {
  const a = randInt(2, 9)
  const b = randInt(0, Math.floor(maxAnswer / a))
  return { id: newId(), text: `${a} × ${b} = ?`, answer: a * b, op: '×', difficulty: tierOf(maxAnswer) }
}

/** "12 ÷ 3 = ?" — built divisor-first so the quotient is always an integer. */
function division(maxAnswer: number): MathQuestion {
  const divisor = randInt(2, 9)
  const quotient = randInt(0, Math.floor(maxAnswer / divisor))
  const dividend = divisor * quotient
  return { id: newId(), text: `${dividend} ÷ ${divisor} = ?`, answer: quotient, op: '÷', difficulty: tierOf(maxAnswer) }
}

/**
 * "a + ? = c" / "a − ? = c" — the player shows the missing number.
 * Only used at medium/hard (the answer can exceed 9, requiring two hands).
 */
function missingNumber(maxAnswer: number): MathQuestion {
  const x = randInt(0, maxAnswer) // the value the player must show
  const difficulty = tierOf(maxAnswer)
  if (Math.random() < 0.5) {
    const a = randInt(0, maxAnswer - x)
    return { id: newId(), text: `${a} + ? = ${a + x}`, answer: x, op: '+', difficulty }
  }
  const a = randInt(x, maxAnswer)
  return { id: newId(), text: `${a} − ? = ${a - x}`, answer: x, op: '-', difficulty }
}

/** "2, 4, 6, ?" — show the next term. */
function sequence(maxAnswer: number): MathQuestion {
  const step = randInt(1, maxAnswer <= 9 ? 2 : 5)
  const start = randInt(0, Math.max(0, maxAnswer - step * 3))
  const a = start
  const b = a + step
  const c = b + step
  const ans = c + step
  return { id: newId(), text: `${a}, ${b}, ${c}, ?`, answer: ans, op: 'seq', difficulty: tierOf(maxAnswer) }
}

/** "7 · 3" — show the bigger of the two (the prompt says so). Distinct numbers. */
function comparison(maxAnswer: number): MathQuestion {
  const a = randInt(0, maxAnswer)
  let b = randInt(0, maxAnswer)
  if (a === b) b = (b + 1) % (maxAnswer + 1)
  return { id: newId(), text: `${a} · ${b}`, answer: Math.max(a, b), op: 'compare', difficulty: tierOf(maxAnswer) }
}

/** Generate a single question for the given difficulty. */
export function generateQuestion(difficulty: Difficulty = 'easy'): MathQuestion {
  switch (difficulty) {
    case 'easy': {
      const roll = Math.random()
      if (roll < 0.35) return addition(9)
      if (roll < 0.70) return subtraction(9)
      if (roll < 0.85) return multiplication(9)
      return comparison(9)
    }
    case 'medium': {
      const roll = Math.random()
      if (roll < 0.2) return addition(50)
      if (roll < 0.4) return subtraction(50)
      if (roll < 0.58) return multiplication(50)
      if (roll < 0.74) return missingNumber(50)
      if (roll < 0.88) return sequence(50)
      return comparison(50)
    }
    case 'hard': {
      const roll = Math.random()
      if (roll < 0.16) return addition(99)
      if (roll < 0.32) return subtraction(99)
      if (roll < 0.48) return multiplication(99)
      if (roll < 0.64) return division(99)
      if (roll < 0.80) return missingNumber(99)
      if (roll < 0.90) return sequence(99)
      return comparison(99)
    }
    default:
      return addition(9)
  }
}
