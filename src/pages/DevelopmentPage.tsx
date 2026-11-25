import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import greetingStrip from '../assets/figma/greeting-strip.svg'
import kontextoCover from '../assets/games/covers/kontexto.png'
import purgatoryoCover from '../assets/games/covers/purgatoryo.jpg'
import { AniiGallery } from '../components/AniiGallery'
import { GameDevArtwork } from '../components/GameDevArtwork'
import { H1 } from '../components/H1'
import { H2 } from '../components/H2'
import { H3 } from '../components/H3'
import { technicalBreakdownsAscii, technicalBreakdownsShortAscii } from '../data/heading-artwork'
import { breakdownHref, breakdowns } from '../lib/technical-breakdowns'

const asciiDigits = [
  ['  ___ ', ' / _ \\', '/ // /', '\\___/ '], [' __', '<  /', '/ / ', '/_/ '],
  [' ___ ', '|_  )', ' / / ', '/___|'], [' ____', '|__ /', ' |_ \\', '|___/'],
  [' _ _  ', '| | | ', '|_  _|', '  |_| '], [' ___ ', '| __|', '|__ \\', '|___/'],
  ['  __ ', ' / / ', '/ _ \\', '\\___/'], [' ____', '|__  |', '  / / ', ' /_/  '],
  [' ___ ', '( _ )', '/ _ \\', '\\___/'], [' ___ ', '/ _ \\', '\\_, /', ' /_/ '],
]

function technicalBreakdownNumber(index: number): string {
  const digits = String(index + 1).padStart(2, '0').split('').map((digit) => asciiDigits[Number(digit)])
  return [0, 1, 2, 3].map((row) => digits.map((digit) => digit[row].padEnd(Math.max(...digit.map((line) => line.length)))).join('')).join('\n')
}

function articleSlug(): string | undefined {
  const basePath = new URL(import.meta.env.BASE_URL, window.location.origin).pathname
  const path = window.location.pathname.slice(basePath.length).replace(/\/+$/, '')
  return /^(?:game-dev|development)\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:\/index\.html)?$/.exec(path)?.[1]
}

export function DevelopmentPage() {
  const slug = articleSlug()
  const study = slug ? breakdowns.find((entry) => entry.slug === (slug === 'kontexto-task-system-refactor' ? 'kontexto' : slug)) : undefined

  if (slug && !study) {
    return <main className="development-page"><H1 id="technical-breakdown-not-found" label="[ Technical breakdown not found ]" /><a href={`${import.meta.env.BASE_URL}game-dev/`}>{'< Back to Game Dev'}</a></main>
  }

  if (study) {
    const cover = study.cover ? study.assets[study.cover] : undefined
    return (
      <main className="development-page">
        <article className="technical-breakdown">
          <a className="development-back" href={`${import.meta.env.BASE_URL}game-dev/`}>{'< Back to Game Dev'}</a>
          <header className="technical-breakdown-header">
            <p className="development-eyebrow">[ Technical Breakdown ]</p>
            <H1 id="technical-breakdown-title" label={study.title} />
            <p className="technical-breakdown-deck">{study.description}</p>
          </header>
          {cover && <img className="technical-breakdown-cover" src={cover} alt="" />}
          <div className="technical-breakdown-body">
            <Markdown remarkPlugins={[remarkGfm]} components={{
              h1: ({ children, id }) => <H2 id={id} label={children} />,
              h2: ({ children, id }) => <H2 id={id} label={children} />,
              h3: ({ children, id }) => <H3 id={id} label={children} />,
              img: ({ src, alt }) => <img src={src && study.assets[src] ? study.assets[src] : src} alt={alt ?? ''} loading="lazy" />,
              a: ({ href, children }) => <a href={href && study.assets[href] ? study.assets[href] : href}>{children}</a>,
            }}>{study.body}</Markdown>
          </div>
          <a className="development-back development-end" href={`${import.meta.env.BASE_URL}game-dev/`}>{'< Back to Game Dev'}</a>
        </article>
      </main>
    )
  }

  return (
    <main className="development-page">
      <header className="game-dev-intro">
        <H1 id="game-dev" label="[ Game Dev ]" artwork={<GameDevArtwork />} />
        <p>I build indie games, game jam projects, and commissioned experiences, working across gameplay systems, custom editor tools, UI, and build delivery.</p>
        <dl className="game-dev-skills">
          <div><dt>Game Engines</dt><dd>Unity / Godot / UE5</dd></div>
          <div><dt>Core Languages</dt><dd>C# / Python / GDScript</dd></div>
        </dl>
      </header>
      <div aria-hidden="true" className="game-dev-divider"><img src={greetingStrip} alt="" width={1152} height={12} /></div>
      <section className="featured-game" aria-labelledby="featured-game-heading">
        <H2 id="featured-game-heading" label="[ Featured Game ]" />
        <H3 label="Anii! Grow to Know" />
        <div className="featured-game-grid">
          <div className="featured-media">
            <div className="featured-trailer"><iframe src="https://www.youtube-nocookie.com/embed/xJZeUs_QqVA" title="Anii! Grow to Know trailer" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>
            <AniiGallery />
          </div>
          <div className="featured-copy">
            <p>What if gardening wasn’t just about planting—what if it was about learning too? Anii! Grow to Know is an educational farming simulator that combines fun and learning.</p>
            <p>Plant crops, take quizzes, and decorate your garden as you grow both your harvest and your knowledge. Learn about Filipino <em>Bahay Kubo</em> crops and discover the tools used in agriculture.</p>
            <p>Grow and harvest six crops, unlock new plots, and personalize your garden as you progress.</p>
            <p>Created by student developers from West Visayas State University under Ukiyo Studios.</p>
            <a href="https://kirubiisfyne.itch.io/anii-grow-to-know" target="_blank" rel="noopener noreferrer">View Anii on itch.io &gt;</a>
          </div>
        </div>
      </section>
      <section className="development-list" aria-labelledby="technical-breakdowns-heading">
        <H2 id="technical-breakdowns-heading" label="[ Technical Breakdowns ]" artwork={
          <div className="plain-ascii-scroll breakdown-ascii" aria-hidden="true">
            <pre className="breakdown-ascii-full"><span>{technicalBreakdownsAscii}</span></pre>
            <pre className="breakdown-ascii-short"><span>{technicalBreakdownsShortAscii}</span></pre>
          </div>
        } />
        <p className="development-description">Technical breakdowns of the systems, decisions, and debugging behind the work.</p>
        {breakdowns.length === 0 ? <p className="development-empty">Technical breakdowns are coming soon.</p> : (
          <ol className="technical-breakdown-list">
            {breakdowns.map((entry, index) => {
              const cover = entry.cover ? entry.assets[entry.cover] : undefined
              return (
                <li key={entry.slug}>
                  <a className="technical-breakdown-card" href={breakdownHref(entry.slug)}>
                    {cover && <img className="technical-breakdown-card-image" src={cover} alt="" loading="lazy" />}
                    <div className="technical-breakdown-card-info">
                      <div className="technical-breakdown-number" aria-hidden="true"><pre>{technicalBreakdownNumber(index)}</pre></div>
                      <div className="technical-breakdown-card-copy">
                        <div className="technical-breakdown-card-heading"><span>[ Technical Breakdown ]</span><H3 className="technical-breakdown-card-title" label={entry.title} /></div>
                        <span className="technical-breakdown-card-description"><span aria-hidden="true">&gt; </span>{entry.description}</span>
                      </div>
                    </div>
                  </a>
                </li>
              )
            })}
          </ol>
        )}
      </section>
      <section className="other-games" aria-labelledby="other-games-heading">
        <H2 id="other-games-heading" label="[ Other Games ]" />
        <div className="other-games-grid">
          <a href="https://kirubiisfyne.itch.io/kontexto" target="_blank" rel="noopener noreferrer"><img src={kontextoCover} alt="" loading="lazy" /><H3 label="KonTEXTo" /><p>A narrative-driven editing simulator: complete print jobs, chat with quirky NPCs, and achieve the perfect score.</p><span>View on itch.io &gt;</span></a>
          <a href="https://kirubiisfyne.itch.io/purgatoryo" target="_blank" rel="noopener noreferrer"><img src={purgatoryoCover} alt="" loading="lazy" /><H3 label="Purgatoryo [Beta]" /><p>A submission for a local game jam.</p><span>View on itch.io &gt;</span></a>
        </div>
      </section>
    </main>
  )
}
