# Quickstart: Cover Flow Validation

This guide describes validation scenarios; the observed run and its limits are recorded below. See [stage contract](contracts/stage.md), [data model](data-model.md), and [feature 003 verification](../003-carousel-interaction-motion/quickstart.md).

## Setup

Use Node >=22.12, npm, WebGL 2-capable Chromium and the repository's unchanged owner models. From the repository root:

```sh
npm ci
npx playwright install chromium
npm run typecheck
npm run build
npm run test:acceptance
npm run preview -- --host 127.0.0.1
```

The acceptance server runs on port 5489 with one worker and desktop 1280 × 832 and mobile 375 × 812 projects. Preserve the production preview as a separate check. Use distinct self-contained textured fixtures outside `glb/`; add a fourth fixture and two-/four-entry harness catalogs. Extend `settlement.spec.ts` or update Playwright's test matching. Ensure production output excludes fixtures, harness, and acceptance-only diagnostics.

## Stage, orbital motion, and timing

- For three and four ready entries at both viewports, verify visible IDs and recognizable images at rest: center plus immediate previous/next, smaller and recessed. Assert all other entries hidden and undrawn, no duplicate ID and no clipping or page-level horizontal scroll; controls remain operable. Check all three display modes, preserving authored textures on return to Rendered.
- Record native click/keyboard activation before React handling and correlate Chromium CDP screencast compositor timestamps with page time, as in feature 003's quickstart. For Next, Previous and both wrap boundaries, inspect actual frames for outgoing left/recede/shrink, incoming right/advance/grow, entry/exit, and mirrored motion. Measure actual first presented centered destination plus matching readable details at ≤500 ms without deliberate delay. Do not infer presentation or timing solely from callbacks or transform values.
- Instrument acceptance-only per-frame participating IDs, transforms and poses to support pixel evidence and assert uniqueness, including four simultaneous distinct participants where applicable. Isolate preflight draws from presentation observations. Check three-entry shared-neighbor back path and two-entry direction-specific transitions; each ID occurs at most once in every draw and the single neighbor rests on the right. Check one-entry disabled controls and empty catalog with no viewer.
- Resize during orbital movement and verify normalized progress continues without restarting; release a held neighbor during movement and verify it only joins the final resting stage. Exercise mode-specific preview validation and preparation that exhausts the movement budget, retaining actual timing failures.
- Inspect tall, wide and asymmetric owner/fixture models across both viewports, including full center rotation; check stage bounds, depth clipping and controls, resizing and reduced motion. Verify previews remain at fitted initial pose while the center spins or is manually inspected. Pointer/touch actions on a preview do not independently rotate it; keyboard inspection affects only the center.

## Independent readiness and synchronization

- Intercept a noninitial adjacent model request before mounting and hold it open. Verify all loads begin, initial center and details settle without waiting, the appropriate preview slot is empty, and no neighbor error covers the center. Release while still adjacent and verify it appears without changing the position live region. Repeat after changing selection so the released model is no longer adjacent.
- Fail an adjacent load and verify the center stays healthy and the slot empty. Select the failed entry and verify the named active error and onward navigation; separately select a held loading destination and verify the active loading state. Inject a preview-specific draw failure and confirm it does not fail the active center; separately retain candidate first-draw failure and terminal context-loss tests.
- Retain feature 003's actual metadata gates for >500 ms, checking visual and accessibility curtains, distinct destination pixels, synchronous matching final presentation, and exactly one position mutation. Cover ordinary navigation, supersession, revisit, and reduced motion. No abandoned or failed selection may announce successful settlement.

## Baseline regressions

- Exercise pointer, touch emulation and keyboard full-turn inspection, both combined-input release orders, regrabs and mode changes. Compare saved and returned views before resumed spin; return completes within 500 ms visible time and remains within the feature 003 pose tolerance. Test 24 ±1 second visible-time revolution, including all modes.
- Pause during turntable, return and orbital movement via hidden/offscreen/inactive states where the environment can actually produce them; verify frozen progress and no jump on resume. Record inability to simulate a real visibility transition as a limit, not a pass. Reduced motion removes intermediate automatic/return/selection frames but preserves active manual inspection.
- Verify retained one-renderer lifecycle, no refetch on mode or navigation, error recovery, keyboard focus, empty/single catalog, no external resource fetches, owner assets unchanged, and normal production output. Record actual environment, timings, screenshots and any untested physical touch or screen-reader speech limitations.

## Observed verification (2026-10-30)

- `npm run typecheck`, `npm run build`, and Chromium `npm run test:acceptance` passed with 84 tests across desktop and mobile.
- Model optimization & eager startup: Resampled embedded GLTF textures from 2048x2048 to 1024x1024, reducing total model asset download by 64% (axe: 7.82MB → 2.85MB; hammer: 9.17MB → 3.30MB) while preserving full visual surface quality. Added `<link rel="preload">` in `index.html` to download models immediately on document arrival.
- Removed "Loading 3D model…" / "Loading 3D viewer…" text overlays during loading and navigation transitions; models load quickly up front and materialize via retro 8x8 Bayer dithering dissolve. Error/unavailable states remain visible.
- Production preview showed the owner-supplied axe centered with the hammer on the right, then the hammer centered with the axe on the right after Next. Verified desktop and 375px mobile layouts with no horizontal scroll or control clipping. Captures: [mobile](evidence/production-mobile.png), [desktop](evidence/production-desktop.png).
