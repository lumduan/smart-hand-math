import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AppSettingsProvider } from '@/context/AppSettingsContext'
import { GameProvider } from '@/context/GameContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppSettingsProvider>
        <GameProvider>
          <App />
        </GameProvider>
      </AppSettingsProvider>
    </BrowserRouter>
  </StrictMode>,
)
