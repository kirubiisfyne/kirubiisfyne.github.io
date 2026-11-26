import aniiImage from '../../games/anii/emissive.png?url'
import aniiGarden from '../../games/anii/screenshot-01.webp?url'
import aniiQuiz from '../../games/anii/screenshot-02.webp?url'
import aniiEvent from '../../games/anii/screenshot-03.webp?url'
import aniiDecoration from '../../games/anii/screenshot-04.webp?url'
import aniiExpansion from '../../games/anii/screenshot-05.webp?url'
import aniiTrailer from '../../games/anii/trailer.webp?url'
import kontextoImage from '../../games/kontexto/emissive.png?url'
import kontextoCampus from '../../games/kontexto/screenshot-01.webp?url'
import kontextoEditor from '../../games/kontexto/screenshot-02.webp?url'
import kontextoAdviser from '../../games/kontexto/screenshot-03.webp?url'
import kontextoTrailer from '../../games/kontexto/trailer.webp?url'

export type GameMedia = {
  readonly url: string
  readonly alt: string
} & ({ readonly kind: 'screenshot' } | { readonly kind: 'trailer'; readonly videoId: string })

export interface Game {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly features: readonly string[]
  readonly context: string
  readonly roles?: readonly string[]
  readonly teamSize?: number
  readonly developmentDuration?: string
  readonly developmentPeriod?: string
  readonly engine?: string
  readonly languages?: readonly string[]
  readonly classification?: string
  readonly personalContributions?: readonly string[]
  readonly teamContributions?: readonly string[]
  readonly status?: string
  readonly media: readonly GameMedia[]
  readonly emissiveUrl: string
  /** Optional half-turn applied within the TV screen's UV island. */
  readonly emissiveRotation?: 0 | 180
  readonly playUrl: string
  readonly sourceUrl?: string
}

// Add games in display order; IDs must stay unique and links must target itch.io.
export const games: readonly Game[] = [
  {
    id: 'kontexto',
    name: 'KonTEXTo',
    roles: ['Lead Unity Developer', 'Technical Artist'],
    engine: 'Unity 6',
    languages: ['C#'],
    classification: 'Educational RPG / Senior thesis',
    personalContributions: [
      'Developed gameplay mechanics and C# systems. (e.g., Task & Dialogue Manager, Text Editor System)',
      'Integrated game-ready 3D assets from Blender.',
    ],
    description:
      'A campus life simulator that turns document formatting into gameplay. Explore a 3D campus as Kiko, build relationships, and complete text-editing assignments for your adviser.',
    features: [
      'Edit and assemble documents in a custom text editor, then receive grades and detailed feedback on your formatting.',
      'Explore campus at your own pace to discover tasks and story details.',
      'Meet characters whose dialogue responds to completed tasks and grades.',
      'Pick up where you left off with auto-saved progress, location, and relationships.',
    ],
    context:
      'Built in Unity 6 with UI Toolkit as a senior thesis project by an Entertainment and Multimedia Computing student team at West Visayas State University. KonTEXTo connects academic research with independent game development through practical text-editing and document-layout challenges.',
    media: [
      { kind: 'trailer', url: kontextoTrailer, alt: 'KonTEXTo trailer poster', videoId: 'wYJc2vGsmZU' },
      { kind: 'screenshot', url: kontextoCampus, alt: 'Kiko exploring a sunlit campus corridor in KonTEXTo' },
      {
        kind: 'screenshot',
        url: kontextoEditor,
        alt: 'Document editor and formatting instructions on a classroom computer in KonTEXTo',
      },
      {
        kind: 'screenshot',
        url: kontextoAdviser,
        alt: 'Mrs. Santos giving Kiko feedback on a submitted document in KonTEXTo',
      },
    ],
    emissiveUrl: kontextoImage,
    emissiveRotation: 180,
    playUrl: 'https://kirubiisfyne.itch.io/kontexto',
    sourceUrl: 'https://github.com/kirubiisfyne/kontexto-repository',
  },
  {
    id: 'anii',
    name: 'Anii! Grow to Know',
    roles: ['Lead Developer', 'Game Director'],
    teamSize: 4,
    developmentDuration: '1 month',
    engine: 'Unity',
    languages: ['C#'],
    classification: 'Educational Game / Game Jam',
    // Individual ownership is unconfirmed; keep these credited to the team.
    teamContributions: [
      'Grid-based building system.',
      'Independent crop lifecycle management.',
      'Tool and interaction systems.',
      'Quiz progression system.',
      'Points, EXP, and leveling systems.',
    ],
    description:
      'An **educational farming simulator** about **Filipino Bahay Kubo crops** and agricultural tools. Plant and harvest crops, answer quizzes, and decorate a garden while learning through play.',
    features: [
      'Plant, water, and harvest **six Bahay Kubo crops**.',
      'Answer **agriculture-themed quizzes** to earn experience and unlock new crops.',
      '**Personalize your garden** with scarecrows and flowers, then unlock more plots as you progress.',
      'Watch for the special Anii Event, which temporarily increases harvest yields by **50%**.',
    ],
    context:
      'Created in Unity for an **Educational Game Jam** themed around Learning and Literacy / Life Skills and Career Readiness. Developed by **West Visayas State University** student creators under **Ukiyo Studios**, with original music and soundscapes by pizza doggy.',
    media: [
      { kind: 'trailer', url: aniiTrailer, alt: 'Anii! Grow to Know trailer poster', videoId: 'xJZeUs_QqVA' },
      {
        kind: 'screenshot',
        url: aniiGarden,
        alt: 'Watering Bahay Kubo crops beside a garden hut in Anii! Grow to Know',
      },
      {
        kind: 'screenshot',
        url: aniiQuiz,
        alt: 'An agriculture quiz asking which tool helps harvest crops in Anii! Grow to Know',
      },
      {
        kind: 'screenshot',
        url: aniiEvent,
        alt: 'Watering crops during a timed Anii Event with the seed selection open',
      },
      {
        kind: 'screenshot',
        url: aniiDecoration,
        alt: 'Choosing a scarecrow decoration for an expanded garden in Anii! Grow to Know',
      },
      {
        kind: 'screenshot',
        url: aniiExpansion,
        alt: 'An expanded garden with six crop types and scarecrows in Anii! Grow to Know',
      },
    ],
    emissiveUrl: aniiImage,
    emissiveRotation: 180,
    playUrl: 'https://kirubiisfyne.itch.io/anii-grow-to-know',
    sourceUrl: 'https://github.com/kirubiisfyne/anii-repository',
  },
]

const ids = new Set<string>()
for (const game of games) {
  if (
    !game.id.trim() ||
    ids.has(game.id) ||
    !game.name.trim() ||
    !game.description.trim() ||
    !game.emissiveUrl.trim()
  ) {
    throw new Error(`Invalid game catalog entry: ${game.id || '(missing ID)'}`)
  }
  if (!game.context.trim() || game.features.some((feature) => !feature.trim())) {
    throw new Error(`Invalid game details: ${game.id}`)
  }
  if (game.teamSize !== undefined && (!Number.isInteger(game.teamSize) || game.teamSize < 1)) {
    throw new Error(`Invalid team size: ${game.id}`)
  }
  for (const text of [
    ...(game.roles ?? []),
    game.developmentDuration,
    game.developmentPeriod,
    game.engine,
    game.classification,
    game.status,
    ...(game.languages ?? []),
    ...(game.personalContributions ?? []),
    ...(game.teamContributions ?? []),
  ]) {
    if (text !== undefined && !text.trim()) throw new Error(`Empty game metadata: ${game.id}`)
  }
  for (const media of game.media) {
    if (!media.url.trim() || !media.alt.trim() || (media.kind === 'trailer' && !/^[\w-]{11}$/.test(media.videoId))) {
      throw new Error(`Invalid game media: ${game.id}`)
    }
  }
  ids.add(game.id)
  let url: URL
  try {
    url = new URL(game.playUrl)
  } catch {
    throw new Error(`Invalid itch.io URL for game: ${game.id}`)
  }
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.itch.io')) {
    throw new Error(`Expected an HTTPS itch.io URL for game: ${game.id}`)
  }
  if (game.sourceUrl !== undefined) {
    let source: URL
    try {
      source = new URL(game.sourceUrl)
    } catch {
      throw new Error(`Invalid source URL for game: ${game.id}`)
    }
    if (source.protocol !== 'https:' || source.username || source.password) {
      throw new Error(`Expected a public HTTPS source URL for game: ${game.id}`)
    }
  }
  if (game.emissiveRotation !== undefined && game.emissiveRotation !== 0 && game.emissiveRotation !== 180) {
    throw new Error(`Invalid emissive rotation for game: ${game.id}`)
  }
}
