import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { useAppSettings } from '@/context/AppSettingsContext'
import { useAudio } from '@/hooks/useAudio'
import { motion } from 'framer-motion'

const FEATURES = [
  { icon: '✋', title: 'Show with fingers', text: 'Hold up your hand and the camera reads the number of fingers in real time.' },
  { icon: '🧮', title: 'Mental math', text: 'Addition, subtraction and times tables that grow harder as you score more.' },
  { icon: '🎉', title: 'Friendly & fun', text: 'Cheerful colors, sounds and badges designed for kids and classrooms.' },
]

export function Home() {
  const audio = useAudio()
  const { onboardingDismissed, dismissOnboarding } = useAppSettings()
  return (
    <div className="space-y-10">
      <section className="text-center">
        <h1 className="font-display text-4xl font-extrabold text-primary sm:text-6xl">
          Math you can <span className="text-accent">hold up</span> ✋
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-base-content/70">
          SmartHand Math turns your webcam into a controller. Answer mental-math
          questions by showing fingers to the camera — no keyboard, no mouse, just hands.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/play">
            <Button size="lg" variant="primary" onClick={() => audio.playClick()}>▶️ Play now</Button>
          </Link>
          <Link to="/learn">
            <Button size="lg" variant="secondary" onClick={() => audio.playClick()}>✋ Learn the gestures</Button>
          </Link>
        </div>
        {!onboardingDismissed && (
          <div className="mx-auto mt-6 flex max-w-xl items-start gap-3 rounded-2xl bg-base-200 p-4 text-left text-sm text-base-content/80">
            <span className="text-2xl">📸</span>
            <div className="flex-1">
              <p className="font-display font-bold text-base-content">How it works</p>
              <p className="mt-1">
                Tap <span className="font-semibold">Start</span> on the Play or Learn page to turn
                on your camera. Everything runs right here in your browser —{' '}
                <span className="font-semibold">the video never leaves your device.</span> (Camera
                access needs HTTPS or localhost.)
              </p>
            </div>
            <button
              className="btn btn-ghost btn-sm btn-circle"
              onClick={() => {
                audio.playClick()
                dismissOnboarding()
              }}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
          >
            <Card className="text-center">
              <div className="text-5xl">{f.icon}</div>
              <h3 className="mt-2 font-display text-xl font-bold">{f.title}</h3>
              <p className="mt-1 text-base-content/70">{f.text}</p>
            </Card>
          </motion.div>
        ))}
      </section>
    </div>
  )
}
