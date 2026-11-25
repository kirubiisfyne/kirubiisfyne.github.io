import { galleryAscii } from '../data/heading-artwork'

export function GalleryPage() {
  return (
    <main className="site-placeholder gallery-page">
      <div className="plain-ascii-scroll" tabIndex={0} role="region" aria-label="Gallery ASCII artwork; scroll horizontally if needed">
        <pre aria-hidden="true">{galleryAscii}</pre>
      </div>
      <h1 id="gallery">[ Gallery ]</h1>
      <p>3D assets, renders, and 2D art are coming soon.</p>
    </main>
  )
}
