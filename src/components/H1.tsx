import type { ReactNode } from 'react'

type H1Props = {
  readonly id: string
  readonly label: ReactNode
} & (
  | { readonly artworkSrc?: string; readonly artwork?: never }
  | { readonly artwork?: ReactNode; readonly artworkSrc?: never }
)

export function H1({ id, label, artworkSrc, artwork }: H1Props) {
  return (
    <div className="flex w-full flex-col items-center gap-[8px] pt-[20px] text-white">
      {artworkSrc ? (
        <div className="relative aspect-[504/48] w-[99%] max-w-[504px]">
          {/* Figma glyphs extend 11.7px above their 48px highlight frame. */}
          <img
            src={artworkSrc}
            alt=""
            width={507}
            height={66}
            className="absolute -top-[24.394%] -left-[0.5163%] w-[100.595%] max-w-none"
          />
        </div>
      ) : artwork}
      <h1 id={id} className="text-center text-[12px] leading-[16px] break-words">
        {label}
      </h1>
    </div>
  )
}
