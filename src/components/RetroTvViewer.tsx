import { useEffect, useRef, useState } from 'react'
import { createRetroTvViewer, type TvStatus } from '../lib/retro-tv-viewer'

export function RetroTvViewer({ image, rotation = 0 }: { readonly image: string | null; readonly rotation?: 0 | 180 }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const viewer = useRef<ReturnType<typeof createRetroTvViewer> | null>(null)
  const [status, setStatus] = useState<TvStatus>('loading')
  const previousImage = useRef<{ image: string | null; rotation: 0 | 180 } | null>(null)

  useEffect(() => {
    if (!canvas.current) return
    try {
      const controller = createRetroTvViewer(canvas.current, setStatus)
      viewer.current = controller
      return () => { viewer.current = null; controller.dispose() }
    } catch {
      setStatus('unavailable')
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
    <div className="tv-stage" data-tv-state={status}>
      <canvas ref={canvas} className="tv-canvas" aria-hidden="true" />
      <p className="tv-status" role="status">{status === 'unavailable' ? 'TV image unavailable. You can still browse games below.' : ''}</p>
    </div>
  )
}
