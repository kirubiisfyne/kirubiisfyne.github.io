import { Art2DCarousel } from './Art2DCarousel'
import { H2 } from './H2'

const art2dAscii = [
  '   ___  ___    ___       __ ',
  '  |_  |/ _ \\  / _ | ____/ /_',
  ' / __// // / / __ |/ __/ __/',
  '/____/____/ /_/ |_/_/  \\__/',
  '                            ',
].join('\n')

export function Art2DShowcase() {
  return (
    <section aria-labelledby="art-2d" className="flex flex-col gap-[20px]">
      <H2 id="art-2d" label="[ 2D Art ]" artwork={<div className="game-dev-artwork art-2d-artwork" aria-hidden="true"><pre>{art2dAscii}</pre></div>} description="A selection of my 2D artwork and graphic design." />
      <Art2DCarousel />
    </section>
  )
}
