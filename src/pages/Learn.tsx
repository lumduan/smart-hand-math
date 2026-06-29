import { useState } from 'react'
import { motion } from 'framer-motion'
import { CameraView } from '@/components/camera/CameraView'
import { Card } from '@/components/common/Card'
import { useStrings } from '@/i18n/useStrings'

/** Free-practice playground: see your finger count live, no pressure. */
export function Learn() {
  const [detected, setDetected] = useState<number>(-1)
  const t = useStrings()

  return (
    <div className="space-y-6">
      <header className="text-center">
        <h1 className="font-display text-3xl font-extrabold text-primary">{t.learn.title}</h1>
        <p className="mt-2 text-base-content/70">{t.learn.subtitle}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CameraView onNumberChange={setDetected} />
        </Card>

        <Card className="items-center justify-center text-center">
          <p className="font-display text-lg text-base-content/60">{t.learn.showing}</p>
          <motion.div
            key={detected}
            className={`my-2 font-display font-extrabold leading-none ${
              detected < 0 ? 'text-7xl text-base-content/40' : 'text-9xl text-primary'
            }`}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            {detected < 0 ? '✋' : detected}
          </motion.div>
          <p className="text-base-content/60">
            {detected < 0
              ? t.learn.feedbackEmpty
              : detected === 1
                ? t.learn.feedbackOne
                : t.learn.feedbackMany}
          </p>
        </Card>
      </div>
    </div>
  )
}
