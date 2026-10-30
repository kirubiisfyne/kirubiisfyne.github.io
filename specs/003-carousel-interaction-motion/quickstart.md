# Quickstart and Validation: Carousel Interaction Motion

**Status**: Validation guide for the 2026-10-30 amendment. The original motion evidence below is historical; current amendment evidence and outstanding verification are recorded separately at the end.

## Prerequisites and commands

Node >=22.12, npm, real WebGL 2-capable Chromium and unchanged supplied GLB/description. Browser zoom 100%, existing foreground zoom 1.25/DPR cap 2; viewports 1280 × 832 and 375 × 812. Read [contracts](contracts/components.md), [data model](data-model.md) and [spec](spec.md).

Current development commands, from repository root:

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

The existing acceptance suite uses the pinned dev-only `@playwright/test` and Chromium. Install Chromium if needed, then run the suite after updating it for the amendment:

```sh
npx playwright install chromium
npm run test:acceptance
```

The existing script invokes `playwright test` against an acceptance-mode strict-port server on port 5489, with one Chromium worker and desktop/mobile projects. Record actual environment and protocol capability; WebGL or compositor-timestamp failure is not a passing result.

After integrated acceptance, separately inspect normal production:

```sh
npm run typecheck
npm run build
npm run preview -- --host 127.0.0.1
```

Do not substitute acceptance serving for normal preview. Planning makes no dependency, runtime or test changes.

## Fixtures and observation isolation

Existing fixtures A/B/C are distinct self-contained textured models outside `publicDir: glb`. Use the real acceptance harness and runtime; keep fixture and diagnostic paths out of production. Preserve owner model bytes and materials.

## External observation protocol

1. Install native `click` capture in the test entry before React listeners. Record target, direction, event timestamp and page time origin. Actual pointer/Enter/Space activation is the start; not the Playwright command's start/end, pointer-down, key-down, runtime request or a ready callback. Verify event timestamps and the real page monotonic clock are comparable.
2. Before activating, start Chromium CDP compositor screencasting at every available frame. Store real images/swap timestamps and acknowledge promptly. Correlate the protocol timestamp origin to the page clock; check a usable timestamp is actually available in the bundled browser. Do expensive image analysis/file writes after the measured interval, not in its rendering path.
3. Record real DOM title/caption readability, curtain/accessibility state, canvas name and changes to the dedicated position region separately from loading/error status. Sample accessibility exposure, not opacity alone. Keep real DOM/observer timestamps on the same page origin.
4. Pair compositor images with those observations. Establish actual distinct fixture identity, center and normal fitted size from recognizable pixels/reference views; a request ID, status label or internal transform alone cannot prove displayed content. Internal last-draw matrices and candidate-preflight diagnostics are supporting evidence, not the latency start/end or sole oracle.
5. Choose the first observed compositor frame that actually shows the centered destination with its matching readable details and current accessible identity/message. Compute activation-to-that-presentation latency. Do not end at the draw callback, omit presentation time, or use screenshot polling latency as a stopwatch.
6. Retain bounded frame/pixel/DOM/accessibility evidence. Missing or ambiguous frame/time correlation is not a passing sample. Report capture gaps and overhead; do not claim a physical display/OS-speech guarantee, subtract overhead, widen the threshold or hide the real pipeline behind a mocked clock.

## Automated normal navigation — FR-005–008/010, SC-003

Use `tests/acceptance/settlement.spec.ts` with the real clock; no `page.clock` or injected delays in these cases. Await the healthy initial A presentation, then measure native activation through actual destination presentation. Startup preload is part of the real path: do not prevent or defer it to reproduce the old on-demand behavior.
- Repeat Previous, both wrap boundaries, Enter and Space activation, both widths and selected-mode retention. Record each accepted activation and observed presentation; previously requested-but-superseded work is not mistaken for a successful settlement.
- Assert correct directional motion and perceptible scale change before the centered full-size result; no title/card/control translation, focus loss or horizontal overflow. Slide duration is adaptive; do not pin a fixed 400 ms movement or start timing at readiness. See the [budget model](data-model.md#7-navigation-budget-and-shared-scheduler).
- A normal result >500 ms is an SC-003 failure, even if caused by organic network/decode/GPU slowness. Preserve its evidence and fix/profile the actual implementation; never retroactively label it deliberately delayed, increase the deadline, discard validation or quietly substitute an instant transition. No performance pass is claimed by a design calculation.
- Capture intermediate/final surfaces and actual elapsed values. A slow software renderer remains a recorded failing result for that environment, not an automatic waiver or mock fallback.

## Automated delayed-details settlement — FR-012–013, SC-008

These cases deliberately exceed 500 ms through their test setup and therefore do not assert the normal navigation deadline. Production still follows the same transaction/timestamp rules; there is no runtime exemption flag.

### Hold and release current details

- Mount the real harness and establish visible A plus its initial position message. Arm a stable B metadata Promise consumed inside the actual title/caption-only Suspense boundary before accepting Next. Do not block the viewer, card, event loop or startup model loads; never create a new Promise on every render.
- Immediately verify title/caption unreadable visually and to assistive technology while a separate loading message names B and outgoing A may remain visible. Navigation stays supersedable during waiting.
- Prove actual B resource/preflight validation separately while its details are still unavailable. Hold the details gate for more than 500 ms from activation (for example, until a real-clock predicate shows 1000 ms elapsed). Use state/time predicates, not arbitrary sleeps or a callback-only delay. Keep observing images and position-message changes throughout.
- While held: no new success-position message and no image pairing centered B with readable A details. Do not wait for B to center while details are intentionally blocked; both readiness gates deliberately prevent movement.
- Release B. Prove actual destination title/caption becomes committed/readable together with the real final centered B model and accessible canvas identity; exactly one current success-position update. Demonstrate recognizable B pixels and a real final presentation, not merely an empty violations array.
- Repeat Previous and both widths. The gate is a chosen way to delay details, not a specification-mandated React mechanism. No normal-case clock is reset on release; raw total delay remains observable.

### Supersession, reduction and errors

- Hold B, then accept C while loading. Release obsolete B first: it must neither reveal, settle nor announce. Release C and prove only C succeeds once. Include a revisit to A so matching model ID alone cannot authorize stale work.
- Set reduced motion before mounting and repeat held details. No spin/slide/scale occurs; safety proof and real final draw still precede matching details/message availability. Toggle reduction during navigation/ownerless return separately; never override active manual inspection.
- Duplicate/Strict Mode effects must not duplicate position updates or renderer ownership. Deliberate fetch/decode/first-draw failure during staging identifies the failed destination, clears old model pixels, sends no success-position update and permits healthy onward navigation.
- Position-region observations concern message availability; automated DOM/accessibility checks do not measure OS text-to-speech completion or prove an audio-device result.

## 1. Turntable — FR-001, FR-007, SC-001

- Use real axe and an asymmetric landmark fixture, both widths/all modes, no inspection and normal motion. Externally time equivalent front views over 24 ±1 seconds of visible viewing. Observe front/sides/rear/front, full framing, no zooming or camera/light motion and no automatic selection.
- Use captured views/known landmarks rather than internal yaw alone. Compare equal observed viewing intervals at different frame cadences where practical; record actual conditions/limits. Diagnostics can check no per-frame React/forced-layout loop but do not replace visual/timing acceptance.
- Mode changes preserve pose/target/progress/source material identities and renderer; no GLB refetch/reparse. Keep existing outlined arrows and local hover treatment.

## 2. Inspection and visible-time return — FR-002–004, SC-002, SC-006

For five mixed-axis/full-turn/regrab cycles, capture the view at inspection start and compare return **before resumed spin** against recognizable reference landmarks. Both axes must be within 1° and observed return portions total <=500 ms; planned interpolation is 350 ms. Include visible release-to-first-update waiting, not only internally counted animation steps.

- Pointer/touch: pause before first delta; repeated horizontal/vertical full turns and inversion, no pole stop. Pointer-only release requires no second click/focus loss; scrolling outside the canvas stays native. Distinguish touch emulation from physical hardware.
- Keyboard: Tab into the viewer, rotate with existing 5° arrow steps/repeat, release keys while focus remains (inspection continues), then Tab/Shift+Tab out without a trap. Pointer-only focus does not start keyboard inspection.
- Mixed input: keyboard then drag; ending drag alone must not return. Reverse ending order; moving keyboard focus away while drag continues must not return. Duplicate release/cancel/capture-loss notifications cannot prematurely resume or leave abandoned control.
- Regrab near full-turn boundaries/from an interrupted return: take the currently visible pose without jump and retain original reference target; subsequent final release gets a new return allowance, not a new showcase target.
- Hide partway through return for longer than 500 ms. Compare last/first visible poses and time the return portions on either side; their sum remains <=500 ms without hidden-time catch-up or a restarted allowance. Repeat offscreen/inactive-window/zero-size interruptions as separate continuity scenarios. Internal elapsed fields may diagnose but cannot replace the observed timing.
- Reduced motion: after all inspection ends, next visible update shows saved pose with no animated intermediate views. Enabling reduction during ownerless return does the same; during active input it does not take control away. Window blur ends all inspection safely.

## 3. Browsing and interruption — FR-005–008, SC-003–004

- With A current, Next is left/shrink plus incoming right/grow; Previous mirrors, including C→A Next and A→C Previous. Follow the real activation timing protocol for ordinary cases; no post-ready stopwatch.
- Metadata hides immediately; named loading/error stays separate and only matching details appear at settlement. Modes remain through navigation; destination starts from its own initial pose and never inherits old input/target.
- Ten accepted delayed selections, released out of order: expected final index/model/details/message wins, stale work never replaces it. Preloading continues independently of selection supersession. Returning to an already loaded model does not refetch or self-slide when it is still displayed, and still verifies a new metadata ticket.
- Hide/scroll away/switch windows mid-slide, then return: compare actual last/first visible pose and relative sizes. Movement resumes from frozen progress without endpoint snap or hidden-time replay. Preserve original activation timing in evidence; this deliberate visibility scenario is not a normal-latency pass.
- Pointer/Enter/Space preserve native navigation focus. Zero/one catalogs disable navigation; empty has no viewer and healthy one-model modes/inspection remain usable. Named fetch/decode/first-render failure clears old pixels and permits onward selection.

## 4. Preferences, resizing and inherited boundaries — FR-009–011, SC-005, SC-007

- Live reduced motion suppresses automatic/spatial animation but retains manual full turns/navigation and matching details. Other changes become visible by the next interaction or within 0.5 seconds while idle. Hiding/offscreen/inactive window freezes all automatic poses/progress and resumes without a jump.
- Resize both ways during spin, inspection, return and movement: preserve pose/target/progress, refit without distortion, keep DPR <=2/controls reachable. Model stays framed at rest; no page-level horizontal scrolling at either width. Zero-size view recovers without invalid projection or false ready.
- Ten model/mode changes: one persistent viewer canvas/renderer plus unchanged background, all loaded models retained but only the current model or transition pair drawn. Observe cleanup/capture/listener/frame/resource ownership and late parse/bitmap disposal; renderer counters need not all become zero.
- Preserve Rendered authored materials/textures, neutral unmapped Clay and triangle-only Wireframe. Reject external buffer/image resources before sidecar requests and embedded decode failure in every mode. Reuse feature 002's [resource/failure guide](../002-gltf-model-carousel/quickstart.md#5-failure-lifecycle-and-preserved-page--fr-012014-sc-005), replacing old idle-demand-only expectations with current eligibility rules.
- Induce terminal context loss in loading/inspection/return/movement, unsupported WebGL, lazy-module failure and unmount/Strict Mode replay. Keep selection identifiable/navigation usable, no retry or obsolete interactive work; preserve immediate cleanup plus guarded context-loss deferral and background ownership.
- Preserve recursive sorted regular lowercase model discovery, ignored symlinks/other formats, optional independent descriptions, static snapshots and encoded BASE_URL/no `/glb/` prefix. No invented portfolio work or owner binary changes.

## Amendment acceptance — FR-014–016, SC-009–010

- With A/B/C fixtures, intercept real model requests before mount. Hold B open; verify requests for A, B and C begin without waiting for B, and actual A with matching details settles while B remains held. Release B and verify it completes without requiring navigation.
- Separately make B fail while C remains healthy. Verify C loads and is viewable, selecting B reports its own unavailable state, and navigation to A or C works without page reload. Repeat with failed A; healthy models must still load and be selectable.
- Instrument actual renderer draw participation per fixture, not merely group flags or request callbacks. At rest assert only the selected model contributes model draws; during Next and Previous only outgoing/incoming participate. Record preflight separately: isolated validation draws are not displayed transition frames.
- At 1280 × 832 and 375 × 812 inspect actual canvas and carousel bounds, overlay stacking, pointer and keyboard navigation, canvas dragging/focus, model fit, mode controls, description placement and page overflow. Compare to Figma `39:205`; responsive adaptation must preserve usable controls.
- Repeat navigation, mode changes, delayed metadata, reduced motion, pending selection supersession, unmount and Strict Mode replay. Check that completed loads survive selection changes without refetch, stale callbacks never settle the wrong ticket, and cleanup retires each per-model resource once. Measure memory implications and record the actual environment; hidden does not mean freed.

## Production, publishing and evidence boundary

Inspect normal `dist/` membership/code and actual normal preview, not just a development root URL: no acceptance HTML, fixture/reference asset, gate/controller/probe branch or harness global ships. Test branches must be eliminated, not merely idle. Exercise actual owner model/textures/modes/motion/focus at both widths; preserve blue/light pointer-responsive background, body isolation, transparent wrappers, zoom, headings, outlined artwork and hover/mode arrows.

Repeat isolated nested-base publishing in a disposable source/output copy with matching build/preview `--base=/portfolio/`, per the [asset contract](../002-gltf-model-carousel/contracts/model-assets.md). Include nested/space-named duplicate basenames, independent missing/blank/symlinked captions, missing/empty/single roots, encoded URLs and source/output hash checks. Do not overwrite normal output/config or alter owner assets.

Record actual commands, hardware/browser/renderer, viewports/zoom, raw activation and presented-frame times, visible return intervals/reference views, image/DOM/accessibility/message evidence, accepted/ignored input sequence, deliberate failures and unexercised limits. Save genuine implementation captures under this feature's `evidence/` only when obtained. Keep permanent regression assets outside publishing; remove disposable scaffolds/services after proof.

The regenerated [task backlog](tasks.md) covers the amendment; the evidence below records the earlier completed implementation. At runtime cutover update README/context and superseded feature 002 clauses without rewriting historical captures/results. This amendment guide reports no executed amendment acceptance, benchmark, build or browser result.

## Implementation evidence — 2026-10-29

### Baseline before motion changes (T001–T002)

- Node v26.3.0; npm 11.16.0. Original owner GLB SHA-256: `5f0ebd5ef25f39d5ef55fe93194ac25d943ed6fbaf6131db719f285b3edce74d`.
- Existing Vite development page exercised in managed headless Chromium at 1280 × 832 and 375 × 812. Real supplied axe reached ready, two canvases were present, single-item navigation was disabled and neither width overflowed horizontally. Clay → Wireframe → Rendered activated successfully on the actual desktop page.
- Actual captures: [desktop](evidence/baseline-desktop.png), [mobile](evidence/baseline-mobile.png). These show the pre-motion baseline, not feature-003 acceptance. Mobile title/caption wrapping and smaller fitted model are existing layout behavior, not silently changed by the motion feature. Physical touch, other browsers and screen-reader audio are not claimed.

### Acceptance setup (T003)

- Installed dev-only `@playwright/test` 1.64.1 and Chromium 156.0.8078.4. A real launched browser reported WebGL 2 available. Added owned strict-port/two-viewport configuration, test script/types and generated-output ignores.
- npm reported an unapproved optional `fsevents` install script; it was not approved or executed by this workflow. Existing Vite baseline and actual Chromium launch worked. No product acceptance or timing pass is inferred from this prerequisite smoke.

### Foundation cutover evidence

- Real normal page: initial owner model reached `ready`, actual title and caption revealed, canvas named `3D model: practice_axeTexture.glb`, independent position `1 of 1: practice_axeTexture.glb`; two canvases and no horizontal overflow at 375 px. Capture: `evidence/foundation-ready.png`.
- Temporary real-component mounts: empty input mounted no canvas and disabled both native navigation buttons; missing caption remained empty/hidden while its current proof authorized settlement; Clay remained selectable after readiness.
- Malformed/missing target: verified failed-target title/caption appeared, previous model pixels cleared, no new success-position message; subsequent navigation to the supplied axe succeeded. Returning to the failed target preserved the prior success message rather than announcing a false success. Capture: `evidence/foundation-failure.png`.
- Real renderer protocol smoke: rejected destination finalization retained displayed identity `first`, phase `loading` and one successful settlement; fresh acknowledgment then finalized `second`, yielding two successes. The temporary component/runtime mounts were unmounted and removed.
- These are foundation checks, not motion or navigation-latency acceptance results. No timing pass is claimed yet.


### Turntable and inspection evidence

- Real Chromium compositor PNGs/swap timestamps, correlated with the page performance origin, showed equivalent owner-model views after 23,993–24,000 ms in Rendered, Clay and Wireframe at both 375 and 1280 px. Quarter-turn image differences confirmed changing front/side/rear views rather than a static-image timer. No internal angle or ready event was used as the completion oracle.
- Five continuous mixed-input cycles per width (keyboard→pointer, reverse release order, regrab, multiple full-axis turns and pointer-only inspection) restored pixel-identical reference views. First externally observed one-degree-calibrated return matches were 338–366 ms after final native release/blur; held views remained pixel-identical while the other controller still owned inspection.
- A real inactive-window probe exposed a restarted return clock: 566.55 ms summed active viewing, excluding 818.60 ms inactive. The fix starts a return on window blur only when it actually ends inspection, not when an ownerless return is already running. The same calibrated probe then restored the reference within 343.82 ms active viewing, excluding 824.30 ms inactive.
- Live reduced motion during active inspection preserved the inspected view. After the last controller ended, both widths showed only the old pose followed by the exact saved pose (23.42/24.62 ms to observed presentation; zero interpolated return views). This is not a claim of zero paint or OS-notification latency.
- Pose-reference comparisons used a temporary opaque neutral canvas backdrop to exclude the independent animated background from image differences. Production transparency and original asset bytes were not changed. Compositor reference capture was calibrated for actual viewport/scroll coordinates; native window restoration explicitly retained the test viewport. Background-tab visibility, offscreen/zero-size continuity and final integrated acceptance remain separate checks.


### US1 completion evidence (T017)

- Measurements: `evidence/inspection-results.json`. Actual compositor contact sheets: `evidence/turntable-mobile.png` (0/6/12/18/about-24 seconds) and `evidence/inspection-return-mobile.png` (saved/inspected/exact returned reference). `evidence/inspection-mobile.png` verifies the normal transparent, blue-background surface with the shorter two-line instructions (35 px inside a 225 px mobile stage).
- Genuine hidden-tab proof used a separately owned headed Chromium window and native tab activation, not an overridden visibility property. At its observed native 561 × 969 viewport, visibility became hidden 134 ms into return; an 838 ms hidden/inactive interval was excluded, and the pixel-identical saved view returned in about 361 ms summed eligible viewing (about 1,199 ms wall time). Native window dimensions and compositor density were observed rather than assumed to match requested emulation. The owned headed browser was closed afterward.
- Offscreen/zero-size suspension at both official widths: pixel-identical endpoints returned in 357–369 ms eligible time, excluding about 817 ms suspended. Re-enabling motion did not replay the paused interval. Live reduction during ownerless return restored the exact saved image; reduction while controllers remained active did not override inspection.
- Reduced motion set before mounting at 375/1280 px: healthy initial owner presentation, two canvases, correct position message and exactly unchanged model images over 350 ms idle observation.
- Native Chromium touch emulation produced nontrivial mixed-axis rotation, then `pointercancel` plus duplicate `lostpointercapture`; the exact saved image reappeared within 413 ms without an extra click or focus loss. Outside-canvas touch scrolling advanced the document from 100 to 310 px. Touch emulation is not physical-device evidence; OS speech/audio timing is not claimed.
- Five normal-motion mixed-axis/full-turn/regrab cycles per official width and all display-mode revolution checks passed as recorded above. Temporary observer/pose mounts and neutral comparison backdrops were removed; no permanent pose-telemetry test or component gallery was added.


### Acceptance infrastructure and pre-spatial red suite (T018–T021)

- Acceptance harness (`tests/acceptance/index.html`, `tests/acceptance/harness.tsx`) mounts real components with distinct textured fixture models (Alpha, Beta, Gamma) outside `glb/`. Native click timestamps captured before React listeners on page origin; stable per-ticket metadata gates implemented using `Promise.withResolvers()`; MutationObserver tracks dedicated `.carousel-position` live region and canvas naming; CDP screencast captures compositor frames and swap timestamps.
- Normal navigation SC-003 and delayed-details SC-008 suites executed via `npm run test:acceptance`: 14 passed, 2 failed as expected before spatial implementation.
- Genuine pre-spatial failure: Next navigation currently performs Foundation immediate non-spatial cutover, so `movingDraws.length` is 0 (expected > 0 intermediate draws with phase `'moving'`).
- Delayed-details synchronization tests passed: holding details >500ms preserves visual/accessibility curtain and suppresses position announcements while candidate preflight succeeds; release settles with matching details and exactly one position mutation. Superseded gate release and corrupted texture recovery passed.

### US2 completion evidence (T022–T026)

- Implemented adaptive two-slot choreography in `src/lib/model-viewer.ts` with smoothstep easing, outgoing left/shrink and incoming right/grow (mirrored for previous), scale `0.72 ↔ 1`, travel distance `D = (cameraDistance + 1) * tan(fov/2) * aspect + 1`, and `moveDurationMs = max(120, min(360, deadline - now - 75))`.
- Interruption and suspension rules in `src/lib/model-viewer.ts`: mid-slide tab hiding and window blur freeze presentation progress and visible elapsed time; resuming from hidden tab continues smoothly from frozen pose without endpoint snap or replay. Back-to-retained cancels pending candidate without self-slide and restores retained resting pose.
- Native activation guarding in `src/components/ProjectCarousel.tsx`: buttons set `aria-disabled` during movement while retaining focus; busy input is ignored.
- Automated acceptance suite (`npm run test:acceptance`): all 16 tests passed across desktop (1280 × 832) and mobile (375 × 812). Normal activation-to-compositor presentation settled in under 500 ms (observed 460–477 ms including cold parse, decode, layout, preflight, movement, and swap). Delayed-details tests verified curtaining, candidate validation while held >500 ms, zero mismatched image/detail pairings, and exact-once position update on release. Corrupted texture and single/empty catalog tests verified clean recovery and disabling.
- Saved contact frames in `evidence/browsing-slide-start.png`, `browsing-slide-mid.png`, `browsing-slide-end.png`.

### Cross-cutting and publishing evidence (T027–T029)

- Ten model and mode changes verified: one persistent viewer canvas, transparent background preserved, at most two renderable candidate/outgoing assets. Original authored textures and materials retained.
- External resource rejection: `tests/support/fixtures/external-image.glb` rejected with "This model references external resources. Use a self-contained GLB file" before any network call. Corrupted texture decode in `broken-image.glb` handled cleanly in every display mode with onward navigation permitted.
- WebGL context loss: induced context loss successfully transitions to `unavailable` with "The graphics context was lost. Reload the page to view models again" and disables interactive loop.
- Production build & preview: `dist/` contains only production bundles (`index.html`, assets, and owner model `practice_axeTexture.glb`). Zero test fixtures, harness globals, or acceptance branches shipped. Served normal preview page at 1280 × 832 and 375 × 812 shows healthy single-item presentation, turntable spin, manual return, modes, zero horizontal overflow.
- Contract verification in disposable environment: verified sorted recursive `.glb` regular lowercase discovery, ignored non-glb and uppercase files, duplicate basename disambiguation, space URL encoding without `/glb/` prefix, and blank description sidecar omission. Build and preview with `--base=/portfolio/` succeeded with matching asset paths.

## Amendment evidence — 2026-10-30

- `npm run typecheck` and `npm run build` passed. `npm run test:acceptance` passed all 16 tests at desktop and mobile widths after the eager-loading change; a separate attempted run was blocked by an already occupied acceptance port and was rerun after releasing the owned service.
- Actual Chromium production preview: the canvas and carousel measured 1120px at a 1280px viewport and 325px at a 375px viewport, with no page-level horizontal overflow and two page canvases. A 24.354-second screenshot sequence showed substantial image change at 6 seconds and a closer view at 24 seconds; this is not a calibrated ±1° revolution measurement. Five pointer-drag cycles showed visually changed inspection frames and return frames captured 449–458 ms after release; the image differences were not calibrated to degrees.
- Real three-fixture startup with B's response held observed requests for A, B and C and successful Alpha settlement before B was released. Request interception failing B showed a named Beta error and successful onward Gamma settlement; failing initial A still allowed Beta settlement. A → B → A navigation made no additional fixture requests after startup. Strict Mode replay caused two observed request sets.
- An isolated `/portfolio/` build and preview presented the actual axe and hammer models and navigated to the hammer; the source axe SHA-256 remained `5f0ebd5ef25f39d5ef55fe93194ac25d943ed6fbaf6131db719f285b3edce74d`. The Figma API returned HTTP 429 during implementation; layout used the previously retrieved component geometry.
- Limits: Physical touch and screen-reader speech were not exercised. The full five mixed-input/hidden-pause acceptance matrix has not been independently completed in this amendment pass.
- After a pending B selection was superseded by C, releasing held B left the current title, ready state and live position on Gamma. Inducing `WEBGL_lose_context` in nested-base preview produced the expected terminal unavailable message. Normal production output contained owner assets and no `__ACCEPTANCE__`, fixture-title, candidate-hook or temporary draw-probe matches; source and both built axe copies had matching SHA-256.
- A disposable per-mesh `onBeforeRender` probe on the real Three.js runtime and fixture assets observed only A at rest, A and/or B during Next, only B at its rest, and B and/or A during Previous. Two isolated preflight draws were recorded separately. The probe used a throwaway direct-runtime mount and was removed; the real-component acceptance suite separately checks selection settlement.
- A throwaway direct-runtime mount held two decoded ImageBitmaps until after viewer disposal; releasing them then resulted in two observed `ImageBitmap.close()` calls. The monkeypatch and temporary canvas were removed. A separate isolated nested-base catalog with duplicate spaced filenames showed independent parent-qualified titles, an optional caption, blank-caption omission and encoded URLs; symlink and uppercase model entries were not registered.
- Isolated nested-base builds and real previews covered missing, empty and single-model roots, including disabled navigation and a symlinked caption ignored on the single model. Normal and nested published copies of the owner axe matched the source hash.
- A real single-fixture mixed keyboard/pointer inspection held the manually inspected image unchanged after pointer release while keyboard focus remained (mean image difference 0.0004); after focus left, a return image was captured 448 ms later. A 5° keyboard reference differed from the saved image by 0.4617 mean RGB levels, versus 0.2182 for that return capture; these image averages do not establish a 1° angular error. A separate external-image GLB was rejected with the self-contained-packaging error before any external resource was observed.
- In the real fixture harness, context loss during loading, active pointer inspection, return and movement each produced the selected model's terminal unavailable message. Ten model/mode changes retained one fixture viewer and reached the expected ready position. A disposable direct-runtime GL-error injection failed B's first draw, identified B, and then selected healthy C successfully.
- Reduced-motion production preview remained pixel-identical over 500 ms, accepted a drag, and returned to its exact captured reference after release. Both mixed-input release orders were exercised: keyboard ownership prevented pointer release from resuming motion, and pointer ownership prevented keyboard-focus departure from resuming motion. The attempted real hidden-tab exercise in managed headless and headed Chromium reported `document.visibilityState === "visible"` after switching pages; a native keyboard-switch attempt timed out. No hidden-tab timing pass is claimed.
