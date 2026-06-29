import type { HTMLAttributes, ReactNode } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

/** Generic content card with soft shadow and rounded corners. */
export function Card({ children, className = '', ...rest }: CardProps) {
  return (
    <div
      className={`card bg-base-100 shadow-lg ring-1 ring-base-300/50 rounded-3xl ${className}`}
      {...rest}
    >
      <div className="card-body">{children}</div>
    </div>
  )
}
