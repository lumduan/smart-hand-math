import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from '@/components/common/Modal'
import { AppSettingsProvider } from '@/context/AppSettingsContext'

// Modal reads strings via useStrings → needs the settings provider.
const renderModal = (ui: Parameters<typeof render>[0]) => render(ui, { wrapper: AppSettingsProvider })

describe('Modal', () => {
  it('renders nothing when closed', () => {
    const { container } = renderModal(
      <Modal open={false} onClose={() => {}}>
        body
      </Modal>,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders title, children, Close button, and backdrop when open', () => {
    renderModal(
      <Modal open onClose={() => {}} title="Game over">
        body
      </Modal>,
    )
    expect(screen.getByText('Game over')).toBeInTheDocument()
    expect(screen.getByText('body')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close modal' })).toBeInTheDocument()
  })

  it('hides the Close button and backdrop when dismissable is false', () => {
    renderModal(
      <Modal open dismissable={false} onClose={() => {}}>
        body
      </Modal>,
    )
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Close modal' })).toBeNull()
  })

  it('calls onClose when the Close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderModal(
      <Modal open onClose={onClose}>
        body
      </Modal>,
    )
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when the backdrop is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderModal(
      <Modal open onClose={onClose}>
        body
      </Modal>,
    )
    await user.click(screen.getByRole('button', { name: 'Close modal' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('is an accessible dialog (role/aria-modal/labelledby) when open', () => {
    renderModal(
      <Modal open onClose={() => {}} title="Game over">
        body
      </Modal>,
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title')
    expect(screen.getByText('Game over')).toHaveAttribute('id', 'modal-title')
  })

  it('closes on Escape when dismissable', () => {
    const onClose = vi.fn()
    renderModal(
      <Modal open onClose={onClose}>
        body
      </Modal>,
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not close on Escape when not dismissable', () => {
    const onClose = vi.fn()
    renderModal(
      <Modal open dismissable={false} onClose={onClose}>
        body
      </Modal>,
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })
})
