# Tasks: Conveyor Art Carousel

**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/carousel-interaction.md`, `quickstart.md`.

## Phase 1: Setup

- [x] T001 Inspect current carousel, acceptance harness, and existing worktree changes in `src/lib/model-viewer.ts`, `src/components/ProjectCarousel.tsx`, and `tests/acceptance/`.
- [x] T002 Run baseline `npm run typecheck` and record any pre-existing failures in `specs/007-conveyor-art-carousel/quickstart.md`.

## Phase 2: Foundational Ownership

- [ ] T003 Separate artwork resource ownership from independently posed occurrences, including skinned clones and safe disposal in `src/lib/model-viewer.ts`.
- [ ] T004 Extend acceptance sample identity with distinct occurrence IDs and logical artwork IDs in `src/lib/model-viewer.ts` and `tests/acceptance/harness.tsx`.

## Phase 3: User Story 1 — Horizontal Belt (P1)

**Independent test**: With four ready artworks, next/previous move all visible occurrences exactly one horizontal slot at constant scale and depth.

- [ ] T005 [US1] Replace tilted unequal-scale slots and orbital motion with equal-scale common-depth linear belt placement in `src/lib/model-viewer.ts`.
- [ ] T006 [US1] Preserve turntable, inspection pose return, authored roll and center-only hit testing by occurrence in `src/lib/model-viewer.ts`.
- [ ] T007 [US1] Replace obsolete orbit motion assertions with horizontal motion, resize and reduced-motion checks in `tests/acceptance/stage-motion.spec.ts` and `tests/acceptance/stage-rest.spec.ts`.

## Phase 4: User Story 2 — Seamless Responsive Loops (P1)

**Independent test**: Cycle two-, three-, and four-artwork catalogs in both directions on desktop/mobile without reversed movement or visible teleportation.

- [ ] T008 [US2] Implement bounded entering/exiting occurrences, clipping and recycling for short catalogs in `src/lib/model-viewer.ts`.
- [ ] T009 [US2] Tune responsive spacing/camera, retain full-width canvas and add spacing compatibility aliases in `src/lib/model-viewer.ts`, `src/components/ModelViewer.tsx`, `src/components/ProjectCarousel.tsx`, and `src/styles.css`.
- [ ] T010 [US2] Update empty/single/two/three catalog and responsive wrap coverage in `tests/acceptance/stage-catalog.spec.ts` and `tests/acceptance/stage-rest.spec.ts`.

## Phase 5: User Story 3 — Retained Interaction and FIFO (P2)

**Independent test**: Rapid next/next/previous/next produces four ordered one-slot settlements and exactly one metadata announcement per successful settlement.

- [ ] T011 [US3] Add ref-owned FIFO activation queue, serial dispatch and service timestamps in `src/components/ProjectCarousel.tsx` and `src/lib/model-viewer.ts`.
- [ ] T012 [US3] Preserve metadata finalization, readiness, failure recovery, visibility pause and cleanup during queued service in `src/components/ProjectCarousel.tsx` and `src/lib/model-viewer.ts`.
- [ ] T013 [US3] Add queue ordering, delayed loading, failures, reduced-motion and unmount tests in `tests/acceptance/stage-queue.spec.ts`, `tests/acceptance/stage-readiness.spec.ts`, and `tests/acceptance/settlement.spec.ts`.
- [ ] T014 [US3] Cover duplicate-occurrence inspection, all modes, authored roll and clone resource cleanup in `tests/acceptance/stage-rest.spec.ts` and `tests/acceptance/stage-catalog.spec.ts`.

## Phase 6: Verification and Documentation

- [ ] T015 Run `npm run typecheck`, `npm run build`, and `npm run test:acceptance`; resolve feature regressions and record results in `specs/007-conveyor-art-carousel/quickstart.md`.
- [ ] T016 Verify production excludes acceptance fixtures/instrumentation and update implemented architecture in `AGENTS.md`.

## Progress

Horizontal slots, occurrence cloning, monotonic movement, responsive layout, spacing aliases and FIFO navigation are implemented. Stage, queue, catalog, readiness and settlement acceptance checks pass on both viewports; see `quickstart.md`. Tasks remain unchecked pending outstanding lifecycle/disposal coverage and a clean complete acceptance run. The full suite currently has one previously observed, unrelated desktop game-controller position failure.

## Dependencies and Strategy

T001–T002 precede T003–T004. US1 requires foundational ownership; US2 builds on US1. US3 follows stable instances and stage motion. Verification requires all stories. Test updates may be developed in parallel with their matching implementation, but completion requires passing checks. MVP: US1; complete delivery includes US2 and US3.
