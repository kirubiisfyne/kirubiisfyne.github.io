# Tasks: Retro TV Game Showcase

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/showcase.md](contracts/showcase.md), [quickstart.md](quickstart.md)

**Format**: `[ID] [P?] [Story?] Description` — `[P]` marks tasks executable concurrently after stated prerequisites; story labels map to the spec.

## Phase 1: Setup

**Purpose**: Verify existing assets and implementation conventions without changing the owner-supplied files.

- [X] T001 Verify every URI in `gltf/practice_tv/practice_tv.gltf` exists with exact case and both `games/kontexto/emissive.png` and `games/anii/emissive.png` are present; record any blocker in `specs/005-retro-tv-showcase/quickstart.md`.
- [X] T002 [P] Inspect `src/pages/PortfolioPage.tsx`, `src/components/ModelViewer.tsx`, `src/lib/model-viewer.ts`, `src/styles.css`, and `tests/acceptance/` for lifecycle, layout and test conventions before implementation.

## Phase 2: Foundational prerequisites

**Purpose**: Supply shared assets and catalog required by all stories.

- [X] T003 Create `src/data/games.ts` with a readonly typed ordered catalog for KonTEXTo and Anii! Grow to Know, exact itch.io links and descriptions from `specs/005-retro-tv-showcase/data-model.md` and `specs/005-retro-tv-showcase/spec.md`, plus imported game-specific emissive image URLs.
- [X] T004 [P] Create `src/lib/retro-tv-assets.ts` with Vite URL imports and a complete glTF dependency map for `gltf/practice_tv/practice_tv.gltf`, its binary and every referenced texture, including its existing default emissive image; preserve `glb/` publicDir and non-root base compatibility.
- [X] T005 [P] Define shared position, Euler rotation in degrees with explicit axis order, and positive scale configuration in `src/data/tv-transform.ts`, documenting scene units and defaults.

**Checkpoint**: Catalog, authored transform and asset URL contract available. T003–T005 may run concurrently after setup.

## Phase 3: User Story 1 — Discover games (P1) 🎯 MVP

**Goal**: Render the supplied TV and initial game's matching image and details on desktop and mobile.

**Independent test**: Open the page at 1280 × 832 and 375 × 812; see the entire TV without clipping with the supplied default transform, KonTEXTo's mapped TV image and matching name/description, with a full-browser-width canvas and no horizontal overflow.

### Tests

- [X] T006 [P] [US1] Add desktop/mobile initial-game, full-width canvas, no-overflow and failure-fallback acceptance scenarios in `tests/acceptance/game-showcase-display.spec.ts`; use the existing suite's harness conventions.

### Implementation

- [X] T007 [US1] Implement persistent transparent renderer, loading-manager dependency mapping, glTF load, `m_Screen` selection, lighting, camera, resize and demand rendering in `src/lib/retro-tv-viewer.ts`; apply `src/data/tv-transform.ts` to a parent of the complete TV.
- [X] T008 [US1] Implement initial emissive texture loading in `src/lib/retro-tv-viewer.ts`, preserving the original `m_Screen` texture's UV channel, mapping, transforms, wrapping, color space and orientation; use neutral fallback and accessible status on model, WebGL or image failure.
- [X] T009 [US1] Create `src/components/RetroTvViewer.tsx` to own viewer lifecycle, communicate loading/error state, handle resize/unmount and React Strict Mode safely, and dispose owned resources and late results.
- [X] T010 [US1] Create `src/components/GameShowcase.tsx` with initial catalog details, accessible status and an empty state independent of viewer availability; integrate the TV viewer without coupling to existing carousel state.
- [X] T011 [US1] Add the showcase section after 3D Art in `src/pages/PortfolioPage.tsx` and implement full-browser-width canvas, in-flow stage, responsive sizing and existing-design styling in `src/styles.css`, preserving existing background and carousel.

**Checkpoint**: US1 can be demonstrated independently with initial game; T006 verifies the slice after implementation.

## Phase 4: User Story 2 — Change channels and visit a game (P1)

**Goal**: Navigate games with synchronized screen, metadata and itch.io destination.

**Independent test**: Use keyboard and pointer to navigate both directions and wrap; each Play link opens the matching itch.io page in a new tab; simulate delayed and failed images.

### Fixture infrastructure

- [X] T012 [US2] Extend `tests/acceptance/harness.tsx` and `tests/acceptance/load-gate.ts` or add isolated helpers under `tests/acceptance/` to supply empty/single-game catalogs and controllable delayed, failed, or out-of-order texture/model loads and WebGL failures; keep all fixture entry points and branches out of production builds and document their interface for T013, T014 and T019.

### Tests

- [X] T013 [P] [US2] Add wraparound, keyboard focus, selection announcement, correct links/new tabs, and zero/one-game cases in `tests/acceptance/game-showcase-navigation.spec.ts`; use the acceptance-only fixture interface from T012.
- [X] T014 [P] [US2] Add rapid selection, out-of-order and failed texture loads, model/WebGL failure, and unmount safety coverage in `tests/acceptance/game-showcase-failures.spec.ts`; use the acceptance-only fixture interface from T012 and verify stale images never represent the current game.

### Implementation

- [X] T015 [US2] Extend `src/lib/retro-tv-viewer.ts` with selected-game emissive swaps, neutral pending/error fallback, generation-token guards, texture caching and disposal; preserve UV/material properties and ignore late completions after selection changes or unmount.
- [X] T016 [US2] Extend `src/components/RetroTvViewer.tsx` to forward current image changes and accurate selected-image loading/error status without recreating the renderer.
- [X] T017 [US2] Implement Previous/Next wraparound and disabled states, selection-derived title/description, a polite selection live region, and Play as an HTTPS link with `target="_blank"` and `rel="noopener noreferrer"` in `src/components/GameShowcase.tsx`; retain navigation and valid links during renderer failures.
- [X] T018 [US2] Style controls and keyboard-visible focus in `src/styles.css`, including responsive and reduced-motion behavior; avoid unintended changes to existing carousel controls.

**Checkpoint**: Both supplied games can be navigated and opened; T013–T014 verify normal and failure paths.

## Phase 5: User Story 3 — Maintain showcase (P2)

**Goal**: Let the owner add catalog entries and adjust the whole TV with local configuration.

**Independent test**: Add a temporary valid catalog entry and change each transform component; reload/rebuild to verify ordering, navigation and whole-TV placement, then restore test data.

### Tests

- [X] T019 [P] [US3] Add catalog extensibility and position/rotation/scale verification using acceptance-only controlled fixtures from T012 in `tests/acceptance/game-showcase-owner.spec.ts`; verify mobile and desktop share authored transform.

### Implementation

- [X] T020 [US3] Review `src/data/games.ts` and `src/data/tv-transform.ts` for documented editable fields, stable IDs, explicit units and valid finite values; ensure adding a catalog entry requires no component registration.
- [X] T021 [US3] Verify `src/lib/retro-tv-viewer.ts` applies all position, degree-based Euler rotation and positive scale components to the same whole-TV parent, independently of responsive camera framing.
- [X] T022 [US3] Document exact game-asset paths, catalog-entry editing, transform values and dev/rebuild workflow in `specs/005-retro-tv-showcase/quickstart.md`.

**Checkpoint**: Owner can maintain content and placement without modifying model assets or renderer logic.

## Phase 6: Polish & cross-cutting validation

- [X] T023 Verify direct asset delivery and all TV/game image URLs at a non-root Vite base in production preview; document reproducible commands and results in `specs/005-retro-tv-showcase/quickstart.md`.
- [X] T024 Check desktop/mobile visual fidelity, actual screen UV mapping, accessible status, keyboard focus, reduced motion and existing portfolio carousel/background regression; record results in `specs/005-retro-tv-showcase/quickstart.md` after T023 or coordinate edits to that file.
- [X] T025 Run `npm run typecheck`, `npm run build`, and `npm run test:acceptance` against `src/` and `tests/acceptance/`; fix failures and document actual results in `specs/005-retro-tv-showcase/quickstart.md`.
- [X] T026 Inspect lifecycle cleanup, canvas count and console across repeated navigation, unmount and Strict Mode replay using `src/lib/retro-tv-viewer.ts` and `src/components/RetroTvViewer.tsx`; fix leaks without disturbing the existing viewer.

## Dependencies & execution order

- Phase 1 → Phase 2 → US1 → US2 → US3 → final validation. US2 extends US1's actual viewer and showcase; US3 verifies shared catalog/transform and complete navigation, so do not claim the stories are fully parallel.
- T003, T004 and T005 touch separate files and can run in parallel after Phase 1. T006 can be authored after the foundation while US1 renderer work proceeds. T007 → T008 → T009 → T010 → T011.
- T012 establishes the acceptance-only fixture interface after US1. T013 and T014 can then be authored in parallel before US2 implementation. T015 → T016 → T017; T018 follows T017 to avoid conflict with US1 styling.
- T019 can be authored after US2 while T020 begins; T021 follows T020 and T022 follows the relevant implementation.
- T023 and T024 are independent checks, but both update the same quickstart file: collect evidence concurrently and serialize edits. T025 and T026 follow implementation; serialize any fixes touching the same files.

## Parallel examples

- **US1**: Author T006 while implementing T007–T008; coordinate the eventual test interface with the viewer component.
- **US2**: After T012 establishes the fixture interface, author T013 and T014 in separate files concurrently before T015–T018.
- **US3**: Author T019 while reviewing owner-facing config in T020; integrate fixture interfaces before executing the test.

## Implementation strategy

1. MVP: complete setup, foundation and US1; validate the first game and responsive TV before adding channel interactions.
2. Deliver US2 for navigation, accessibility and robust texture switching; then US3 for owner-editable maintenance.
3. Complete cross-cutting production-base, resource lifecycle and regression validation. Do not report success until checks actually pass.
