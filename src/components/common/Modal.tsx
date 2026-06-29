import type { ReactNode } from 'react'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** Disable backdrop click to close (useful while a round is active). */
  dismissable?: boolean
}

/** Accessible DaisyUI modal controlled by the `open` prop. */
export function Modal({ open, onClose, title, children, dismissable = true }: ModalProps) {
  if (!open) return null
  return (
    <div className={`modal ${open ? 'modal-open' : ''}`}>
      <div className="modal-box rounded-3xl">
        {title && <h3 className="font-display text-2xl font-bold mb-2">{title}</h3>}
        <div className="py-2">{children}</div>
        <div className="modal-action">
          {dismissable && (
            <button className="btn btn-ghost" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
      {dismissable && (
        <button
          className="modal-backdrop bg-black/40"
          aria-label="Close modal"
          onClick={onClose}
        />
      )}
    </div>
  )
}
