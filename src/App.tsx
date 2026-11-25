import { lazy, Suspense, useEffect } from 'react'
import { ConnectSection } from './components/ConnectSection'
import { MetaballBackground } from './components/MetaballBackground'
import { currentPage, SiteHeader } from './components/SiteHeader'
import { PortfolioPage } from './pages/PortfolioPage'

const DevelopmentPage = lazy(() => import('./pages/DevelopmentPage').then((module) => ({ default: module.DevelopmentPage })))

export function App() {
  const page = currentPage()
  useEffect(() => {
    const basePath = new URL(import.meta.env.BASE_URL, window.location.origin).pathname
    const relativePath = window.location.pathname.slice(basePath.length)
    if (/^development(?:\/|$)/.test(relativePath)) {
      window.location.replace(`${basePath}${relativePath.replace(/^development/, 'game-dev')}${window.location.search}${window.location.hash}`)
    }
  }, [])

  return (
    <>
      <MetaballBackground />
      <SiteHeader page={page} />
      {page === 'game-dev' ? <Suspense fallback={<main className="site-placeholder">Loading Game Dev…</main>}><DevelopmentPage /></Suspense> : page === '3d-art' || page === 'graphic-design' ? <main className="site-placeholder"><h1>{page === '3d-art' ? '[ 3D Art ]' : '[ Graphic Design ]'}</h1></main> : <PortfolioPage />}
      <ConnectSection />
    </>
  )
}
