import artArtwork from '../assets/figma/art-ascii.svg'
import greeting from '../assets/figma/greeting.svg'
import greetingStrip from '../assets/figma/greeting-strip.svg'
import projectsArtwork from '../assets/figma/projects-ascii.svg'
import wordmark from '../assets/figma/wordmark.svg'
import { Art2DShowcase } from '../components/Art2DShowcase'
import { ConnectSection } from '../components/ConnectSection'
import { GameShowcase } from '../components/GameShowcase'
import { H1 } from '../components/H1'
import { H2 } from '../components/H2'
import { ProjectCarousel } from '../components/ProjectCarousel'
import { SkillsSection } from '../components/SkillsSection'
import { projects } from '../data/projects'
import { artDescription, introduction } from '../data/site-copy'

export function PortfolioPage() {
  return (
    <>
      <a className="skip-link" href="#projects">
        Skip to projects
      </a>
      <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-[20px] p-[20px] sm:p-[40px] lg:p-[64px]">
        <header className="flex flex-col items-start gap-[8px]">
          <img src={greeting} alt="Hi! Kirby Bilbao, greeting you!" width={248} height={12} />
          <img src={wordmark} alt="kirubiisfyne" width={581} height={49} className="h-auto w-full max-w-[580.34px]" />
          <h1 className="hero-title">[ Game Developer &amp; Artist ]</h1>
          <p className="w-full max-w-[574px]">{introduction}</p>
        </header>
        <div aria-hidden="true" className="h-[12px] w-full overflow-hidden">
          <img src={greetingStrip} alt="" width={1152} height={12} className="h-[12px] w-[1152px] max-w-none" />
        </div>
        <H1 id="projects" label="[ PROJECTS ]" artworkSrc={projectsArtwork} level={2} />
        <GameShowcase />
        <section aria-labelledby="art" className="flex flex-col gap-[20px]">
          <H2 id="art" label="[ 3D Art ]" artworkSrc={artArtwork} description={artDescription} />
          <ProjectCarousel projects={projects} />
        </section>
        <Art2DShowcase />
        <SkillsSection />
      </main>
      <ConnectSection />
    </>
  )
}
