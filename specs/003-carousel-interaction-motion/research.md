# Research: Carousel Interaction Motion

**Revised**: 2026-10-30 for the startup-loading and Figma-layout amendment. Earlier motion research below remains applicable except where this amendment explicitly supersedes it. This is planning, not evidence that the amendment has been implemented or measured.

## Amendment research closure

**Decision — all-model startup loading**: Start one independent load for every static catalog entry when the viewer runtime mounts. Retain each successfully parsed asset for the runtime lifetime in a per-model registry; initial selection proceeds as soon as its own load and metadata proof are ready. A failure belongs to that model, not the viewer or other loads. Selection consumes the matching ready/pending/failed entry without starting another fetch. Late completion can update its registry entry but cannot settle a stale selection.

**Rationale**: `src/lib/model-viewer.ts` currently starts `loadModel` only from `select`, treats only candidate/displayed loads as alive, and retires outgoing assets. Those policies must change to fulfill FR-015. Per-load validation, guarded disposal and metadata ticket checks remain essential. All catalog loads start independently rather than using a worker queue that waits for earlier loads.

**Alternatives considered**: Selected-only or neighbor preload violates startup requirements; disposing on every selection defeats reuse; a global cache complicates ownership and teardown. Retention increases network, decode and memory pressure; hidden assets are not freed. The catalog has no specified size limit, so no unrequested cap or eviction is introduced.

**Decision — visibility and validation**: Retain many loaded assets but expose only the selected asset at rest, or the outgoing and incoming assets during transitions. The existing isolated centered candidate preflight may draw a candidate in a non-presented probe; it must restore the presentation before paint and is not an on-screen carousel frame. Preserve original materials, shared mode overrides and one renderer.

**Rationale**: Current `presentation.visible` and isolated candidate preflight already separate draw participation from resource lifetime. Selection, ticket proof, draw validation and synchronous settlement remain selection-scoped rather than being triggered by background loading.

**Alternatives considered**: Rendering a row of neighbors violates FR-016; treating hidden as disposed contradicts retained preload; removing first-draw validation would weaken current error behavior.

**Decision — canvas and Figma**: Reorganize the main carousel area to span its available width, layer the existing navigation buttons above the transparent canvas, and keep the centered title and mode row plus description outside the model motion. Adapt Figma component `39:205` responsively, not as a static image. Keep focus and native pointer targets on the buttons and canvas.

**Rationale**: The Figma main component has a 1152px-wide main area with navigation overlaid, a centered title, image region and mode row, and description beneath. The current `styles.css` constrains the viewer inside a 732px card and places buttons in separate grid columns. The widened stage changes aspect ratio, camera projection and travel calculations; fit and both motion directions need actual desktop/mobile verification.

**Alternatives considered**: Stretching the canvas bitmap by CSS alone would misalign drawing and input. Making the entire page a WebGL layer exceeds the specified carousel boundary. Keep the existing React artwork, semantic controls and background.

**Verification boundary**: Existing acceptance fixtures and Chromium compositor suite are implemented; extend them for concurrent startup, held and failed loads, no unwanted fetch on revisit, draw participation and responsive overlay. Historic timings and screenshots predate the amendment. The unfilled constitution supplies no adopted gates. No amendment browser or performance measurements were performed during planning.

## Historical motion research (2026-10-29)

The following decisions remain historical where they prohibit preloading or retention; the amendment decisions above supersede those prohibitions.

## 1. Reuse the existing stack and resource pipeline

**Decision (superseded in part)**: Keep the existing React, TypeScript, Three.js, Vite and Tailwind stack, one persistent transparent renderer, camera/lights, original materials and catalog. The amendment replaces the former no-preload/no-cache choice with a carousel-lifetime model registry. The existing Playwright suite remains the acceptance baseline.

**Rationale**: `package.json:6–30` contains the current commands/dependencies and no test runner. `ModelViewer.tsx:24–46` separates runtime lifetime, selection and mode. `model-viewer.ts:44–262,565–617` already validates embedded resources, tracks late disposal and fits/draws models. Replacing those mechanisms adds risk without satisfying a new visitor need. The supplied axe is 7,821,812 bytes (observed filesystem size); decode/upload/first-draw preparation is real work and cannot be assumed free. No preparation-duration benchmark was run. [Pinned runner metadata](https://registry.npmjs.org/@playwright/test/1.64.1) declares Node >=20; this establishes engine compatibility, not a tested installation.

**Alternatives considered**: React Three Fiber/Drei, animation/state-machine packages, permanent neighbor previews and manual-only testing. All-catalog preload and retained resources are now required by the amendment; no new runtime package is needed.

## 2. Measure normal navigation from activation, not readiness

**Decision**: The parent takes the accepted native button `click` event timestamp as immutable `activatedAtMs`, in the page's performance time origin. This applies to pointer and native Enter/Space activation; do not start at pointer-down, key-down, handler completion, channel registration or model readiness. Runtime derives `deadlineAtMs = activatedAtMs + 500`. Preserve it through lazy registration, fetch, parse, metadata staging and preflight.

At the first eligible movement callback after both gates are valid, choose once:

`moveDurationMs = max(120, min(400, deadlineAtMs - nowMs - 50))`

Use the same page-origin monotonic clock for `nowMs`. The 50 ms is planned final-frame/draw/compositor headroom; 120 ms preserves perceptible directional motion. These are engineering defaults, not new specification tolerances. Early preparation leaves up to 400 ms movement; later preparation shortens it. Normal real-browser acceptance still requires the actual presented settlement within 500 ms of activation.

**Rationale**: A fixed 400 ms slide after preparation can exceed the total deadline. [Event.timeStamp](https://developer.mozilla.org/en-US/docs/Web/API/Event/timeStamp) identifies event creation in the relevant time origin. [RAF documentation](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) distinguishes callback timestamps from actual repaint and warns about refresh-rate-dependent progression. Preparation, frame scheduling and final presentation must all remain in measured latency.

**Alternatives considered**: Restarting a 500 ms clock at readiness; fixed 400 ms regardless of preparation; hiding latency with a fake clock; snapping every late healthy destination. The amendment now explicitly requires startup preload; the original activation deadline remains.

**Failure boundary**: The formula is not a universal 500 ms guarantee. Preparation <=330 ms leaves the planned 120 ms minimum and 50 ms reserve; actual frames may consume more or less. Arbitrarily slow network/decode/GPU work cannot be bounded by animation math. Late healthy content still completes safely with directional motion; an ordinary SC-003 measurement over 500 ms fails. Never discard validation, forge ready, waive the result, or retroactively call an unplanned slow load a deliberately delayed test. Only the acceptance scenario that deliberately holds details is exempt from the normal deadline assertion. That exemption exists in test setup, not a production flag.

## 3. Preserve the last visible pose through suspension

**Decision**: One scheduler owns dirty rendering, turntable, return and navigation. Freeze visible progress during hidden document, offscreen/zero-size viewer or inactive window. Resume from the last presented pose/progress; do not snap interrupted navigation to its endpoint. Retain the original activation timestamp as raw latency evidence, even across interruption.

**Rationale**: The revised spec explicitly requires resuming without a skipped rotation or sudden jump. The old navigation endpoint-snap recovery is obsolete. Normal timing cases run continuously visible/active; visibility-interruption cases establish continuity separately and are not reported as passing normal-latency measurements.

**Alternatives considered**: Hidden-time catch-up, resetting the activation clock, resolving every hidden navigation at its endpoint, or recurrent polling while no work can be presented.

## 4. Choose explicit input ownership and a visible-time return clock

**Decision**: Keep a selection-local Set containing independent primary-pointer and keyboard-inspection tokens. Only empty ownership with a saved target starts return. Keyup does not release keyboard-focus ownership; pointer-only focus does not acquire it. Window blur releases inspection and pauses automatic motion. Use 350 ms smoothstep, fixed shortest per-axis deltas, and preserve the original target through regrabs. Reduced motion restores an ownerless target without interpolation and presents it at the next eligible draw.

Measure eligible time from release/resume events, not only from the first subsequent RAF: include visible scheduling time, freeze accumulated time during suspension, and never cap away an eligible stall to manufacture a timing pass. A regrab starts a new return leg only after all activity ends again. Acceptance measures visible portions and reference poses externally; internal scalars are diagnostic evidence only.

**Rationale**: This is a compact way to implement the visitor's independent-control and pause rules. It is a planning choice, not an owner-required collection type. Per-axis `atan2(sin(delta), cos(delta))` avoids unwinding complete revolutions while preserving `qX(pitch) × qY(yaw)` and the original target.

**Alternatives considered**: One exclusive owner enum, any-focus-pauses-spin, spring settling with an uncertain duration, unwrapped-angle return, and a globally shortest quaternion path that changes the established two-axis semantics.

## 5. Choose an immediate curtain and exclusive presentation bridge

**Decision**: React owns real title/caption text and markers. A small parent bridge exclusively owns their curtain attributes, canvas accessible name and children of an otherwise-empty position live region. Close the curtain synchronously before staging/selecting. A focused metadata component uses `useLayoutEffect` to verify the actual current title/caption-or-absence DOM. Candidate model validation and current DOM proof jointly gate movement.

After the final centered draw, a synchronous `finalize(ticket): boolean` rechecks request/channel/node proof, reveals committed text, names the canvas and updates the independent position region once before the callback returns. Only true permits ready/outgoing retirement/input. False restores the previous valid presentation before paint and waits supersedably for renewed proof. No drawing from the layout-effect stack, passive-effect reveal or `flushSync`.

**Rationale**: Current `ProjectCarousel.tsx:35–38,54–60,73–75` changes selection text/live content immediately; current `ModelViewer.tsx:40–42` selects later through an effect. [React layout effects](https://react.dev/reference/react/useLayoutEffect) run after commit/before repaint. [React refs guidance](https://react.dev/learn/manipulating-the-dom-with-refs) permits mutation only of parts React has no reason to update. Exclusive ownership prevents competing writers and removes the separate React commit/reveal race without per-frame React state.

**Alternatives considered**: Keep outgoing text visible, render duplicate metadata trees, let JSX and the bridge both write the same attributes/live children, hide the whole card, or assume a queued state setter proves current text is committed.

## 6. Keep two slots and genuine candidate validation

**Decision (superseded in part)**: Keep outgoing and latest candidate as the only presentation participants, but retain the complete loaded catalog in the runtime registry. Isolate the candidate at centered/full fitted size for its draw-call/GL-error validation, then restore/redraw the prior presentation in the same callback before paint. Preserve per-load resource ownership, external-URI rejection and decode/bounds failure checks.

**Rationale**: Outgoing draw calls cannot validate an invisible candidate. A pending or retained nonparticipant must never settle a selection without the current ticket, or become visible outside an isolated probe. Noncancelable decoders completing after disposal must release their own resources.

**Alternatives considered**: Delete outgoing on activation, count overlapping draw calls as candidate readiness, extra renderers, geometry copies, and error-masking material fallbacks.

## 7. Use external real-time acceptance for SC-003

**Decision**: Add one permanent Chromium acceptance suite, real components and distinct textured fixtures outside `glb/`. Measure ordinary cases on a real, unmocked clock. Capture actual native click activation independently in the test entry before React handles it. Record compositor frame images/timestamps through Chromium CDP screencasting, acknowledge frames promptly, and process images after the measured interval. Correlate frame-swap timestamps with the page time origin; verify that the bundled Chromium supplies a usable timestamp. Missing/ambiguous timing evidence is an acceptance prerequisite failure, not permission to substitute an internal ready callback.

Use recognizable fixture pixels/reference views, actual DOM visibility/accessibility and position-message changes to establish settlement. Runtime post-presentation group/matrix evidence and candidate-preflight diagnostics support identity/scale analysis but cannot alone prove what was displayed or start/end the latency clock. Do not warm the destination's fetch/decode path just to pass: include fresh-context first navigation as well as repeats, both directions/wraps and both widths. Record capture overhead and environment; never subtract overhead or increase the 500 ms threshold.

**Rationale**: [CDP Page](https://chromedevtools.github.io/devtools-protocol/tot/Page/) and its [primary schema](https://github.com/ChromeDevTools/devtools-protocol/blob/master/json/browser_protocol.json) define `startScreencast`, compressed `screencastFrame` images and frame-swap timestamps. These APIs are experimental; compatibility must be exercised at implementation. [Playwright webServer](https://playwright.dev/docs/test-webserver) provides an owned strict-port server. A fake animation clock omits real load/parse/paint cost; screenshots polled from the test process are not precise event timestamps.

**Alternatives considered**: JSDOM/model mocks, ready-callback echo, a screenshot polling loop as a stopwatch, fake-clock SC-003, internal transforms alone, and widening tolerances for a slow software renderer. None proves the requested normal visitor latency.

## 8. Keep delayed-details acceptance separate and nonvacuous

**Decision**: Choose stable per-ticket metadata-only Suspense/React `use` gates in acceptance mode to delay actual title/caption availability >500 ms. This is one useful test mechanism, not a specification mandate. Keep real network/decode/render/RAF running. Verify immediate visual and accessibility exclusion, no in-flight success-position update, no mismatched image, actual eventual distinct centered destination and exactly one matching position update. Cover superseded gates/revisits, ordinary Next/Previous, reduced motion and failure recovery. No production `isDelayed` branch or request deadline reset.

**Rationale**: A real delayed subtree exercises the chosen coordination boundary rather than merely withholding a forwarded notification. The same production guards handle organic and injected delay. A zero-mismatch array alone could pass without showing any destination; eventual visual identity and accessibility are mandatory. OS speech completion timing is not measured by DOM/live-region availability.

**Alternatives considered**: Global React scheduler monkeypatching, a fresh Promise every suspended render, blocking the whole card/event loop, manual-only checks or calling organic slowness an injected delay.

## 9. Workflow and evidence boundary

**Decision**: The planning pass regenerated this research, plan, data model, component contract and quickstart while preserving the approved spec, 16/16 checklist and then-existing backlog. The subsequent regenerated [30-task backlog](tasks.md) now carries activation timestamp propagation, adaptive movement, separate normal-latency/delayed-details acceptance and freeze/resume. Shared initial settlement remains in Foundation before either story; shared-runtime edits remain sequential. No runtime implementation is claimed.

**Observed this run**: Setup returned feature identifier `003-carousel-interaction-motion` and retained the existing plan file. Optional Git hooks were parsed/offered, not executed. The required updater command returned 127; the installed script inventory has no updater, so update existing `AGENTS.md` manually. Behavior search failed because its judge service rejected requests; literal source searches and two scouts supplied the code evidence.

An abstract timing smoke checked selected preparation times 0–330 ms with adaptive movement plus two 17 ms frame allowances; late preparation remained a raw miss. A separate equation check exercised short-angle endpoints and 120 ms + 230 ms visible return around an excluded pause. These are design calculations, not application or browser acceptance. No package install, test source, runtime change, screenshot, build, typecheck or measured GPU/load latency is claimed. Performance must be proved on the actual implementation; this plan does not promise <=500 ms on arbitrary networks/devices or grant them a passing waiver.
