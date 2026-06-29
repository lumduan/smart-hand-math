import type { Difficulty } from '@/utils/mathGenerator'
import { useStrings } from '@/i18n/useStrings'

interface LevelBadgeProps {
  level: number
  difficulty?: Difficulty
}

const DIFFICULTY_STYLE: Record<Difficulty, string> = {
  easy: 'badge-success',
  medium: 'badge-warning',
  hard: 'badge-error',
}

/** Shows the current level, tinted by difficulty. */
export function LevelBadge({ level, difficulty = 'easy' }: LevelBadgeProps) {
  const t = useStrings()
  const label = {
    easy: t.game.difficultyEasy,
    medium: t.game.difficultyMedium,
    hard: t.game.difficultyHard,
  }[difficulty]
  return (
    <div className={`badge badge-lg gap-1 font-display ${DIFFICULTY_STYLE[difficulty]}`}>
      <span>🎯</span>
      <span className="font-bold">{t.game.level(level)}</span>
      <span className="opacity-80 hidden sm:inline">· {label}</span>
    </div>
  )
}
