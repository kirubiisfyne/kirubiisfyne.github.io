import kontextoImage from '../../games/kontexto/emissive.png?url'
import aniiImage from '../../games/anii/emissive.png?url'

export interface Game {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly emissiveUrl: string
  /** Optional half-turn applied within the TV screen's UV island. */
  readonly emissiveRotation?: 0 | 180
  readonly playUrl: string
}

// Add games in display order; IDs must stay unique and links must target itch.io.
export const games: readonly Game[] = [
  { id: 'kontexto', name: 'KonTEXTo', description: 'An immersive campus life simulator where every word counts. Explore, socialize, and master the art of text editing.', emissiveUrl: kontextoImage, emissiveRotation: 180, playUrl: 'https://kirubiisfyne.itch.io/kontexto' },
  { id: 'anii', name: 'Anii! Grow to Know', description: 'An educational farming simulator where you plant crops, take quizzes, and learn about Filipino Bahay Kubo crops.', emissiveUrl: aniiImage, emissiveRotation: 180, playUrl: 'https://kirubiisfyne.itch.io/anii-grow-to-know' },
]

const ids = new Set<string>()
for (const game of games) {
  if (!game.id.trim() || ids.has(game.id) || !game.name.trim() || !game.description.trim() || !game.emissiveUrl.trim()) {
    throw new Error(`Invalid game catalog entry: ${game.id || '(missing ID)'}`)
  }
  ids.add(game.id)
  let url: URL
  try { url = new URL(game.playUrl) } catch { throw new Error(`Invalid itch.io URL for game: ${game.id}`) }
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.itch.io')) {
    throw new Error(`Expected an HTTPS itch.io URL for game: ${game.id}`)
  }
  if (game.emissiveRotation !== undefined && game.emissiveRotation !== 0 && game.emissiveRotation !== 180) {
    throw new Error(`Invalid emissive rotation for game: ${game.id}`)
  }
}
