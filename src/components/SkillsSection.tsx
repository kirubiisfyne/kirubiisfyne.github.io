import { useEffect, useRef } from 'react'
import { skillGroups } from '../data/skills'
import { mountAsciiShimmer } from '../lib/ascii-shimmer'
import { creativeStackDescription, techStackDescription } from '../data/site-copy'

const headingArtwork = [" ______   __  __   __   __       __       ______    \n/\\  ___\\ /\\ \\/ /  /\\ \\ /\\ \\     /\\ \\     /\\  ___\\   \n\\ \\___  \\\\ \\  _\"-.\\ \\ \\\\ \\ \\____\\ \\ \\____\\ \\___  \\  \n \\/\\_____\\\\ \\_\\ \\_\\\\ \\_\\\\ \\_____\\\\ \\_____\\\\/\\_____\\ \n  \\/_____/ \\/_/\\/_/ \\/_/ \\/_____/ \\/_____/ \\/_____/ \n                                                    "," ______           __     ____ __              __  \n/_  __/___  ____ / /    / __// /_ ___ _ ____ / /__\n / /  / -_)/ __// _ \\  _\\ \\ / __// _ `// __//  '_/\n/_/   \\__/ \\__//_//_/ /___/ \\__/ \\_,_/ \\__//_/\\_\\ ","  _____                 __   _                  __              __  \n / ___/____ ___  ___ _ / /_ (_)_  __ ___   ___ / /_ ___ _ ____ / /__\n/ /__ / __// -_)/ _ `// __// /| |/ // -_) (_-</ __// _ `// __//  '_/\n\\___//_/   \\__/ \\_,_/ \\__//_/ |___/ \\__/ /___/\\__/ \\_,_/ \\__//_/\\_\\ \n                                                                    "] as const

function SkillGroup({ group }: { readonly group: (typeof skillGroups)[number] }) {
  return (
    <section className="skill-group" aria-label={group.title}>
      <h4 className="skill-group-title">[ {group.title} ]</h4>
      <ul className="skill-list">
        {group.items.map((skill) => (
          <li className="skill-item" key={skill.name}>
            <pre className="skill-art" aria-hidden="true">{skill.art}</pre>
            <span className="skill-name">[ {skill.name} ]</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function SkillsSection() {
  const section = useRef<HTMLElement>(null)

  useEffect(() => {
    if (section.current) return mountAsciiShimmer(section.current)
  }, [])

  return (
    <section ref={section} className="skills-section" aria-labelledby="skills-heading">
      <header className="skills-main-heading">
        <div className="skills-heading-art" aria-hidden="true"><pre>{headingArtwork[0]}</pre></div>
        <h2 id="skills-heading">[ SKILLS ]</h2>
      </header>
      <section className="skills-category" aria-labelledby="tech-stack-heading">
        <header className="skills-category-heading">
          <div className="skills-category-art" aria-hidden="true"><pre>{headingArtwork[1]}{'\n '}</pre></div>
          <h3 id="tech-stack-heading">[ Tech Stack ]</h3>
          <p>{techStackDescription}</p>
        </header>
        {skillGroups.slice(0, 4).map((group) => <SkillGroup key={group.title} group={group} />)}
      </section>
      <section className="skills-category" aria-labelledby="art-stack-heading">
        <header className="skills-category-heading">
          <div className="skills-category-art creative" aria-hidden="true"><pre>{headingArtwork[2]}</pre></div>
          <h3 id="art-stack-heading">[ Creative Stack ]</h3>
          <p>{creativeStackDescription}</p>
        </header>
        {skillGroups.slice(4).map((group) => <SkillGroup key={group.title} group={group} />)}
      </section>
    </section>
  )
}
