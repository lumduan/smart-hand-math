import { useEffect, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStrings } from '@/i18n/useStrings'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** Disable backdrop-click/Escape close (useful while a round is active). */
  dismissable?: boolean
}

/** Accessible DaisyUI modal: a real `role="dialog"` with focus management,
 *  Escape-to-close (when dismissable), and enter/exit motion. */
export function Modal({ open, onClose, title, children, dismissable = true }: ModalProps) {
  const t = useStrings()
  const boxRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  // Focus the dialog on open; Escape closes when dismissable.
  useEffect(() => {
    if (!open) return
    previouslyFocused.current = document.activeElement as HTMLElement | null
    boxRef.current?.focus()
    if (!dismissable) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, dismissable, onClose])

  // Restore focus to the trigger when the dialog closes.
  useEffect(() => {
    if (open) return
    previouslyFocused.current?.focus?.()
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal modal-open"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            ref={boxRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            className="modal-box rounded-3xl outline-none"
            initial={{ scale: 0.9, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {title && (
              <h3 id="modal-title" className="font-display text-2xl font-bold mb-2">
                {title}
              </h3>
            )}
            <div className="py-2">{children}</div>
            <div className="modal-action">
              {dismissable && (
                <button className="btn btn-ghost" onClick={onClose}>
                  {t.common.close}
                </button>
              )}
            </div>
          </motion.div>
          {dismissable && (
            <button className="modal-backdrop bg-black/40" aria-label={t.common.closeAria} onClick={onClose} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
