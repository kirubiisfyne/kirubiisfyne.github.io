import { useEffect, useRef } from 'react'
import { skillGroups } from '../data/skills'
import { mountSkillConveyors } from '../lib/ascii-shimmer'
import { creativeStackDescription, techStackDescription } from '../data/site-copy'

const headingArtwork = [" ______   __  __   __   __       __       ______    \n/\\  ___\\ /\\ \\/ /  /\\ \\ /\\ \\     /\\ \\     /\\  ___\\   \n\\ \\___  \\\\ \\  _\"-.\\ \\ \\\\ \\ \\____\\ \\ \\____\\ \\___  \\  \n \\/\\_____\\\\ \\_\\ \\_\\\\ \\_\\\\ \\_____\\\\ \\_____\\\\/\\_____\\ \n  \\/_____/ \\/_/\\/_/ \\/_/ \\/_____/ \\/_____/ \\/_____/ \n                                                    "," ______           __     ____ __              __  \n/_  __/___  ____ / /    / __// /_ ___ _ ____ / /__\n / /  / -_)/ __// _ \\  _\\ \\ / __// _ `// __//  '_/\n/_/   \\__/ \\__//_//_/ /___/ \\__/ \\_,_/ \\__//_/\\_\\ ","  _____                 __   _                  __              __  \n / ___/____ ___  ___ _ / /_ (_)_  __ ___   ___ / /_ ___ _ ____ / /__\n/ /__ / __// -_)/ _ `// __// /| |/ // -_) (_-</ __// _ `// __//  '_/\n\\___//_/   \\__/ \\_,_/ \\__//_/ |___/ \\__/ /___/\\__/ \\_,_/ \\__//_/\\_\\ \n                                                                    "] as const

function SkillConveyor({ groups, label }: { readonly groups: readonly (typeof skillGroups)[number][]; readonly label: string }) {
  return (
    <>
      <ul className="visually-hidden">
        {groups.flatMap((group) => group.items.map((skill) => (
          <li key={`${group.title}-${skill.name}`}>{skill.name} — {group.title}</li>
        )))}
      </ul>
      <div className="skill-viewport" role="region" tabIndex={0} aria-label={`${label} skills conveyor, moving`} aria-describedby="skill-conveyor-help" data-label={label} title="Drag to scroll. Tap or press Space to pause or resume; use arrow keys to move.">
        <div className="skill-track" aria-hidden="true">
          <div className="skill-cycle">
            {groups.flatMap((group) => group.items.map((skill) => (
              <div className="skill-item" key={`${group.title}-${skill.name}`}>
                <pre className="skill-art">{skill.art}</pre>
                <span className="skill-name">[ {skill.name} ]</span>
              </div>
            )))}
          </div>
        </div>
      </div>
    </>
  )
}

export function SkillsSection() {
  const section = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!section.current) return
    const mounted = mountSkillConveyors(section.current)
    return () => mounted.dispose()
  }, [])

  return (
    <section ref={section} className="skills-section" aria-labelledby="skills-heading">
      <header className="skills-main-heading">
        <div className="skills-heading-art" aria-hidden="true"><pre>{headingArtwork[0]}</pre></div>
        <h2 id="skills-heading">[ SKILLS ]</h2>
      </header>
      <p id="skill-conveyor-help" className="visually-hidden">Drag to scroll. Tap or press Space to pause or resume. Use left and right arrow keys to move.</p>
      <section className="skills-category" aria-labelledby="tech-stack-heading">
        <header className="skills-category-heading">
          <div className="skills-category-art" aria-hidden="true"><pre>{headingArtwork[1]}{'\n '}</pre></div>
          <h3 id="tech-stack-heading">[ Tech Stack ]</h3>
          <p>{techStackDescription}</p>
        </header>
        <SkillConveyor groups={skillGroups.slice(0, 4)} label="Tech Stack" />
      </section>
      <section className="skills-category" aria-labelledby="art-stack-heading">
        <header className="skills-category-heading">
          <div className="skills-category-art creative" aria-hidden="true"><pre>{headingArtwork[2]}</pre></div>
          <h3 id="art-stack-heading">[ Creative Stack ]</h3>
          <p>{creativeStackDescription}</p>
        </header>
        <SkillConveyor groups={skillGroups.slice(4)} label="Creative Stack" />
      </section>
    </section>
  )
}
