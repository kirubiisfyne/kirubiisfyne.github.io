import type { ReactNode } from 'react'

type H3Props = {
  readonly id?: string
  readonly label: ReactNode
  readonly className?: string
}

export function H3({ id, label, className = '' }: H3Props) {
  return <h3 id={id} className={`text-[12px] leading-[18px] break-words ${className}`}>{label}</h3>
}
