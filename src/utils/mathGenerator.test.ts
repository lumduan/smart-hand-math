import { describe, it, expect } from 'vitest'
import {
  generateQuestion,
  difficultyForScore,
  type Difficulty,
  type Operator,
} from '@/utils/mathGenerator'

const MAX_ANSWER: Record<Difficulty, number> = { easy: 9, medium: 50, hard: 99 }
const VALID_OPS: Operator[] = ['+', '-', '×']
const SAMPLE = 1000

describe('difficultyForScore', () => {
  it.each([
    [0, 'easy'],
    [4, 'easy'],
    [5, 'medium'],
    [14, 'medium'],
    [15, 'hard'],
    [42, 'hard'],
  ])('score %i → %s', (score, expected) => {
    expect(difficultyForScore(score)).toBe(expected as Difficulty)
  })
})

describe('generateQuestion — range & shape invariants', () => {
  for (const difficulty of ['easy', 'medium', 'hard'] as Difficulty[]) {
    const questions = Array.from({ length: SAMPLE }, () => generateQuestion(difficulty))

    describe(difficulty, () => {
      it('every answer is within the representable range', () => {
        for (const q of questions) {
          expect(q.answer).toBeGreaterThanOrEqual(0)
          expect(q.answer).toBeLessThanOrEqual(MAX_ANSWER[difficulty])
        }
      })

      it('every question is tagged with its difficulty', () => {
        expect(questions.every((q) => q.difficulty === difficulty)).toBe(true)
      })

      it('op is always +, -, or ×', () => {
        for (const q of questions) expect(VALID_OPS).toContain(q.op)
      })

      it('text is a non-empty string', () => {
        expect(questions.every((q) => typeof q.text === 'string' && q.text.length > 0)).toBe(true)
      })

      it('ids are non-empty strings', () => {
        expect(questions.every((q) => typeof q.id === 'string' && q.id.length > 0)).toBe(true)
      })

      it('ids are unique within the sample', () => {
        const ids = questions.map((q) => q.id)
        expect(new Set(ids).size).toBe(ids.length)
      })

      it('multiplication operands a are in [2,9]', () => {
        const muls = questions.filter((q) => q.op === '×')
        expect(muls.length).toBeGreaterThan(0)
        for (const q of muls) {
          const a = Number(q.text.split(' × ')[0])
          expect(a).toBeGreaterThanOrEqual(2)
          expect(a).toBeLessThanOrEqual(9)
        }
      })

      it('subtraction answers are never negative', () => {
        for (const q of questions.filter((q) => q.op === '-')) {
          expect(q.answer).toBeGreaterThanOrEqual(0)
        }
      })
    })
  }

  it('defaults to easy when called with no argument', () => {
    expect(generateQuestion().difficulty).toBe('easy')
  })
})
