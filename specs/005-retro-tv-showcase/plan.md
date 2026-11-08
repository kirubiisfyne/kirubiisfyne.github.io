# Implementation Plan: Retro TV Game Showcase

**Branch**: `main` (feature selector: `005-retro-tv-showcase`) | **Date**: 2026-11-07 | **Spec**: [spec.md](spec.md)

## Summary

Add a game showcase section with a persistent Three.js TV, two owner-supplied screen textures, synchronized game metadata, wrapping navigation and itch.io links. Use one editable TV transform and a typed local catalog. Keep the TV model and default assets unchanged. Resolve TV dependencies and game textures explicitly because they live outside Vite's existing `glb/` public directory.

## Technical Context

**Language/Version**: TypeScript 7.0.2, React 19.3.1  
**Dependencies**: Three.js 0.186.1, Vite 8.3.5, Tailwind CSS 4.3.3  
**Storage**: Static local catalog and owner-supplied files  
**Testing**: Typecheck, build, existing Playwright acceptance suite plus showcase scenarios on desktop and mobile  
**Platform**: Responsive browser portfolio, including keyboard and reduced-motion users  
**Constraints**: Preserve existing background and carousel; respect deployed base path; clean up Three.js resources; do not change supplied source assets or existing `glb/` discovery contract.  
**Scale**: One TV, two initial games; extensible static catalog. Demand render when possible, no mandatory animation.

## Constitution Check

The constitution is an unfilled template, not adopted governance; no enforceable constitutional gates. Project instructions in `AGENTS.md` apply. Pre-design and post-design checks: PASS; no exceptions required.

## Project Structure

```text
src/
  pages/PortfolioPage.tsx              # compose new section
  components/GameShowcase.tsx          # controls, details, state and accessible fallback
  components/RetroTvViewer.tsx         # renderer lifecycle bridge
  lib/retro-tv-viewer.ts               # TV loading, texture swaps, rendering and cleanup
  data/games.ts                        # catalog and authored TV transform
  styles.css                           # responsive styling
vite.config.ts                         # asset resolution only if required
acceptance/ or existing test location  # extend existing suite after inspection
gltf/practice_tv/                      # TV model and default textures
games/{kontexto,anii}/emissive.png    # per-game screen textures
specs/005-retro-tv-showcase/           # spec and design artifacts
```

Exact file placement may follow existing conventions; do not couple the TV viewer to model-carousel state.

## Implementation Phases

1. **Asset delivery and catalog**: Define typed catalog and transform (position/rotation in explicit units, scale), initial names/descriptions/URLs and URL imports. Make glTF, bin and all dependent images available in dev and built output without changing `publicDir` or copying into `glb/`. Resolve the model's `m_Screen_emissive.png` to its supplied default file; load selected game textures separately from `games/`. Verify production base path, MIME/content and no missing asset.
2. **TV renderer**: Load one glTF with `LoadingManager` URL mapping, identify `m_Screen`, preserve existing UV/texture transform and glTF texture conventions when replacing emissive maps. Configure camera/lights and single shared object transform; render a transparent full-browser-width canvas centered against in-flow stage, accounting for existing zoom. Resize via observed bounds. Keep selection rendering demand-driven.
3. **Selection and UI**: Compose new section below 3D Art. Provide semantic buttons and external anchor with `target="_blank"` and `rel="noopener noreferrer"`. Wrap selection, synchronize metadata/link with selected game, and expose selection via a polite live region. Disable navigation for zero/one item. Match existing design without inventing new artwork.
4. **Robustness**: Cache/load image textures with per-selection generation tokens; late loads cannot overwrite latest selection. On pending or failure, replace old image with neutral fallback, not stale content. Preserve textual navigation when model, WebGL or image fails; provide accessible status. Dispose owned textures, geometries, materials, renderer and listeners on teardown; guard late completions and React Strict Mode replay; avoid affecting existing viewer.
5. **Validation**: Add tests described in quickstart; run typecheck, build and full acceptance suite, including existing carousel regression. Inspect actual screen, canvas bounds and transforms at desktop/mobile; test non-root `BASE_URL` in preview. Do not claim passing results until run.

## Complexity Tracking

Separate renderer is justified by distinct TV presentation and asset loading; avoid rewriting the mature carousel. No additional runtime dependency or backend.
