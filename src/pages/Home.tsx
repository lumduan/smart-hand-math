import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { useAppSettings } from '@/context/AppSettingsContext'
import { useAudio } from '@/hooks/useAudio'
import { useStrings } from '@/i18n/useStrings'
import { motion } from 'framer-motion'

// Emoji are universal; pair them positionally with the i18n feature copy.
const FEATURE_ICONS = ['✋', '🧮', '🎉'] as const

export function Home() {
  const audio = useAudio()
  const { onboardingDismissed, dismissOnboarding } = useAppSettings()
  const t = useStrings()
  const onb = t.home.onboarding

  return (
    <div className="space-y-10">
      <section className="text-center">
        <h1 className="font-display text-4xl font-extrabold text-primary sm:text-6xl">
          {t.home.heroLead}
          <span className="text-accent">{t.home.heroEmphasis}</span>
          {t.home.heroSuffix}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-base-content/70">{t.home.heroSubtitle}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/play">
            <Button size="lg" variant="primary" onClick={() => audio.playClick()}>
              {t.home.ctaPlay}
            </Button>
          </Link>
          <Link to="/learn">
            <Button size="lg" variant="secondary" onClick={() => audio.playClick()}>
              {t.home.ctaLearn}
            </Button>
          </Link>
        </div>
        {!onboardingDismissed && (
          <div className="mx-auto mt-6 flex max-w-xl items-start gap-3 rounded-2xl bg-base-200 p-4 text-left text-sm text-base-content/80">
            <span className="text-2xl">📸</span>
            <div className="flex-1">
              <p className="font-display font-bold text-base-content">{onb.title}</p>
              <p className="mt-1">
                {onb.bodyStart}
                <span className="font-semibold">{onb.bodyEmphasis1}</span>
                {onb.bodyMid}
                <span className="font-semibold">{onb.bodyEmphasis2}</span>
                {onb.bodyEnd}
              </p>
            </div>
            <button
              className="btn btn-ghost btn-sm btn-circle"
              onClick={() => {
                audio.playClick()
                dismissOnboarding()
              }}
              aria-label={onb.dismissAria}
            >
              ✕
            </button>
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {t.home.features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
          >
            <Card className="text-center">
              <div className="text-5xl">{FEATURE_ICONS[i]}</div>
              <h3 className="mt-2 font-display text-xl font-bold">{f.title}</h3>
              <p className="mt-1 text-base-content/70">{f.text}</p>
            </Card>
          </motion.div>
        ))}
      </section>
    </div>
  )
}
