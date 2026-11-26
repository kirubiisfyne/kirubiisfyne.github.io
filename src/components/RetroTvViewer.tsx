import { useEffect, useId, useRef, useState } from 'react'
import { createRetroTvViewer, type TvStatus } from '../lib/retro-tv-viewer'

export function RetroTvViewer({
  image,
  rotation = 0,
  navigationEnabled,
  onNavigate,
}: {
  readonly image: string | null
  readonly rotation?: 0 | 180
  readonly navigationEnabled: boolean
  readonly onNavigate: (direction: -1 | 1) => void
}) {
  const instructionsId = useId()
  const canvas = useRef<HTMLCanvasElement>(null)
  const controls = useRef<HTMLDivElement>(null)
  const navigation = useRef({ navigationEnabled, onNavigate })
  navigation.current = { navigationEnabled, onNavigate }
  const viewer = useRef<ReturnType<typeof createRetroTvViewer> | null>(null)
  const [status, setStatus] = useState<TvStatus>('loading')
  const [controllerStatus, setControllerStatus] = useState<TvStatus>('loading')
  const previousImage = useRef<{ image: string | null; rotation: 0 | 180 } | null>(null)
  const navigate = (direction: -1 | 1) => {
    if (!navigation.current.navigationEnabled) return
    viewer.current?.nudge(direction)
    navigation.current.onNavigate(direction)
  }

  useEffect(() => {
    const target = canvas.current
    if (!target) return
    let active = true
    let controller: ReturnType<typeof createRetroTvViewer> | undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || !active) return
        observer.disconnect()
        try {
          controller = createRetroTvViewer(
            target,
            setStatus,
            setControllerStatus,
            (previous, next) => {
              const style = controls.current?.style
              style?.setProperty('--previous-x', `${previous.x * 100}%`)
              style?.setProperty('--previous-y', `${previous.y * 100}%`)
              style?.setProperty('--next-x', `${next.x * 100}%`)
              style?.setProperty('--next-y', `${next.y * 100}%`)
              const width = controls.current?.clientWidth ?? 0
              const separation = Math.abs(next.x - previous.x) * width
              style?.setProperty('--hit-width', `${Math.max(1, Math.min(24, separation * 0.9))}px`)
            },
            (direction) => {
              if (!navigation.current.navigationEnabled) return
              viewer.current?.nudge(direction)
              navigation.current.onNavigate(direction)
            }
          )
          viewer.current = controller
          const latest = previousImage.current
          if (latest) controller.setImage(latest.image, latest.rotation)
        } catch {
          setStatus('unavailable')
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(target)
    return () => {
      active = false
      observer.disconnect()
      viewer.current = null
      controller?.dispose()
    }
  }, [])
  useEffect(() => {
    const previous = previousImage.current
    previousImage.current = { image, rotation }
    if (!previous || (previous.image === image && previous.rotation === rotation)) {
      viewer.current?.setImage(image, rotation)
      return
    }

    viewer.current?.setImage(null)
    const timer = window.setTimeout(() => viewer.current?.setImage(image, rotation), 300)
    return () => window.clearTimeout(timer)
  }, [image, rotation])

  return (
    <>
      <div className="tv-stage" data-tv-state={status}>
        <div className="game-canvas-layer">
          <canvas
            ref={canvas}
            className="tv-canvas"
            role="application"
            aria-label="Game navigation"
            aria-describedby={instructionsId}
            aria-disabled={!navigationEnabled}
            tabIndex={0}
            onKeyDown={(event) => {
              if (!navigationEnabled || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return
              event.preventDefault()
              navigate(event.key === 'ArrowLeft' ? -1 : 1)
            }}
          />
          <div
            ref={controls}
            className="game-controller-navigation"
            data-controller-state={controllerStatus}
            aria-hidden="true"
          >
            <span className="navigation-button navigation-previous game-navigation-button" />
            <span className="navigation-button navigation-next game-navigation-button" />
          </div>
        </div>
        <p className="tv-status" role="status">
          {status === 'unavailable' ? 'TV image unavailable. You can still browse games below.' : ''}
        </p>
      </div>
      <p id={instructionsId} className="instruction-copy game-navigation-instructions">
        {navigationEnabled ? '[ D-pad / focus + arrows: change game ]' : '[ Game navigation unavailable ]'}
      </p>
    </>
  )
}
