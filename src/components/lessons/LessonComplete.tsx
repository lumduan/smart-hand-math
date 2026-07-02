import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import type { Lesson } from '@/content/lessons'
import type { ActiveLesson, Stars } from '@/context/LessonsContext'
import { useAudio } from '@/hooks/useAudio'
import { useTts } from '@/hooks/useTts'
import { useStrings } from '@/i18n/useStrings'
import { finale } from '@/utils/confetti'

interface LessonCompleteProps {
  lesson: Lesson
  active: ActiveLesson
  stars: Stars
  onExit: () => void
  onRestart: () => void
}

/**
 * Lesson-completion screen: pass/fail message + stars, with confetti + spoken
 * feedback on entry so a non-reader hears the outcome. (Extracted from
 * `LessonRunner`'s inline `CompleteScreen`.)
 */
export function LessonComplete({ lesson, active, stars, onExit, onRestart }: LessonCompleteProps) {
  const t = useStrings()
  const audio = useAudio()
  const tts = useTts()
  const passed = active.assessmentScore >= lesson.assessment.passThreshold

  // Celebrate + narrate the result once on entry.
  useEffect(() => {
    if (passed) {
      audio.playLessonComplete()
      finale()
      tts.speak(t.lessons.spokenPassed)
    } else {
      audio.playTryAgain() // gentle, non-punitive (RFC-0004)
      tts.speak(t.lessons.spokenFailed)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="items-center text-center">
        <div className="font-display text-5xl">{passed ? '🎉' : '💪'}</div>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-primary">
          {passed ? t.lessons.passed : t.lessons.failed}
        </h1>
        <p className="mt-2 text-base-content/70">
          {t.lessons.scoreLabel(active.assessmentScore, lesson.assessment.questions)}
        </p>
        {passed && (
          <p className="mt-1 font-display text-2xl text-warning" aria-label={t.lessons.starsLabel(stars)}>
            {'⭐'.repeat(stars)}
          </p>
        )}
        <div className="mt-5 flex justify-center gap-3">
          <Button variant="primary" onClick={onRestart}>
            {t.lessons.playAgain}
          </Button>
          <Link to="/lessons" onClick={onExit}>
            <Button variant="ghost">{t.lessons.back}</Button>
          </Link>
        </div>
      </Card>
    </motion.div>
  )
}
