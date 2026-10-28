import { useState } from 'react';
import type { Project } from '../types/project';
import previousArrow from '../assets/figma/previous.svg';
import nextArrow from '../assets/figma/next.svg';

interface ProjectCarouselProps {
  readonly projects: readonly Project[];
}

export function ProjectCarousel({ projects }: ProjectCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const project = projects[activeIndex];
  const canNavigate = projects.length > 1;

  function navigate(direction: number) {
    if (!canNavigate) return;
    setActiveIndex(index => (index + direction + projects.length) % projects.length);
  }

  return (
    <section
      aria-label="Projects"
      className="grid w-full grid-cols-[32px_minmax(0,732px)_32px] items-center justify-center gap-[12px] text-center text-white md:grid-cols-[44px_minmax(0,732px)_44px] md:gap-[32px]"
    >
      <button
        type="button"
        aria-label="Previous project"
        disabled={!canNavigate}
        onClick={() => navigate(-1)}
        className="flex min-h-[44px] w-full items-center justify-center enabled:cursor-pointer"
      >
        <img src={previousArrow} alt="" width={44} height={62} className="w-full" />
      </button>
      {project ? (
        <figure className="min-w-0 self-start">
          <div className="relative aspect-[732/574] w-full">
            <h3 className="absolute inset-x-0 top-0 flex h-[18px] items-center justify-center">
              <span className="sr-only">{project.title}</span>
              <img src={project.titleImageSrc} alt="" className="h-[12px] max-w-full" />
            </h3>
            <img
              src={project.imageSrc}
              alt={project.imageAlt}
              width={1080}
              height={1920}
              className="absolute top-[1.852%] left-[24.34%] aspect-[321.04/570.74] w-[43.858%] object-cover"
            />
          </div>
          <figcaption className="min-h-[18px] text-[12px] leading-[16px]">
            {project.description}
          </figcaption>
        </figure>
      ) : <div />}
      <button
        type="button"
        aria-label="Next project"
        disabled={!canNavigate}
        onClick={() => navigate(1)}
        className="flex min-h-[44px] w-full items-center justify-center enabled:cursor-pointer"
      >
        <img src={nextArrow} alt="" width={44} height={62} className="w-full" />
      </button>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {project ? `${activeIndex + 1} of ${projects.length}: ${project.title}` : ''}
      </p>
    </section>
  );
}
