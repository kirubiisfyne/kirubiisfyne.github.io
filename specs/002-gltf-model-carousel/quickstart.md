# Quickstart and Verification: Textured Model Carousel

**Status**: Implemented and browser-verified on 2026-10-28. The real supplied GLB, updated Figma controls, unrestricted input, catalog boundaries, failures/lifecycle, normal production output, and isolated nested-base output were exercised. Evidence and limits are recorded below.

## Prerequisites

- Node 22.12+ or supported newer release and npm; deployment currently uses Node 24.
- Self-contained owner-supplied glTF 2.0 binary `.glb` files in repository-root `glb/`, following [asset contract](contracts/model-assets.md). No separate buffers or texture files.
- A WebGL 2 browser. Use 1280 × 832 and 375 × 812 viewports with browser zoom 100%; existing foreground zoom remains 1.25.

The owner has completed the folder rename, and the supplied model is present at `glb/practice_axeTexture.glb`; no further rename is needed. Before that rename, the binary passed official Khronos validation with zero errors/warnings, embedding geometry and three 2048 × 2048 textures without external references. No repeat validation is claimed here. The former missing `.bin`/PNG prerequisite remains superseded.

Structural validation is not a visual-lighting check. Use the real supplied GLB for implementation acceptance; additional distinct complete fixtures can prove carousel boundaries but must not ship as invented portfolio work.

## Run

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

Adding/removing `.glb` entries requires restarting the development server. Asset membership is a process/build snapshot, not runtime directory enumeration; `.gltf` files are excluded.

For production verification after integration:

```sh
npm run typecheck
npm run build
npm run preview -- --host 127.0.0.1
```

Open the URL printed by Vite. `build` and type-check are separate. Inspect actual `dist/` output through preview, not source files alone. Existing Pages workflow already deploys that output.

## Owner workflow

Place self-contained `.glb` files anywhere beneath the existing `glb/` root. Rebuild/redeploy to add/remove entries; no folder rename, project registration, or component edits are required. Optional adjacent `<stem>.description.txt` files supply custom plain-text descriptions; restart/rebuild after adding/editing/removing copy. Missing/blank/symlinked sidecars omit captions; orphan files never add entries. Filenames supply titles, with parent context for duplicate names. See [model assets](contracts/model-assets.md) for source-to-public-URL mapping; there is no `/glb/` prefix in published URLs. Discovery uses only this root: if it is absent/empty, show the empty state rather than falling back to the former folder.

## Acceptance scenarios

### 1. Real textured model and showcase light — FR-001–004, SC-001

- Load the supplied `practice_axeTexture.glb` by itself. Confirm its actual geometry replaces the static PNG, both head/handle appear, and no old artwork overlays the viewer. Model-specific network traffic consists only of the selected GLB, with zero external buffer/texture requests.
- In initial Rendered mode, inspect front, side, rear, top, and underside. Verify base-color detail, normal-map surface detail, and differing metallic/roughness responses. A generic gray shape is not a Rendered-mode pass; the explicitly chosen Clay mode is tested separately.
- Compare key/fill/rim contributions in a temporary inspection harness: key establishes form, weaker fill retains shadow-side detail, rim separates the rear/side silhouette. All lights stay fixed while the model rotates. Restore the normal three-light rig afterward.
- Check the 35° camera fit at both acceptance widths before/after resize and with the axe horizontal/inverted; entire model remains visible with no near/far or viewport clipping.
- Inspect the actual surface and capture evidence; renderer settings or a passing build alone do not prove visual lighting quality.

### 2. Full-turn input — FR-005–006, SC-002

Use an asymmetric textured fixture with clearly distinct front/rear/top/underside if the axe is ambiguous; keep it temporary.

- Pointer: accumulate two complete horizontal turns in each direction, then two complete vertical turns in each direction. Continue across gesture releases/regrabs. No clamp or forced upright reset; a 180° vertical turn clearly inverts the model.
- Touch: repeat through the browser's direct touch helpers/emulation; vertical rotation works inside the canvas while the page still scrolls outside it. Record that emulation is not a physical-device check if applicable.
- Keyboard: Tab to the named canvas and observe focus/instructions. At 5° per keydown, 72 handled keydowns equal a full turn; 144 equal two turns. Exercise left/right/up/down, including reverse and mixed-axis movement. Tab/Shift+Tab exit; no focus trap or carousel selection change.
- Release/cancel/lost capture/window blur ends dragging; moving afterward does not keep rotating. Secondary pointers/buttons do not replace the active primary drag.
- Orientation changes do not re-render the whole carousel or cause screen-reader status spam. Use temporary instrumentation only when necessary.

### 3. Carousel selection and stale loads — FR-007–008, SC-003

- Use three visually distinct complete temporary entries in an isolated harness or temporary model folder additions. Record initial sorted order.
- Next/previous by click and Enter/Space reach all entries and wrap at both boundaries. Position announcement, title, optional copy, and visible model always refer to one selection; activated button retains focus.
- Rotate one model, navigate away, and revisit: initial fitted orientation is restored, not inherited.
- Delay an earlier model's binary response through browser request control. Trigger ten navigation activations while loads are pending. Let responses/parse results finish out of order: final model/title match the expected index; no old model appears later.
- Break one entry deliberately, then navigate to a valid entry. Unavailable selection does not trap browsing. Distinguish empty, one-item-disabled, and multi-item-enabled navigation.

### 4. Folder discovery and deployed resources — FR-009–011, SC-004

- Use a temporary folder/harness with zero entries, then add two self-contained `.glb` files, one nested. Restart/build: exactly two entries appear without source/registration edits. Include `.gltf`, `.bin`, and standalone images as negative discovery fixtures; none becomes an entry.
- Rebuild without changes: same case-sensitive relative-path order. Remove one `.glb`, rebuild: exactly one entry with both navigation controls disabled.
- Include two different subfolders with the same binary basename and a filename containing a space. Distinct entries/titles remain distinguishable; encoded model URLs succeed and each model's embedded textures display without sidecar assets.
- Inspect production binary responses and the copied hierarchy, not only the catalog array. Verify the current root base and a separate disposable source/output copy built with `npm run build -- --base=/portfolio/`, then preview that copy with `npm run preview -- --base=/portfolio/ --host 127.0.0.1`. GLB requests remain below the deployment base, copied binary bytes are unchanged, and no external buffer/texture requests occur. Do not overwrite the real root-base configuration or its verified `dist/`.
- Do not use a renamed PNG, an untextured cube, copied duplicate projects, or source-text assertions as proof of textured-model discovery.

### 5. Failure, lifecycle, and preserved page — FR-012–014, SC-005

- In an isolated harness, test no models, a single valid GLB, corrupt/truncated binary header/chunks, invalid embedded geometry, corrupt embedded PNG data, empty/invalid bounds, and renderer unavailability. Show readable statuses and current title, never indefinitely loading or an apparently successful untextured model.
- Test a deliberately externally referencing `.glb`: it remains a discovered entry but reports a self-contained-packaging error with zero sidecar network requests. Also exercise embedded-image decode failure, since the loader may otherwise resolve without a texture; that selection must still be unavailable. Keep deliberate-failure evidence separate from unexpected errors.
- Exercise WebGL context loss using browser facilities in the harness: unavailable status, stopped viewer work, usable surrounding page and navigation. Unsupported context at initial mount must behave similarly.
- Count viewer renderer construction through at least ten switches: one persistent live viewer context, not a context per selection. Retired loads cannot attach or retain interactive objects. After unmount, no viewer listeners, observer, captured pointer, scheduled RAF, or owned live resources remain; remount restores exactly one viewer. Inspect disposal with throwaway instrumentation and GPU counters interpreted with documented renderer-internal allocations, not an assumption that every counter reaches zero.
- Static idle viewer has no recurring RAF. With a healthy model loaded, the page normally has two canvases: unchanged background plus one viewer; do not retain the original feature's historical one-canvas assertion as a new total-page rule.
- Check body isolation, transparent page/viewer clear, original blue/light glyph palette, highlight bars, foreground zoom, and headings. Updated local button paper/difference-blend styling must not invert/recolor the page or metaballs. Pointer-responsive background and reduced-motion behavior remain unchanged; no edit to `ascii-metaballs.js`.
- At both widths: no horizontal overflow; text/controls remain reachable and viewer is fully contained. Scroll outside the canvas normally.

### 6. Updated Figma controls and display modes — FR-015–017, SC-006–007

- Compare the implemented carousel against [updated Figma carousel](design/carousel.png), [view states](design/view-control-variants.png), [navigation states](design/navigation-variants.png), and the exact [view](design/view-control-hover.svg)/[navigation](design/navigation-hover.svg) hover vectors. These files are design evidence, not screenshots of a working viewer.
- Verify title → media → Clay/Rendered/Wireframe row → description order; retain desktop source row spacing and allow a taller wrapped/stacked row at 375 pixels. No clipped labels, controls, card, or page-level horizontal overflow with the existing root zoom.
- Enter/leave each enabled navigation and mode button. The paper bar and glyph difference blending match the exported states, arrow direction remains correct, and measured card/button positions do not move. No extra bevel/shadow/timing is presumed. Disabled navigation does not look clickable. Hover alone never changes mode or selection.
- Tab to each enabled mode button, observe focus and its hover-equivalent appearance, activate by Enter/Space, and repeat through pointer click and touch. Focus stays on the activated control; exactly one `aria-pressed` value remains. The selected mode's original arrows animate toward/away from stationary text; reduced motion leaves them still and inset. No selected underline remains. Pointer dragging shows no canvas outline; keyboard arrows or Tab/Shift+Tab restore its focus ring. The view's arrow-key rotation and navigation button activation still work independently.
- Start Rendered: the real axe has authored textures/maps. Rotate to a clearly noninitial pose, select Clay: neutral solid, no authored colors/metalness/normal-map detail, same shape/pose/framing. Select Wireframe: triangle edges only, no filled/texture overlay, full rotation still works. Return Rendered: original materials/maps return exactly.
- Run at least ten mode changes across all modes. Temporary network/renderer instrumentation observes zero new GLB fetches/parses, unchanged geometry/material assignments and camera/orientation, one viewer context, and no per-click override-material allocations after each override's first use. Returning to Rendered must not reference a disposed material/texture.
- Choose Wireframe or Clay, then navigate next/previous, including a delayed load and revisit: chosen mode persists, while each selected model receives its initial fitted orientation. A late retired load cannot reset mode or model. Unmount/remount returns Rendered.
- A healthy one-model catalog has disabled next/previous but enabled mode controls. Loading/error has disabled mode controls, and no mode can mask a corrupt texture or external-reference failure. Empty presentation has no active mode controls or Three initialization.
- Repeat disposal with Clay and Wireframe active. Source model textures/materials are released on selection retirement; reusable override materials are retained only for the runtime and released once on runtime cleanup. Mode changes schedule demand frames only; idle/reduced-motion states have no recurring viewer RAF.

## Evidence and documentation after implementation

Record only executed scenarios, viewport/device/browser details, deliberate failed requests, screenshots of the actual rendered model, and remaining limits here. Update root README, original static-image/manual-data contracts and data-model notes, and `AGENTS.md` after the cutover. Preserve old screenshots as historical evidence, not proof of the new viewer. Remove temporary harnesses/assets/instrumentation before shipping; never delete owner assets to clean up a fixture run.

No permanent gallery or automated suite is required by this plan. If an existing incidental/source-text test is encountered, remove it rather than re-pin implementation text. Add a permanent regression only for a meaningful behavioral boundary if warranted during implementation.

## Planning checks already exercised

- Planning setup resolved `specs/002-gltf-model-carousel/`.
- Npm version query: `three` 0.186.1; `@types/three` 0.186.0. Nothing installed by this command.
- Historical pre-clarification JSON inspection identified missing external files; that prerequisite is superseded by the supplied self-contained GLB. Official Khronos validator 2.0.0-dev.3.10 reported zero errors/warnings/infos/hints for `gltf/practice_axeTexture.glb`; its two meshes, one PBR material, and three embedded 2048 × 2048 PNGs require no external files.
- A disposable Node/Vite 8.3.5 production build, before the format clarification, proved `publicDir: 'gltf'` copied the then-supplied JSON model unchanged, compiled path constants, and substituted a nested base. This historical copy-mechanism proof is not a GLB-specific build or rendering result. Its temporary files/output were removed.
- A disposable numerical check exercised conservative sphere-fit inequalities at three aspect ratios and two-turn trigonometric closure. This did not prove input handling, lighting, or Three.js rendering.
- Updated full-file Figma metadata and nine PNG/SVG design exports were inspected: two button component sets, three mode instances, current row placement/measurements, and exact paper-fill/difference-blend hover artwork. Targeted metadata calls returned API 429, but export calls succeeded. No prototype timing or actual application hover/mode behavior was verified by this design inspection.

## Implementation Verification — 2026-10-28

### Environment and commands

- Managed Chromium 150.0.0.0 on macOS; WebGL 2.0, ANGLE Metal Renderer: Apple M4. Browser zoom 100%, application root zoom 1.25; acceptance viewports 1280 × 832 and 375 × 812. Default observed device pixel ratio was 1.25.
- Prerequisite script resolved this feature with tasks; requirement checklist had 16 complete, zero incomplete. No extension hook configuration was present. Language-server reference queries reported no available server; source-reference fallback mapped the Project type, producer, carousel, and existing page consumer before cutover.
- Installed `three` 0.186.1, `@types/three` 0.186.0, and `@types/node` 24.19.2 while retaining existing stack versions/scripts.
- Actual development surface ran on port 5273. Disposable source-tree discovery ran on separate ports; owner model bytes/folder were never renamed or removed for testing.
- First integrated `npm run typecheck` found nullable WebGL-context captures in nested functions. A guarded nonnullable context alias fixed them; the subsequent type-check passed without diagnostics.
- Normal `npm run build` passed: 44 modules transformed. Root preview used `npm run preview -- --host 127.0.0.1 --port 5473 --strictPort`. Root `dist/` contains only application assets/index and the supplied model, not verification fixtures.

| Normal production output | Minified | Gzipped |
| --- | ---: | ---: |
| Page JavaScript | 234.37 kB | 74.35 kB |
| Lazy ModelViewer/Three.js JavaScript | 875.43 kB | 265.08 kB |
| CSS | 26.84 kB | 12.25 kB |

Vite's >500 kB chunk warning remains visible for the lazy 3D chunk; no warning suppression or artificial splitting was added. Three.js remains outside the page chunk.

### Real model, light, modes, and input

- Real axe rendered with both meshes, authored `M_Axe` material, and base-color, normal, metallic/roughness, and occlusion maps. Rendered restoration retained the same mesh geometry/material objects; Clay had neutral `bcbcbc`, roughness 0.85, metalness 0, and no maps; Wireframe used unmapped unlit `ebebeb` triangle edges without filled surfaces.
- Inspected the real Rendered/Clay/Wireframe surfaces. Temporarily disabling each light changed the rendered pixel luminance, including the small rear-rim contribution; restored all three afterward. Rig remained at planned positions/intensities 8/3/10, with fixed camera/lights. No HDR, floor, extra light, palette change, or opaque scrim was introduced.
- Eleven native mode activations produced zero new requests, one live viewer, unchanged geometry/material identities, camera distance, and quaternion. Switching at a noninitial pose reported zero pose error. Native Enter/Space and direct CDP touch taps selected modes; hover/focus alone did not select.
- Desktop keyboard: 144 handled keydowns in each of Right/Left/Down/Up completed two turns per direction/axis, with zero measured quaternion error after each. A 36-keydown vertical half-turn measured π radians without a polar clamp. Mixed-axis input matched `qX(pitch) × qY(yaw)` within floating-point tolerance.
- Desktop pointer: four repeated half-width/half-height drags per direction/axis completed two turns, returning to the starting quaternion. Mobile CDP touch repeated the same four direction/axis cases with zero measured return error; page scrolling outside the canvas moved from 0 to 165 pixels.
- Release, synthetic pointer cancellation/capture-loss/window-blur paths, right mouse button rejection, and nonprimary-pointer rejection were exercised. Moving after cancellation did not rotate. Selecting via Enter while a mouse drag was captured released capture, reset pose to identity, and retained focus on Next. Terminal context loss during capture also released it.
- Tab left the focused canvas for Clay; Shift+Tab returned to Previous in the multi-model harness. Rotation caused zero observed carousel status/pressed/selection mutations. No React orientation state or spoken-status updates per rotation.
- Production repeated full turns and an inverted side pose, then resized desktop → mobile without changing its quaternion. Projected actual mesh vertices remained inside clip space. At DPR 1.25 the mobile 195 × 225 displayed canvas used a 243 × 281 buffer; at emulated DPR 3 it capped to 390 × 450.
- Hidden zero-size surface stayed loading with zero draws; restoring its size reached ready. One synchronous batch of 100 production rotation invalidations scheduled exactly one RAF.

### Browsing, ownership, and errors

- Three distinct disposable asymmetric textured GLBs (amber tall wedge, green wide wedge, violet deep wedge) proved pointer/Enter/Space next/previous wrapping, coherent title/copy/position/model, retained activated-button focus, retained Wireframe mode, reset orientation on selection/revisit, and one persistent live viewer.
- Ten pending selections were fulfilled out of order, including revisits; final green title/model stayed ready in Clay. Controls were disabled while loading. A retired parse's delayed ImageBitmap completion was closed exactly once, did not attach, and left the current model's image open and mode/pose intact.
- Zero entries: explicit empty message, disabled navigation, no mode controls, zero renderer constructions, and only the background canvas. One healthy entry: navigation disabled while all three mode controls were enabled.
- Deliberate truncated binary and malformed chunk framing, invalid embedded geometry, corrupt embedded PNG, NaN bounds, empty scene, external buffer URI, and external image URI all reached error with mode controls disabled and navigation still enabled. External-resource fixtures produced zero sidecar requests. Embedded data-URI image packaging succeeded. Navigating from failures reached a healthy textured model.
- Unsupported WebGL 2 was simulated at canvas initialization; readable unavailable UI and surrounding navigation/background remained. Aborting the lazy viewer-module request reached the local module-unavailable boundary. Deliberate WebGL context loss disposed the runtime, removed its observers/listeners, and kept subsequent navigation operable with a terminal reload message.
- Ten model/mode switches retained one live viewer, no early override-material disposal, and bounded fixture GPU counters: one geometry and three textures (one model texture plus area-light lookup textures). A 350 ms idle observation saw zero viewer draws and zero viewer RAF requests.
- Strict Mode initially exposed immediate context-loss cleanup breaking effect replay. Cleanup now releases resources/listeners immediately and defers only context loss by a microtask, guarded by canvas ownership. Verified replay left one live renderer; normal production constructed exactly one.
- Unmount with Wireframe active left zero live viewer renderers, zero active viewer ResizeObservers/listeners, both override materials disposed once, no duplicate resource disposals, and unchanged background-canvas identity. Repeated with Clay active; remount restored one viewer in Rendered. Source ImageBitmaps closed on retirement, including late decode completion.
- Readable final-build corrupt-response failure and successful reload recovery were also exercised on the actual root production preview. Deliberate fixture/interception errors are not normal-page errors.

### Automatic catalog and static publishing

- Disposable tree started with no `glb/` but a valid former-root `gltf/former.glb`: empty catalog, no fallback. Empty `glb/` also produced zero entries. Adding only files—not registration or source edits—and restarting discovered two nested, space-containing, duplicate-basename models in stable code-unit order. Titles included parent context; URLs encoded each segment; no descriptions were fabricated.
- `.gltf`, `.bin`, `.png`, uppercase `.GLB`, directory symlink, and file symlink were not entries. A malformed lowercase `.glb` remained discoverable and showed its runtime failure. An unchanged restart retained order; removal/restart yielded one enabled viewer with disabled navigation, then removal to empty yielded no viewer.
- A separate source/output copy used `npm run build -- --base=/portfolio/`. Its preview required the matching `--base=/portfolio/` flag; an initial root-base preview was corrected without rebuilding or changing real config/output. Both nested models then loaded embedded textures with HTTP 200 under `/portfolio/`, no extra `/glb/`, no external model sidecars, no browser errors, and no console errors.

| Verified binary | Bytes | Matching SHA-256 (scope below) |
| --- | ---: | --- |
| Supplied root `practice_axeTexture.glb` | 7,821,812 | `5f0ebd5ef25f39d5ef55fe93194ac25d943ed6fbaf6131db719f285b3edce74d` |
| Isolated `A folder 1/shared.glb` | 2,268 | `182381323419dbc5cc50f12a0ba30d3f032c92c3f087362a8e939436021d04e6` |
| Isolated `b folder/shared.glb` | 2,256 | `cee9908b93b26c95b6dc965262f7bfdcf8441b0469b56fbb70b888424ceaa2cb` |

The supplied source and root output hashes matched; isolated source/output hashes and browser-served SHA-256 matched for both distinct fixtures. The normal output was never overwritten by the nested build. Only the supplied axe ships as portfolio work.

### Figma, background, and actual screenshots

- Desktop 732-source-pixel card uses separate title/media/mode/description rows; mobile modes stack in order without clipped labels or horizontal page overflow. Filename text wraps rather than truncating. Outlined mask geometry came from saved Figma vectors, without a new UI font.
- Enabled navigation hover kept card/button positions unchanged and did not activate selection. Measured paper bar was approximately 41.58 × 32 source pixels; previous glyph transform was mirrored. Local `isolation: isolate`, difference blending, focus ring, exactly one pressed mode, and selected underline were observed.
- Root zoom stayed 1.25, page foreground transparent, renderer clear alpha 0, and body isolation `isolate`. Healthy root previews had two canvases; local artwork and JetBrains Mono loaded. Normal desktop/mobile root and nested previews had no unexpected browser/console errors or overflow.
- Reduced motion kept background pixels static, ignored pointer movement, and scheduled no recurring background/viewer frame. Returning to normal motion resumed background pixel changes/ticks while viewer demand rendering stayed independent.
- `ascii-metaballs.js` retained SHA-256 `fe553ec8e5ecc3456e866fc72cd64dd7aea1802cc325b950246b8d6a128315d8`, including the owner's existing edits. It and the supplied GLB were not edited by implementation.
- Actual root-preview captures: [desktop overview](evidence/desktop-overview.png), [Rendered](evidence/desktop-rendered.png), [Clay](evidence/desktop-clay.png), [Wireframe](evidence/desktop-wireframe.png), [mobile overview](evidence/mobile-overview.png), [mobile Rendered](evidence/mobile-rendered.png), [mobile controls/focus](evidence/mobile-controls-focus.png).
- [Nested-base enabled navigation hover](evidence/nested-base-navigation-hover.png) shows a disposable verification model, not additional portfolio work. All captures are browser output, not Figma substitutes.

### Limits and cleanup

- Touch was CDP emulation, not a physical-device check. Safari/Firefox, physical touch hardware, and screen-reader audio were not exercised; semantic names, focus, native activation, pressed/status content, and touch scrolling were inspected in Chromium.
- Extra probe found a Vite 8.3.5 development-server limitation for literal `#` in public filenames: an encoded `A%20folder%20%231/shared.glb` request returned HTML rather than GLB bytes. Ordinary spaces were verified. Use URL-safe names without `#`; no filename-specific shim or silent catalog filtering was added.
- Metallic surfaces can remain dark outside the three softbox reflections; background glyph overlap is intentionally preserved. No contrast scrim or background rewrite was introduced.
- Disposable harnesses, generated models, browser instrumentation, isolated trees/output, and owned verification services were removed/stopped after evidence. No permanent gallery or test framework was added. Old feature 001 screenshots/results remain explicitly historical.

## Direct owner refinements — 2026-10-28

Implemented separately from the unimplemented turntable/carousel-transition specification in feature 003:

- Optional adjacent `<stem>.description.txt` files now supply per-model copy. The existing axe text was migrated unchanged; no application-code special case remains. File contents are trimmed and embedded at startup/build, not fetched at runtime. All files under `glb/` are public.
- The active mode's existing outlined arrows animate outward with mechanical steps (750 ms, steps(3, jump-none), ±8px travel); text does not move and the underline is removed. Reduced motion keeps the selected arrows stepped outward and still. Hover paper/difference blending and original artwork remain.
- Pointer-focused canvas keeps arrow-key interaction but has no outline. Keyboard input and returning with Tab restore its visible focus ring. Blur/disposal clear the pointer-focus marker.

### Exercised verification

- `npm run typecheck` and `npm run build` passed after all runtime changes (44 modules). No new dependency or permanent test framework.
- Managed Chromium, production preview on port 5477, desktop 1280 × 832 and mobile 375 × 812, DPR 1.25. Desktop first-drag reproduction before the fix produced a white `solid` outline despite no keyboard interaction. After the fix pointer drag retained focus with `outline: none`; ArrowRight restored `solid`, and Tab/Shift+Tab left/returned with visible focus.
- Production showed the existing text only on exact `practice_axeTexture.glb`; the owner's existing `copy` entries had no caption. Navigating retained Wireframe mode. No owner GLB was modified or removed.
- Switching Rendered → Clay → Wireframe moved the active animation only to the selected button; inactive arrows had no animation, central labels had no transform, and button `::after` had no underline content. Actual desktop/mobile surfaces were inspected. Mobile reduced motion reported no arrow animation, ±8 source-pixel static outward arrow offsets, and no horizontal overflow.
- Disposable Node/Vite catalog smoke exercised missing root; nested duplicate basenames with independent descriptions; leading/trailing whitespace; missing/blank copy; orphan and uppercase nonentries; ignored model/description symlinks; reloaded snapshots after edits and removals. These were catalog-only fixtures, not rendering models. Fixtures and script were removed.
- A fresh production browser tab had zero console errors or request/page failures. The development tab recorded HMR connection interruptions during configuration restart and aborted in-flight model fetches during reload; these are not reported as clean-production failures.
- Actual production captures: [desktop active arrows](evidence/desktop-active-arrows.png), [mobile Wireframe/reduced motion](evidence/mobile-active-arrows-reduced-motion.png).

Safari/Firefox, physical touch hardware, and screen-reader audio were not re-exercised for these refinements. The earlier verification section is historical; its selected-underline and axe-only description observations describe the pre-refinement implementation.
