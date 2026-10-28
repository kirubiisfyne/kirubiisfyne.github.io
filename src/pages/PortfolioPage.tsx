import { H1 } from '../components/H1';
import { H2 } from '../components/H2';
import { ProjectCarousel } from '../components/ProjectCarousel';
import { projects } from '../data/projects';
import wordmark from '../assets/figma/wordmark.svg';
import greeting from '../assets/figma/greeting.svg';
import greetingStrip from '../assets/figma/greeting-strip.svg';
import projectsArtwork from '../assets/figma/projects-ascii.svg';
import artArtwork from '../assets/figma/art-ascii.svg';

const introduction = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';

export function PortfolioPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-[20px] p-[20px] sm:p-[40px] lg:p-[64px]">
      <header className="flex flex-col items-start gap-[8px]">
        <img src={greeting} alt="Hi! Kirby Bilbao, Greeting you!" width={248} height={12} />
        <img
          src={wordmark}
          alt="kirubiisfyne"
          width={581}
          height={49}
          className="h-auto w-full max-w-[580.34px]"
        />
        <p className="min-h-[48px] w-full max-w-[574px]">{introduction}</p>
      </header>
      <div aria-hidden="true" className="h-[12px] w-full overflow-hidden">
        <img src={greetingStrip} alt="" width={1152} height={12} className="h-[12px] w-[1152px] max-w-none" />
      </div>
      <H1 id="projects" label="[ PROJECTS ]" artworkSrc={projectsArtwork} />
      <section aria-labelledby="art" className="flex flex-col gap-[20px]">
        <H2 id="art" label="[ 3D Art ]" artworkSrc={artArtwork} description={introduction} />
        <ProjectCarousel projects={projects} />
      </section>
    </main>
  );
}
