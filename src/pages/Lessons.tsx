import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card } from '@/components/common/Card'
import { CURRICULUM } from '@/content/lessons'
import { useLessons } from '@/context/LessonsContext'
import { useStrings } from '@/i18n/useStrings'

/** Lesson list: cards with title, objective, stars, and lock/start state. */
export function Lessons() {
  const t = useStrings()
  const { progress, isUnlocked } = useLessons()

  return (
    <div className="space-y-6">
      <header className="text-center">
        <h1 className="font-display text-3xl font-extrabold text-primary">{t.lessons.listTitle}</h1>
        <p className="mt-2 text-base-content/70">{t.lessons.listSubtitle}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {CURRICULUM.map((lesson, i) => {
          const p = progress[lesson.id]
          const unlocked = isUnlocked(lesson.id)
          const complete = p?.status === 'complete'
          const stars = p?.stars ?? 0
          return (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
            >
              <Card className={unlocked ? '' : 'opacity-60'}>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display text-xl font-extrabold">{t.lessons.titles[lesson.id]}</h2>
                  <span className="badge badge-ghost font-display shrink-0">
                    {complete ? '⭐'.repeat(stars) : unlocked ? t.lessons.start : t.lessons.locked}
                  </span>
                </div>
                <p className="mt-2 text-base-content/70">{t.lessons.objectives[lesson.id]}</p>
                <div className="mt-4">
                  {unlocked ? (
                    <Link
                      to={`/lessons/${lesson.id}`}
                      className="btn btn-primary rounded-full font-display"
                    >
                      {complete ? t.lessons.playAgain : t.lessons.start}
                    </Link>
                  ) : (
                    <button className="btn btn-ghost rounded-full font-display" disabled>
                      {t.lessons.locked}
                    </button>
                  )}
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
