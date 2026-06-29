import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'

const FEATURES = [
  { icon: '✋', title: 'Show with fingers', text: 'Hold up your hand and the camera reads the number of fingers in real time.' },
  { icon: '🧮', title: 'Mental math', text: 'Addition, subtraction and times tables that grow harder as you score more.' },
  { icon: '🎉', title: 'Friendly & fun', text: 'Cheerful colors, sounds and badges designed for kids and classrooms.' },
]

export function Home() {
  return (
    <div className="space-y-10">
      <section className="text-center">
        <h1 className="font-display text-4xl font-extrabold text-brand-primary sm:text-6xl">
          Math you can <span className="text-brand-accent">hold up</span> ✋
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-base-content/70">
          SmartHand Math turns your webcam into a controller. Answer mental-math
          questions by showing fingers to the camera — no keyboard, no mouse, just hands.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/play">
            <Button size="lg" variant="primary">▶️ Play now</Button>
          </Link>
          <Link to="/learn">
            <Button size="lg" variant="secondary">✋ Learn the gestures</Button>
          </Link>
        </div>
        <p className="mt-3 text-sm text-base-content/50">
          Tip: this needs camera access over HTTPS (localhost works too).
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.title} className="text-center">
            <div className="text-5xl">{f.icon}</div>
            <h3 className="mt-2 font-display text-xl font-bold">{f.title}</h3>
            <p className="mt-1 text-base-content/70">{f.text}</p>
          </Card>
        ))}
      </section>
    </div>
  )
}
