# Tasks: 3D Cover Flow Stage

**Input**: `specs/004-cover-flow-stage/plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/stage.md`, and `quickstart.md`  
**Tests**: The specification and quickstart explicitly require rendered-browser acceptance and timing verification. Tests below exercise observable behavior; acceptance-only diagnostics must not ship in production.

## Phase 1: Setup

**Purpose**: Extend the existing acceptance infrastructure without changing the production catalog.

- [X] T001 Create a fourth distinct, self-contained textured verification model at `tests/support/fixtures/d.glb`, outside the owner-supplied `glb/` catalog
- [X] T002 Extend `tests/acceptance/harness.tsx` to expose zero-, one-, two-, three-, and four-entry fixture catalogs and controllable load/detail gates; update `playwright.config.ts` to discover the new stage specs while retaining production exclusion (depends on T001)

## Phase 2: Foundational

**Purpose**: Establish shared per-entry stage ownership and independent validation before story work.

- [X] T003 In `src/lib/model-viewer.ts`, retain one presentation and rotation group per catalog ID and derive unique center/left/right assignments from ordered indices, including right-only two-entry and empty unavailable slots; hide and do not draw unassigned entries
- [X] T004 In `src/lib/model-viewer.ts`, add per-entry, per-mode isolated validation using an offscreen render target on the existing renderer; prioritize candidates, restore render target, visibility, transforms, material override, and any changed viewport, scissor and clear state in `finally`, and attribute preview failures independently while preserving terminal context-loss handling
- [X] T005 In `src/lib/model-viewer.ts`, calculate shared stage geometry and clipping from conservative normalized model spheres across resting slots and complete paths, bounding between samples via analytic extrema or a conservative error margin, usable horizontal/vertical FOV and control margins; start with scale 0.62, x ±1.6, z −1.2 and rear z −2.4, and recalculate on resize

**Checkpoint**: One renderer and one retained model per ID; shared stage and validation primitives are available to all stories.

## Phase 3: User Story 1 — See neighboring projects (P1) — MVP

**Goal**: Show a prominent inspectable center and static, smaller, recessed ready neighbors in every display mode.

**Independent test**: At 375px and 1280px, open three ready distinct models; verify their actual rendered positions and framing, change all modes, inspect the center, and confirm previews remain static and non-interactive.

### Acceptance and implementation

- [X] T006 [P] [US1] Add rendered-browser coverage in `tests/acceptance/stage-rest.spec.ts` for center and adjacent identities at each initial selection in three- and four-entry catalogs, hidden non-neighbors, static preview poses, all modes, center inspection, preview pointer/touch rejection, controls, clipping, and horizontal overflow at both configured viewports
- [X] T007 [US1] In `src/lib/model-viewer.ts`, render only ready, validated assigned models at their derived resting transforms, keep previews at their own fitted initial poses, and apply the existing scene-wide mode override without changing the center pose or authored materials
- [X] T008 [US1] In `src/lib/model-viewer.ts`, hit-test visible models once at pointer/touch initiation and reject preview hits while preserving center/background gesture semantics, keyboard ownership, focus, and DOM control priority
- [X] T009 [P] [US1] Adjust `src/styles.css` only as needed so the full-width stage stays behind operable controls without page overflow and all rotating center and preview bounds remain visible at both supported widths

**Checkpoint**: US1 can be verified independently with a settled three-model catalog.

## Phase 4: User Story 2 — Orbit between projects (P1)

**Goal**: Move distinct models continuously in the requested direction and settle matching centered model, accessible details, and position together.

**Independent test**: With four ready distinct models, navigate Next and Previous including wrap boundaries; verify real rendered choreography and compositor settlement ≤500 ms, then repeat with reduced motion and delayed details.

### Acceptance and implementation

- [X] T010 [P] [US2] Extend `tests/acceptance/settlement.spec.ts` to assert actual compositor frames showing the destination and matching details and native activation timing ≤500 ms for both directions and wrap boundaries, plus delayed-details gates held over 500 ms, visual and accessibility curtains, supersession, revisit, reduced motion, and exactly one successful position announcement
- [X] T011 [P] [US2] Add `tests/acceptance/stage-motion.spec.ts` coverage for visible distinct participant identities, directional orbit and entry/exit paths, resize without progress reset, frozen visibility progress, reduced-motion frame suppression, and preserved mode and initial destination pose; exhaust the movement budget during preparation and verify immediate completion does not reset the activation clock or conceal a compositor timing failure
- [X] T012 [US2] In `src/lib/model-viewer.ts`, snapshot distinct start/end participant transforms at movement start and animate smooth orbital position, depth, and scale for four-or-more entries; move departing center continuously from its current pose to its initial preview pose and reset the incoming center before settlement
- [X] T013 [US2] In `src/lib/model-viewer.ts`, integrate orbital progress with the existing visible-time scheduler and activation deadline, shorten movement to the remaining presentation budget without a minimum that overruns it, immediately finish when exhausted, and recompute geometry on resize without resetting normalized progress
- [X] T014 [US2] In `src/lib/model-viewer.ts` and `src/components/ProjectCarousel.tsx`, preserve request/ticket guards, immediate visual and accessibility curtains, candidate preflight, final centered draw and synchronous matching metadata reveal with one position announcement; prevent stale or failed transactions from finalizing
- [X] T015 [US2] In `src/lib/model-viewer.ts`, preserve navigation-ending inspection, independent input ownership, saved shortest-return/regrab behavior, 24-second turntable, pause/resume without catch-up, and live reduced-motion preference changes during orbital transitions
- [X] T016 [US2] Extend acceptance-only frame instrumentation in `src/lib/model-viewer.ts` and `tests/acceptance/harness.tsx` to report distinct presented participant IDs, transforms and poses without counting isolated preflight draws or including instrumentation in production

**Checkpoint**: US2 is independently verifiable against a ready four-entry catalog after US1's resting stage.

## Phase 5: User Story 3 — Browse incomplete or small catalogs (P1)

**Goal**: Keep healthy selections usable when neighbors are unavailable and render unique, deterministic stages for every catalog size.

**Independent test**: Exercise empty, one-, two-, and three-entry catalogs; hold and fail neighbor loads, select those destinations, and navigate onward without duplication, blocked settlement, or misleading announcements.

### Acceptance and implementation

- [X] T017 [P] [US3] Add `tests/acceptance/stage-catalog.spec.ts` coverage for zero through four entries, two-entry Next/Previous routes and right-only rest, the three-entry shared-neighbor back path, and per-frame uniqueness
- [X] T018 [P] [US3] Add `tests/acceptance/stage-readiness.spec.ts` coverage for held and failed neighbors, late readiness while adjacent or no longer adjacent, selected loading/failed destinations, preview draw failure, candidate draw failure, onward navigation, and terminal context loss; release a held adjacent model during movement and verify it joins only the final resting stage if still adjacent, without delaying settlement or announcing a selection; exercise preview validation separately in each display mode
- [X] T019 [US3] In `src/lib/model-viewer.ts`, implement the direction-specific two-entry rear/left route and single shared-neighbor rear path for three entries, with one presentation per ID and a right-only two-entry resting slot
- [X] T020 [US3] In `src/lib/model-viewer.ts`, freeze movement membership, add late-ready validated previews only at final rest if still adjacent, leave unavailable immediate neighbors empty, and prevent preview loading or failure from delaying or replacing a healthy center
- [X] T021 [US3] In `src/lib/model-viewer.ts` and `src/components/ProjectCarousel.tsx`, retain active-destination loading/error and onward navigation, restore the last settled stage on superseded loading, avoid self-orbit on revisit, and isolate combined-draw failures before retiring a healthy center
- [X] T022 [US3] Preserve empty-catalog no-viewer and one-entry disabled navigation in `src/components/ProjectCarousel.tsx` and `src/components/ModelViewer.tsx`; verify independent startup loads, generation guards, disposal and Strict Mode renderer ownership remain intact

**Checkpoint**: Small and incomplete catalogs satisfy their independent test without regressing the first two stories.

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T023 Run `npm run typecheck`, `npm run build`, and `npm run test:acceptance` against `tests/acceptance/`; update affected existing acceptance assertions for the stage contract without weakening timing or accessibility checks
- [X] T024 Exercise production preview and the real-browser scenarios in `specs/004-cover-flow-stage/quickstart.md`: both widths, distinct rendered models, controls, inspection, pause/resume, mode changes, catalog errors and asset retention; measure a 24 ±1 second visible-time turntable revolution and uninterrupted return within 500 ms of visible time, and exercise both combined-input release orders and regrabs; verify production output excludes acceptance fixtures and diagnostics
- [X] T025 Record actual commands, timing evidence, screenshots and any unexercised physical touch, screen-reader or visibility limitations in `specs/004-cover-flow-stage/quickstart.md`; update implemented feature context in `AGENTS.md` only after verification

## Dependencies & Execution Order

- Setup T001 → T002; foundation T003 → T004 → T005 follows setup. T003–T005 share `src/lib/model-viewer.ts` and must be serialized.
- Story order: **US1 → US2 → US3**. US2 builds on the resting stage; US3's directional small-catalog routes build on the orbital transaction. Each checkpoint has its own independent test; the stories are not claimed to be code-independent.
- US1: T006 may run alongside T007–T009 after foundation; serialize T007 → T008. T009 touches a separate file and can run alongside viewer work once geometry is known.
- US2: T010 and T011 can be authored in parallel after US1 and before the corresponding implementation. Serialize T012 → T013 → T014 → T015 → T016 because they share runtime/transaction files.
- US3: T017 and T018 can be authored in parallel after US2 and before the corresponding implementation. Serialize T019 → T020 → T021 → T022 because runtime and carousel ownership overlap.
- T023 follows all story work; T024 follows T023; T025 follows observed validation. Do not treat an unavailable physical-device or real visibility scenario as a pass.

### Parallel execution examples

- **US1**: After T005, assign T006 (`tests/acceptance/stage-rest.spec.ts`) and T007 (`src/lib/model-viewer.ts`) to separate workers; T009 (`src/styles.css`) may proceed once T005 geometry is available.
- **US2**: After US1, assign T010 (`tests/acceptance/settlement.spec.ts`) and T011 (`tests/acceptance/stage-motion.spec.ts`) in parallel; begin runtime integration after their intended behavioral coverage is agreed.
- **US3**: After US2, assign T017 (`tests/acceptance/stage-catalog.spec.ts`) and T018 (`tests/acceptance/stage-readiness.spec.ts`) in parallel; keep T019–T022 with one integration owner.

## Implementation Strategy

1. Complete setup and foundation, then deliver US1 as the MVP and run its independent real-browser check.
2. Add US2, validate native-to-compositor timing and metadata synchronization, then add US3 and validate small and incomplete catalogs.
3. Complete cross-cutting verification and record observed evidence. Preserve owner assets, production isolation, existing resource cleanup, and feature 003 behavior throughout.
