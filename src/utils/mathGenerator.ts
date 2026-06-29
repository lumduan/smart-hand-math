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
 */

export type Difficulty = 'easy' | 'medium' | 'hard'

export type Operator = '+' | '-' | '×'

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

// --- per-range builders ---------------------------------------------------

function addition(maxAnswer: number): MathQuestion {
  const a = randInt(0, maxAnswer)
  const b = randInt(0, maxAnswer - a)
  return { id: newId(), text: `${a} + ${b}`, answer: a + b, op: '+', difficulty: 'easy' }
}

function subtraction(maxAnswer: number): MathQuestion {
  const a = randInt(0, maxAnswer)
  const b = randInt(0, a)
  const difficulty: Difficulty = maxAnswer <= 9 ? 'easy' : maxAnswer <= 50 ? 'medium' : 'hard'
  return { id: newId(), text: `${a} − ${b}`, answer: a - b, op: '-', difficulty }
}

function multiplication(maxAnswer: number): MathQuestion {
  const difficulty: Difficulty = maxAnswer <= 9 ? 'easy' : maxAnswer <= 50 ? 'medium' : 'hard'
  const a = randInt(2, 9)
  const b = randInt(0, Math.floor(maxAnswer / a))
  return { id: newId(), text: `${a} × ${b}`, answer: a * b, op: '×', difficulty }
}

/**
 * "a + ? = c" / "a − ? = c" — the player shows the missing number.
 * Only used at medium/hard (the answer can exceed 9, requiring two hands).
 */
function missingNumber(maxAnswer: number): MathQuestion {
  const x = randInt(0, maxAnswer) // the value the player must show
  const difficulty: Difficulty = maxAnswer <= 50 ? 'medium' : 'hard'
  if (Math.random() < 0.5) {
    const a = randInt(0, maxAnswer - x)
    return { id: newId(), text: `${a} + ? = ${a + x}`, answer: x, op: '+', difficulty }
  }
  const a = randInt(x, maxAnswer)
  return { id: newId(), text: `${a} − ? = ${a - x}`, answer: x, op: '-', difficulty }
}

// Patch the difficulty label to match the caller's tier for add (it has no
// maxAnswer-tier signal of its own).
function withDifficulty(q: MathQuestion, difficulty: Difficulty): MathQuestion {
  return { ...q, difficulty }
}

/** Generate a single question for the given difficulty. */
export function generateQuestion(difficulty: Difficulty = 'easy'): MathQuestion {
  switch (difficulty) {
    case 'easy': {
      const roll = Math.random()
      if (roll < 0.45) return addition(9)
      if (roll < 0.9) return subtraction(9)
      return multiplication(9)
    }
    case 'medium': {
      const roll = Math.random()
      if (roll < 0.3) return withDifficulty(addition(50), 'medium')
      if (roll < 0.6) return subtraction(50)
      if (roll < 0.85) return multiplication(50)
      return missingNumber(50)
    }
    case 'hard': {
      const roll = Math.random()
      if (roll < 0.3) return withDifficulty(addition(99), 'hard')
      if (roll < 0.6) return subtraction(99)
      if (roll < 0.85) return multiplication(99)
      return missingNumber(99)
    }
    default:
      return addition(9)
  }
}
