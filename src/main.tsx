import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
// Self-hosted Baloo 2 (no Google Fonts CDN egress); weights 400–800.
import '@fontsource/baloo-2/400.css'
import '@fontsource/baloo-2/500.css'
import '@fontsource/baloo-2/600.css'
import '@fontsource/baloo-2/700.css'
import '@fontsource/baloo-2/800.css'
// Self-hosted Mitr — THAI subset only (Baloo 2 has no Thai glyphs; Latin stays Baloo 2).
import '@fontsource/mitr/thai-400.css'
import '@fontsource/mitr/thai-500.css'
import '@fontsource/mitr/thai-600.css'
import '@fontsource/mitr/thai-700.css'
import App from './App'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { AppSettingsProvider } from '@/context/AppSettingsContext'
import { GameProvider } from '@/context/GameContext'
import { LessonsProvider } from '@/context/LessonsContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {/* Catch any render throw and show a recoverable card instead of a blank page. */}
      <ErrorBoundary>
        <AppSettingsProvider>
          <GameProvider>
            <LessonsProvider>
              {/* Respect the user's prefers-reduced-motion setting for all motion. */}
              <MotionConfig reducedMotion="user">
                <App />
              </MotionConfig>
            </LessonsProvider>
          </GameProvider>
        </AppSettingsProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
)
