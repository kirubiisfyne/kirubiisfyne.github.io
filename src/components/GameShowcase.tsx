import { useEffect, useState } from 'react'
import { games as defaultGames, type Game } from '../data/games'
import { gameDescription } from '../data/site-copy'
import { GameInfo } from './GameInfo'
import { GameMediaCarousel } from './GameMediaCarousel'
import { H2 } from './H2'
import { RetroTvViewer } from './RetroTvViewer'

const gameDevAscii = [
  '  _____                 ___          ',
  ' / ___/__ ___ _  ___   / _ \\___ _  __',
  "/ (_ / _ `/  ' \\/ -_) / // / -_) |/ /",
  '\\___/\\_,_/_/_/_/\\__/ /____/\\__/|___/',
  ' ',
].join('\n')

function gameIndexFromUrl(games: readonly Game[]) {
  const id = new URLSearchParams(window.location.search).get('game')
  return Math.max(
    0,
    games.findIndex((game) => game.id === id)
  )
}

export function GameShowcase({ games = defaultGames }: { readonly games?: readonly Game[] }) {
  const [index, setIndex] = useState(() => gameIndexFromUrl(games))
  const selected = games.length ? games[index % games.length] : undefined
  const move = (direction: number) => setIndex((current) => (current + direction + games.length) % games.length)

  useEffect(() => {
    const restoreSelection = () => setIndex(gameIndexFromUrl(games))
    window.addEventListener('popstate', restoreSelection)
    return () => window.removeEventListener('popstate', restoreSelection)
  }, [games])

  useEffect(() => {
    if (!selected) return
    const url = new URL(window.location.href)
    if (!url.searchParams.has('game') && index === 0) return
    if (url.searchParams.get('game') === selected.id) return
    url.searchParams.set('game', selected.id)
    window.history.replaceState(window.history.state, '', url)
  }, [selected, index])

  return (
    <section className="game-showcase" aria-labelledby="game-showcase-heading">
      <H2
        id="game-showcase-heading"
        label="[ Game Dev ]"
        description={gameDescription}
        artwork={
          <div className="game-dev-artwork" aria-hidden="true">
            <pre>{gameDevAscii}</pre>
          </div>
        }
      />
      <div className="game-carousel">
        {selected && <h3 className="game-title">{selected.name}</h3>}
        <div className="game-carousel-stage">
          <RetroTvViewer
            image={selected?.emissiveUrl ?? null}
            rotation={selected?.emissiveRotation}
            navigationEnabled={games.length >= 2}
            onNavigate={move}
          />
        </div>
        {selected ? (
          <div className="game-details">
            <GameMediaCarousel key={selected.id} game={selected} />
            <GameInfo game={selected} />
            <p className="game-announcement" aria-live="polite" aria-atomic="true">
              {selected.name}, {(index % games.length) + 1} of {games.length}
            </p>
          </div>
        ) : (
          <p className="game-empty">No games available yet.</p>
        )}
      </div>
    </section>
  )
}
