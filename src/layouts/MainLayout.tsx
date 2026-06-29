import { NavLink, Outlet } from 'react-router-dom'
import { useAppSettings } from '@/context/AppSettingsContext'

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: '🏠', end: true },
  { to: '/learn', label: 'Learn', icon: '✋' },
  { to: '/play', label: 'Play', icon: '🧮' },
]

/** App shell: top navigation, routed content, footer. */
export function MainLayout() {
  const { muted, toggleMuted, mirrored, toggleMirrored } = useAppSettings()

  return (
    <div className="flex min-h-screen flex-col bg-base-200">
      <header className="navbar sticky top-0 z-20 border-b border-base-300 bg-base-100/90 px-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2">
          <NavLink to="/" className="flex items-center gap-2 font-display text-xl font-extrabold text-brand-primary">
            <span className="text-2xl">✋</span>
            <span>SmartHand Math</span>
          </NavLink>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `btn btn-sm rounded-full font-display ${isActive ? 'btn-primary' : 'btn-ghost'}`
                }
              >
                <span>{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <button
              className="btn btn-ghost btn-sm btn-circle"
              onClick={toggleMirrored}
              title={mirrored ? 'Mirror on' : 'Mirror off'}
              aria-label="Toggle mirror"
            >
              {mirrored ? '🪞' : '🖼️'}
            </button>
            <button
              className="btn btn-ghost btn-sm btn-circle"
              onClick={toggleMuted}
              title={muted ? 'Muted' : 'Sound on'}
              aria-label="Toggle sound"
            >
              {muted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-base-300 bg-base-100 px-4 py-4 text-center text-sm text-base-content/60">
        Built with React · Vite · MediaPipe · Tailwind + DaisyUI
      </footer>
    </div>
  )
}
