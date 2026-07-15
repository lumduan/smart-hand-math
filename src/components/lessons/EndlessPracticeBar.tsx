import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/common/Button'
import { nextLessonOf, type Lesson } from '@/content/lessons'
import { useStrings } from '@/i18n/useStrings'

interface EndlessPracticeBarProps {
  lesson: Lesson
  /** 1-based round number shown to the learner (climbs as items are answered). */
  round: number
  /** Whether the lesson has been passed (gates the "Next lesson" exit). */
  passed: boolean
  onExit: () => void
}

/**
 * Endless-practice header, shown in place of `StepProgress` while
 * `active.practiceMode === 'endless'`. A low-pressure round counter plus the two exits
 * the learner always has: "End" → lessons list, and "Next lesson" → the next lesson
 * (only when the lesson was passed, mirroring `LessonComplete`'s gate).
 */
export function EndlessPracticeBar({ lesson, round, passed, onExit }: EndlessPracticeBarProps) {
  const t = useStrings()
  const next = passed ? nextLessonOf(lesson) : undefined

  return (
    <motion.div layout className="flex flex-wrap items-center justify-center gap-2">
      <span className="badge badge-md badge-warning font-display">{t.lessons.practiceRound(round)}</span>
      <Link to="/lessons" onClick={onExit}>
        <Button variant="ghost">{t.lessons.endPractice}</Button>
      </Link>
      {next && (
        <Link to={`/lessons/${next.id}`} onClick={onExit}>
          <Button variant="ghost">{t.lessons.nextLesson}</Button>
        </Link>
      )}
    </motion.div>
  )
}
