# Implementation Plan: NES Game Viewer Layout

**Feature context**: `006-nes-game-layout`
**Working Git branch**: `main`; planning creates no branch or commit.
**Status**: Proposed; implementation not started.
**Input**: [spec.md](./spec.md)

## Summary

Extend existing retro TV renderer into a shared TV/controller composition. Bake FBX-derived layout into typed configuration; load supplied self-contained NES GLB; raycast controller-local D-pad regions. Keep native controls for keyboard, assistive technology, loading, and graphics failures. Preserve existing TV image/motion pipeline and catalog ownership.

## Technical Context

- **Language/stack**: React 19.3.1, strict TypeScript 7.0.2, Three.js 0.186.1, Vite 8.3.5, existing CSS/Tailwind setup.
- **Assets**: Existing `gltf/practice_tv/`; `gltf/NESController/NESController.glb` via Vite URL import.
- **Reference**: Owner-supplied `GameViewer.fbx`, inspected offline only. No runtime FBXLoader or absolute filesystem dependency.
- **Storage**: Existing readonly local game catalog. No backend or new persistence.
- **Testing**: Existing Playwright acceptance infrastructure; desktop/mobile, one worker. Typecheck and production build.
- **Performance**: One persistent renderer/canvas for game section; parallel independent asset loads; no per-game model reload; retain demand rendering and existing visibility-aware noise/motion.
- **Scope**: Game section only. No react-three-fiber, model catalog changes, gameplay integration, or controller remapping UI.

## Constitution Check

Repository constitution remains an unfilled template, not adopted governance. Actual gates come from AGENTS.md and feature 005:
- Source assets unchanged; no invented work.
- Existing background/carousel untouched.
- Animation/projection updates outside React state.
- Generation/disposal guards, reduced motion, and failure navigation retained.
- Use existing direct Three.js and test infrastructure.

Pre-design check: pass. Post-design check: pass; only deliberate supersession is TV-only framing, replaced with unclipped combined-layout framing. No governance violations claimed.

## Project Structure

### Planning artifacts

```text
specs/006-nes-game-layout/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/ui.md
└── quickstart.md
```

Task generation is a later step; this plan does not claim tasks.md or implementation exists.

### Planned source/test changes

| Path | Change |
| --- | --- |
| `src/data/game-viewer-layout.ts` | New: normalized reference transforms, camera fit parameters, verified D-pad-local regions/anchors. |
| `src/lib/nes-controller-assets.ts` | New: URL import for supplied embedded GLB. |
| `src/lib/game-controller.ts` | New: scoped raycast/projection helper and pointer gesture handling; no renderer ownership. |
| `src/lib/retro-tv-viewer.ts` | Extend existing scene with controller, combined framing, independent readiness and cleanup; preserve TV screen/motion logic. |
| `src/components/RetroTvViewer.tsx` | Bridge navigation callbacks/readiness and semantic projected controls without per-frame React updates. |
| `src/components/GameShowcase.tsx` | Retain selection ownership; replace standalone game arrows with controller navigation/fallback; remove game-only arrow asset imports. |
| `src/styles.css` | Game-section pointer handling, projected focus controls, responsive framing, and visible fallback navigation. |
| `tests/acceptance/game-showcase-*.spec.ts` | Preserve existing coverage; add controller behavior/failure/alignment cases and revise obsolete framing assertions. |

Keep `src/data/tv-transform.ts` editable and meaningful; compose its values inside TV reference-placement group. Do not alter carousel navigation artwork/styles globally.

## Phase 0: Research — complete

See [research.md](./research.md). Key findings:
- Controller GLB contains geometry plus three embedded PNG textures; no external resource URIs.
- Alternate GLTF references `Grid_normal.png`, while supplied filename uses `Grid_Normal.png`; embedded GLB avoids case-sensitive deployment risk.
- FBX has TV/controller groups and a camera, but raw camera projection misses both model centers and far plane is 100 against thousand-scale scene coordinates. Recover basis/units and refit, do not copy blindly.
- Nodes have generic names; D-pad mapping needs verified mesh-local geometry, not guessed “previous/next” node labels.

## Phase 1: Design — complete

Contracts and state are defined in [data-model.md](./data-model.md) and [contracts/ui.md](./contracts/ui.md). Validation scenarios are in [quickstart.md](./quickstart.md).

1. Scene owns camera, lighting, TV group, and controller group. TV tilt remains local to TV; controller preserves reference pose.
2. Build explicit normalized placement from FBX world transforms and matching source geometry. Apply a common unit/basis conversion; avoid independently normalizing away relative scale/placement.
3. Fit combined bounds and a validated viewing direction on resize. Refit after either load without treating temporary single-object bounds as final reference framing. Keep layout stable using declared reference bounds.
4. Raycast only verified D-pad regions in controller-local space. Use canvas bounding rectangle for pointer coordinates, not window dimensions or drawing-buffer pixels.
5. Project D-pad anchors into native button positions. Convert through actual canvas/overlay rectangles; account for full-width canvas and existing root zoom. Update DOM positions on relevant draws/resizes, not React renders.
6. Healthy canvas handles pointer picking; semantic buttons handle keyboard/assistive activation. Route each gesture through one navigation action, never both canvas and overlay.
7. While loading/failed/offscreen or too small for safe non-overlapping hit areas, expose same native controls visibly. Preserve catalog navigation even if graphics fail.

No agent-context updater script exists. Do not fabricate one or change AGENTS.md for a proposed feature; update project context after implementation is verified.

## Implementation sequence

### 1. Establish reference composition

- Extract and document source-to-reference transform mapping and camera-basis correction.
- Verify source geometry alignment, controller front face, and D-pad orientation in browser.
- Add typed configuration and GLB URL import.
- Capture desktop/mobile composition baseline before interaction work.

**Exit**: Supplied models reproduce inferred composition without clipping; no source bytes changed.

### 2. Integrate shared scene and lifecycle

- Load controller independently alongside existing TV; preserve TV API and image pipeline.
- Replace TV-only fit with stable combined-layout fit; retain TV-local transform overrides.
- Track controller readiness separately from TV status.
- Cover late/failed loads, disposal of geometry/materials/textures, context loss, Strict Mode replay, and listener cleanup.

**Exit**: One game-section canvas; either asset can fail without disabling the other or game links.

### 3. Wire controller navigation and accessibility

- Add verified D-pad left/right hit regions and anchors; ignore center/up/down, A/B, Start/Select, shell, cable, and empty space.
- Accept one navigation activation per completed pointer gesture; cancel on drag, pointercancel, or lost capture. Preserve normal touch scrolling.
- Connect shared `onNavigate(-1 | 1)` action to GameShowcase's functional index update.
- Add native named controls at projected anchors with visible focus; use visible fallback when necessary. Avoid duplicate tab stops/actions.
- Disable every path for zero/one games. Keep existing announcement and Play behavior.

**Exit**: Pointer, touch, keyboard, and assistive activation produce identical catalog selection.

### 4. Refine responsive integration

- Preserve FBX-derived pose/relative composition; tune stage height and camera padding for narrow viewports.
- Keep controller targets non-overlapping. Aim for 44 CSS px touch targets; when projection cannot support usable targets, retain visible native alternatives instead of overlapping invisible hotspots.
- Preserve page scrolling, background pointer behavior, reduced motion, and visibility handling.
- Remove old game-only side arrows; leave model carousel controls unchanged.

**Exit**: Correct alignment under desktop/mobile resize and existing root zoom, with visible focus and no clipping.

### 5. Verify and document

- Add real pointer-coordinate tests so DOM button clicks alone cannot mask broken raycasting.
- Test loading, independent failures, no WebGL, context loss, rapid navigation, disabled catalogs, resize, and repeated mount/unmount.
- Update only obsolete TV-only size assertions; retain image, static, tilt, transform, stale-load, and link regressions.
- Run typecheck, build, and full acceptance suite. Inspect production asset URLs and absence of FBX/acceptance dependencies.
- Save actual browser evidence and update project context after verification.

**Exit**: Validation guide passes; no console errors, double activation, resource leaks, or unrelated regressions.

## Complexity Tracking

No new framework, backend, animation-state store, renderer, or generic asset-discovery system. One narrow controller interaction helper keeps extension maintainable.
