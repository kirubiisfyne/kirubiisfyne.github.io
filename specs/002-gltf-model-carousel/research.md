# Research: Textured 3D Model Carousel

**Date**: 2026-10-28
**Status**: Technical decisions resolved and synchronized with GLB-only and updated Figma display-mode/hover clarifications. The supplied binary passed structural validation; runtime implementation and visual acceptance remain pending.

## 1. Direct Three.js, lazy React adapter

**Decision**: Add `three` 0.186.1 and `@types/three` 0.186.0 with direct imports and GLTFLoader. A module-scope lazy `ModelViewer` owns an imperative runtime in `src/lib/model-viewer.ts` plus reusable `ViewModeControls`. Keep one renderer through model/mode changes. React holds active index, coarse model-tagged status, and selected display mode; rotation/rendering stays imperative.

**Rationale**: The repository already uses effect-owned imperative rendering for its background. A separate Three renderer can follow that ownership convention without rewriting the background or introducing a React scene framework. Pointer movement and rotation do not need React renders. The heavy module stays outside the initial page chunk; no renderer/model requests occur for an empty catalog.

**Alternatives considered**: React Three Fiber/Drei add an unnecessary rendering layer and dependencies for one static viewer. A renderer keyed/remounted per model is simpler locally but recreates WebGL contexts on navigation and complicates resource-limit checks. Eagerly importing Three into the page unnecessarily enlarges the initial module graph.

**Evidence**: Existing `MetaballBackground` contract, `ProjectCarousel` implementation, and React's documented setup/cleanup/Strict Mode behavior. Npm version queries returned the versions above; compatibility must still be confirmed by implementation type-check/build.

Sources: [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html), [React useEffect](https://react.dev/reference/react/useEffect), [React lazy](https://react.dev/reference/react/lazy).

## 2. Renamed model root as Vite public assets

**Decision**: Set `publicDir: 'glb'`. Recursively enumerate regular `.glb` files beneath that sole repository-root folder and inject serialized `__MODEL_PATHS__`. Normalize separators to `/`, sort by a case-sensitive code-unit comparator, and use relative paths as IDs. Ignore `.gltf`, `.bin`, and standalone images as entries. Discovery reads filenames only; malformed models remain selected-item errors. Missing/empty root means an empty catalog; do not follow directory symlinks or fall back to the former folder.

**Rationale**: The owner explicitly chose `glb/` as the new root to match self-contained binary models and avoid naming conflicts, and has completed the rename. The supplied model is now at `glb/practice_axeTexture.glb`; no further asset move is required. Vite public-directory copying and the existing catalog constant still apply. A new build/start rescans; dev hot-discovery is not required.

**URL rule**: Contents of `glb/` map to the public site root. `glb/axe/model.glb` becomes `${import.meta.env.BASE_URL}axe/model.glb`, not `/glb/axe/model.glb`. Encode path segments rather than slashes. Root rename leaves relative IDs and public URLs unchanged; each model still embeds its resources. Current GitHub user-site base stays `/`; verify a nested base during implementation.

**Alternatives considered**: Retaining the former root or scanning both roots contradicts the requested clean rename. A `public/glb/` relocation is unnecessary because Vite can use the requested repository-root `glb/` directly. GLB URL imports could work, but changing the established catalog/copy architecture is unrelated to this directory-only clarification. Runtime directory requests cannot enumerate static hosting; generated manifests/copy plugins remain unnecessary.

**Evidence**: Before this clarification, a temporary Node/Vite 8.3.5 build used `gltf/` as `publicDir`, copied the then-supplied JSON model unchanged, compiled the catalog constant, and substituted `/portfolio/`. That historical run establishes the copy/config mechanism, not GLB-specific runtime behavior. Its output was removed. GLB-specific production requests and rendering remain implementation checks.

Sources: [Vite static assets](https://vite.dev/guide/assets.html#the-public-directory), [publicDir and define](https://vite.dev/config/shared-options.html), [public base paths](https://vite.dev/guide/build.html#public-base-path).

## 3. Three softbox lights and authored PBR materials

**Decision**: Use exactly three neutral-white `RectAreaLight` sources, initialized with `RectAreaLightUniformsLib.init()`, aimed at the centered unit-radius model. Start with the following shared rig; adjust globally only after real visual review, not through per-model registration:

| Role | Position | Width × height | Initial intensity |
| --- | --- | --- | --- |
| Key | `(3, 3, 4)` | `3 × 4` | `8` |
| Fill | `(-3, 1, 2)` | `4 × 4` | `3` |
| Rim | `(2, 2, -3)` | `2 × 3` | `10` |

The camera stays on positive Z looking toward the origin; the rig stays in showcase/world space. Use transparent WebGL 2, explicit sRGB output, Neutral tone mapping, and initial exposure 1. Rendered preserves loader-authored color spaces, normals, factors, and maps. Requested Clay/Wireframe use reversible scene overrides only, never destructive source edits. No shadow maps, floor, extra ambient light, downloaded HDR, or fallback material disguising a failed asset load.

**Rationale**: Rectangular lights give broad softbox-like specular highlights on the supplied metallic/roughness PBR material. Key/fill/rim are roles defined by direction and relative contribution, not a required class of point light. The viewer can provide those roles without external environment assets or a fourth light. RectAreaLight supports standard/physical PBR materials; no cast-shadow support is needed here.

**Alternatives considered**: Three directional lights are cheaper but provide small specular highlights on polished surfaces. Ambient-only lighting removes the requested three-point form definition. RoomEnvironment/HDR can improve general material presentation, but introduces additional illumination/assets beyond this deliberately bounded three-light rig. RectAreaLight does not affect unlit materials; do not silently convert authored unlit materials to lit ones. The supplied export is PBR, not unlit.

**Risk/acceptance**: Starting intensities are design inputs, not measured final appearance. Highly mirror-like models can remain dark except where they reflect a softbox; review the actual supplied textured GLB during implementation. Tune the shared rig while retaining weaker fill, key dominance, rim separation, authored materials, and no clipping of recognizable surface detail. Preserve the transparent background even if the existing glyphs reduce contrast.

Sources: [RectAreaLight](https://threejs.org/docs/pages/RectAreaLight.html), [MeshStandardMaterial](https://threejs.org/docs/pages/MeshStandardMaterial.html), [renderer color/tone mapping](https://threejs.org/docs/pages/WebGLRenderer.html).

## 4. Full-turn rotation without orbit poles

**Decision**: Keep a fixed camera; rotate a centered model wrapper using two runtime angles. Set its quaternion from `qX(pitch) × qY(yaw)`. Input updates those angles directly; never derive them back from Euler decomposition and never clamp pitch. Reduce angles modulo a full turn when useful for numerical stability without introducing a visible stop. Horizontal rotation is about the model's pitched upright axis; vertical rotation is about showcase X, allowing full end-over-end turns.

**Rationale**: The spec explicitly requires passing through inversion. Default orbit-style spherical coordinates restrict polar movement and cannot satisfy this merely by enabling rotation. Explicit two-angle composition has deterministic return after each complete turn and avoids Euler extraction/gimbal-state logic. Preserve exported glTF Y-up orientation; Blender Z-up is an authoring reference, not a demand for an engine Z rotation.

**Input decisions**: Pointer Events, one active primary pointer, pointer capture, and local `touch-action: none`; use rendered canvas dimensions so the existing `zoom: 1.25` does not change sensitivity. A full rendered-width/height drag corresponds to one full turn; repeated drags can continue rotation. Arrow keys turn 5° per keydown/repeat while focused. End ownership on release/cancel/capture loss/blur/selection/disposal. No inertia, auto-rotation, pan, wheel zoom, or roll UI.

**Alternatives considered**: OrbitControls risks pole clamps and upright resets; trackball controls add roll and a different axis contract. Incrementally mutating decomposed Euler angles is harder to reason about under mixed-axis interaction.

Source: [Object3D transforms/quaternions](https://threejs.org/docs/pages/Object3D.html).

## 5. Rotation-safe framing and demand rendering

**Decision**: Update world matrices, compute world-space model bounds, and wrap the untouched loaded scene with centering and uniform normalization groups. The rotation wrapper encloses a sphere of radius 1. With vertical half-FOV `v = 17.5°`, aspect `a`, horizontal half-FOV `h = atan(tan(v) × a)`, use distance `d = 1.1 / sin(min(v, h))`. Choose near/far planes around that sphere with positive near and visible front/back bounds; recompute on resize. Reject empty/nonfinite/zero-radius bounds as unavailable instead of dividing by zero.

**Rationale**: A sphere fits for every yaw/pitch combination. Fitting only an initial upright box clips a long axe when it lies horizontally. Wrapper transforms preserve root scale, internal part placement, and authored geometry; do not destructively recenter vertices.

**Rendering**: At most one pending invalidation RAF; render on load/input/resize, never continuously. ResizeObserver triggers layout-aware sizing, with zero-size deferral. Rendered DOM bounds include foreground zoom; multiply those displayed dimensions by capped device pixel ratio, not by zoom again. No draw-loop state in React. Reduced motion remains compatible with explicit user movement and no viewer autoplay.

**Evidence**: A throwaway math probe checked sphere-fit inequalities for three aspect ratios and two-turn angle closure in both directions. This proves the chosen formulas only, not browser input or graphics output.

## 6. Selection-scoped errors, stale results, and disposal

**Decision**: Each selection receives a generation token, AbortController for one binary fetch, and private `LoadingManager` for parsing/embedded image decoding. After fetching the `.glb` as ArrayBuffer, verify its GLB 2.0 container header/length, then call `GLTFLoader.parseAsync`. Register a load-local `beforeRoot` plugin to inspect parsed buffer/image URIs and reject non-embedded references before dependency loading; embedded buffer views/data URIs are allowed. Restrict the parse manager's URL modifier to `data:` and loader-created `blob:` resources, never network sidecars. Record any manager error as terminal even if the loader resolves. Always guard callbacks by generation/disposed state and dispose late successes.

**Rationale**: The `.glb` extension alone does not guarantee embedded resources; GLB supports external references, so packaging must be enforced, not assumed. Fetching the container separately allows binary verification and abort without reparsing its JSON manually: the plugin uses the loader's parsed JSON. Inspection of the selected Three.js version found `loadTextureImage()` catches failures and returns `null`, so corrupt embedded images can otherwise produce an apparently successful untextured scene. The manager error hook covers decoding failures; cancellation remains an optimization, not the race-safety mechanism.

**Resource ownership**: Deduplicate and dispose loaded geometries, materials, textures, skeleton data, and unique ImageBitmap sources across all returned glTF scenes. On a parser failure, retain/clean resources already observed by load-scoped tracking rather than only traversing an attached scene. Track resources at dependency fulfillment if needed through a load-local GLTFLoader plugin; do not introduce a generic global resource framework. Retired generations never upload to the live renderer. No global cross-model cache. Dispose observers/listeners/RAF/renderer on viewer unmount. Keep the shared light-uniform lookup tables module-scoped, not per-model allocations.

**Alternatives considered**: Merely selecting `.glb` filenames still admits external sidecars. Relying on promise rejection alone misses swallowed image failures. Aborting alone cannot protect against completed/uncancellable parse work. Caching all models retains resources unnecessarily and complicates ownership. Falling back to gray materials or fetching sidecars would hide packaging errors and contradict the requested self-contained contract.

Sources: [LoadingManager, including abort limitations](https://threejs.org/docs/pages/LoadingManager.html), [GLTFLoader 0.186.1 source](https://unpkg.com/three@0.186.1/examples/jsm/loaders/GLTFLoader.js) (`loadTextureImage` catch), [ImageBitmapLoader](https://threejs.org/docs/pages/ImageBitmapLoader.html), [Texture disposal](https://threejs.org/docs/pages/Texture.html#dispose), [renderer disposal](https://threejs.org/docs/pages/WebGLRenderer.html#dispose).

## 7. Supplied self-contained binary

**Observation**: The owner replaced the original multi-file export with `gltf/practice_axeTexture.glb`. In the preceding validation request, official Khronos `gltf-validator` 2.0.0-dev.3.10 reported zero errors, warnings, infos, or hints. The GLB 2.0 container's declared/actual size is 7,821,812 bytes, with aligned JSON and BIN chunks. It contains two meshes (212 vertices, 128 triangles), one PBR material, and three embedded 2048 × 2048 PNGs: base color, normal, and packed occlusion/roughness/metallic. No external buffer/image URIs or required extensions were present.

**Decision**: Use this `.glb` as the real supplied portfolio model, unchanged. The previous missing `.bin`/PNG prerequisite is superseded; no separate files are needed or requested. Do not retain `.gltf` discovery as compatibility. Structural validation and embedded-resource inspection do not prove rendered appearance, input behavior, or showcase lighting; those remain browser acceptance work. Additional temporary verification assets must not ship as invented portfolio content.

**Clarifications**: On 2026-10-28 the user chose `.glb` instead of `.gltf`, then specified `glb/` as the replacement model folder. That directory rename supersedes the earlier retain-folder decision; the feature identifier remains `002-gltf-model-carousel`. Only binary `.glb` files under the new root become entries, with no old-folder alias/fallback. The owner completed the physical rename before task generation; no rename work remains.

## 8. Updated Figma controls and reversible display modes

**Design evidence**: Figma file `8Qb17gg8m0JsxFuEScxxsG` was re-read through full-file MCP data. Carousel `11:39` and current page instance `27:125` now contain two reusable component sets: NextButton `27:99` (Default `27:98`, OnHover `27:100`) and ViewControlButton `27:82` (Default `27:81`, OnHover `27:83`). ViewButtons row `27:45` holds Clay `27:85`, Rendered `27:89`, and Wireframe `27:93` below the media and above the description. Previous uses the navigation component mirrored, as confirmed by the carousel export.

**Measured layout**: MainCard is a centered 732-wide column with 2-pixel gaps. The media image source is 321.04 × 570.74, but the live viewer still fits its complete geometry within available media space rather than preserving a static crop. ViewButtons is a 32-high row with 64-pixel horizontal padding and gaps, leaving three 158.67-wide slots. Labels use 12-pixel MS W98 UI bold artwork, centered. Keep source desktop dimensions before the existing application scale; allow responsive wrapping/stacking rather than horizontal overflow.

**Observed hover mechanics**: Default uses white glyphs/letters without a bar. [View hover SVG](design/view-control-hover.svg) has a `#EBEBEB` 158.667 × 14 rectangle and a white label path with `mix-blend-mode: difference`. [Navigation hover SVG](design/navigation-hover.svg) has a 41.584 × 32 rectangle starting at y=21.5 within a 44 × 67 arrow export, again white/difference glyphs. The [default navigation SVG](design/navigation-default.svg) is 44 × 62. The vector source, not a bevel-like PNG edge, defines the styling; do not add borders/shadows as inferred decoration. Isolate the button blend group so it does not invert the page/metaballs. Reserve maximum glyph extents to avoid hover layout shifts.

**Assets**: [Carousel](design/carousel.png), [view variants](design/view-control-variants.png), and [navigation variants](design/navigation-variants.png) are design snapshots, not browser evidence. Fixed outlined [Clay](design/clay-label.svg), [Rendered](design/rendered-label.svg), and [Wireframe](design/wireframe-label.svg) labels were also exported from `I27:85;27:50`, `I27:89;27:50`, and `I27:93;27:50`. Reuse outlines/masks to preserve lettering without introducing an unverified font. Additional targeted metadata requests received API 429; PNG/SVG export succeeded. No prototype timing/easing was verified, so directly apply default/hover states with no invented timing.

**Decision — UI state**: Use one native three-toggle group, Rendered initially, with exactly one pressed button and a persistent selected underline distinct from hover. Keep the selected mode through model navigation while preserving the existing orientation-reset rule. This is an explicitly chosen conventional default, not a claimed Figma selected variant. Enable mode controls only for the current ready model; one-model navigation remains disabled independently. Hover/focus never selects. Keyboard focus uses the hover-equivalent graphic plus an explicit ring; touch uses native click. Empty/loading/error cannot bypass asset validation.

**Decision — rendering**: Expose runtime `setMode(DisplayMode)`, independent from model selection. Use `scene.overrideMaterial = null` for Rendered, a lazily allocated shared neutral-gray MeshStandardMaterial (initial `#BCBCBC`, roughness 0.85, metalness 0, no maps) for Clay, and a lazy shared MeshBasicMaterial (paper `#EBEBEB`, `wireframe: true`, no maps, unlit) for Wireframe. Original mesh material assignments remain unchanged, so authored appearance returns exactly and per-model disposal still finds all source textures/materials. Override resources live until runtime cleanup and are reused across selections. Same-mode activation does nothing; an actual change schedules one frame without refetch/reparse, geometry copy, camera reset, or new renderer.

**Alternatives considered**: Setting `wireframe` or stripping maps directly on original materials risks incomplete restoration and disposal bugs. Cloning materials on every click allocates unnecessarily. Dedicated wireframe overlay meshes duplicate geometry and conflict with edges-only presentation. Reloading the GLB or remounting a viewer per mode loses rotation and wastes requests/contexts. A fourth Solid button duplicates the requested Solid/Clay mode.

Sources: [Scene overrideMaterial](https://threejs.org/docs/pages/Scene.html#overrideMaterial), [MeshBasicMaterial wireframe and unlit behavior](https://threejs.org/docs/pages/MeshBasicMaterial.html#wireframe), [MeshStandardMaterial](https://threejs.org/docs/pages/MeshStandardMaterial.html), and [updated Figma carousel](https://www.figma.com/design/8Qb17gg8m0JsxFuEScxxsG/Untitled?node-id=11-39).

## Research Completion

No open architecture clarification remains. No dependencies or application code were changed by research. Core Three.js documentation was available; some legacy manual cleanup/color-management URLs returned 404, so disposal/color decisions cite current API pages and versioned loader source instead. Planning checks are recorded separately from future runtime evidence in [quickstart.md](quickstart.md).
