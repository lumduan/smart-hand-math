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
import App from './App'
import { AppSettingsProvider } from '@/context/AppSettingsContext'
import { GameProvider } from '@/context/GameContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppSettingsProvider>
        <GameProvider>
          {/* Respect the user's prefers-reduced-motion setting for all motion. */}
          <MotionConfig reducedMotion="user">
            <App />
          </MotionConfig>
        </GameProvider>
      </AppSettingsProvider>
    </BrowserRouter>
  </StrictMode>,
)
