import { Suspense } from 'react'
import { NavLink, Outlet, useLocation, useSearchParams } from 'react-router-dom'
import { CAMERA_SIZES, useAppSettings, type CameraScale } from '@/context/AppSettingsContext'
import { TunePanel } from '@/components/dev/TunePanel'
import { useAudio } from '@/hooks/useAudio'
import { useStrings } from '@/i18n/useStrings'
import { LOCALES } from '@/i18n/strings'
import { AnimatePresence, motion } from 'framer-motion'

// Routes + icons are code-side; labels come from the i18n dictionary.
const NAV_ROUTES = [
  { to: '/', icon: '🏠', end: true, labelKey: 'home' as const },
  { to: '/learn', icon: '✋', end: false, labelKey: 'learn' as const },
  { to: '/lessons', icon: '🎓', end: false, labelKey: 'lessons' as const },
  { to: '/play', icon: '🧮', end: false, labelKey: 'play' as const },
]

// Glyph grows with the size — small / medium / large black square (Phase 8.1).
const CAMERA_SCALE_ICON: Record<CameraScale, string> = {
  sm: '▪️',
  md: '◼️',
  lg: '⬛',
}

/** App shell: top navigation, routed content, footer. */
export function MainLayout() {
  const { muted, toggleMuted, mirrored, toggleMirrored, locale, setLocale, cameraScale, setCameraScale } =
    useAppSettings()
  const audio = useAudio()
  const t = useStrings()
  const location = useLocation()
  const [params] = useSearchParams()
  const tune = params.has('tune')

  const cameraSizeLabel =
    cameraScale === 'sm' ? t.nav.cameraSizeSm : cameraScale === 'md' ? t.nav.cameraSizeMd : t.nav.cameraSizeLg
  const cycleCameraScale = () => {
    const i = CAMERA_SIZES.indexOf(cameraScale)
    return CAMERA_SIZES[(i + 1) % CAMERA_SIZES.length]
  }

  return (
    <div className="flex min-h-screen flex-col bg-base-200">
      <a href="#main" className="skip-link">
        {t.nav.skipToContent}
      </a>
      <header className="navbar sticky top-0 z-20 border-b border-base-300 bg-base-100/90 px-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2">
          <NavLink to="/" className="flex items-center gap-2 font-display text-xl font-extrabold text-primary">
            <span className="text-2xl">✋</span>
            <span>{t.nav.brand}</span>
          </NavLink>

          <nav className="flex items-center gap-1">
            {NAV_ROUTES.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => audio.playClick()}
                className={({ isActive }) =>
                  `btn btn-sm rounded-full font-display ${isActive ? 'btn-primary' : 'btn-ghost'}`
                }
              >
                <span>{item.icon}</span>
                <span className="hidden sm:inline">{t.nav[item.labelKey]}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <div className="btn-group btn-xs mr-1" role="group" aria-label={t.nav.localeAria}>
              {LOCALES.map((loc) => (
                <button
                  key={loc}
                  className={`btn btn-xs ${locale === loc ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => {
                    audio.playClick()
                    setLocale(loc)
                  }}
                  aria-pressed={locale === loc}
                >
                  {loc.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              className="btn btn-ghost btn-sm btn-circle"
              onClick={() => {
                audio.playClick()
                setCameraScale(cycleCameraScale())
              }}
              title={`${t.nav.cameraSizeAria}: ${cameraSizeLabel}`}
              aria-label={`${t.nav.cameraSizeAria}: ${cameraSizeLabel}`}
            >
              {CAMERA_SCALE_ICON[cameraScale]}
            </button>
            <button
              className="btn btn-ghost btn-sm btn-circle"
              onClick={() => {
                audio.playClick()
                toggleMirrored()
              }}
              title={mirrored ? t.nav.mirrorOn : t.nav.mirrorOff}
              aria-label={t.nav.mirrorAria}
            >
              {mirrored ? '🪞' : '🖼️'}
            </button>
            <button
              className="btn btn-ghost btn-sm btn-circle"
              onClick={() => {
                audio.playClick()
                toggleMuted()
              }}
              title={muted ? t.nav.muted : t.nav.soundOn}
              aria-label={t.nav.soundAria}
            >
              {muted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Suspense
              fallback={
                <div className="flex justify-center py-20">
                  <span className="loading loading-spinner loading-lg text-primary" />
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-base-300 bg-base-100 px-4 py-4 text-center text-sm text-base-content/60">
        {t.nav.footer}
      </footer>

      {tune && <TunePanel />}
    </div>
  )
}
