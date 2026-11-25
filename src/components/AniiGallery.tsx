import { useEffect, useRef, useState } from 'react'
import screenshot1 from '../assets/games/anii/1.png'
import screenshot2 from '../assets/games/anii/2.png'
import screenshot3 from '../assets/games/anii/3.png'
import screenshot4 from '../assets/games/anii/4.png'
import screenshot5 from '../assets/games/anii/5.png'

const screenshots = [screenshot1, screenshot2, screenshot3, screenshot4, screenshot5]

export function AniiGallery() {
  const [selected, setSelected] = useState<number | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (selected !== null && !element.open) element.showModal()
    if (selected === null && element.open) element.close()
  }, [selected])

  const move = (direction: number) => setSelected((current) => current === null ? null : (current + direction + screenshots.length) % screenshots.length)

  return (
    <>
      <div className="anii-thumbnails" aria-label="Anii screenshots">
        {screenshots.map((src, index) => (
          <button key={src} type="button" onClick={() => setSelected(index)} aria-label={`View Anii screenshot ${index + 1} of ${screenshots.length}`}>
            <img src={src} alt="" loading="lazy" />
          </button>
        ))}
      </div>
      <dialog ref={dialog} className="anii-lightbox" aria-label="Anii screenshot viewer" onClose={() => setSelected(null)} onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1) }
        if (event.key === 'ArrowRight') { event.preventDefault(); move(1) }
      }} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close() }}>
        {selected !== null && <div className="anii-lightbox-content">
          <div className="anii-lightbox-top"><span>Screenshot {selected + 1} / {screenshots.length}</span><button type="button" onClick={() => dialog.current?.close()} autoFocus>Close ×</button></div>
          <img src={screenshots[selected]} alt={`Anii! Grow to Know screenshot ${selected + 1} of ${screenshots.length}`} />
          <div className="anii-lightbox-controls"><button type="button" onClick={() => move(-1)}>&lt; Previous</button><button type="button" onClick={() => move(1)}>Next &gt;</button></div>
        </div>}
      </dialog>
    </>
  )
}
