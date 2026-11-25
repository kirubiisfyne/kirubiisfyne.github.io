# Quickstart and Validation: Conveyor Art Carousel

## Side-scaling revision

Side models again use 75% of center scale, interpolated through movement; the three-slot layout and edge dither remain. This supersedes equal-scale verification below.

## Current three-slot revision

Three full-size sharp models at common depth, with gradual dither at both edges, supersede the five-slot pixelation/blur revisions below. Targeted desktop/mobile acceptance: 78 tests passed across rest, navigation, FIFO, dither at DPR 1/2, readiness, display modes, inspection, short catalogs and resource lifecycle. Full suite was not rerun.

## Pixelation revision

Side pixelation replaces the earlier blur. Inner/outer slots use 4/7 CSS px blocks; block size interpolates with depth while the centered artwork remains sharp. See `evidence/conveyor-pixel-desktop.png` and `evidence/conveyor-pixel-mobile.png`.

## Five-slot visual revision

The five-slot revision supersedes historical three-slot/common-depth and four-occurrence checks below. Center stays sharp and forward; inner/outer slots use 75%/62% scale and 1.5/3 px blur, interpolated during motion. Five positions fit desktop; mobile may crop outer slots. Two-to-four item catalogs repeat occurrences, single-item catalogs do not. Up to six occurrences render in motion. Equal-depth side layers share an offscreen pass; the center draws directly.

Verified: production build and typecheck; pixel comparison confirms blurred sides and unchanged sharp center on desktop and mobile; edge dither passes at DPR 1 and 2; desktop/mobile five-entry wrapping, short-catalog/skeleton lifecycle, readiness, scale/depth interpolation, modes, inspection, reduced motion, FIFO and metadata gates exercised. Superseded hidden-frame and superseded-gate tests were updated and individually rechecked. Final full suite not rerun. The pre-existing desktop game-controller position assertion still fails (expected <627.2, actual 640.65625); the other seven controller tests pass. Captures: `evidence/conveyor-five-depth-desktop.png`, `evidence/conveyor-five-depth-mobile.png`.

## Status

Implementation in progress: horizontal belt, repeated visual instances and FIFO navigation are implemented. Full verification is not complete; see the results below and outstanding tasks in `tasks.md`.

See [spec.md](spec.md), [data-model.md](data-model.md), and the [interaction contract](contracts/carousel-interaction.md) for exact semantics.

## Prerequisites

- Use the Node/npm environment supported by the current lockfile.
- Run commands from repository root.
- Keep owner model files unchanged. Test distinct textured fixtures in `tests/support/fixtures/`, outside `glb/`.
- Stop any process already using acceptance port 5489; the suite intentionally does not reuse an existing server.
- No new dependency, backend, migration or manual project registration is required.

## Install and Baseline

```bash
npm ci
npm run typecheck
npm run build
npm run test:acceptance
```

If dependencies are already installed, installation is optional. Record any existing failures before changing app code; do not silently weaken unrelated tests to get a green suite.

## Develop and Run Targeted Checks

```bash
npm run dev
```

After implementing the planned tests:

```bash
npm run test:acceptance -- tests/acceptance/stage-rest.spec.ts tests/acceptance/stage-motion.spec.ts tests/acceptance/stage-catalog.spec.ts
npm run test:acceptance -- tests/acceptance/stage-queue.spec.ts tests/acceptance/stage-readiness.spec.ts tests/acceptance/settlement.spec.ts
```

Playwright starts Vite in acceptance mode on port 5489 with one worker and runs both `desktop` (1280 × 832) and `mobile` (375 × 812). Do not start an extra acceptance server for those commands. `stage-queue.spec.ts` is a planned file; create it during implementation before using its command.

## Validation Matrix

### A. Smaller side previews at horizontal rest

1. Use ready textured fixtures with at least four catalog entries.
2. Inspect center and both neighbors at rest in both viewport projects.
3. Assert common Y/Z, side scale at 75% of center, logical neighbor order and unique occurrence IDs.
4. Verify center prominence approximately matches the previous center reference; neighbors may be cropped on mobile.
5. Assert body-width canvas centering/aspect and no document horizontal overflow. Verify native controls remain visible, clickable and keyboard-focusable.

**Pass**: Side previews are smaller but not recessed or tilted. Default neighbor pose retains authored roll. Only the center turns automatically.

### B. One-slot travel and wraparound

1. Sample Next and Previous from interior positions and both catalog boundaries.
2. Track occurrences by instance ID, not model ID.
3. Assert each participating occurrence moves with the required X sign for exactly one slot at fixed Y/Z. Incoming and outgoing center models grow/shrink smoothly between the two slot scales. Use numeric tolerances appropriate to floating-point sampling.
4. Assert no negative eased progress, overshoot, depth excursion or rear route.
5. Verify edge occurrences are outside the aperture before reuse/discard and at most four occurrences participate.
6. Resize mid-motion; verify normalized progress does not reset. Simulate hidden visibility; verify progress and queued dispatch freeze and resume.

**Pass**: Left on Next, right on Previous, smooth endpoints and no visible loop teleport. Do not compare world coordinates across a resize as if spacing had stayed fixed; compare normalized slot coordinates.

### C. Zero/one/two/three artwork catalogs

- Zero: no art viewer mounted.
- One: one centered occurrence, navigation disabled, no duplicates.
- Two: center A with B/B neighbors; navigate through a full cycle each direction. Check separate instance transforms, exactly two logical entries and no duplicate downloads.
- Three: verify outgoing/incoming duplicates at the boundary and absence of a rear crossing.
- Four or more: verify full neighbor order after multiple forward/backward wraps and no off-row retained assets drawn accidentally.

**Pass**: Cycle visits every logical entry once before repeating, no extra selection stops, three rest/four movement occurrences maximum. Count logical assets and visual instances separately.

### D. FIFO rapid input and timing

1. Begin from a ready center and activate Next, Next, Previous, Next rapidly.
2. Repeat while the first candidate load is held and while movement is active.
3. Verify all four input records retain their native timestamps; service order is +1, +1, -1, +1, resolved from each previous logical selection.
4. Verify four distinct ready settlements and four live-region updates, no lost/merged requests and no metadata for a waiting item exposed early.
5. Check buttons remain activatable and do not claim `aria-disabled` merely because work is queued.
6. Observe at least a presented settlement opportunity before the following request curtains its details; drain cannot happen synchronously inside finalize.
7. Assert idle activation-to-presentation ≤1500 ms and queued service-to-presentation ≤1500 ms under supported ready/preparable conditions. Report queue wait and total native activation-to-presentation separately; do not falsely fail a healthy long queue for exceeding 1500 ms total wait.
8. Repeat with reduced motion, a recoverable failed selection, visibility pause and unmount. Ensure reduced-motion/error queues cannot recursively overflow the stack and terminal failure clears animation work.

**Pass**: Every healthy accepted input services in FIFO order; one success announcement per actual successful settlement. Failed selection is not announced as successful, and later requests can recover from its logical index.

### E. Inspection, repeated identities and modes

1. Inspect center using pointer and existing keyboard keys; release and regrab during the 350 ms return.
2. Verify independent pointer/keyboard ownership, target preservation and resumed 24-second positive-yaw turntable.
3. Drag a painted neighbor, including one sharing logical identity with another occurrence; verify it does not acquire center inspection.
4. Navigate from a nondefault inspected pose; verify outgoing pose returns smoothly while translation remains horizontal and destination begins at default.
5. Exercise Rendered, Clay and Wireframe before/while moving and after wraps. Preserve mode and authored materials; no extra downloads.
6. Test authored roll and, if needed, an acceptance-only rigged fixture. Verify repeated skeleton hierarchies do not cross-mutate and materials/geometry/textures remain shared and live.

**Pass**: Inspection targets instance identity, metadata targets artwork identity, and selected mode applies correctly to all occurrences without pose coupling.

### F. Readiness and synchronized metadata

1. Hold adjacent load: center remains healthy; empty neighbor joins at rest without announcement.
2. Release neighbor during movement: it joins only after rest.
3. Hold destination metadata >500 ms: candidate preflight completes; destination title/caption remain visually hidden, `aria-hidden`, and `inert` until final centered presentation.
4. Release within service budget and verify proportionally shortened motion. Release after the budget and verify no extra decorative movement delays safe settlement.
5. Inject per-mode preview failure, candidate draw failure and embedded-resource errors. Verify isolation, error UI, FIFO onward navigation and no success announcement for failure.
6. Attempt stale proof/late-load completion after error/unmount/terminal loss. Verify it cannot reveal incorrect metadata or revive retired instances.

**Pass**: Preserve existing proof-ticket guards and synchronous final-draw/finalize ordering, once per successfully serviced selection.

### G. Resources, Strict Mode and production isolation

1. Count requests/parses during repeated short-catalog loops: one retained load per logical artwork, not per occurrence.
2. Recycle occurrences, switch modes, unmount/remount under Strict Mode and trigger context loss.
3. Verify private skeleton resources are released, shared resources disposed only by asset owners, no listener/drain callback leaks, and renderer reuse follows existing deferred context-loss logic.
4. Confirm no second art renderer is introduced. Account for background/game canvases separately rather than enforcing an obsolete whole-page canvas count.
5. Run final checks:

```bash
npm run typecheck
npm run build
npm run test:acceptance
```

6. Inspect built output for acceptance entries, fixture URLs and instrumentation markers; confirm production does not include them. Check source and asset diff to ensure no supplied model changed as part of this feature.

**Pass**: Full suite green on both projects, production isolation retained, no feature-introduced owner-asset modifications.

## Partial Implementation Results

- Baseline `npm run typecheck`: passed before app changes.
- After initial FIFO changes: `npm run typecheck` and `npm run build` passed; focused FIFO acceptance passed on desktop and mobile (2 tests).
- Initial complete acceptance run: 155 passed, 3 failed. Two failures asserted superseded loading behavior; the test was updated for FIFO and passed on both viewports in the subsequent targeted run.
- Targeted FIFO/readiness/game-controller run: 29 passed, 1 failed. Desktop `game-controller.spec.ts` projected D-pad position assertion expected `< 627.2`, received `640.65625`. This is outside the art-carousel changes and remains unresolved; owner controller asset files were already modified in the worktree before this feature work. No claim is made about the cause.
- Subsequent conveyor run: `npm run typecheck` and `npm run build` passed; full acceptance suite reported 161 passed and the same unrelated desktop game-controller position failure (expected `< 627.2`, received `640.65625`). All conveyor stage, queue, readiness and settlement cases in that run passed on both viewports.
- Earlier targeted conveyor checks exercised horizontal monotonic motion, then-equal scale/common depth, two-/three-entry instance identity, no additional load requests during wrap, FIFO ordering/timing, reduced motion, recoverable failure, responsive canvas, inspection, modes and metadata settlement. Equal scale was later superseded by smaller side previews.
- Latest targeted stage-rest, stage-motion, stage-queue and stage-catalog suite: 50 passed on desktop/mobile. Includes a synthetic acceptance-only skinned fixture that verifies repeated occurrences have separate skeleton identities and shared geometry across all three modes, plus hidden-document queue pause, FIFO timing, reduced motion and recoverable failure.
- Follow-up desktop/mobile targeted tests: skinned clones retain independent skeletons and shared geometry; recycled and unmounted clone occurrences report one disposal each. Offscreen viewer suspends queued selections until re-entry. All four follow-up cases passed.
- Browser evidence: `evidence/conveyor-art-desktop.png` and `evidence/conveyor-art-mobile.png` (original belt); `evidence/conveyor-dither-desktop.png` and `evidence/conveyor-dither-mobile.png` show the subsequent even-lighting and edge-dither update, using distinct acceptance fixtures.
- Edge-dither regression: 70 targeted desktop/mobile tests passed, including pixel sampling at DPR 1 and 2 for both edges and Clay/Rendered modes, mode switching, inspection, loading, and synchronized settlement. Edge-mask preflight is disabled during offscreen candidate validation.
- Smaller side previews: 34 desktop/mobile rest, motion and edge-dither tests passed; 68 further catalog, queue, readiness and settlement tests passed. Side scale is 75% of center, with monotonic scaling during slides. Evidence: `evidence/conveyor-small-sides-desktop.png` and `evidence/conveyor-small-sides-mobile.png`.
- Latest production build excludes `fixture-skinned`, `skinned.glb`, `tests/support/fixtures`, `onOccurrenceDisposed` and `onPresentationDrawn` markers. `git diff --check` passes.
- `npm run lint` reports 23 errors and 2 warnings across the existing project, including formatting in unrelated files; it is not a clean baseline.
- Remaining: directly exercise instanced-mesh disposal and queued-input unmount cleanup in greater depth. Final full-suite pass remains blocked by the existing game-controller assertion. No supplied assets were modified by this feature.

## Evidence to Record During Implementation

- Commands, date, browser/environment, pass/fail counts and any pre-existing failures.
- Desktop/mobile screenshots of smaller side previews and partially cropped mobile neighbors.
- Sampled Next/Previous and short-catalog wrap trajectories with instance IDs.
- FIFO sequence, native activation timestamps, queue waits, service starts and compositor settlement times.
- Delayed-proof >500 ms evidence and exactly-once announcement records.
- Resource/Strict Mode/context-loss outcomes and production exclusion checks.

Save actual captures under `evidence/` using feature-specific filenames. No captures or runtime results have been produced by this planning step.
