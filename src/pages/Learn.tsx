import { useState } from 'react'
import { CameraView } from '@/components/camera/CameraView'
import { Card } from '@/components/common/Card'

/** Free-practice playground: see your finger count live, no pressure. */
export function Learn() {
  const [detected, setDetected] = useState<number>(-1)

  return (
    <div className="space-y-6">
      <header className="text-center">
        <h1 className="font-display text-3xl font-extrabold text-brand-primary">Learn the gestures</h1>
        <p className="mt-2 text-base-content/70">
          Turn on the camera and hold up your fingers. Try to make each number from 0 to 10!
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CameraView onNumberChange={setDetected} />
        </Card>

        <Card className="items-center justify-center text-center">
          <p className="font-display text-lg text-base-content/60">You're showing</p>
          <div
            key={detected}
            className={`my-2 font-display font-extrabold leading-none ${
              detected < 0 ? 'text-7xl text-base-content/40' : 'text-9xl text-brand-primary animate-pop'
            }`}
          >
            {detected < 0 ? '✋' : detected}
          </div>
          <p className="text-base-content/60">
            {detected < 0
              ? 'Point your hand at the camera…'
              : detected === 1
                ? 'One finger — great!'
                : 'Nice! Keep practicing different numbers.'}
          </p>
        </Card>
      </div>
    </div>
  )
}
