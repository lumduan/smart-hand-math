import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card } from '@/components/common/Card'
import { EndlessPracticeBar } from '@/components/lessons/EndlessPracticeBar'
import { LessonComplete } from '@/components/lessons/LessonComplete'
import { LessonStep } from '@/components/lessons/LessonStep'
import { StepProgress } from '@/components/lessons/StepProgress'
import { LESSON_MAP } from '@/content/lessons'
import { useLessons } from '@/context/LessonsContext'
import { useStrings } from '@/i18n/useStrings'

/** Runs a single lesson: teach steps → assessment → completion screen. */
export function LessonRunner() {
  const { lessonId } = useParams()
  const lesson = lessonId ? LESSON_MAP[lessonId] : undefined
  const t = useStrings()
  const { active, progress, startLesson, stepComplete, retryStep, assessAnswer, exitLesson } = useLessons()

  // Start (or restart) a fresh session whenever the route target changes.
  useEffect(() => {
    if (lessonId && active?.lessonId !== lessonId) startLesson(lessonId)
  }, [lessonId, active?.lessonId, startLesson])

  const isAssess = active?.phase === 'assess'
  const endless = active?.practiceMode === 'endless'
  // Assessment items are generated once (no consecutive repeats) when the assess
  // phase begins and stored on `active.assessment`; here we just index into them.
  // (Hooks must run before the early returns below.)
  const step = useMemo(() => {
    if (!lesson || !active) return null
    // `?.` on the array: a stale `active` (e.g. from a hot reload) can lack the
    // field → undefined → the `if (!step)` spinner guard handles it (no throw).
    return isAssess ? active.assessment?.[active.assessmentIndex] : lesson.steps[active.stepIndex]
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
      <LessonComplete
        lesson={lesson}
        active={active}
        stars={progress[lesson.id]?.stars ?? 0}
        onExit={exitLesson}
        onRestart={() => startLesson(lesson.id)}
        onPractice={() => startLesson(lesson.id, 'endless')}
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
        {endless ? (
          <EndlessPracticeBar
            lesson={lesson}
            round={active.practiceRound + 1}
            passed={progress[lesson.id]?.status === 'complete'}
            onExit={exitLesson}
          />
        ) : (
          <StepProgress
            steps={lesson.steps}
            current={isAssess ? lesson.steps.length : active.stepIndex}
            assessing={isAssess}
            assessmentIndex={active.assessmentIndex}
            assessmentTotal={lesson.assessment.questions}
          />
        )}
      </header>

      {/*
        Deliberately NOT keyed by step.id: consecutive same-kind steps (e.g. the
        run of `showMe` digits) reuse this instance so the camera stays live
        across them. Per-step state resets via the step.id effect inside each
        view (and useAutoSubmit resets on its questionId = step.id).
      */}
      <LessonStep
        step={step}
        assessment={isAssess}
        onComplete={stepComplete}
        onAttempt={assessAnswer}
        onRetry={retryStep}
      />
    </div>
  )
}
