# Implementation Plan: Sticky Site Navigation

**Branch**: `main` (planning only; no branch created)  
**Specification**: [spec.md](spec.md)  
**Status**: Ready for implementation planning/review; no application code changed.

## Summary

Add a shared paper-colored, sticky site header inspired by `ConnectSection`, with `[ kirubiisfyne ]` at left and Overview, Development, Gallery at right. Keep existing Overview intact; add Development and Gallery as honest empty page shells. Maintain a compact single row at normal mobile widths, with accessible reflow at extreme zoom.

## Technical Context

- React 19, TypeScript, Vite, existing CSS/Tailwind, Three.js. No router dependency currently; `src/App.tsx` always renders `PortfolioPage` with `MetaballBackground`.
- `src/pages/PortfolioPage.tsx` currently owns the entire Overview and `ConnectSection`; the new common shell should own header, background and footer once per page.
- Connect uses `--color-paper: #ebebeb`, black text, `JetBrains Mono`, bracketed links, underlined hover and visible keyboard focus. Reuse these cues without copying the large footer layout.
- GitHub Pages deployment builds a static `dist/`; `glb/` is Vite `publicDir`. Direct URL loads cannot depend on a generic server-side SPA fallback. Respect `import.meta.env.BASE_URL` for application, links, assets and production checks.
- Existing test setup: Playwright acceptance mode on port 5489, desktop 1280×832 and mobile 375×812. Commands: `npm run typecheck`, `npm run build`, `npm run test:acceptance`.
- Constitution is an unfilled template; no adopted constitution gates. Existing `AGENTS.md` project constraints apply, especially renderer lifetime, visual layering, reduced motion and asset ownership.

## Design Decisions

### URLs and deployment

Prefer static multi-page Vite entries: Overview at the configured base, Development at `<base>/development/`, Gallery at `<base>/gallery/`; each new directory contains an HTML entry loading the same React entry. Configure Vite build inputs so the output includes both directory `index.html` files. Use base-aware links, and determine the page from the entry or normalized pathname. The Pages server can therefore serve each deep link directly without a 404 rewrite, client-side router dependency, hash URLs or JavaScript redirects. Confirm actual Pages directory slash/canonical behavior and refresh in a production-style static server and deployed preview; adjust generated link paths if needed. Unknown URLs retain host 404 behavior. Preserve acceptance-mode entry configuration and model asset discovery.

Normal anchor navigation intentionally reloads between pages; back/forward and sharing use browser-native behavior. Background and renderers clean up through existing lifecycle on page exit. If deployment tests show static directory routes unsupported, stop and choose an explicit host-compatible alternative before implementation is considered complete.

### Shared layout and styling

- Move `ConnectSection` from `PortfolioPage` into shared site layout in `src/App.tsx` (or a dedicated layout), keeping Overview's existing `main`, sections and semantics unchanged. Mount exactly one `MetaballBackground` and one footer per page.
- Add `src/components/SiteHeader.tsx`: semantic site header and labeled `nav`, real anchors, `aria-current="page"` on exactly one link. Brand links to Overview. Active state is distinct from hover/focus; focus indicator remains legible against paper.
- Sticky top, opaque paper background, black monospace and bracketed brand. Keep header above artwork, without interfering with viewer pointer input; test stacking contexts, root zoom, and full-width canvases. Avoid animations and respect reduced motion.
- Align desktop inner width and horizontal padding with footer/portfolio. Use measured compact spacing/type for all four labels in one row at 320–375px without clipping or overlap. Do not use horizontal scrolling or truncate labels. Provide reflow at high text zoom if a single row cannot remain accessible, and size/space hit targets as far as available width permits.
- Account for actual rendered sticky-header height in anchor scrolling and focus reveal (including responsive changes). Avoid fixed spacer assumptions and ensure the focused target remains visible.
- Add restrained `DevelopmentPage` and `GalleryPage`: unique main heading and concise honest empty state. Reuse foreground spacing, typography, background and footer; do not create placeholder projects, entries, images or browsing functionality.

## Implementation Phases

1. **Baseline and route scaffolding**: inspect Vite acceptance entry and deployment base behavior; add directory HTML entry points and Vite multi-page inputs, preserving existing acceptance and model build paths. Define a single base-aware route map and robust route selection.
2. **Shared site shell**: compose existing background, new header, selected page and one Connect footer; keep the Overview content and section IDs unchanged. Avoid remounting the existing page within a single load and preserve WebGL cleanup.
3. **Header and shells**: implement semantic navigation and active/focus/hover states; add two truthful empty pages; style desktop and compact mobile; address sticky layering and scroll offset.
4. **Automated verification**: add Playwright coverage of all pages, correct active state, navigation, browser history, reload, direct entry, keyboard, sticky position, mobile and no horizontal overflow. Include 320× viewport and text zoom/reflow checks; exercise production build under a non-root base with a static server, not only Vite dev fallback. Run existing suite unchanged and validate production bundle excludes acceptance artifacts.
5. **Manual verification**: inspect 1280×832 and 375×812 plus 320px and zoomed text; test touch targets and focus visibility, sticky contrast over background, footer and headings; interact with both overview viewers, conveyor navigation, reduced motion, failure states and footer links. Validate a real GitHub Pages deployment or equivalent artifact and URL behavior.

## Proposed Files

```text
src/App.tsx                         # shared shell and page selection
src/components/SiteHeader.tsx       # shared sticky navigation
src/pages/PortfolioPage.tsx         # retain Overview, remove duplicate footer
src/pages/DevelopmentPage.tsx       # new empty shell
src/pages/GalleryPage.tsx           # new empty shell
src/styles.css                      # header/page styles and responsive offsets
src/data/…                          # optional single base-aware route map
development/index.html              # static entry
gallery/index.html                  # static entry
vite.config.ts                      # multi-page build entries
tests/acceptance/…                  # navigation/regression coverage
```

Exact route map and test filenames are implementation choices; avoid adding a router or content management layer unless static entry requirements prove insufficient.

## Risks and Verification Gates

- **Mobile width versus usability**: long labels compete with bracketed brand. Verify real font metrics at 320px; if one-row legibility or touch operation is impossible, raise tradeoff instead of silently hiding links or shrinking text excessively.
- **Static hosting**: dev server fallback can hide broken production deep links. Build with a non-root base and test directory entries, refresh, scripts and links on a static server; verify deployment behavior before sign-off.
- **Existing rendering**: header stacking and shell refactor can break full-width canvases, background isolation, scrolling, focus or canvas cleanup. Run existing acceptance suite and manual visual/input regressions.
- **Scope**: no invented work, content model, article pages, gallery grid, filters, or content migration in this feature.
