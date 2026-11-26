import type { Game } from '../data/games'

function GameText({ text }: { readonly text: string }) {
  return text.split(/\*\*([^*]+)\*\*/).map((part, index) => (index % 2 ? <strong key={part}>{part}</strong> : part))
}

function InfoList({ items }: { readonly items: readonly string[] }) {
  return (
    // biome-ignore lint/a11y/noRedundantRoles: Preserve Safari list semantics when CSS markers are hidden.
    <ul className="game-info-list" role="list">
      {items.map((text) => (
        <li key={text}>
          <span className="game-info-chevron" aria-hidden="true">
            &gt;
          </span>
          <p>
            <GameText text={text} />
          </p>
        </li>
      ))}
    </ul>
  )
}

export function GameInfo({ game }: { readonly game: Game }) {
  return (
    <div className="game-info game-description">
      <nav className="game-actions" aria-label={`Links for ${game.name}`}>
        {game.sourceUrl && (
          <a
            className="game-info-link"
            href={game.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Source Code: ${game.name} (opens in a new tab)`}
          >
            <span className="view-mode-artwork">
              {'>'} View on Github {'<'}
            </span>
          </a>
        )}
        <a
          className="game-info-link"
          href={game.playUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Play Game: ${game.name} on Itch.io (opens in a new tab)`}
        >
          <span className="view-mode-artwork">
            {'>'} Get on Itch.io {'<'}
          </span>
        </a>
      </nav>
      <div className="game-info-grid">
        <div className="game-info-section game-info-roles">
          <h4 className="game-info-heading">
            <span>Role</span>
          </h4>
          <InfoList items={game.roles ?? []} />
        </div>
        <div className="game-info-section game-info-contributions">
          <h4 className="game-info-heading">
            <span>Contribution</span>
          </h4>
          {!!game.personalContributions?.length && (
            <>
              {!!game.teamContributions?.length && <h5 className="game-info-note">Personal contributions</h5>}
              <InfoList items={game.personalContributions} />
            </>
          )}
          {!!game.teamContributions?.length && (
            <>
              <h5 className="game-info-note">Team-developed systems</h5>
              <InfoList items={game.teamContributions} />
            </>
          )}
        </div>
        <div className="game-info-section game-info-description">
          <h4 className="game-info-heading">
            <span>Description / Game Info</span>
          </h4>
          <InfoList items={[game.description, game.context]} />
        </div>
        <div className="game-info-section game-info-features">
          <h4 className="game-info-heading">
            <span>Game Features</span>
          </h4>
          <InfoList items={game.features} />
        </div>
      </div>
    </div>
  )
}
