import { professionalLinks, resumeFilename, resumeUrl } from '../data/contact'

const socialLinks = [
  { label: 'Facebook', href: 'https://facebook.com/kirby.bilbao' },
  { label: 'Instagram', href: 'https://www.instagram.com/kirubiisfyne/' },
]

function LinkGroup({ links }: { links: readonly { label: string; href: string; download?: string }[] }) {
  return (
    <ul className="connect-links">
      {links.map(({ label, href, download }) => (
        <li key={label}>
          <span aria-hidden="true">&gt;</span>
          <a href={href} download={download}>
            [ {label} ]
          </a>
        </li>
      ))}
    </ul>
  )
}

export function ConnectSection() {
  return (
    <footer className="connect-section">
      <div className="connect-inner">
        <div className="connect-intro">
          <h2 id="connect-heading" className="connect-heading">
            <span className="sr-only">Connect</span>
            <pre aria-hidden="true">{String.raw`  _____                       __
 / ___/__  ___  ___  ___ ____/ /_
/ /__/ _ \/ _ \/ _ \/ -_) __/ __/
\___/\___/_//_/_//_/\__/\__/\__/`}</pre>
          </h2>
          <p className="connect-availability">[ Open for internships and commissions ]</p>
        </div>
        <div className="connect-top">
          <nav className="connect-navigation" aria-label="Connect links">
            <LinkGroup links={professionalLinks} />
            <LinkGroup links={socialLinks} />
            <LinkGroup links={[{ label: 'CV / Resume', href: resumeUrl, download: resumeFilename }]} />
          </nav>
          <p className="connect-copyright">Kirby Bilbao ( C ) 2026</p>
        </div>
      </div>
    </footer>
  )
}
