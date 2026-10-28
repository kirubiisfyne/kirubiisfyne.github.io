# Data Model: Textured 3D Model Carousel

## Build-time model paths

`__MODEL_PATHS__: readonly string[]` is injected by Vite configuration, declared in `src/vite-env.d.ts`, and consumed only to derive the module-level readonly catalog.

- One path per regular `.glb` file beneath repository-root `glb/`, recursively. Only the renamed root is scanned; no old-folder alias/fallback.
- POSIX separators, no leading slash or `glb/` prefix, no absolute local paths. Relative IDs remain stable when only the catalog root is renamed.
- Exact case is preserved; order is ascending code-unit comparison, not locale sorting.
- Root missing/empty means an empty array; ignore directory symlinks.
- Discovery reads filenames only. A malformed or externally referencing `.glb` remains an entry that reports unavailable when selected, rather than disappearing silently.
- `.gltf`, `.bin`, standalone images, directories, and other files are never entries.
- Snapshot is fixed for a deployed build or dev-server process; restart/rebuild to rescan.

No generated tracked manifest or registration file exists.

## Project

Keep the existing exported `Project` symbol in `src/types/project.ts`; replace its image-specific shape with model-backed fields, migrating every consumer before removing old fields.

| Field | Type | Rule |
| --- | --- | --- |
| `id` | readonly string | Exact relative model path; unique and stable across builds unless the path changes. |
| `title` | readonly string | Filename including `.glb`; add parent-path context for duplicate basenames. The UI brackets it for the existing title treatment. |
| `modelUrl` | readonly string | Vite base plus each encoded path segment; public root mapping, not an extra `glb/` URL prefix. |
| `description` | readonly optional string | Existing supplied copy only for exact path `practice_axeTexture.glb`; absent for unknown models. |

The module-level `projects: readonly Project[]` in `src/data/projects.ts` derives this shape from the injected path list, not a handwritten project array. The existing page import and carousel prop boundary remain. Remove `titleImageSrc`, `imageSrc`, and `imageAlt` rather than retaining deprecated aliases. Accessible model identity comes from the generated title and viewer instructions/status.

No mandatory per-model metadata, title SVG, image fallback, or custom lighting configuration is required. The optional axe-copy association never determines catalog membership. No content is persisted remotely or in local storage.

## Carousel selection

Only `activeIndex: number` is React carousel state. The readonly collection is static per mounted instance, preserving the current component contract.

- Nonempty: selected project is `projects[activeIndex]`; initial index is 0.
- Multiple entries: functional next/previous updates wrap modulo collection length.
- Zero/one: both controls disabled; zero renders an explicit empty state and no viewer.
- Title, description, position announcement, and viewer prop derive from one selected Project.
- Selection does not move focus away from its activated button.
- Changing the collection during an instance's lifetime is not required; a rebuild/reload starts a new catalog snapshot.

## Display mode

`DisplayMode = 'clay' | 'rendered' | 'wireframe'` is a type-only runtime export used by the lazy React adapter and `ViewModeControls`. It is not a Project field or per-model metadata requirement.

| Value | Button label | Presentation |
| --- | --- | --- |
| `clay` | `> Clay <` | Neutral gray, rough, nonmetallic solid under the three-point lights; no authored colors/maps or texture-derived normal/bump detail. |
| `rendered` | `> Rendered <` | Exact authored materials and embedded textures; default on a fresh mounted viewer. |
| `wireframe` | `> Wireframe <` | Readable light triangle edges only; unlit and untextured, with no filled surface/overlay. |

- `ModelViewer` owns coarse React `mode` state; the runtime retains the same desired mode through `setMode`. No mode value changes per frame.
- Mode survives next/previous model selection for the mounted carousel. Model orientation still resets per selection; a new mount resets mode to Rendered. No browser preference storage or per-model remembered mode.
- Exactly one mode button has `aria-pressed=true` and a persistent selected underline; hover/focus is transient and does not select. Native activation changes mode without moving focus.
- Controls are enabled only when the current model is ready, including a healthy single-model catalog. Loading/empty/error disables them; mode is retained but cannot mask a failed load.
- Mode changes preserve model ID, loaded resources, original materials, geometry, yaw/pitch, and camera fit. Same-mode activation is a no-op; a different mode invalidates one demand frame, never a model fetch/parse or renderer mount.

## Viewer status

`ViewerStatus` is a discriminated union exported by `src/lib/model-viewer.ts` for the React adapter. Events carry `modelId` to keep announcements/status coherent.

| Status | Payload | Meaning |
| --- | --- | --- |
| `loading` | `modelId` | Current selection is fetching/parsing/preparing its first draw. |
| `ready` | `modelId` | GLB is self-contained, embedded resources decoded successfully, scene is valid, and initial draw completed. |
| `error` | `modelId`, readable `message` | Invalid binary, external asset reference, corrupt embedded resource, or renderer failure; no false successful textured view. |

A renderer/module initialization failure may exist before a model is selected; the adapter represents this as a viewer-level unavailable message and includes the current selected title in its accessible presentation. It does not fabricate a model ID or permanently disable carousel navigation.

If React's last model-tagged status differs from the selected ID, derive loading immediately until the selected generation reports. Runtime generation checks remain necessary when the same model is revisited, because ID equality alone cannot distinguish old and new requests.

## Runtime-owned transient state

Kept outside React state, owned by the mounted viewer runtime:

- Renderer, scene, fixed camera, three-light rig, resize observer, and at most one pending render-frame ID.
- `disposed` flag and monotonically increasing selection generation.
- Current load context: generation, model identity, binary-fetch AbortController, parse manager, resource-failure flag, result/resource ownership, and retirement state.
- Current model rotation/normalization/centering wrapper groups; loaded glTF scenes and resource sets.
- Desired `DisplayMode` and lazily created/reused Clay/Wireframe override materials. These overrides belong to the mounted runtime, not an individual model; original mesh material assignments remain untouched for restoration/disposal.
- `yaw`, `pitch` numbers and reusable quaternion/vector scratch values; identity orientation on each selection.
- Active pointer ID and last displayed client coordinates; no active pointer outside a valid gesture.
- Measured displayed width/height, camera-fit distance, and effective capped pixel ratio.

Do not place orientation, pointer movement, Three objects, frame count, or per-frame values in React state. No cross-selection global model cache.

## State transitions and invariants

1. **Mount**: Create one runtime and persistent renderer; initialize lighting and listeners. Failure yields readable unavailable UI without breaking the page.
2. **Select**: Retire old generation, remove old scene, cancel active gesture and supported requests, dispose owned model resources, reset yaw/pitch but retain selected mode/runtime overrides, create a new load context, publish loading.
3. **Current successful completion**: Fetch/verify the binary, reject external references, decode all embedded resources, validate bounds, center/normalize, fit camera, apply the latest retained mode, attach one model, draw, publish ready. Mode controls cannot bypass decoding errors or cause network sidecar requests.
4. **Binary/packaging/resource/parse/bounds error**: Publish error for the current selection, remove unusable content, clean tracked resources. Do not fetch external dependencies or hide the failure by skipping the catalog entry.
5. **Retired completion**: Dispose the result without scene attachment, status publication, or render invalidation. The newer selection is untouched.
6. **Input/mode/resize**: Update runtime values and schedule one demand frame. Mode changes select null/Clay/Wireframe scene override without mutating original materials or refetching. Coalesce invalidations; no recurring animation loop.
7. **Unmount/terminal context failure**: Mark disposed; retire selection, cancel RAF, release capture, detach listeners/observer, clear override, dispose model resources and any runtime-owned override materials once, then renderer. Late results still dispose themselves. React mode returns to Rendered on a fresh mount.

Shared geometries/materials/textures/ImageBitmaps across the scenes of one loaded asset are disposed exactly once. Image source closure follows texture ownership; no global cache shares those sources with a live other selection. Loaded camera/light nodes do not replace the showcase camera/rig. Animation clips remain inactive.
