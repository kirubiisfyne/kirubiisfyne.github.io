type Page = 'overview' | 'game-dev' | '3d-art' | 'graphic-design'

const base = import.meta.env.BASE_URL
const pages: readonly { id: Page; label: string; href: string }[] = [
  { id: 'overview', label: 'Overview', href: base },
  { id: 'game-dev', label: 'Game Dev', href: `${base}game-dev/` },
  { id: '3d-art', label: '3D Art', href: `${base}3d-art/` },
  { id: 'graphic-design', label: 'Graphic Design', href: `${base}graphic-design/` },
]

export function currentPage(): Page {
  const path = window.location.pathname.replace(/\/+$/, '')
  const basePath = new URL(base, window.location.origin).pathname.replace(/\/+$/, '')
  const relativePath = path.startsWith(`${basePath}/`) ? path.slice(basePath.length) : ''
  if (relativePath === '/game-dev' || relativePath.startsWith('/game-dev/') || relativePath === '/development' || relativePath.startsWith('/development/')) return 'game-dev'
  if (relativePath === '/3d-art' || relativePath === '/3d-art/index.html') return '3d-art'
  if (relativePath === '/graphic-design' || relativePath === '/graphic-design/index.html' || relativePath === '/gallery' || relativePath === '/gallery/index.html') return 'graphic-design'
  return 'overview'
}

export function SiteHeader({ page }: { page: Page }) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a className="site-brand" href={base}>[ kirubiisfyne ]</a>
        <nav className="site-navigation" aria-label="Main navigation">
          {pages.map(({ id, label, href }) => (
            <a key={id} href={href} aria-current={page === id ? 'page' : undefined}>
              {label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}
