interface H1Props {
  readonly id: string
  readonly label: string
  readonly artworkSrc: string
  readonly level?: 1 | 2
}

export function H1({ id, label, artworkSrc, level = 1 }: H1Props) {
  const Heading = level === 1 ? 'h1' : 'h2'
  return (
    <div className="flex w-full flex-col items-center gap-[8px] pt-[20px] text-white">
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
      <Heading id={id} tabIndex={-1} className="text-[12px] leading-[16px]">
        {label}
      </Heading>
    </div>
  )
}
