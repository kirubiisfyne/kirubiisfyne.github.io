# Implementation Plan: Textured 3D Model Carousel

**Feature**: `002-gltf-model-carousel` | **Date**: 2026-10-28 | **Spec**: [spec.md](spec.md)

**Branch**: Setup reports `002-gltf-model-carousel` as the feature context. This workflow does not create or switch a Git branch.

**Status**: Planned; synchronized with the 2026-10-28 GLB-only and updated Figma display-mode/hover clarifications. Application implementation and browser acceptance are not yet performed.

## Summary

Replace the static axe image with one reusable Three.js viewer inside the existing `ProjectCarousel`. Apply updated Figma NextButton/ViewControlButton states and add Clay, Rendered, and Wireframe controls between the media and description; preserve unrelated page composition, 125% foreground scale, and the unchanged ASCII metaball background. Discover every self-contained `.glb` recursively from repository-root `glb/` at Vite configuration and serve/copy it unchanged via `publicDir`. A fixed camera, three rectangular softbox lights, and explicit yaw/pitch allow full rotations. Reversible scene material overrides change mode without reloading the model or altering authored materials.

## Technical Context

**Language/Version**: Existing strict TypeScript 7.0.2, React/React DOM 19.3.1, Node 22.12+; deployment uses Node 24. Local Node 26.3.0 and Vite 8.3.5 observed.

**Primary Dependencies**: Keep Vite 8.3.5, Tailwind CSS 4.3.3 and current React plugins. Add `three` 0.186.1 and development types `@types/three` 0.186.0, queried from npm during planning. Add compatible `@types/node` for Node build configuration imports; record actual resolutions in `package-lock.json` during implementation. No React Three Fiber, Drei, controls package, carousel package, HDR download, or test framework.

**Storage**: Self-contained `.glb` files in `glb/`, with geometry, buffers, and textures embedded; serialized readonly relative-path catalog compiled into the client. No runtime filesystem enumeration, external sidecar assets, API, database, or persistence.

**Testing**: Existing `typecheck` and `build` commands once after implementation integration, followed by actual desktop/mobile production-preview browser scenarios in [quickstart.md](quickstart.md). Use disposable assets/harnesses for boundary and load-race scenarios; no permanent test suite is currently installed. Add a permanent regression test only if a meaningful consumer-visible bug cannot be reliably guarded by the existing verification approach.

**Target Platform**: Modern desktop/mobile browsers supporting WebGL 2. Non-WebGL devices retain page content and readable unavailable status. Browser acceptance at 1280 × 832 and 375 × 812, browser zoom 100% with existing application zoom 1.25.

**Project Type**: Single-page client-rendered static portfolio, deployed from `dist/` through existing GitHub Actions.

**Performance Goals**: One persistent viewer renderer/context per mounted carousel, one selected scene at a time, and no continuous viewer animation loop. Coalesce input/resize changes into at most one pending render frame. Orientation stays outside React state. Load Three.js in a lazy viewer chunk and fetch only the selected `.glb`, never external model buffers or textures. Cap drawing-buffer pixel ratio at 2, accounting for the foreground CSS zoom.

**Constraints**: No edits to `ascii-metaballs.js` or its mounting lifecycle. Keep body isolation, transparent page/viewer canvas, palette, highlights, headings, navigation focus, and content scale. Preserve authored PBR materials unchanged for Rendered; use temporary mode overrides only for requested Clay/Wireframe inspection. Apply the verified updated button artwork/hover states, not the old static button treatment. No invented production models or mode-based workaround for failed asset loading.

**Scale/Scope**: One model carousel; catalog size determined by files, with no artificial item cap. The supplied `practice_axeTexture.glb` passed Khronos validation with zero errors/warnings and embeds its geometry and three textures. No missing-sidecar asset dependency remains; actual rendered appearance still requires browser acceptance.

## Constitution Check

**Before research**: Pass. `.specify/memory/constitution.md` remains an unfilled template, not adopted governance. Apply user requirements and existing project constraints, not template examples.

**After design**: Pass. Reuse existing carousel and deployment, introduce only Three.js and build/type support, preserve the background, and perform a clean static-image/manual-list cutover. No backend, editor, global state layer, rendering framework, or new governance exception.

## Project Structure

### Documentation (this feature)

```text
specs/002-gltf-model-carousel/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── components.md
│   └── model-assets.md
├── checklists/requirements.md
└── design/                        # Figma references, not browser proof
    ├── carousel.png
    ├── view-control-variants.png
    ├── navigation-variants.png
    ├── view-control-hover.svg
    ├── navigation-hover.svg
    ├── navigation-default.svg
    ├── clay-label.svg
    ├── rendered-label.svg
    └── wireframe-label.svg
```

`tasks.md` is produced later by `/speckit.tasks`, not this command. Evidence files are added only after actual implementation verification.

### Source Code (planned changes, not created by planning)

```text
glb/                               # existing sole asset root; owner rename complete
└── practice_axeTexture.glb         # supplied, validated, self-contained binary model
vite.config.ts                     # publicDir + recursive sorted catalog constant
package.json
package-lock.json
src/
├── vite-env.d.ts                   # readonly __MODEL_PATHS__ declaration
├── types/project.ts               # model-backed Project, no static-image fields
├── data/projects.ts                # catalog-to-project derivation, not registration
├── components/
│   ├── ProjectCarousel.tsx         # updated navigation, title, single lazy viewer
│   ├── ModelViewer.tsx             # canvas/status/mode ownership and lifecycle
│   └── ViewModeControls.tsx        # three reusable Figma-style toggle buttons
├── lib/model-viewer.ts             # Three.js scene/load/input/disposal ownership
└── styles.css                     # scoped default/hover/focus/selected styles
```

`PortfolioPage` keeps importing the readonly `projects` collection and composing the same carousel. No new page architecture is needed. During implementation update root README, affected original feature contracts/data model, and verification records; retain historical evidence with clear supersession notes.

**Structure Decision**: One lazy React adapter and one imperative renderer module, not a generic rendering system. Keep the existing `Project` export and `projects` import boundary but replace their image-specific fields and implementation completely. Find references with the language server before changing exported contracts; migrate all callers and remove obsolete image/title imports and any now-unreferenced cutover assets after reference checks. Do not delete unrelated Figma exports.

## Phase 0 — Research Decisions

See [research.md](research.md) for evidence, primary sources, alternatives, and limits. Resolved decisions:

1. Use direct Three.js with `GLTFLoader`, a fixed perspective camera, and a persistent renderer; no React rendering bridge.
2. Configure `publicDir: 'glb'`. Recursively scan regular files in that same directory at config evaluation, normalize to POSIX relative paths, filter exact `.glb`, sort by code-unit comparison, and inject `__MODEL_PATHS__` using `JSON.stringify`. Ignore `.gltf`, `.bin`, and standalone textures as entries. Missing/empty root produces an empty catalog; do not follow directory symlinks or fall back to the former folder. No virtual-module plugin, generated tracked manifest, or model payload in the JS bundle.
3. Vite public assets map to the site root, not `/glb/`: `glb/axe/model.glb` becomes `${BASE_URL}axe/model.glb`. Derive URLs with `import.meta.env.BASE_URL` and per-segment encoding; preserve binary bytes. Restart dev after catalog changes; production inclusion requires rebuild/redeploy.
4. Use three neutral-white `RectAreaLight` sources with initialized `RectAreaLightUniformsLib`: key, weaker fill, rear/side rim. These support the supplied PBR material and provide broad specular highlights without an external environment asset. No ambient fourth light, floor, shadow maps, or postprocessing. Exact initial tuning and caveats are in research.
5. Compute world bounds, center with wrapper groups, uniformly normalize the bounding-sphere radius to 1, and fit that sphere with a 35° perspective camera using the narrower horizontal/vertical field of view. This sacrifices some initial tall-model size to guarantee no clipping at any rotation.
6. Store yaw and pitch as runtime numbers; compose `qX(pitch) × qY(yaw)` on the model's rotation wrapper without decomposing Euler angles or clamping pitch. Keep camera/lights fixed. Full turns pass through inversion; Blender-exported glTF uses the exported upright orientation, not an arbitrary Z-axis correction.
7. Every selection gets its own abortable `.glb` fetch, `LoadingManager`, generation token, failure flag, and result ownership. Confirm the binary header, then use `GLTFLoader.parseAsync` with a load-local `beforeRoot` packaging check that rejects external buffer/image URIs before dependency loading; embedded buffer views/data URIs remain valid. The parse manager permits only embedded `data:` and loader-created `blob:` resource URLs. Corrupt embedded textures remain terminal even if the loader resolves a scene. Correctness relies on generation/disposed guards and disposal of late results, not cancellation alone.
8. `DisplayMode` is `'clay' | 'rendered' | 'wireframe'`. The mounted viewer starts Rendered and retains the selected mode through `select` calls; model selection still resets orientation. Use `scene.overrideMaterial = null` for Rendered, a lazily allocated neutral nonmetallic rough MeshStandardMaterial for Clay, and a lazily allocated unlit light MeshBasicMaterial with `wireframe: true` for Wireframe. Reuse overrides; never rewrite source materials, reload GLBs, allocate per click, or create edge-overlay meshes.
9. Current Figma confirms NextButton set `27:99`, ViewControlButton set `27:82`, and mode row `27:45`. Exact defaults/hover exports and dimensions are documented in [research](research.md) and [UI contracts](contracts/components.md). SVG hover uses a paper bar plus white glyphs with `mix-blend-mode: difference`; do not infer extra bevels, shadows, or transition timing from the PNG preview.

## Phase 1 — Design and Contracts

### Build and asset boundary

Keep discovery in `vite.config.ts`, using Node filesystem/path APIs and no extra scanner dependency. Enumerate `.glb` filenames only; malformed or non-self-contained binary models remain runtime per-entry errors, not catalog filters that silently hide them. The injected constant is `readonly string[]` in `src/vite-env.d.ts`. `src/data/projects.ts` derives one immutable `Project` per path. Use the full relative path as ID; display bracketed filename text and append parent-path context only for duplicate basenames. Associate the existing axe description with exact path `practice_axeTexture.glb`; no metadata entry is required for other models.

`publicDir` copies each binary model byte-for-byte to `dist/`, maintaining hierarchy for grouping, not sidecar dependencies. The owner has completed the rename to `glb/`; use only that existing root, with no old-folder alias or fallback. The feature identifier stays unchanged. Reserve the root for intended public assets, not site `index.html` or application bundles. Existing Pages workflow already publishes `dist/`; no deployment rewrite or further physical rename is needed.

### React and viewer ownership

`ProjectCarousel` retains only active-index state, functional wrap updates, native disabled buttons, selection announcement, and coherent title/description. Replace outlined per-project title artwork with actual styled text so arbitrary model filenames render without asset exports. Keep the existing typography family/spacing rather than adding an unverified font to imitate outlined lettering.

`ModelViewer` additionally owns coarse `mode` state initialized to Rendered. Its three-button `ViewModeControls` group appears below the canvas and above the carousel description, in Clay → Rendered → Wireframe order. Use native buttons with `aria-pressed`, a persistent selected underline independent of transient hover, and shared Figma-derived label artwork. Disable mode controls until the current model is ready; a healthy single-item catalog still enables them. The mode is not keyed to model ID and is not a persisted browser preference.

Declare `React.lazy` for `ModelViewer` at module scope; use a small Suspense surface and narrow viewer-module error boundary. Mount no renderer for an empty catalog; show disabled mode controls with the empty presentation if they remain in layout. Do not key the viewer by model ID: one canvas/context persists through selections. `ModelViewer` has a lifetime effect owning runtime/disposal, a selection effect calling `select`, and a primitive mode effect calling `setMode`. Mode changes never rerun the lifetime/selection effect. Model-tagged status prevents stale-ready UI; initialization/context loss remain readable unavailable states.

The runtime owns scene/material overrides, lights, camera, resource manager, render invalidation, ResizeObserver, pointer/keyboard listeners, selected model, and cleanup. React owns title/status, focus semantics, instructions, selected-mode state, and the button group. No quaternion, pointer-coordinate, frame counter, or per-frame state in React.

### Interaction and render invariants

Use Pointer Events and capture for one active primary pointer. Horizontal/vertical sensitivity is `2π / rendered width` and `2π / rendered height`, measured with `getBoundingClientRect` so CSS zoom is included. Ignore secondary pointers/buttons. Focus the viewer on pointer activation. End drag on release, cancellation, capture loss, or window blur; remove any temporary ownership on selection and disposal. Apply `touch-action: none` only to the canvas, never the page.

Focused arrow keys rotate 5° per keydown/repeat: left/right yaw, up/down pitch. Prevent default only for handled keys in the viewer; Tab, Enter/Space on carousel buttons, and page scrolling outside remain native. Provide visible instructions and a visible focus ring. No damping, autoplay, wheel zoom, pan, roll UI, or animation playback.

Render only after successful load, mode/orientation change, resize, or restored valid size; coalesce with a single RAF. Zero-size surfaces defer drawing. Use displayed canvas bounds for aspect and drawing-buffer sizing at capped pixel ratio; do not apply 1.25 twice. No continuous viewer loop. Updated Figma media/control/description rows grow naturally instead of retaining the old `732/574` title-plus-media clipping wrapper; keep a 732-wide card, source media height about 570.74, and separate title/mode/description rows. At narrow widths reduce mode-row padding/gaps and wrap or stack labels without truncation. Hover effects stay inside fixed button footprints and do not resize the card.

### Load completion and cleanup

`select` first invalidates the prior generation, cancels its active gesture and binary fetch, removes its scene, and releases its resources, then publishes loading for the new ID. Fetch one `.glb` as ArrayBuffer, verify its GLB 2.0 container header/length, and parse it with the load-local no-external-resource policy above. Readiness requires self-contained packaging, a valid finite nonempty scene, completed embedded-image decoding, no resource errors, and a successful first draw. External references produce an unavailable state without sidecar requests, not an attempt to fetch them. Ignore loaded glTF cameras/lights as presentation controls; do not run animation clips.

Use one idempotent resource disposer per load. Traverse all returned glTF scenes and deduplicate geometries, materials, textures, skeleton resources, and ImageBitmap sources before disposing/closing. On failed/stale loads, release returned or already tracked resources without attaching them. If parser work can finish after cancellation, its completion still belongs to the retired generation and must be disposed. Do not enable a global cross-selection Three cache. Dispose renderer/observer/listeners/pending RAF only on viewer unmount or terminal renderer failure, not every model switch. Release any locally created object URLs; loader-owned URLs remain loader-owned.

Clay/Wireframe overrides belong to the renderer lifetime, not a loaded asset. Allocate each on first use, reuse across selections, and dispose only at runtime disposal. The original glTF mesh material assignments remain untouched, so traversal still finds source materials/textures even while an override is active. Set override to null for Rendered and before terminal cleanup. A completed new model renders using the latest retained mode; stale callbacks never restore an earlier mode. No per-mode scene, GLB refetch, geometry copy, or helper overlay.

### Existing contract cutover

FR-001–004 cover artwork/materials/lighting/framing; FR-005–006 rotation/accessibility; FR-007–008 navigation/selection safety; FR-009–011 catalog/identities; FR-012–014 errors/responsiveness/lifecycle/background; FR-015–017 reversible modes, retained mode state, and updated Figma control interactions. Detailed interfaces: [components](contracts/components.md), [model assets](contracts/model-assets.md), [data model](data-model.md).

## Phase 2 — Implementation and Verification Sequence

1. Follow the dependency order in [tasks.md](tasks.md): complete setup and shared discovery (T001–T004), then the model-backed data contract (T005). Preserve supplied `.glb` bytes and folder structure; migrate every affected consumer with the T011 integration, without deprecated image fields or a manual project list.
2. Build the runtime, reversible modes, controls, and React adapter, then connect the existing carousel (T006–T011). At the US1 checkpoint (T012), prove initial real-model presentation, three mode appearances/restoration, no refetch/context recreation, and loading/decode-error behavior. An isolated harness may support this smoke check; full-rotation proof is not required before integration or claimed before input is implemented.
3. Implement unrestricted pointer/touch/keyboard rotation and its UI semantics (T013–T014), then prove full turns, inversion, cancellation, rotation-safe fitting, and mode switching at a noninitial pose (T015).
4. Complete updated navigation and cross-selection behavior (T016–T018), then catalog metadata boundaries and the owner's automatic add/remove workflow (T019–T020). Verify wrapping, retained mode, reset model orientation, asynchronous selection safety, responsive controls, and no manual registration.
5. Exercise integrated failure, lifecycle, and background scenarios (T021), run the final normal type-check/build (T022), inspect its production preview (T023), and prove nested-base publishing in isolation (T024), using [quickstart.md](quickstart.md). No source-text tests, permanent gallery, or new test framework.
6. After successful smoke proof, update documentation and record only observed evidence/status (T025–T026). All stories and acceptance criteria remain required; an earlier checkpoint is not a reduced delivery scope.

## Planning Verification and Supplied Asset

- `setup-plan.sh --json` resolved this feature and created the plan template.
- Npm reports `three` 0.186.1 and `@types/three` 0.186.0; no dependencies were installed by planning.
- Historical packaging proof, before the format clarification: a disposable Node/Vite 8.3.5 build copied the then-supplied JSON model unchanged from `gltf/` to the build root, compiled the serialized catalog constant, and substituted a `/portfolio/` base. Vite's byte-copy architecture remains applicable, but that run is not a GLB-specific build or rendering result. Temporary files were removed; the successful probe used the repository's Node/Vite runtime after Bun module-resolution failures.
- A disposable math probe checked the conservative sphere-fit inequality at three aspect ratios and full-turn angle closure. This is not proof of Three.js rendering or user-input behavior.
- The supplied `gltf/practice_axeTexture.glb` was validated with official Khronos `gltf-validator` 2.0.0-dev.3.10: zero errors, warnings, infos, or hints. Its 7,821,812 bytes contain two meshes (212 vertices/128 triangles), one PBR material, and three embedded 2048 × 2048 PNGs for base color, normal, and packed occlusion/roughness/metallic maps; no external buffer/image URIs or required extensions.
- The validated self-contained GLB supersedes the former missing-buffer/texture prerequisite. Do not request separate `.bin` or PNG files, fabricate replacements, or ship verification fixtures as portfolio work. Structural validation does not prove final lighting or appearance.
- No application code changed and no model was browser-rendered during planning or this clarification.
- Updated Figma full-file metadata and nine design exports (three PNG, six SVG) were inspected. They confirm both reusable component sets, all three mode instances, row placement, dimensions, fixed label outlines, and hover fill/blend styling. Targeted metadata follow-ups hit API 429; image/vector exports succeeded. Prototype timing and actual application hover/mode behavior are not claimed as verified.

## Planning Completion

Research, entity/state design, UI/asset contracts, and runnable verification instructions accompany this plan. No extension hook configuration or agent-context updater script is installed; maintain concise pending-feature context directly in `AGENTS.md`. No open technical clarification or constitution exception remains. Next command: `/speckit.tasks`.
