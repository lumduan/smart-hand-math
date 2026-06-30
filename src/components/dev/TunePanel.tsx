import { CAMERA_SIZES, useAppSettings } from '@/context/AppSettingsContext'

/**
 * Temporary tuning panel for AutoSubmit timing + camera size (Phase 8.2).
 * Mounted by `MainLayout` only when the URL has `?tune`, so it works in the
 * deployed PWA for real-hardware A/B testing. Values persist via
 * `AppSettingsContext`, so a chosen config survives reloads. Delete this file
 * (and its mount) once defaults are settled → ADR-0008.
 */
export function TunePanel() {
  const {
    autoSubmitEnabled,
    setAutoSubmitEnabled,
    autoSubmitPromptMs,
    setAutoSubmitPromptMs,
    autoSubmitConfirmMs,
    setAutoSubmitConfirmMs,
    cameraScale,
    setCameraScale,
  } = useAppSettings()

  return (
    <div className="fixed bottom-4 right-4 z-50 w-64 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-xl">
      <p className="font-display font-bold">⚙️ Tuning (dev)</p>

      <label className="mt-3 flex items-center justify-between text-sm">
        <span>AutoSubmit</span>
        <input
          type="checkbox"
          className="toggle toggle-sm toggle-primary"
          checked={autoSubmitEnabled}
          onChange={(e) => setAutoSubmitEnabled(e.target.checked)}
        />
      </label>

      <label className="mt-2 block text-sm">
        <span className="flex justify-between">
          <span>Prompt</span>
          <span>{autoSubmitPromptMs}ms</span>
        </span>
        <input
          type="range"
          min={200}
          max={3000}
          step={100}
          className="range range-xs range-primary mt-1"
          value={autoSubmitPromptMs}
          onChange={(e) => setAutoSubmitPromptMs(Number(e.target.value))}
        />
      </label>

      <label className="mt-2 block text-sm">
        <span className="flex justify-between">
          <span>Confirm</span>
          <span>{autoSubmitConfirmMs}ms</span>
        </span>
        <input
          type="range"
          min={200}
          max={3000}
          step={100}
          className="range range-xs range-primary mt-1"
          value={autoSubmitConfirmMs}
          onChange={(e) => setAutoSubmitConfirmMs(Number(e.target.value))}
        />
      </label>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span>Camera</span>
        <div className="btn-group btn-xs" role="group" aria-label="Camera size">
          {CAMERA_SIZES.map((s) => (
            <button
              key={s}
              className={`btn btn-xs ${cameraScale === s ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setCameraScale(s)}
              aria-pressed={cameraScale === s}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
