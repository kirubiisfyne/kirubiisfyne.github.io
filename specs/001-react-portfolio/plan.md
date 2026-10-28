# Implementation Plan: React Portfolio Main Page

**Feature**: `001-react-portfolio` | **Date**: 2026-10-28 | **Spec**: [spec.md](spec.md)

**Branch**: Setup reports `001-react-portfolio` as the feature context; no Git branch was created by this workflow.

**Input**: Build the components first with React, TypeScript, and Tailwind CSS; then construct “MacBook Air - 1.”

## Summary

Add Vite tooling to the existing project without replacing its files. Build and independently verify `H1`, `H2`, and `ProjectCarousel` before composing the main page. Retain `ascii-metaballs.js` unchanged and mount it through React's effect lifecycle.

**Execution status**: Implemented; completed tasks and observed verification are recorded in [tasks.md](tasks.md) and [quickstart.md](quickstart.md). Planning decisions below remain as the design record.

## Technical Context

**Language/Version**: TypeScript 7.0.2, strict mode; preserve the existing JavaScript renderer.

**Primary Dependencies**: React/React DOM 19.3.1, Vite 8.3.5, Tailwind CSS 4.3.3 with `@tailwindcss/vite`, `@vitejs/plugin-react`, matching React types, and `@fontsource/jetbrains-mono` 5.3.0. Record resolved compatible versions in `package-lock.json`.

**Toolchain**: npm; local Node 26.3.0 and npm 11.16.0 observed. Use Node 22.12+ or a supported newer release satisfying dependency engine requirements.

**Storage**: Local typed content and bundled assets; no API, database, or persistence.

**Testing**: Type-check and production build once after implementation; direct browser component and page checks from [quickstart.md](quickstart.md). No existing suite or permanent test framework; use a removable component harness for behavioral edge cases.

**Target Platform**: Modern desktop/mobile browsers; visual checks at 1280 × 832 and 375 × 812.

**Project Type**: Single-page client-rendered portfolio.

**Performance Goals**: One active background canvas/animation loop; animation remains outside React state; no carousel library, router, animation library, or runtime CSS engine.

**Constraints**: Components before page composition; preserve Figma artwork/content and current background palette. No opaque full-page foreground, fabricated projects, or unrelated features.

**Scale/Scope**: Three reusable components, one main page, one supplied project.

## Constitution Check

**Before research**: No adopted constitution exists; the installed file is an unfilled template. Do not infer rules from its examples. Requested scope and existing-code reuse are the gates.

**After design**: Pass. The design reuses the renderer and supplied artwork, isolates carousel state, and introduces only the requested frontend stack plus its build/font dependencies. No governance exception is needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-react-portfolio/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/components.md
├── checklists/requirements.md
└── design/
    └── main-page.png
```

`tasks.md` is produced by `/speckit.tasks`. The PNG is a design reference, not proof of the implemented page; the outlined title SVG now lives in `src/assets/figma/project-title.svg`.

### Source Code (implemented)

```text
ascii-metaballs.js                 # existing; retain unchanged
index.html                        # existing; replace inline mounting with React entry
package.json
package-lock.json
vite.config.ts
tsconfig.json
src/
├── main.tsx
├── App.tsx
├── styles.css
├── components/
│   ├── H1.tsx
│   ├── H2.tsx
│   ├── ProjectCarousel.tsx
│   └── MetaballBackground.tsx
├── pages/PortfolioPage.tsx
├── data/projects.ts
├── types/project.ts
└── assets/figma/
```

**Structure Decision**: Keep a single source tree and direct imports; no backend, shared design-system package, generic heading factory, or global state layer. `App` owns the background and page; component props are defined in [contracts/components.md](contracts/components.md).

## Phase 0 — Research Decisions

See [research.md](research.md) for decisions, sources, and alternatives. Toolchain versions were queried from npm. Figma MCP confirmed the frame and component nodes; a 1280 × 832 reference image and a path-only project-title SVG were exported and inspected. All design choices are resolved; remaining asset exports are implementation actions, not missing user input.

## Phase 1 — Components First

1. **Tooling and assets**: Add npm/Vite configuration manually in this existing directory, not a destructive scaffold. Configure strict TS with `allowJs: true`, `checkJs: false`, and `noEmit: true` to import the existing renderer without a rewrite. Use `react-jsx`, bundler module resolution, and DOM libraries. Configure React and Tailwind Vite plugins; use `@import "tailwindcss"` and a local JetBrains Mono 400 font import. Add `dev`, `typecheck`, `build`, and `preview` scripts.
2. **Reference assets**: Export the wordmark, the two ASCII heading frames, both arrow nodes, greeting group, greeting strip, and project render from Figma. Move the already-exported title SVG into application assets. Use outlined exports for MS W98 UI lettering instead of distributing an unverified font; provide equivalent semantic text. Do not rasterize the entire page or carousel.
3. **H1**: Build a typed component with supplied ASCII artwork, an actual `h1` containing the readable Projects label, and reference spacing. Preserve the artwork's internal highlight fill; only full-page blue fill is replaced.
4. **H2**: Build a separate typed component with supplied ASCII artwork, an actual `h2`, and description. Preserve reference sizing and spacing; allow descriptions to grow at narrow widths.
5. **ProjectCarousel**: Build from a readonly typed project collection. Keep only the active index in local state; derive all visible fields from one selected item. Use native previous/next buttons, descriptive labels, visible focus, wrapping for multiple projects, disabled controls for fewer than two, and no autoplay. Preserve the main card's 732-pixel desktop width and the artwork's proportions; scale at narrow widths.
6. **Component checkpoint**: Use a removable development harness to render the three components independently. Compare headings and carousel against their Figma references; exercise empty, single-item, and multi-item collections with pointer and keyboard input. Complete this before writing main-page composition. Keep harness fixtures out of production content and remove the harness after verification.

## Phase 2 — Main Page After Components

1. Compose `PortfolioPage` from the verified components and the reference header/greeting strip in their existing order. Use the sole supplied project; preserve the reference copy.
2. Match the 1280-pixel reference: 64-pixel outer padding, 1152-pixel content width, 20-pixel main gaps, left-aligned header with 8-pixel gaps, centered section headings, and 32-pixel desktop carousel gaps. Use content-driven vertical height rather than clipping to the 832-pixel frame.
3. Preserve the source's blue `#023FCC`, light `#EBEBEB`, white `#FFFFFF`, and dark highlight lettering. Do not introduce additional palette colors or stylistic redesign. Below desktop width, reduce outer padding/gaps and proportionally shrink artwork/wordmark while retaining readable text and reachable controls.
4. `MetaballBackground` renders no DOM; its one effect calls `mountAsciiMetaballs(document.body)` and returns the existing disposer. Mount it once in `App`. Keep `body` isolated, all page wrappers transparent, and the canvas outside transformed containers. Retain Strict Mode so effect setup/cleanup/remount exposes duplicate-canvas bugs.
5. Replace `index.html`'s old inline mounting script with the React entry, eliminating the second mounting path. Do not change the renderer's export, settings, masks, palette, or event handling.
6. Perform the browser scenarios in [quickstart.md](quickstart.md), then type-check/build once and inspect the production preview. Update the root usage documentation after successful implementation verification.

## Planning Completion

- Research, data model, component contracts, and validation guide accompany this plan.
- No extension hook configuration exists; pre/post-plan hooks are skipped.
- No agent-context update script is installed in `.specify/scripts/bash/`; record concise project context directly in `AGENTS.md` rather than inventing or fetching a script.
- No application code, dependencies, or implementation tests are installed by this planning command.
