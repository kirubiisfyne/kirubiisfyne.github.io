# Quickstart and Verification: Textured Model Carousel

**Status**: Planning synchronized with GLB-only and updated Figma display-mode/hover clarifications; supplied binary structurally validated. Model viewer not implemented or browser-verified. Scenarios below are acceptance instructions, not claimed runtime results.

## Prerequisites

- Node 22.12+ or supported newer release and npm; deployment currently uses Node 24.
- Self-contained owner-supplied glTF 2.0 binary `.glb` files in repository-root `glb/`, following [asset contract](contracts/model-assets.md). No separate buffers or texture files.
- A WebGL 2 browser. Use 1280 × 832 and 375 × 812 viewports with browser zoom 100%; existing foreground zoom remains 1.25.

The owner has completed the folder rename, and the supplied model is present at `glb/practice_axeTexture.glb`; no further rename is needed. Before that rename, the binary passed official Khronos validation with zero errors/warnings, embedding geometry and three 2048 × 2048 textures without external references. No repeat validation is claimed here. The former missing `.bin`/PNG prerequisite remains superseded.

Structural validation is not a visual-lighting check. Use the real supplied GLB for implementation acceptance; additional distinct complete fixtures can prove carousel boundaries but must not ship as invented portfolio work.

## Run after implementation

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

Place self-contained `.glb` files anywhere beneath the existing `glb/` root. Rebuild/redeploy to add/remove entries; no folder rename, sidecar copying, project registration, or component edits are required. Filenames supply titles, with parent context for duplicate names. See [model assets](contracts/model-assets.md) for source-to-public-URL mapping; there is no `/glb/` prefix in published URLs. Discovery uses only this root: if it is absent/empty, show the empty state rather than falling back to the former folder.

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
- Inspect production binary responses and the copied hierarchy, not only the catalog array. Verify the current root base and a disposable `npm run build -- --base=/portfolio/` output/preview. GLB requests remain below the deployment base, copied binary bytes are unchanged, and no external buffer/texture requests occur. Rebuild normally afterward before delivery.
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
- Tab to each enabled mode button, observe focus and its hover-equivalent appearance, activate by Enter/Space, and repeat through pointer click and touch. Focus stays on the activated control; exactly one `aria-pressed` value and selected underline remain after moving the pointer away. The view's arrow-key rotation and navigation button activation still work independently.
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

No application type-check/build, production-page browser check, or 3D visual acceptance has been performed for this feature yet.
