# Research: Component-First Portfolio

## Stack and build

- **Decision**: React 19.3.1, TypeScript 7.0.2, Vite 8.3.5, Tailwind CSS 4.3.3; npm lockfile. These versions were returned by `npm view <package> version` on 2026-10-28, not installed or compatibility-tested during planning.
- **Rationale**: One client-only page needs no server framework. Add configuration manually to preserve this nonempty project. Tailwind's current integration is `@tailwindcss/vite` plus `@import "tailwindcss"`; do not introduce a legacy Tailwind/PostCSS setup.
- **Alternatives**: Next.js adds unused routing/server concerns; a carousel package adds unnecessary weight for two buttons and an index.
- **Sources**: [Vite guide](https://vite.dev/guide/), [Tailwind Vite setup](https://tailwindcss.com/docs/installation/using-vite).

## Existing JavaScript renderer

- **Decision**: Keep `ascii-metaballs.js`; use TS `allowJs: true`, `checkJs: false`, and `noEmit: true`. Import it from a small effect-only `MetaballBackground` component and return its disposer.
- **Rationale**: The module already owns pointer/resize/visibility listeners, reduced motion, animation scheduling, and idempotent cleanup. It needs an isolated body and must not be inside transformed wrappers. React state must not drive its animation.
- **Alternatives**: A TypeScript rewrite or replacement effect risks changing the requested background without delivering requested UI value. A second inline mount would duplicate the canvas.
- **Sources**: [TypeScript allowJs](https://www.typescriptlang.org/tsconfig/allowJs.html), existing renderer lines 28–46 and 166–208.

## Design assets and typography

- **Decision**: Use real Figma assets; self-host JetBrains Mono 400 through `@fontsource/jetbrains-mono` 5.3.0. Use outlined SVG for fixed MS W98 UI lettering, with equivalent native/screen-reader text. Do not claim an MS W98 UI webfont is available or substitute a different font silently.
- **Rationale**: Figma MCP confirmed the original nodes. Exporting title node `11:27` produced a 154 × 12 SVG containing paths, demonstrating that the custom lettering can be preserved without shipping its font. The reference screenshot confirms the ASCII artwork's light highlight bars are intentional and must remain.
- **Alternatives**: A screenshot of the whole page prevents responsive, semantic components. Reconstructed artwork and substitute fonts would reduce fidelity. A licensed font file was not supplied.
- **Sources**: [Figma file](https://www.figma.com/design/8Qb17gg8m0JsxFuEScxxsG/Untitled?node-id=0-1), [Fontsource](https://fontsource.org/fonts/jetbrains-mono/use), [exported title](../../src/assets/figma/project-title.svg), [reference frame](design/main-page.png).

### Export manifest for implementation

File key: `8Qb17gg8m0JsxFuEScxxsG`. SVG exports preserve artwork as vectors; the project image uses its image fill.

| Asset | Node | Handling |
| --- | --- | --- |
| Main-page reference | `1:2` | Already exported to `design/main-page.png`; documentation only |
| Wordmark | `1:4` | SVG; preserve 580.34 × 48.84 reference proportions |
| Greeting | `3:22` | Outlined SVG group; equivalent readable greeting text |
| Repeated greeting strip | `3:21` | Outlined SVG group; scale/clip decoration within page width |
| Projects ASCII frame | `3:83` | SVG; preserve its light fill and 504 × 48 frame |
| 3D Art ASCII frame | `8:2` | SVG; preserve its light fill and 32-pixel frame height |
| Previous control | `11:38` | SVG inside native button |
| Next control | `11:36` | SVG inside native button; preserve source direction/transforms |
| Project title | `11:27` | Exported and moved to `src/assets/figma/project-title.svg`; consumed by project content |
| Axe render | `11:24` | Download imageRef `40331509126c44f331df7fa91a5ada83ae520a36`; displayed reference box 321.04 × 570.74, cover crop |

Do not bake the page background into any exported foreground component. Export artwork, not the entire H1/H2/carousel with their content.

## Component and layout decisions

- **Decision**: Build `H1`, `H2`, and `ProjectCarousel` first, independently verify them with a temporary harness, then compose `PortfolioPage`. Heading props carry readable labels and artwork; project state is one active index over static typed content.
- **Rationale**: This enforces the user's requested order and prevents page-specific positioning from becoming a component dependency. Use the design's actual hierarchy and no generic component factory.
- **Alternatives**: Building the page first and extracting components later contradicts the requested sequence. A permanent component gallery/Storybook is unnecessary scope.
- **Visual direction**: Reference blue base, light/white foreground, native dark glyphs on highlight bars; ASCII wordmark/headings remain the focal treatment. Header stays left-aligned, sections centered. Match source spacing at 1280 pixels, reduce padding and scale artwork on mobile. No new palette, cards, decorative motion, or redesign.

## Carousel defaults and verification

- **Decision**: Native buttons, no autoplay, wrap in both directions for two or more items, disabled buttons for zero/one, omitted card for zero. Preserve real project title, artwork, and description together. Temporary multi-project data exists only for verification.
- **Rationale**: These match the specification and keep navigation accessible without inventing production work.
- **Alternatives**: Auto-advancing slides and drag gestures are unrequested behavior. Duplicating the supplied project would not prove selection correctness.
- **Verification**: Direct component/page browser checks; type-check/build after implementation. No permanent test framework is required by this feature.

## Context and hooks

The constitution remains an unfilled template. No extension hook configuration or agent-context updater script exists in the installed scaffold. Update `AGENTS.md` directly with concise feature context; do not claim an absent script ran.
