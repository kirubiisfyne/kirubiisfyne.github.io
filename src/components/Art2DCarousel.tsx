import { type CSSProperties, useEffect, useRef, useState } from 'react'
import navigationDefault from '../assets/figma/navigation-default.svg'
import navigationHover from '../assets/figma/navigation-hover.svg'

const images = import.meta.glob<string>('../assets/2d/**/*.{png,jpg,jpeg,webp,avif,gif,svg}', {
  eager: true, query: '?url', import: 'default',
})
const configs = import.meta.glob<{ name?: string; description?: string }>('../assets/2d/**/*.config.json', {
  eager: true, import: 'default',
})
const artworks = Object.keys(images).sort().map((path) => {
  const config = configs[path.replace(/\.[^.]+$/, '.config.json')]
  const filename = path.split('/').pop()!.replace(/\.[^.]+$/, '')
  return {
    path,
    url: images[path],
    title: typeof config?.name === 'string' && config.name.trim() || filename,
    description: typeof config?.description === 'string' ? config.description.trim() : '',
  }
})
const navigationArtwork = {
  '--navigation-default': `url("${navigationDefault}")`,
  '--navigation-hover': `url("${navigationHover}")`,
} as CSSProperties

export function Art2DCarousel() {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState<-1 | 0 | 1>(0)
  const [enlarged, setEnlarged] = useState<(typeof artworks)[number] | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const queue = useRef<(-1 | 1)[]>([])
  const locked = useRef(false)
  const count = artworks.length
  const current = artworks[index]

  useEffect(() => {
    if (enlarged && dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal()
  }, [enlarged])

  useEffect(() => {
    if (!direction) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = window.setTimeout(() => {
      setIndex((previous) => (previous + direction + count) % count)
      setDirection(0)
      locked.current = false
      const next = queue.current.shift()
      if (next) {
        locked.current = true
        // Let the settled belt render before starting the next slide.
        requestAnimationFrame(() => setDirection(next))
      }
    }, reduced ? 0 : 700)
    return () => window.clearTimeout(timer)
  }, [direction, count])

  function navigate(next: -1 | 1) {
    if (count < 2) return
    if (locked.current) queue.current.push(next)
    else {
      locked.current = true
      setDirection(next)
    }
  }

  const slots = count === 1 ? [0] : direction === 1 ? [-1, 0, 1, 2] : direction === -1 ? [-2, -1, 0, 1] : [-1, 0, 1]
  return (
    <div className="project-carousel art2d-carousel" aria-label="2D artwork carousel">
      {current ? (
        <figure className="project-card">
          <figcaption className="project-title">[ {current.title} ]</figcaption>
          <div className="viewer-frame">
            <div className="art2d-stage" aria-label={`${current.title}, artwork ${index + 1} of ${count}`}>
              {slots.map((slot) => {
                const artwork = artworks[(index + slot + count * 2) % count]
                return (
                  <div key={slot} className="art2d-slot" aria-hidden={slot !== 0 || direction !== 0}
                    style={{ '--slot': slot, '--destination': slot - direction, '--center-scale': slot === 0 ? 1 : 0.75, '--destination-scale': slot - direction === 0 ? 1 : 0.75 } as CSSProperties}
                    data-moving={direction !== 0 || undefined}>
                    {slot === 0 && direction === 0 ? (
                      <button type="button" className="art2d-enlarge" aria-label={`Enlarge ${artwork.title}`} onClick={() => setEnlarged(artwork)}>
                        <img src={artwork.url} alt={artwork.title} draggable={false} />
                      </button>
                    ) : <img src={artwork.url} alt="" draggable={false} />}
                  </div>
                )
              })}
            </div>
            <button type="button" aria-label="Previous artwork" disabled={count < 2} onClick={() => navigate(-1)} className="navigation-button navigation-previous" style={navigationArtwork}><span className="navigation-artwork" aria-hidden="true" /></button>
            <button type="button" aria-label="Next artwork" disabled={count < 2} onClick={() => navigate(1)} className="navigation-button navigation-next" style={navigationArtwork}><span className="navigation-artwork" aria-hidden="true" /></button>
          </div>
          <p className="project-description" hidden={!current.description}>{current.description}</p>
          <p className="sr-only" aria-live="polite" aria-atomic="true">{current.title}, {index + 1} of {count}</p>
        </figure>
      ) : <p className="project-empty">2D artwork coming soon.</p>}
      <dialog ref={dialogRef} className="art2d-dialog" aria-label={enlarged ? `Enlarged artwork: ${enlarged.title}` : 'Enlarged artwork'} onClose={() => setEnlarged(null)} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close() }}>
        <button type="button" className="art2d-dialog-close" aria-label="Close enlarged artwork" onClick={() => dialogRef.current?.close()}>×</button>
        {enlarged && <img src={enlarged.url} alt={enlarged.title} />}
      </dialog>
    </div>
  )
}
