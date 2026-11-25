interface H1Props {
  readonly id: string
  readonly label: string
  readonly artworkSrc: string
}

export function H1({ id, label, artworkSrc }: H1Props) {
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
      <h1 id={id} className="text-[12px] leading-[16px]">
        {label}
      </h1>
    </div>
  )
}
