import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { LessonStep } from '@/components/lessons/LessonStep'
import { StepProgress } from '@/components/lessons/StepProgress'
import { LESSON_MAP, type Lesson } from '@/content/lessons'
import { useLessons, type ActiveLesson } from '@/context/LessonsContext'
import { useAudio } from '@/hooks/useAudio'
import { useTts } from '@/hooks/useTts'
import { useStrings } from '@/i18n/useStrings'
import { buildAssessmentStep } from '@/utils/lessonsContent'
import { celebrate } from '@/utils/confetti'

/** Runs a single lesson: teach steps → assessment → completion screen. */
export function LessonRunner() {
  const { lessonId } = useParams()
  const lesson = lessonId ? LESSON_MAP[lessonId] : undefined
  const t = useStrings()
  const { active, progress, startLesson, stepComplete, assessAnswer, exitLesson } = useLessons()

  // Start (or restart) a fresh session whenever the route target changes.
  useEffect(() => {
    if (lessonId && active?.lessonId !== lessonId) startLesson(lessonId)
  }, [lessonId, active?.lessonId, startLesson])

  const isAssess = active?.phase === 'assess'
  // Generate an assessment item's random target ONCE (memoized by `active`),
  // not on every render — and hooks must run before the early returns below.
  const step = useMemo(() => {
    if (!lesson || !active) return null
    return isAssess ? buildAssessmentStep(lesson, active.assessmentIndex) : lesson.steps[active.stepIndex]
  }, [isAssess, lesson, active])

  if (!lesson) {
    return (
      <Card className="items-center text-center">
        <p className="font-display text-lg">🤔</p>
        <Link to="/lessons" className="btn btn-ghost rounded-full font-display">
          {t.lessons.back}
        </Link>
      </Card>
    )
  }

  // Session is starting (or switching from another lesson).
  if (!active || active.lessonId !== lesson.id) {
    return (
      <div className="flex justify-center py-20">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    )
  }

  if (active.phase === 'complete') {
    return (
      <CompleteScreen
        lesson={lesson}
        active={active}
        stars={progress[lesson.id]?.stars ?? 0}
        onExit={exitLesson}
        onRestart={() => startLesson(lesson.id)}
      />
    )
  }

  // Logically unreachable once lesson + active are present, but satisfies the
  // type (step is non-null for the rest of the render).
  if (!step) {
    return (
      <div className="flex justify-center py-20">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <header className="space-y-2 text-center">
        <h1 className="font-display text-2xl font-extrabold text-primary">{t.lessons.titles[lesson.id]}</h1>
        <StepProgress
          steps={lesson.steps}
          current={isAssess ? lesson.steps.length : active.stepIndex}
          assessing={isAssess}
          assessmentIndex={active.assessmentIndex}
          assessmentTotal={lesson.assessment.questions}
        />
      </header>

      {/*
        Deliberately NOT keyed by step.id: consecutive same-kind steps (e.g. the
        run of `showMe` digits) reuse this instance so the camera stays live
        across them. Per-step state resets via the step.id effect inside each
        view (and useAutoSubmit resets on its questionId = step.id).
      */}
      <LessonStep step={step} assessment={isAssess} onComplete={stepComplete} onAttempt={assessAnswer} />
    </div>
  )
}

function CompleteScreen({
  lesson,
  active,
  stars,
  onExit,
  onRestart,
}: {
  lesson: Lesson
  active: ActiveLesson
  stars: 0 | 1 | 2 | 3
  onExit: () => void
  onRestart: () => void
}) {
  const t = useStrings()
  const audio = useAudio()
  const tts = useTts()
  const passed = active.assessmentScore >= lesson.assessment.passThreshold

  // Celebrate + narrate the result once on entry (a non-reader hears the outcome).
  useEffect(() => {
    if (passed) {
      audio.playWin()
      celebrate()
      tts.speak(t.lessons.spokenPassed)
    } else {
      audio.playWrong()
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
        <p className="mt-2 text-base-content/70">{t.lessons.scoreLabel(active.assessmentScore, lesson.assessment.questions)}</p>
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
