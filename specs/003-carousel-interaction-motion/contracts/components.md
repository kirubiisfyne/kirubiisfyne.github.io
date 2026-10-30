# UI, Motion, Settlement and Acceptance Contracts

**Status**: The original motion and settlement behavior and the 2026-10-30 startup-loading and layout amendment are implemented; see [quickstart.md](../quickstart.md#amendment-evidence--2026-10-30) for observed verification and limits. Preserve the [specification](../spec.md), feature 002 [UI](../../002-gltf-model-carousel/contracts/components.md) and [asset/publishing](../../002-gltf-model-carousel/contracts/model-assets.md) contracts except explicitly superseded clauses.

## 1. Coordinator and native activation

`src/components/ProjectCarousel.tsx` retains static readonly `projects`, native Previous/Next buttons and one module-scope lazy unkeyed viewer. Adopt Figma ProjectCarousel `39:205` responsively: the Three.js canvas spans the carousel width beneath operable overlaid navigation controls, while title, mode row and description remain stationary. Empty mounts no viewer; zero/one entries natively disable navigation independently of healthy single-model modes.

The parent synchronously guards accepted intent. Loading/waiting is latest-wins, advancing from latest requested cursor; moving rejects activation without cursor/token/timestamp change or queue. Temporary movement guarding uses aria-disabled without moving focus. Native pointer click, Enter and Space remain equivalent; hover never activates.

For each accepted native button `click`, retain `event.timeStamp` as `activatedAtMs` before React scheduling, bridge work or runtime selection. It shares the page performance time origin; do not use pointer-down/key-down, Playwright command start, handler completion or ready events as activation. Preserve it through lazy initialization and loading. Initial selection alone uses null direction/timestamp and has no navigation deadline.

A lifecycle-registered bound channel receives selection synchronously. Pre-registration keeps only latest intent with its original timestamp/proof. The full static catalog is passed to the persistent viewer at startup for independent loading, not as a new selection per entry. Unregister only originating channel before disposal.

## 2. Exclusive presentation ownership and DOM proof

- React owns the real title/caption text, request/model markers, coarse status/instructions and mode state.
- A small parent bridge exclusively owns curtain attributes, canvas accessible name and children of the stable polite atomic position region, which remains empty in JSX.
- Close the curtain before staging or selecting; opacity 0 plus aria-hidden/inert applies to metadata only, with no transition. Initialize new part refs hidden before paint. Keep title → media → modes → caption and footprints. Do not hide the whole card or put a focused canvas under aria-hidden.
- While pending, canvas name is generic and separate loading/error status names the requested destination. Do not reveal predecessor identity as the destination.
- The focused proposed `CarouselMetadata.tsx` renders the real title/caption parts at their existing positions, never a duplicate hidden presentation. `useLayoutEffect` checks actual current-ticket DOM identity/content; absence of caption is explicit proof. Combine both parts only for the current registration.
- Layout acknowledgment schedules work only. No draw/reveal/message mutation from that stack; no `flushSync` or passive-effect reveal. Stale cleanup can revoke only its own proof.
- After the successful final centered draw, `finalize(ticket)` synchronously rechecks request/channel/nodes and reveals matching text, names canvas and updates the independent position region once. Ready/outgoing hiding/input require true. Coarse React state follows, not controls, settlement.
- False finalization leaves curtain/message unchanged, restores/redraws previous valid presentation before paint and waits supersedably for renewed proof without a recurring loop.
- Current failure clears old pixels and reveals only verified failed-target content; separate error status, no success-position message. Parent handles lazy-module/pre-channel failure; adapter identifies renderer initialization/terminal unavailable requests without fake ready or automatic retry.

Position-message availability is the contract, not OS speech timing. It is independent of staged text and exactly once per successful request, including revisits; duplicate effects/status updates cannot rewrite it. Pending/failed/superseded work produces no new success message.

```mermaid
sequenceDiagram
    participant C as Carousel coordinator
    participant M as React metadata parts
    participant V as Viewer runtime
    participant B as Browser presentation
    C->>C: Accept native click timestamp; curtain; token
    C->>M: Stage current destination text
    C->>V: select(request with original activatedAtMs)
    M->>C: Verify actual current committed DOM
    C->>V: setMetadataReady(ticket, true)
    V->>V: Require model preflight + DOM proof
    V->>V: Choose slide from original deadline remainder
    V->>C: Final centered draw; finalize(ticket)
    C->>C: Reveal + name + position message once
    C-->>V: true
    V->>V: Ready; hide outgoing; unlock input
    V-->>B: Matching final presentation
```

## 3. Adapter and runtime interfaces

`src/components/ModelViewer.tsx` uses one lifetime effect to create/register the runtime with the static catalog and identity-matched cleanup to unregister/dispose. Stable callback refs avoid renderer recreation; separate primitive mode effect remains. Type-only imports preserve lazy Three.js loading. React receives coarse phase/identity, never per-frame motion.

Show healthy outgoing/candidate presentation while loading/moving; remove the old loading-hides-all-canvas rule. Accept rotation only on healthy finalized current content with no pending navigation. Modes stay usable during spin/inspection/return and healthy retained-current loading, disabled during movement, initial empty loading and failure. Preserve group/instruction semantics, scoped touch-action, pointer-only outline suppression, visible keyboard focus/Tab exit, mode artwork/750 ms stepped arrows and reduced-motion static arrows.

Module: `src/lib/model-viewer.ts`.

| Interface/member | Planned contract |
| --- | --- |
| `DisplayMode` | Existing `clay | rendered | wireframe`. |
| `MetadataTicket` | Readonly `requestId: number`, `modelId: string`; local channel/DOM identity additionally authorizes proof. |
| `ViewerSelectionRequest` | Readonly `requestId`, `model: Pick<Project, 'id' | 'modelUrl'>`, `direction: 'next' | 'previous' | null`, `activatedAtMs: number | null`. Null pair only on genuine initial selection. |
| `ViewerStatus` | `requestId`, `requestedId`, nullable `displayedId`; discriminated states below. Not a displayed-latency oracle. |
| `createModelViewer(canvas, catalog, callbacks)` | Initialize one renderer and per-entry load registry; begin all catalog loads independently. `catalog` is static per mount; exact signature may follow the existing options convention. Coarse `onStatus` and synchronous `finalize(ticket): boolean` preserve selection semantics. |
| `select(request): void` | Select the matching pending, ready or failed registry entry using the original activation timestamp and a fresh ticket; no duplicate fetch. Stale/duplicate/disposed requests ignored. Defensive moving rejection agrees with synchronous parent acceptance guard. |
| `setMetadataReady(ticket, ready): void` | Accept/revoke matching proof idempotently. Acknowledgment schedules, never draws/finalizes reentrantly. |
| `setMode(mode): void` | Same-mode no-op; appearance-only shared scene override, no refetch/reparse/remount or pose reset. |
| `dispose(): void` | Idempotently abort pending entries and release registry resources, capture, ownership, scheduler, subscriptions, overrides and renderer; dispose late parse results safely and retain guarded Strict Mode context-loss deferral. |

Only bound select/metadata-ready commands are registered with the parent, not renderer/scene objects. Late callbacks compare their originating identity.

| State | Meaning |
| --- | --- |
| `loading` | Waiting for validated candidate/current details/visibility/size or renewed proof; may retain healthy outgoing. |
| `moving` | Both gates passed, interpolation underway; no rotation or accepted navigation. |
| `ready` | Final actual draw and true synchronous finalization; not parse completion or queued React state. |
| `error` | Identified current failed destination, no old pixels; browsing can continue, no success message. |
| `unavailable` | Terminal renderer/module inability; future requests remain identifiable, no recreation/retry policy. |

## 4. Timing, choreography and suspension

[Data model](../data-model.md#7-navigation-budget-and-shared-scheduler) is authoritative for equations/state. Runtime derives `deadlineAtMs = activatedAtMs + 500`. Current behavior chooses `moveDurationMs = max(120, min(360, deadlineAtMs - nowMs - 75))` at the first eligible movement callback; preserve immutable activation origin and diagnostic raw elapsed through final presentation. No production intentional-delay flag.

Next moves outgoing left/shrink and incoming right/grow; Previous mirrors across wraps. Relative scale 1 ↔0.72; only model roots move, never title/text/controls. Candidate starts yaw=pitch=0. One renderer retains all loaded entries, with at most two model presentation participants. Fixed lights, safe sphere fit/DPR, unmodified authored materials and shared overrides remain. Preserve embedded-resource/decode/bounds checks and isolated candidate-centered first draw; restore previous pixels before paint, excluding probes from presented-frame evidence.

Minimum 120 ms is a planning choice for perceptibility, not permission to waive SC-003. If preparation/frame work causes ordinary presented latency >500 ms, that case fails acceptance even though healthy content still finishes safely. Do not rebase time, widen the threshold, declare organic slowness deliberate, or silently replace normal directional movement with an instant cut. Only reduced motion removes spatial interpolation.

Hidden/offscreen/zero-size/inactive-window conditions freeze progress; resuming continues from the last visible pose rather than snapping to the endpoint. Keep original activation/deadline for raw evidence. Visibility-interrupted cases separately prove continuity and do not supply a normal SC-003 timing pass. Resize preserves normalized progress and recomputes fit/travel.

## 5. Inspection and visible-time motion

Choose a selection-local Set of independent primary-pointer/keyboard-focus tokens. Save target once on first inspection, preserve it through mixed ownership/regrabs, and start return only after all activity ends. Pointer endings remove only pointer ownership; keyup does not end keyboard inspection; focus departure removes only keyboard ownership. Pointer-only focus creates no keyboard activity. Window blur clears inspection and suspends motion; accepted navigation clears without outgoing return/input transfer.

Turntable positive yaw is `2*pi/24` per eligible visible second. Manual `qX(pitch) × qY(yaw)` remains unrestricted, one displayed extent per full turn and 5° arrow steps. Return uses 350 ms smoothstep/fixed shortest per-axis deltas and exact target before spin resumes. Eligibility segments start at release/resume events so visible waiting before a RAF is not erased; freeze, not reset, elapsed time during suspension. A regrab creates a fresh return leg only after final release, retaining target.

Reduced motion preserves manual ownership, disables spin/spatial interpolation and restores an ownerless saved pose without an animated journey; next eligible draw displays it. Model/details validation/finalization remain mandatory for selection. Use one nullable coalesced RAF, cached dimensions and reusable math; no per-frame React state, forced layout loop, hidden catch-up or delta cap concealing elapsed visible time.

## 6. Acceptance boundary and production isolation

Use existing dev-only `@playwright/test` 1.64.1 and [quickstart](../quickstart.md) commands. Existing fixture models and acceptance harness remain outside `publicDir: glb`; only owner work ships.

Normal SC-003 cases use real clock and native pointer/Enter/Space activation, actual compositor frame images and swap timestamps, and real DOM/accessibility observations. Startup preload remains enabled; do not defer it merely to recreate the previous on-demand path or artificially warm a timed case. Missing or ambiguous timestamp/image evidence blocks acceptance, never falls back to a ready callback. Verify actual centered fixture pixels/reference view, not status text alone.

Optional typed acceptance injection is enabled only by `import.meta.env.MODE === 'acceptance'`: stable per-ticket metadata gate Promise, separate candidate-validation diagnostics and post-presentation observation derived from actual last-draw groups/matrices. It does not change activation timestamps, duration allocation or production timing rules. A metadata-only Suspense/React `use` boundary delays actual title/caption availability >500 ms while viewer/loading stays responsive. No new Promise per render or whole-card suspension.

Observe all final presentation callbacks plus compositor images, DOM curtain/accessibility state and dedicated position-region mutations. Runtime diagnostics alone are not displayed identity or latency proof. Delayed cases cover eventual actual destination, zero mismatch/early message, exact-once current update, superseded gate/revisit, both directions/widths, reduced motion and failure/onward recovery. They do not assert a <=500 ms deadline that their own setup deliberately violates.

Harness globals stay in the test entry, never production `src/`. Normal entry must not import tests; normal build eliminates gate/observer branches, not merely leaves them inactive. Inspect output membership/code and actual normal preview. Preserve one viewer renderer/background; no hidden second renderer, broad gallery or mocked acceptance. Required permanent tests remain after disposable instrumentation is removed.

## 7. Implementation handoff

The regenerated [task backlog](../tasks.md) covers startup requests, nonblocking initial settlement, isolated failure, reuse and cleanup, per-model presented draw participation, responsive full-width overlay and required delayed-details acceptance. No amendment runtime or browser acceptance result is supplied by this contract.
