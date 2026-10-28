# Project Context

- Implemented feature: `specs/001-react-portfolio/`; read its spec, component contracts, and verification record before changes.
- Stack: React 19.3.1, strict TypeScript 7.0.2, Vite 8.3.5, Tailwind CSS 4.3.3 through its Vite plugin; npm with `package-lock.json`.
- Commands: `npm ci`, `npm run dev`, `npm run typecheck`, `npm run build`, `npm run preview`.
- `H1`, `H2`, and `ProjectCarousel` were built and independently browser-verified before `PortfolioPage` composition. No permanent component gallery/test framework exists.
- Figma file: `8Qb17gg8m0JsxFuEScxxsG`; main frame `1:2`. Original artwork is in `src/assets/figma/`; MS W98 UI lettering uses outlined exports, not an unverified font dependency.
- Keep `ascii-metaballs.js` unchanged unless explicitly changing the effect. `MetaballBackground` owns one cleanup-returning effect; no inline/second mounting path remains. Keep body isolation and transparent foreground wrappers.
- Preserve the effect's blue base, light glyphs, pointer response, reduced-motion behavior, and the design's local highlight bars. Production ships only the supplied axe project; do not invent work.
- Carousel input is a static readonly collection per instance. Zero/one item disables navigation; multiple items wrap. Animation remains outside React state.
- Browser evidence and exercised scenarios: `specs/001-react-portfolio/quickstart.md`. No automated permanent suite was added; type-check/build and actual desktop/mobile preview were verified.
- Constitution is an unfilled template, not adopted governance. No agent-context updater script exists; this file is maintained directly.
