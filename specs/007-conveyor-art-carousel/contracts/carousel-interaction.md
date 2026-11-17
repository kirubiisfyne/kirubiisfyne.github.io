# Interaction Contract: Conveyor Art Carousel

## Side-scaling revision

Side slots use 75% center scale; scale interpolates smoothly during navigation. This supersedes equal-scale language below.

## Current three-slot revision

Rest with three equal-scale, sharp, common-depth slots; transitions include at most four occurrences. Gradual spatial dither remains at both edges. This supersedes the five-slot depth, blur and pixelation revisions below.

## Pixelation revision

Side pixelation supersedes blur in the five-slot revision. Pixel block size grows with depth and interpolates during movement; the center remains sharp.

## Superseding five-slot revision

Five ready positions at rest (one for a single entry), six during movement; repeated occurrences share logical asset ownership. Center renders sharp and forward; inner and outer positions progressively shrink, recede and blur, interpolating continuously while moving. Desktop fits five, mobile may crop outer positions. This supersedes the three-position, common-depth and four-occurrence descriptions below; navigation, lifecycle and accessibility rules remain binding.

## Boundary

Existing React carousel UI ↔ one persistent renderer/controller. No new HTTP API or persisted schema. Internal type names may differ; the observable rules and ownership boundaries below are binding for implementation.

## 1. Navigation Admission and Dispatch

- For a multi-artwork catalog, each native Previous/Next button activation (mouse, touch, Enter, Space) enqueues one direction, including during loading and movement.
- Navigation remains disabled for zero/one artwork. A busy animation alone must not set the buttons' `disabled` or `aria-disabled` state.
- Canvas arrow keys retain existing model-inspection semantics; do not repurpose them as belt navigation.
- FIFO entries capture direction and native timestamp plus lightweight input sequence. Resolve the next logical index modulo catalog count when service starts; assign a fresh viewer request ID then. Initial model preparation counts as active service; activations during it queue until initial readiness or recoverable error.
- No dropped, merged, reverse-canceled or superseded input in healthy operation. A queued destination must not curtain/change current metadata until it enters service.
- One active service at a time. Drain on a later animation frame after settled ready/error state is established, not inside the synchronous renderer finalization callback.

### Request Timing

Preserve `ViewerSelectionRequest.activatedAtMs` as the normalized native event time. Add a service timestamp field (planned name `serviceStartedAtMs`) rather than overwrite activation time. Initial/non-navigation selection may use null timestamps.

For an idle activation, keep native activation as the deadline origin. For a request that waited in FIFO, use service start as the deadline origin. `deadlineAtMs = origin + 1500`. Keep existing preparation guards and final-presentation reserve. Instrument total latency and service latency separately.

There is no 1500 ms bound on total waiting for an arbitrarily long queue. Nominal slide is 700 ms when readiness and budget permit; late preparation proportionally shortens it. Preparation held beyond the deadline settles without extra decorative travel after readiness is satisfied.

## 2. Presentation Geometry

- Ready rest positions are previous/center/next with common Y/Z. Side models use 75% of the center's normalized scale.
- Neighbors use authored default pose; center may turn/inspect. Authored roll stays inside inspection rotation.
- Next shifts each visible participant left one slot; Previous shifts right one slot. Position follows one monotonic smooth curve, while models entering/leaving the center smoothly grow/shrink between side and center sizes. No tilt, depth arc, reversal, overshoot or rear crossing.
- A stationary spatial ordered-dither fade progressively removes fragments near both visible horizontal edges before clipping. It applies in every display mode and under reduced motion; center fragments remain solid. Entering/exiting may repeat logical artwork IDs but must have separate instance IDs and transforms.
- Use even ambient/directional illumination instead of a concentrated spotlight; retain authored material and geometry appearance.
- Zero entries mount no viewer; one entry has exactly one occurrence. Two entries have center A and neighbors B/B; three entries permit separate outgoing/incoming occurrences of one artwork during wrapping.
- Failed/not-ready preview slots stay empty. A neighbor becoming ready mid-slide may join at rest, not alter the captured moving participant set.
- No continuous scrolling, draggable belt, clickable preview selection, new controls or new literal belt decoration.

## 3. Controller and Layout Options

Preserve `select`, `setMetadataReady`, `setMode`, and `dispose` behavior and their lifetime guarantees. Introduce canonical belt-spacing terminology without gratuitous compatibility breaks:

- Planned `beltSpacing` option and runtime setter/getter express positive spacing multiplier, not depth or radius.
- Existing `orbitRadius`, `setOrbitRadius`, `getOrbitRadius`, `--orbit-radius`, and `--carousel-orbit-radius` become deprecated spacing aliases for this feature.
- Precedence among valid positive finite values: canonical `beltSpacing` option, CSS `--carousel-belt-spacing`, legacy `orbitRadius` option, CSS `--orbit-radius`, CSS `--carousel-orbit-radius`, default 1.0. Keep the default at 1.0 in viewer logic rather than setting a stylesheet variable, so explicit legacy CSS aliases remain usable.
- Invalid/nonpositive/nonfinite values are ignored in favor of valid configured/default spacing.
- Runtime spacing updates remeasure the existing renderer, preserve normalized motion progress and do not reload models or recreate the renderer.

## 4. Selection and Metadata Transaction

1. Dispatch the queue head, curtain destination title/caption visually and with `aria-hidden`/`inert`, and send the selection request.
2. Independently finish candidate readiness/per-mode validation and metadata proof.
3. Move only when the candidate and proof permit; reduced motion skips intermediate travel.
4. Draw the destination centered in its final rest stage using the same renderer.
5. Synchronously validate and finalize the matching `{requestId, modelId}` ticket; reveal destination details.
6. Report `ready` and update the dedicated position live region once.
7. After a presented settlement opportunity, dispatch the next queued entry on a later animation frame.

Visual copies receive no separate DOM description, metadata ticket, selection index, or announcement. Failure or stale proof must not announce successful settlement. Queueing does not remove existing stale-request guards.

## 5. Inspection and Display Modes

- Raycast visual occurrences; inspect only the active center occurrence. Same logical artwork ID is not sufficient proof of center ownership.
- Preserve unrestricted pitch/yaw, positive-yaw 24-second turntable, separate pointer/keyboard ownership, 350 ms per-axis shortest return and regrab target preservation.
- Outgoing center pose eases back to authored default during horizontal translation. Arriving center starts default, then resumes turntable only when ready/eligible.
- Neighbors remain static at default pose, including copies of the currently rotating artwork during a transition.
- Keep Clay, Rendered and Wireframe semantics via `scene.overrideMaterial`; navigation retains mode, mode changes preserve current inspection pose and do not reload models.
- Preserve pointer-versus-keyboard focus presentation and existing stage gesture behavior.

## 6. Failure, Visibility and Cleanup

- Independent retained loading and preview-validation isolation remain unchanged at the logical-asset boundary.
- Recoverable destination failure establishes existing error selection, emits no success announcement, and releases FIFO for onward navigation from that logical index. If no healthy displayed model exists, retain the existing nonanimated recovery path.
- Terminal context loss cancels/clears pending animation queue work and retains existing unavailable UI and navigation semantics for later activations.
- Hidden/offscreen/unfocused viewers freeze visual motion and queue dispatch; visibility restoration resumes serial work without skipping entries or fabricating settlements.
- Unmount cancels drain callbacks, clears queue refs, detaches occurrences, disposes clone-owned resources and retires each asset owner once. Preserve Strict Mode renderer reuse/deferred context-loss behavior.
- Repeated occurrences must not produce extra fetches/parses or double-dispose shared geometry, materials or textures.

## 7. Responsive and Reduced Motion

- Preserve body-width canvas alignment, stage aspect ratio, root-zoom compensation, transparent clear and DPR cap.
- Preserve center prominence. Mobile may crop neighbors; do not shrink all three to fit or create horizontal page scrolling. Existing controls remain unobscured/usable.
- Reduced motion removes belt travel, idle turntable and decorative movement; deliberate model inspection and serial readiness/metadata settlement remain available.

## 8. Acceptance Boundary

Samples distinguish `instanceId` from `modelId`, retain native activation/compositor data, and include service timing and queue order. Assert at most four transition occurrences and three rest occurrences, not four distinct artworks. Production excludes acceptance entries, fixtures and instrumentation. Validation must cover both permanent viewport projects; screenshots supplement, not replace, geometry/timing/metadata assertions.
