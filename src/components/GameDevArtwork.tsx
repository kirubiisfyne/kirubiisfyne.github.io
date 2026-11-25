const gameDevAscii = [
  '  _____                 ___          ',
  ' / ___/__ ___ _  ___   / _ \\___ _  __',
  "/ (_ / _ `/  ' \\/ -_) / // / -_) |/ /",
  '\\___/\\_,_/_/_/_/\\__/ /____/\\__/|___/',
  ' ',
].join('\n')

export function GameDevArtwork() {
  return <div className="game-dev-artwork" aria-hidden="true"><pre>{gameDevAscii}</pre></div>
}
