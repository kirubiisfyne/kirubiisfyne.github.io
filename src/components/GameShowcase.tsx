import { useState, type CSSProperties } from 'react'
import playArtwork from '../assets/figma/view-play.svg'
import { games as defaultGames, type Game } from '../data/games'
import { gameDescription } from '../data/site-copy'
import { H2 } from './H2'
import { RetroTvViewer } from './RetroTvViewer'

const gameDevAscii = [
  '  _____                 ___          ',
  ' / ___/__ ___ _  ___   / _ \\___ _  __',
  "/ (_ / _ `/  ' \\/ -_) / // / -_) |/ /",
  '\\___/\\_,_/_/_/_/\\__/ /____/\\__/|___/',
  ' ',
].join('\n')

export function GameShowcase({ games = defaultGames }: { readonly games?: readonly Game[] }) {
  const [index, setIndex] = useState(0)
  const selected = games.length ? games[index % games.length] : undefined
  const move = (direction: number) => setIndex((current) => (current + direction + games.length) % games.length)
  return (
    <section className="game-showcase" aria-labelledby="game-showcase-heading">
      <H2
        id="game-showcase-heading"
        label="[ Game Dev ]"
        description={gameDescription}
        artwork={<div className="game-dev-artwork" aria-hidden="true"><pre>{gameDevAscii}</pre></div>}
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
            <a className="view-mode-button game-play" href={selected.playUrl} target="_blank" rel="noopener noreferrer" aria-label="Play (opens in a new tab)">
              <span aria-hidden="true" className="view-mode-artwork" style={{ '--view-artwork': `url("${playArtwork}")`, width: 48, height: 12 } as CSSProperties}>
                <span className="view-mode-glyph view-mode-arrow-start" />
                <span className="view-mode-glyph view-mode-label" />
                <span className="view-mode-glyph view-mode-arrow-end" />
              </span>
            </a>
            <p className="game-description">{selected.description}</p>
            <p className="game-announcement" aria-live="polite" aria-atomic="true">{selected.name}, {index % games.length + 1} of {games.length}</p>
          </div>
        ) : <p className="game-empty">No games available yet.</p>}
      </div>
    </section>
  )
}
