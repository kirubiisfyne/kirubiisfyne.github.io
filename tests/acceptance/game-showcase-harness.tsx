import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { GameShowcase } from '../../src/components/GameShowcase'
import { games } from '../../src/data/games'
import '../../src/styles.css'

const params = new URLSearchParams(location.search)
const catalog = params.get('catalog') === 'empty' ? []
  : params.get('catalog') === 'media-empty' ? [{ ...games[0], media: [] }]
  : params.get('catalog') === 'media-single' ? [{ ...games[0], media: games[0].media.slice(1, 2) }]
  : params.get('catalog') === 'single' ? games.slice(0, 1)
  : params.get('catalog') === 'extended' ? [...games, { ...games[0], id: 'fixture-extra', name: 'Fixture Extra Game' }]
  : games
function Harness() {
  const [mounted, setMounted] = useState(true)
  return <>
    {params.has('lifecycle') && <button type="button" onClick={() => setMounted((value) => !value)}>Toggle showcase</button>}
    {mounted && <GameShowcase games={catalog} />}
  </>
}

createRoot(document.getElementById('root')!).render(<StrictMode><Harness /></StrictMode>)
