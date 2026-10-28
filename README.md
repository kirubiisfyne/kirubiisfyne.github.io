# kirubiisfyne portfolio

React + TypeScript + Tailwind CSS implementation of the Figma “MacBook Air - 1” frame, with the original animated ASCII metaball background.

## Run

Requires Node 22.12+ (or a supported newer release) and npm. Verified locally with Node 26.3.0 and npm 11.16.0.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite.

## Verify and build

```sh
npm run typecheck
npm run build
npm run preview
```

The production output is `dist/`. Build does not run type-checking automatically; run both commands above.

## Structure

- `src/components/H1.tsx`, `H2.tsx`, `ProjectCarousel.tsx`: reusable typed components, built and browser-verified before page composition.
- `src/pages/PortfolioPage.tsx`: reference layout, content, and responsive adaptation.
- `src/data/projects.ts`: readonly project collection; ships only `practice_axe.fbx`. Navigation is disabled for one item and wraps for multiple items.
- `src/assets/figma/`: original exported artwork. Fixed custom lettering uses outlined SVG; readable text remains available to assistive technology. JetBrains Mono is locally bundled.
- `ascii-metaballs.js`: existing renderer, unchanged. `MetaballBackground` mounts it once and returns its cleanup function; reduced-motion preferences retain the original static treatment.

The existing blue base and glyph palette are preserved. Foreground page wrappers are transparent; the design's local highlight bars remain. Reference descriptions intentionally retain the supplied Figma copy.

[Implementation tasks](specs/001-react-portfolio/tasks.md) · [Verification record and screenshots](specs/001-react-portfolio/quickstart.md) · [Figma source](https://www.figma.com/design/8Qb17gg8m0JsxFuEScxxsG/Untitled?node-id=1-2)
