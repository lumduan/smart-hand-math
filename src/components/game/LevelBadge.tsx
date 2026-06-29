import type { Difficulty } from '@/utils/mathGenerator'

interface LevelBadgeProps {
  level: number
  difficulty?: Difficulty
}

const DIFFICULTY_STYLE: Record<Difficulty, string> = {
  easy: 'badge-success',
  medium: 'badge-warning',
  hard: 'badge-error',
}

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

/** Shows the current level, tinted by difficulty. */
export function LevelBadge({ level, difficulty = 'easy' }: LevelBadgeProps) {
  return (
    <div className={`badge badge-lg gap-1 font-display ${DIFFICULTY_STYLE[difficulty]}`}>
      <span>🎯</span>
      <span className="font-bold">Level {level}</span>
      <span className="opacity-80 hidden sm:inline">· {DIFFICULTY_LABEL[difficulty]}</span>
    </div>
  )
}
