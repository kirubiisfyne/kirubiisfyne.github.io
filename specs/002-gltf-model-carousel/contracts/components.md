# UI and Runtime Contracts

These contracts supersede only the static-image/manual-project parts of the original portfolio contract. Other heading, page, and background contracts remain unchanged.

## ProjectCarousel

**Module**: `src/components/ProjectCarousel.tsx`.
**Props**: readonly `projects: readonly Project[]`, using [data-model.md](../data-model.md). Input remains static per mounted instance.

- Keep the named `Projects` region, responsive carousel grid, and 732-source-pixel main-card width; update navigation appearance to Figma NextButton set `27:99` (Default `27:98`, OnHover `27:100`), with the previous instance mirrored to keep its direction.
- Keep native `button type="button"` controls named `Previous project` and `Next project`. Both disabled below two entries; otherwise next/previous wrap. Enter/Space and pointer activation remain equivalent; focus stays on the activated control.
- Nonempty: visible `h3` is bracketed generated title text, not per-model outlined SVG artwork. Use the existing typography, no unverified font dependency. Description is conditional native text, with no borrowed copy for newly discovered work.
- Follow updated MainCard `11:28`: title, media, ViewButtons row `27:45`, then description, centered with 2-source-pixel gaps. Media has source height about 570.74; preserve rotation-safe model fitting rather than the static PNG crop. Remove the old fixed `732/574` title-plus-media wrapper; the added controls/card height must not be clipped.
- One module-scope lazy `ModelViewer` inside a local Suspense loading surface and narrow viewer-module error boundary. Never key it by project ID or render multiple hidden canvases to simulate a carousel.
- The current title, optional description, viewer model, and polite position announcement derive from the same selection. Keep the concise position announcement distinct from loading/error status so orientation changes do not produce spoken output.
- Empty: explicit `No models available` text, disabled controls, no canvas or Three.js initialization. Do not show the historical axe image as a working model.
- No autoplay, routing, persistence, wheel-driven navigation, or model-swipe carousel gestures.
- Navigation hover uses the paper `#EBEBEB` bar and white arrow difference blending from the exported source, not a generic full-button fill. OnHover contains a 32-source-pixel highlight under a taller arrow; reserve a stable footprint so enter/leave never moves the card or hit target. Use the same treatment for `:focus-visible` with the explicit focus ring. Disabled navigation is non-actionable and has no enabled-hover effect.

## ModelViewer

**Module**: `src/components/ModelViewer.tsx`.
**Props**: readonly `model: Project`.

- Reusable independently of portfolio page content. A focusable canvas has a descriptive accessible name such as `3D model: <title>` and instructions linked with `aria-describedby`; use a focusable interactive-region semantic, not `role="application"` or decorative-only image semantics.
- Visible concise instruction: drag to rotate; use arrow keys when focused. A visible focus indicator applies to the canvas, not only the existing global button selector. Tab and Shift+Tab leave normally.
- Status is native text with a polite accessible loading/error announcement; do not expose a constantly changing canvas pixel buffer as live content. Canvas remains empty/hidden as appropriate when unavailable; selected title remains outside it.
- A lifetime effect initializes `createModelViewer` after lazy module load and returns its disposer. A selection effect calls `select` when model identity/URL changes, after runtime initialization. Use stable primitive dependencies and a stable state callback; no unrelated copy object should recreate the renderer.
- Persistent renderer across model changes. Only coarse model-tagged status and selected mode belong in React state; derive loading on a selected-ID mismatch to avoid a stale-ready flash before effects run.
- Own `mode: DisplayMode` state initialized to `'rendered'`. It persists through model prop changes because the viewer is not keyed by model ID; a fresh viewer mount resets it. A separate primitive mode effect calls runtime `setMode` without recreating the renderer or re-running selection.
- Render `ViewModeControls` below the canvas/status area and before the outer description. Its disabled state is derived from the current model-tagged status: enabled only for ready, including a one-model collection; disabled during loading/error. Empty layout either omits the group with the card or shows it disabled without mounting Three.
- WebGL/module initialization failure and context loss present readable unavailable UI while the surrounding carousel remains operable. Context loss is terminal for that viewer instance; reload/remount may create a new instance. No automatic retry policy.
- Transparent renderer clear color and transparent foreground wrappers preserve the blue/glyph background; no new full-page scrim.

## ViewModeControls and updated ViewControlButton treatment

**Module**: `src/components/ViewModeControls.tsx`.
**Props**: readonly `mode: DisplayMode`, `disabled: boolean`, `onModeChange: (mode: DisplayMode) => void`.

- Named group `Model display mode`; three native `button type="button"` controls in Clay → Rendered → Wireframe order, with plain accessible names and exactly one `aria-pressed="true"`.
- Source set `27:82`, Default `27:81`, OnHover `27:83`; carousel instances Clay `27:85`, Rendered `27:89`, Wireframe `27:93`. This is one reusable visual treatment instantiated three times, not three independent modes that can be active together.
- Source row: full MainCard width, centered, height 32, horizontal padding 64, gaps 64, three 158.67-wide buttons; generic label frame is about 14 high. Default has no paper bar, hover adds `#EBEBEB` with white glyphs using difference blending. Preserve label artwork `> Clay <`, `> Rendered <`, `> Wireframe <` via the exported outlined SVGs, not a new font dependency.
- Keep the glyph/label layer and background separate so difference blending applies inside an isolated button only, not to the metaballs/page. No invented bevel, shadow, or prototype animation duration: the SVG source specifies flat fill/blending. Hover/focus never activates the mode.
- Pointer/touch click and Enter/Space choose a mode; focus stays on the activated button. Keyboard focus gets the hover-equivalent treatment plus a visible focus ring. The selected mode keeps a persistent underline after hover ends; this selected treatment is an explicit accessible default because Figma defines no selected variant.
- Disabled buttons never appear actionable or activate, but selected-state semantics remain coherent. On narrow screens reduce source padding/gaps, then wrap/stack in order without truncating the longest Wireframe label or introducing horizontal page overflow. Do not force the 32-pixel desktop row height after wrapping.
- Only mode state changes on activation; the buttons never mutate the Project, advance the carousel, capture viewer rotation gestures, or load a model.


## Imperative viewer runtime

**Module**: `src/lib/model-viewer.ts`.
**Export**: `createModelViewer(canvas: HTMLCanvasElement, onStatus: (status: ViewerStatus) => void): ModelViewerController`.

`ModelViewerController` exposes only:

- `select(model: Pick<Project, 'id' | 'modelUrl'>): void` — replaces selection, resets orientation/framing, and owns load/error/race cleanup.
- `setMode(mode: DisplayMode): void` — stores the requested view mode and switches scene material override without reloading, selecting, changing orientation/camera, or creating a renderer; same-mode calls are no-ops. Selected mode survives `select` and is used on current-generation completion.
- `dispose(): void` — idempotently retires all work/resources/listeners and the renderer.

`ViewerStatus` is the model-tagged loading/ready/error union in [data-model.md](../data-model.md). The runtime may throw during renderer initialization; the adapter must present this as unavailable, not a fatal page exception.
`DisplayMode` is the type-only export `'clay' | 'rendered' | 'wireframe'` from the runtime module; type imports from controls must not eagerly load Three.js into the page chunk.

### Rendering and lighting

- Three.js WebGL 2 renderer with alpha, sRGB output, Neutral tone mapping, initial exposure 1; no external HDR or postprocessing. No automatic model animation.
- Exactly key/fill/rim rectangular area lights in fixed showcase space, using initialized RectAreaLight uniforms and the shared rig in [research.md](../research.md). Fill is weaker than key; rim is behind/to the side. Rendered uses unchanged authored materials; Clay uses a reversible neutral material override. Do not parent lights to the rotating model or permanently overwrite source materials.
- Fixed 35° perspective camera. Load the exported default scene, preserve internal transforms/materials, and use wrapper centering/uniform normalization. Disable any loaded lights as additional illumination and ignore loaded camera selection.
- Fit a radius-1 enclosing sphere using both horizontal and vertical FOV with 10% distance margin. Refit after displayed-size changes without changing user orientation; no clipping at any yaw/pitch.
- ResizeObserver plus demand invalidation; at most one pending RAF, no recurring viewer loop. Displayed bounds account for current root zoom, with pixel ratio capped at 2. Defer zero-size rendering until valid dimensions return.
- Rendered: `scene.overrideMaterial = null`, restoring exact original mesh materials and embedded maps. Clay: lazy/reused MeshStandardMaterial with neutral gray color, metalness 0, high roughness, and no texture/normal/bump/occlusion/emissive maps. Wireframe: lazy/reused light MeshBasicMaterial, `wireframe: true`, no textures, no filled surface/overlay. Wireframe lines are unlit; no extra lights or geometry copies.
- Changing mode invalidates one demand frame and preserves geometry, yaw/pitch, camera fit, source material identity, and selected Project. No fetch/reparse, keyed remount, animation loop, or hidden second viewer. Non-Rendered views never bypass failed embedded-resource loading.

### Pointer and keyboard

- One active primary pointer; drag deltas measured in displayed client coordinates. Horizontal width / vertical height drag corresponds to 360°; repeated drags continue in either direction.
- `qX(pitch) × qY(yaw)` composition with no polar clamp, forced upright behavior, or hidden third-axis control. Reset to identity on each selection, including revisit.
- Pointer capture prevents a lost release during dragging. Release/cancel/lost capture/window blur/selection/disposal ends ownership. Ignore secondary contacts and unrelated mouse buttons.
- `touch-action: none` scoped to the canvas, not card buttons/page. Outside-viewer scrolling remains native.
- Focused arrows rotate 5° per keydown/repeat; suppress browser default only for handled arrows. Arrow rotation never advances the carousel; navigation buttons retain native Enter/Space behavior.

### Loading, errors, and ownership

- One per-selection binary fetch with AbortController, GLTFLoader/LoadingManager parse context, and generation token. Verify GLB 2.0 header/length, then parse with `parseAsync`; a load-local `beforeRoot` check rejects external buffer/image URIs before dependency loading. Embedded buffer views/data URIs are valid. Restrict parse resource URLs to embedded `data:` and loader-created `blob:` resources; never request network sidecars.
- Packaging violations and manager decode errors are terminal for that selection, even if the loader resolves a scene with corrupt/missing embedded textures. Validate bounds and first draw before ready. Abort retired fetches/supported parse requests, but generation guards determine correctness: stale callbacks cannot attach content, publish status, or cancel newer work.
- Retiring selection removes/disposes its scene and observed resources. A later result is disposed rather than attached. No cache of previous models or hidden renderers.
- Deduplicate geometry/material/texture/skeleton/ImageBitmap disposal within an asset, including other returned scenes. Keep dependency-fulfillment tracking load-local when parser failure can precede a complete scene. Do not close a bitmap still owned by the current scene.
- Override materials belong to the mounted runtime: create only on first use, share across selections, and dispose once at runtime cleanup, not on each model switch. Original mesh assignments stay untouched, so per-load traversal still releases authored resources while an override is active. Clear scene override before terminal disposal; late load callbacks cannot revert the chosen mode.
- Unmount removes only this viewer's observer, listeners, capture, pending RAF, resources, canvas ownership, and renderer/context; it must never remove the background canvas or call background disposal.

## Unchanged boundaries and implementation cutover

`PortfolioPage` composition, `H1`, `H2`, `MetaballBackground`, and `ascii-metaballs.js` retain their existing contracts. Existing `Project` and `projects` exports remain the integration points but gain only the new model-backed shape; remove obsolete image/title-art fields and imports in one cutover. Find exported-symbol references using the available language server before edits. Update the original feature's now-superseded image/manual-data documentation during implementation without rewriting historical screenshot evidence.
