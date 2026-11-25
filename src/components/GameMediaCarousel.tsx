import { type CSSProperties, useEffect, useRef, useState } from 'react'
import navigationDefault from '../assets/figma/navigation-default.svg'
import navigationHover from '../assets/figma/navigation-hover.svg'
import type { Game, GameMedia } from '../data/games'

const navigationArtwork = {
  '--navigation-default': `url("${navigationDefault}")`,
  '--navigation-hover': `url("${navigationHover}")`,
} as CSSProperties

export function GameMediaCarousel({ game }: { readonly game: Game }) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState<-1 | 0 | 1>(0)
  const [enlarged, setEnlarged] = useState<GameMedia | null>(null)
  const [closing, setClosing] = useState(false)
  const queue = useRef<(-1 | 1)[]>([])
  const locked = useRef(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const count = game.media.length
  const current = game.media[index]

  useEffect(() => {
    if (!direction) {
      const next = queue.current.shift()
      if (next) {
        // Paint the settled belt before starting the next queued slide.
        const frame = requestAnimationFrame(() => setDirection(next))
        return () => cancelAnimationFrame(frame)
      }
      locked.current = false
      return
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = window.setTimeout(
      () => {
        setIndex((previous) => (previous + direction + count) % count)
        setDirection(0)
      },
      reduced ? 0 : 700
    )
    return () => window.clearTimeout(timer)
  }, [direction, count])

  useEffect(() => {
    if (enlarged && dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal()
  }, [enlarged])

  useEffect(() => {
    if (!closing) return
    const timer = window.setTimeout(() => dialogRef.current?.close(), 220)
    return () => window.clearTimeout(timer)
  }, [closing])

  function closeEnlarged() {
    if (closing) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) dialogRef.current?.close()
    else setClosing(true)
  }

  useEffect(() => {
    if (!enlarged || closing) return
    const onScroll = () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) dialogRef.current?.close()
      else setClosing(true)
    }
    const timer = window.setTimeout(() => window.addEventListener('scroll', onScroll, { passive: true }), 250)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [enlarged, closing])

  function navigate(next: -1 | 1) {
    if (count < 2) return
    if (locked.current) queue.current.push(next)
    else {
      locked.current = true
      setDirection(next)
    }
  }

  if (!current) return null
  const slots = count === 1 ? [0] : direction === 1 ? [-1, 0, 1, 2] : direction === -1 ? [-2, -1, 0, 1] : [-1, 0, 1]

  return (
    <section className="project-carousel game-media-carousel" aria-label={`${game.name} media`}>
      <div className="viewer-frame">
        <div className="art2d-stage game-media-stage">
          {slots.map((slot) => {
            const media = game.media[(index + slot + count * 2) % count]
            const active = slot === 0 && direction === 0
            return (
              <div
                key={slot}
                className="art2d-slot game-media-slot"
                aria-hidden={!active}
                inert={!active}
                style={
                  {
                    '--slot': slot * 0.9,
                    '--destination': (slot - direction) * 0.9,
                    '--center-scale': slot === 0 ? 1 : 0.75,
                    '--destination-scale': slot - direction === 0 ? 1 : 0.75,
                  } as CSSProperties
                }
                data-moving={direction !== 0 || undefined}
              >
                {active && media.kind === 'trailer' ? (
                  <iframe
                    className="game-media-player"
                    title={`${game.name} trailer`}
                    src={`https://www.youtube-nocookie.com/embed/${media.videoId}?autoplay=0&rel=0&playsinline=1`}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : media.kind === 'screenshot' ? (
                  <button
                    type="button"
                    className="art2d-enlarge game-media-open"
                    disabled={!active}
                    aria-label={`Enlarge ${media.alt}`}
                    onClick={() => setEnlarged(media)}
                  >
                    <img
                      src={media.url}
                      alt={active ? media.alt : ''}
                      draggable={false}
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                ) : (
                  <img src={media.url} alt="" draggable={false} loading="lazy" decoding="async" />
                )}
              </div>
            )
          })}
        </div>
        <button
          type="button"
          aria-label="Previous game media"
          disabled={count < 2}
          onClick={() => navigate(-1)}
          className="navigation-button navigation-previous"
          style={navigationArtwork}
        >
          <span className="navigation-artwork" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Next game media"
          disabled={count < 2}
          onClick={() => navigate(1)}
          className="navigation-button navigation-next"
          style={navigationArtwork}
        >
          <span className="navigation-artwork" aria-hidden="true" />
        </button>
      </div>
      <p className="sr-only game-media-position" aria-live="polite" aria-atomic="true">
        {current.kind === 'trailer' ? 'Trailer' : 'Screenshot'}, {index + 1} of {count}
      </p>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Native dialog onCancel handles Escape; the close button supports keyboard activation. */}
      <dialog
        ref={dialogRef}
        className="art2d-dialog"
        data-closing={closing || undefined}
        aria-label={`Enlarged screenshot: ${game.name}`}
        onClose={() => {
          setEnlarged(null)
          setClosing(false)
        }}
        onCancel={(event) => {
          event.preventDefault()
          closeEnlarged()
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeEnlarged()
        }}
      >
        <button
          type="button"
          className="art2d-dialog-close"
          aria-label="Close enlarged screenshot"
          onClick={closeEnlarged}
        >
          <span aria-hidden="true">[ X ]</span>
        </button>
        {enlarged && <img src={enlarged.url} alt={enlarged.alt} />}
      </dialog>
    </section>
  )
}
