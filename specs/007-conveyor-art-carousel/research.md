# Research: Conveyor Art Carousel

**Date**: 2026-11-17<br>
**Scope**: Repository inspection plus Three.js r186 documentation. Historical research: the later user request for smaller side models supersedes the equal-scale decision in this document; see the updated specification and plan.

## 1. Retain the existing viewer and metadata protocol

**Decision**: Modify `src/lib/model-viewer.ts` and `ProjectCarousel.tsx` rather than replace their rendering/selection architecture.

**Evidence**: The graph and source inspection connect `ProjectCarousel`'s selection/request refs, metadata proof/curtain and `finalize` callback to `ModelViewer`'s controller and the persistent renderer. `restStage`, `snapshotMovement`, `moveStage`, and the frame callback localize most old choreography. Candidate preparation and final centered rendering already have acceptance instrumentation.

**Rationale**: The visual path is changing, not catalog discovery, resource validation, material modes or metadata guarantees. Keeping the existing transaction reduces regressions.

**Alternatives considered**: A second renderer/component would duplicate resource/lifecycle logic and risk desynchronized metadata. CSS movement of the whole canvas cannot keep independent center inspection, equal slot layout, and seamless wrapping correct.

## 2. Separate artwork assets from occurrences

**Decision**: Keep one retained asset/resource owner per catalog ID; allow several independently transformed belt instances to reference it. Use Three.js `SkeletonUtils.clone` for scene hierarchy copies.

**Evidence**: Current `LoadContext` owns a single `presentation`, `rotation`, yaw/pitch and resource tracker. Current `assignments` returns a `Map<LoadContext, Slot>`, which cannot represent two neighbor occurrences of one artwork. Three.js r186 documentation states `SkeletonUtils.clone` clones descendants and bones, preserves SkinnedMesh/bone associations, and reuses geometry/material by reference. The bones must be descendants of the cloned object. Skeleton disposal is required when its resources are no longer used.

**Rationale**: Two-artwork rest state and three-artwork wrap transitions require repeated identities. Ordinary group reuse reparents the same scene; an ordinary clone alone is insufficient for reliable skinned hierarchies. Independent skeleton ownership must not imply independent geometry/material/texture ownership.

**Alternatives considered**: Reparse/refetch for each occurrence wastes resources and breaks independent retained loading. GPU `InstancedMesh` is not a generic replacement for arbitrary multi-mesh/skinned glTF scenes. Forbidding duplicates contradicts the user's answer.

**Implementation cautions**: Shared materials also share custom dither hooks. Do not attach conflicting occurrence-specific fades to them. Track clone-owned skeleton/bone-texture resources without letting the clone disposer traverse/dispose shared mesh materials, geometry or textures. Test repeated creation/recycling/unmount and preserve parser tracking hooks.

**Documentation source**: Context7 `/mrdoob/three.js/r186`, query on SkeletonUtils.clone and shared-resource disposal; official reference pages: https://threejs.org/docs/#examples/en/utils/SkeletonUtils and https://threejs.org/manual/en/how-to-dispose-of-objects.html . Installed runtime is 0.186.1; verify installed addon types during implementation.

## 3. Use four physical coordinates, not rear paths

**Decision**: Rest coordinates -1/0/+1; add +2 for Next or -2 for Previous. Every occurrence translates by one slot at common Y/Z/scale. Recycle only after clipping makes the outgoing occurrence invisible.

**Evidence**: Existing `moveStage` contains special two-artwork arcs, three-artwork rear crossings, center/preview depth arcs, scale interpolation and transition dither. Existing slots are center scale 2.2 versus preview 0.62, with rear depth and 22.5° tilt. Those are precisely the superseded behaviors.

**Rationale**: A physical occurrence model handles all catalog sizes with the same formula, bounds simultaneous work, and never asks one object to move left and teleport right in view. For two artworks, four occurrences still refer to only two retained assets.

**Alternatives considered**: Keeping distinct-only participants forces visual gaps or wrong-way wraps. Moving every catalog entry wastes draw/setup work. A simple modulo of X coordinates without clipping can visibly teleport large models at wide viewport edges.

## 4. Keep center size; crop rather than fit-to-row

**Decision**: Start from current normalized center scale and stage-relative projected size. Use common-depth spacing and a horizontal aperture; mobile may show only portions of neighbors.

**Evidence**: Current `measure()` expands the canvas to body width and compensates camera FOV for stage size and root zoom. Its camera distance and near/far also incorporate old orbit depth and preview layout, so replacing slot positions alone would change framing unexpectedly. `src/styles.css` currently exposes `--orbit-radius: 1.4`.

**Rationale**: User selected prominent center and cropped mobile neighbors. Equal sizes must not imply forcing three artworks into a narrow viewport or making mobile inspection too small. Geometry/aperture math must keep recycled instances outside view while preserving the existing DOM canvas contract.

**Alternatives considered**: Fit all three equally to mobile width contradicts the answer. Retaining old depth-driven camera fitting undercuts equal apparent scale. Renaming every exposed orbit option without compatibility would cause avoidable integration breakage; map deprecated aliases to spacing for now.

## 5. Keep a single smooth motion phase

**Decision**: Use existing quintic smoothstep (`easeInOutSmooth`) once over a nominal 700 ms slide. No anticipation or overshoot; preserve the 1500 ms service budget and current final-presentation reserve.

**Evidence**: Existing motion is 250 ms anticipation +700 ms forward motion +250 ms overshoot settling, with a 1500 ms deadline and 175 ms reserve. The required easing helper already exists. The user selected straight smooth travel rather than mechanical or continuous motion.

**Rationale**: One monotonic scalar establishes conveyor direction and makes resize/visibility handling testable. Existing shortest per-axis pose return remains separate from positional travel.

**Alternatives considered**: Spring/overshoot violates requested movement. Linear easing is simpler but introduces abrupt starts/stops. A new animation package is unnecessary.

## 6. Queue every activation, but service one selection at a time

**Decision**: Use a ref-owned FIFO in `ProjectCarousel`, containing input direction and original native activation time. Resolve destination and assign request identity only at dispatch. Drain after final settlement on a later animation frame.

**Evidence**: Existing `navigate()` ignores input while `phase.current === 'moving'` but accepts/replaces requests during loading; its destination derives from the requested index, so loading supersession can skip to a nonadjacent model. Buttons currently use moving-only `aria-disabled`. User explicitly chose queue every click when asked about this conflict.

**Rationale**: Serial dispatch preserves one-slot continuity, does not expose queued metadata early, and makes every activation observable in order. A later frame between settlements prevents immediate re-curtaining before a settled draw can be presented. Lightweight refs avoid per-frame React renders; existing React state still records logical selection/status.

**Alternatives considered**: One move at a time and latest-request loading supersession were offered and not selected. Merging opposite directions or an implicit bounded/drop queue would contradict the chosen behavior. Dispatching all requests immediately bypasses one-slot choreography and synchronous metadata settlement.

**Timing consequence**: Keep the original native activation timestamp immutable for end-to-end evidence. Idle moves use activation-based deadlines; queued moves receive a new service-start deadline. An arbitrary queue cannot meet one global 1500 ms activation deadline for every click; this distinction is explicit in the specification. No additional promise about total waiting time is made.

**Failure consequence**: An error is not successful settlement or a position announcement. After establishing the existing logical failed selection, service subsequent queued directions from that index. Terminal/unmounted viewers discard pending animation work rather than retaining dead closures.

## 7. Rewrite superseded assertions; preserve regression evidence

**Decision**: Update existing stage/settlement tests and add focused queue cases. Keep the permanent suite, two viewport projects, native activation/compositor timestamps and distinct textured fixture pipeline.

**Evidence**: `stage-catalog.spec.ts` expects right-only two-entry rest and a rear three-entry crossing. `stage-motion.spec.ts` asserts orbital participants. `stage-readiness.spec.ts` includes loading supersession. These must not remain as requirements after the update. Other existing tests cover independent readiness, metadata proof, mode-specific preview validation and terminal context loss.

**Rationale**: New visuals invalidate old choreography expectations, not reliability checks. Instance IDs must supplement logical model IDs in samples so duplicates cannot be silently collapsed by Maps or Sets.

**Alternatives considered**: Screenshots alone cannot prove direction, same-depth motion, queue order, exactly-once finalization or disposal. A separate permanent gallery or test framework is unnecessary.

## Resolution Status

All product choices needed for planning are resolved. Spacing/clip tuning and clone disposal verification are implementation/validation tasks with defined acceptance checks, not unknown requirements. The constitution remains an unfilled template. No dependency/version changes are planned.
