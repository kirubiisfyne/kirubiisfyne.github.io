import type { ReactNode } from 'react'

type H2Props = {
  readonly id?: string
  readonly label: ReactNode
  readonly description?: ReactNode
} & (
  | { readonly artworkSrc?: string; readonly artwork?: never }
  | { readonly artwork?: ReactNode; readonly artworkSrc?: never }
)

export function H2({ id, label, artworkSrc, artwork, description }: H2Props) {
  return (
    <div className="flex w-full flex-col items-center gap-[10px] pt-[20px] text-center text-white">
      {artworkSrc ? (
        <div className="relative aspect-[202/32] w-full max-w-[202px]">
          {/* Preserve the artwork's overflow around its 32px highlight frame. */}
          <img src={artworkSrc} alt="" width={202} height={50} className="absolute -top-[36.5625%] left-0 w-full" />
        </div>
      ) : artwork}
      <h2 id={id} className="text-[12px] leading-[16px] break-words">
        {label}
      </h2>
      {description != null && (
        <p className="flex min-h-[48px] w-full max-w-[1146px] items-center justify-center text-[12px] leading-[16px]">{description}</p>
      )}
    </div>
  )
}
