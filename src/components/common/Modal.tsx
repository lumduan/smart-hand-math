import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** Disable backdrop click to close (useful while a round is active). */
  dismissable?: boolean
}

/** Accessible DaisyUI modal controlled by the `open` prop, with enter/exit motion. */
export function Modal({ open, onClose, title, children, dismissable = true }: ModalProps) {
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
            className="modal-box rounded-3xl"
            initial={{ scale: 0.9, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {title && <h3 className="font-display text-2xl font-bold mb-2">{title}</h3>}
            <div className="py-2">{children}</div>
            <div className="modal-action">
              {dismissable && (
                <button className="btn btn-ghost" onClick={onClose}>
                  Close
                </button>
              )}
            </div>
          </motion.div>
          {dismissable && (
            <button className="modal-backdrop bg-black/40" aria-label="Close modal" onClick={onClose} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
