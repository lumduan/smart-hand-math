import { Component, type ErrorInfo, type ReactNode } from 'react'
import { STRINGS } from '@/i18n/strings'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

/**
 * App-wide error boundary. A render-phase throw in React has no other catch
 * point — without this, any throw unmounts the whole tree and the user just
 * sees a blank white page. Instead we show a friendly, recoverable card, log the
 * full error + component stack, and surface the error message on screen so it can
 * be reported. Uses `STRINGS.en` directly (no hooks/context) so the fallback
 * renders even if a provider is what threw.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('SmartHand Math crashed:', error, info.componentStack)
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    const c = STRINGS.en.common
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-base-200 p-6 text-center">
        <div className="font-display text-6xl">🙈</div>
        <h1 className="font-display text-2xl font-extrabold text-primary">{c.errorTitle}</h1>
        <p className="max-w-md text-base-content/70">{c.errorBody}</p>
        <button
          type="button"
          className="btn btn-primary rounded-full font-display shadow-md"
          onClick={() => window.location.reload()}
        >
          {c.errorReload}
        </button>
        {/* Shown for diagnosis so the exact error can be reported. */}
        <pre className="max-w-md overflow-auto rounded-xl bg-base-300 p-3 text-left text-xs text-error">
          {error.message}
        </pre>
      </div>
    )
  }
}
