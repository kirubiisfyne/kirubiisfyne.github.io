# Implementation Plan: 3D Cover Flow Stage

**Branch**: `main` (setup reported feature identifier `004-cover-flow-stage`; no feature branch exists) | **Date**: 2026-10-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-cover-flow-stage/spec.md`

## Summary

Extend the persistent Three.js viewer from a single resting model to a centered active model and ready adjacent previews. Derive distinct slot assignments from catalog order, animate per-model presentation transforms on a recessed orbit, and preserve the existing selection transaction, independent loading, input ownership and visibility-aware scheduler. Adapt camera framing and clipping to the full stage and validate real rendered output and settlement at both supported widths.

## Technical Context

**Language/Version**: Strict TypeScript 7.0.2, React 19.3.1  
**Primary Dependencies**: Three.js 0.186.1, Vite 8.3.5, Tailwind CSS 4.3.3  
**Storage**: Existing static `glb/` catalog and optional description sidecars; no new persistent data  
**Testing**: `npm run typecheck`, `npm run build`, Playwright Chromium acceptance (`npm run test:acceptance`) and focused production preview  
**Target Platform**: WebGL-capable desktop and mobile browsers; acceptance widths 1280 and 375 CSS px  
**Project Type**: Single-page portfolio  
**Performance Goals**: Normal ready navigation activation to presented matching settlement ≤500 ms; 24-second turntable; inspection return ≤500 ms visible time  
**Constraints**: One persistent viewer renderer; one object per catalog entry; no stale settlement or duplicate models; no blocking on adjacent loads; preserve production exclusion of acceptance fixtures and hooks; keep owner assets and background unchanged  
**Scale/Scope**: Static catalog per carousel; at most three visible at rest and up to four distinct transition participants.

## Constitution Check

The constitution is an unfilled template and establishes no adopted gates. Pre-design and post-design checks pass; project instructions and feature 003 remain binding context. No governance exceptions are required.

## Project Structure

### Documentation (this feature)

```text
specs/004-cover-flow-stage/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/stage.md
└── tasks.md             # story-organized implementation and verification tasks
```

### Source Code (repository root)

```text
src/components/ProjectCarousel.tsx  # selection and metadata transaction
src/components/ModelViewer.tsx      # viewer lifecycle and status
src/lib/model-viewer.ts             # scene, loads, stage, motion and input
src/styles.css                     # responsive canvas and controls if needed
src/data/projects.ts                # existing catalog
tests/acceptance/                  # real viewer harness and acceptance
tests/support/fixtures/            # non-production models
```

**Structure Decision**: Extend the existing viewer and acceptance harness; do not introduce another rendering canvas, a second model registry, or React animation state.

## Implementation Sequence

1. Establish stage geometry from normalized model bounds and camera FOV/aspect. Recalculate responsive slot positions, scale, depth and camera near/far together; verify active rotating sphere and both previews fit within usable canvas at both widths. Prevent previews obscuring controls and maintain active prominence.
2. Derive a distinct per-ID resting map using ordered catalog indices and readiness, with empty slots for unavailable entries. Snapshot the current stage and target map per accepted transaction, using explicit two- and three-entry paths. Keep per-frame transforms in the viewer, not React.
3. Integrate orbital motion into the existing adaptive deadline and visible-time scheduler. Handle selection supersession during loading, cancellation, resize, preference changes, and no-animation settlement. Reset departing active pose smoothly toward its initial pose as it becomes a preview; destination starts at its own initial pose and only spins after successful settlement.
4. Isolate candidate preflight from all other visible participants and restore the stage afterward. Keep candidate preflight, metadata proof, final centered draw and synchronous finalize as a single guarded transaction. Ensure a preview load or draw failure never destroys or reports failure for a healthy active selection; retain active-destination errors and context-loss semantics.
5. Update acceptance instrumentation and real-render tests for stage identities, transforms, readiness, per-model pose, all catalog sizes and directional paths, retaining compositor timing and delayed-details tests. Exercise production preview, baseline inspection, mode and responsive checks; report limitations honestly.

## Resolved Design Rules

- Use normalized radius 1 for the center and an initial preview scale of 0.62, side offset ±1.6 and depth −1.2. Use a recessed rear lane reaching depth −2.4 for shared-neighbor and two-entry routing. These are starting visual constants, adjustable together after viewport verification; the fit invariant below is mandatory.
- Fit the camera to the union of conservative bounding spheres over resting slots and sampled continuous paths, with horizontal/vertical margins and control exclusion areas. For each sphere `(x,y,z,r)`, conservatively require `d >= z + r + max((abs(x)+r)/tan(horizontalHalfFov), (abs(y)+r)/tan(verticalHalfFov))`, using reduced usable FOV for margins. Set clipping planes from the same entire depth envelope. Retain center presentation scale 1 and keep it visibly largest; do not fit center and previews independently.
- Bound the complete orbit, not only the sampled points: use analytic extrema or a conservative sampling error margin, including after resize, so the framing and clipping invariants hold between samples.
- For four or more entries, use the ordinary mirrored outgoing, incoming, entering and exiting paths in FR-004. The two- and three-entry routes below are distinct-entry exceptions, not duplicate instances.
- With two entries, Next advances the right neighbor to center and routes the departing center left then behind to its final right slot. Previous routes the right neighbor behind to the left before it advances to center, while the departing center recedes right. This catalog-size exception preserves the deterministic right-only rest without cloning or snapping. With three entries, the shared neighbor stays visible on a recessed back path from old left to new right for Next (mirrored for Previous), becoming static at settlement.
- Freeze transition membership when movement starts. A neighbor finishing later may appear at its final resting slot after movement, subject to independent validation; it never delays centered settlement. Resizing recomputes paths from normalized phase and current geometry without resetting the transaction or elapsed progress.
- Isolated validation must also restore any viewport, scissor and clear state it changes, including `scene.overrideMaterial`, before the next presented draw.
- Use an offscreen render target on the same renderer for isolated per-entry validation; restore render target, visibility, transform and material state in `finally`. Track validation by entry and display mode. A candidate is prioritized; preview validation never gates active settlement. Preview failure marks that preview unavailable and repaints the healthy stage; context loss remains terminal. Attribute unexpected combined-draw errors through isolated participant checks before retiring a healthy center.
- Retain the activation deadline and presentation reserve. Shorten movement to the remaining usable budget instead of forcing the existing 120 ms minimum when it would exceed that budget. If the budget is already exhausted, complete the ready transition immediately and record any real acceptance failure; do not reset timing, widen the threshold or treat organic slowness as deliberate delay.
- Hit-test visible stage models at pointer/touch initiation and reject a preview hit; keep existing center/background inspection semantics and keyboard ownership. Do not add per-frame hit testing. Existing DOM controls retain event priority.

## Agent Context and Design Review

No agent-context updater script is installed under `.specify/scripts/`. `AGENTS.md` already records the stack and implemented 003 baseline; leave those implementation claims intact until feature 004 is implemented. This plan and its linked contracts hold the proposed design. The clarified FR-004 and the existing tasks specify the ordinary and small-catalog choreography, late readiness, per-mode validation, deadline exhaustion, and measured baseline checks. Post-design constitution review finds no adopted gates or unresolved clarification. Validation scenarios remain prospective.

## Complexity Tracking

No constitution violations or additional architectural layers are proposed.
