import { useState, type CSSProperties } from 'react'
import navigationDefault from '../assets/figma/navigation-default.svg'
import navigationHover from '../assets/figma/navigation-hover.svg'
import playArtwork from '../assets/figma/view-play.svg'
import { games as defaultGames, type Game } from '../data/games'
import { introduction } from '../data/site-copy'
import { H2 } from './H2'
import { RetroTvViewer } from './RetroTvViewer'

const gameDevAscii = [
  '  _____                 ___          ',
  ' / ___/__ ___ _  ___   / _ \\___ _  __',
  "/ (_ / _ `/  ' \\/ -_) / // / -_) |/ /",
  '\\___/\\_,_/_/_/_/\\__/ /____/\\__/|___/',
  ' ',
].join('\n')

const navigationArtwork = {
  '--navigation-default': `url("${navigationDefault}")`,
  '--navigation-hover': `url("${navigationHover}")`,
} as CSSProperties

export function GameShowcase({ games = defaultGames }: { readonly games?: readonly Game[] }) {
  const [index, setIndex] = useState(0)
  const selected = games.length ? games[index % games.length] : undefined
  const move = (direction: number) => setIndex((current) => (current + direction + games.length) % games.length)
  return (
    <section className="game-showcase" aria-labelledby="game-showcase-heading">
      <H2
        id="game-showcase-heading"
        label="[ Game Dev ]"
        description={introduction}
        artwork={<div className="game-dev-artwork" aria-hidden="true"><pre>{gameDevAscii}</pre></div>}
      />
      <div className="game-carousel" style={navigationArtwork}>
        {selected && <h3 className="game-title">{selected.name}</h3>}
        <div className="game-carousel-stage">
          <RetroTvViewer image={selected?.emissiveUrl ?? null} rotation={selected?.emissiveRotation} />
          <nav aria-label="Game navigation">
            <button className="navigation-button navigation-previous game-navigation-button" type="button" aria-label="Previous" disabled={games.length < 2} onClick={() => move(-1)}>
              <span className="navigation-artwork" aria-hidden="true" />
            </button>
            <button className="navigation-button navigation-next game-navigation-button" type="button" aria-label="Next" disabled={games.length < 2} onClick={() => move(1)}>
              <span className="navigation-artwork" aria-hidden="true" />
            </button>
          </nav>
        </div>
        {selected ? (
          <div className="game-details">
            <p className="game-description">{selected.description}</p>
            <a className="view-mode-button game-play" href={selected.playUrl} target="_blank" rel="noopener noreferrer" aria-label="Play (opens in a new tab)">
              <span aria-hidden="true" className="view-mode-artwork" style={{ '--view-artwork': `url("${playArtwork}")`, width: 48, height: 12 } as CSSProperties}>
                <span className="view-mode-glyph view-mode-arrow-start" />
                <span className="view-mode-glyph view-mode-label" />
                <span className="view-mode-glyph view-mode-arrow-end" />
              </span>
            </a>
            <p className="game-announcement" aria-live="polite" aria-atomic="true">{selected.name}, {index % games.length + 1} of {games.length}</p>
          </div>
        ) : <p className="game-empty">No games available yet.</p>}
      </div>
    </section>
  )
}
