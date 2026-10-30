# Implementation Plan: Carousel Interaction Motion Amendment

**Branch**: `003-carousel-interaction-motion` | **Revised**: 2026-10-30 | **Spec**: [spec.md](spec.md)

**Status**: Original feature 003 motion was implemented and verified on 2026-10-29. The 2026-10-30 amendment is implemented; [quickstart.md](quickstart.md#amendment-evidence--2026-10-30) records observed evidence and outstanding verification rather than treating historic results as amendment proof.

## Summary

Adopt Figma ProjectCarousel `39:205` as a responsive full-width carousel layout. Position native navigation controls above the transparent Three.js canvas, with the canvas spanning the carousel width. Preserve the title, mode controls and description as stationary accessible UI. Recompute projection, fit and transition travel from the actual full canvas bounds and preserve input, focus and responsive behavior.

Start all catalog model loads independently at runtime startup. Keep each completed asset in a runtime-lifetime registry with its own load, failure and resource ownership. Do not delay the initial model on other entries. Selection chooses an entry without refetching; a failed entry is reported only when selected and never blocks healthy entries. At rest draw only the selected model; during transition draw only outgoing and incoming. Preserve isolated non-presented candidate preflight, metadata proof, synchronous settlement and exactly-once position messaging.

## Technical Context

- **Language and platform**: Strict TypeScript 7.0.2, React 19.3.1, Vite 8.3.5, direct Three.js 0.186.1, Tailwind 4.3.3; responsive WebGL 2 static portfolio. Node >=22.12; existing deployment baseline Node 24.
- **Dependencies**: Existing runtime and `@playwright/test` 1.64.1; no new runtime dependency. Existing module-lazy viewer, one transparent renderer, fixed lights, authored assets and static readonly catalog remain.
- **Data and ownership**: Per-mount registry keyed by existing unique project ID, per-entry abort/parse/resources and state. Selected and candidate references govern presentation, not resource ownership. No backend, global cache, per-model renderer, model/geometry copies or persistent neighboring preview.
- **Scale and tradeoff**: The current production catalog contains the owner-supplied axe and hammer; verification also uses three distinct fixtures. Starting and retaining all models increases startup bandwidth, decode contention and memory; visibility prevents drawing but does not free memory. Do not introduce an unrequested cap, eviction policy or loading queue that waits for another model.
- **Performance**: Retain 24-second turntable, <=500 ms visible return and <=500 ms normal native activation-to-presented settlement. Startup contention and GPU upload are not assumed free; measure the actual implementation without waivers. No per-frame React state or hidden-time catch-up.
- **Testing**: Extend existing Chromium acceptance harness and fixtures for real concurrent loads, independent errors, presentation participation, synchronized details and desktop/mobile canvas layout. Run existing compositor-timed navigation and delayed-details suite plus typecheck/build and actual production preview. Retain production isolation and nested-base asset rules.
- **Constraints**: Preserve unrestricted inspection, reduced motion, focus, local hover and mode artwork, empty/single catalogs, embedded-only resource validation, original model bytes, background canvas, zoom and DPR cap. Hidden assets may consume memory; no claim that hidden equals disposed.
- **Unknowns**: No unresolved product clarification. Actual loading contention, memory use, visual fit and frame timing require implementation measurements; they are not assumed solved by this plan.

## Constitution Check

The constitution is an unfilled template and imposes no adopted principles. Pre-research and post-design checks pass: the plan preserves the inherited product contracts, the explicitly requested Three.js and Figma constraints, resource safety, accessibility, production isolation and measurable acceptance. No waiver is required. The spec quality checklist is 13/16: its technology-neutrality checks do not pass because the owner explicitly requested Three.js and verification of drawing; this is not a constitutional violation.

## Project Structure

- `src/components/ProjectCarousel.tsx`, `ModelViewer.tsx`, `CarouselMetadata.tsx`, `ViewModeControls.tsx`: catalog handoff, single viewer lifecycle, responsive layout and unchanged semantic settlement.
- `src/lib/model-viewer.ts`: per-model registry, startup loading, presentation slots, scheduler, resource lifecycle and failure isolation.
- `src/styles.css` and `src/assets/figma/`: full-width stage, Figma-aligned overlay, native controls and existing artwork.
- `tests/acceptance/`, `tests/support/fixtures/`, `playwright.config.ts`: existing real Chromium acceptance and distinct fixtures, extended without publishing fixtures.
- [research.md](research.md), [data-model.md](data-model.md), [contracts/components.md](contracts/components.md), [quickstart.md](quickstart.md): decisions, ownership, contracts and runnable validation.

## Phase 0: Research

Two independent read-only research slices inspected current load/selection/resource behavior and layout/input behavior. Decisions and alternatives are recorded in [research.md](research.md). Figma data already retrieved for `39:205` shows a 1152px desktop main area, overlaid navigation, central title/media/mode row and description; a later independent node request was rate-limited. Recheck exact visual details from the design when implementing rather than guessing mobile measurements.

## Phase 1: Design and Contracts

1. Pass the static catalog to the persistent runtime once per mount. Begin every fetch without waiting for another to finish, with separate load context and per-entry state. Decode, bounds-check and retain each result; callbacks guard runtime ownership and must not reveal or announce a selection. Selection attaches its own current request ticket to an entry rather than using a load generation as the selection identity.
2. Distinguish asset lifetime from presentation lifetime: successful assets stay in the registry until teardown, while only displayed/candidate roots are visible or rendered. On navigation reset the destination pose, preserve mode and continue to enforce latest-request selection and the existing preflight and metadata gates. Reset/hide the outgoing presentation after settlement rather than disposing its asset.
3. A nonselected load failure records an entry-local error and leaves current presentation and all other loads alone. Selecting an already failed entry uses the existing destination-named failure path, clears stale pixels and permits onward navigation. Global renderer/context loss remains terminal. On unmount abort pending loads, detach resources, dispose each entry exactly once and release late decoder results safely; preserve Strict Mode guarded context-loss deferral.
4. Implement Figma layout with a full-width measurable stage and actual resized drawing buffer, not CSS-stretched pixels. Overlay semantic buttons above the canvas without intercepting canvas drag elsewhere. Preserve z-order, focus ring, pointer capture, touch behavior and title/mode/description accessibility. Keep fit/framing and carousel travel correct under the changed aspect ratio and zoom; maintain no horizontal overflow at both acceptance widths.
5. Retain turntable/inspection, mode overrides, reduced motion, activation timestamp, adaptive directional motion, visibility pause, metadata curtain and finalization semantics. Existing runtime currently uses a 120–360 ms adaptive duration and 75 ms headroom; preserve actual behavior unless measurement demonstrates a needed correction, while retaining the <=500 ms external acceptance requirement.
6. Extend real acceptance: hold one noninitial response while observing all requests and initial settlement; inject a failed model and verify healthy navigation; exercise superseded selections and revisit without refetch; inspect actual model draw participation at rest and through both directional transitions, distinguishing preflight probes from displayed frames. Exercise initial failure and late completion after disposal. Verify full-width stage bounds and native control/canvas interactions at 1280 × 832 and 375 × 812. Run [quickstart](quickstart.md) for inherited and amended requirements.

[Data model](data-model.md) defines entry and selection state; [component contracts](contracts/components.md) define ownership and boundaries. The current acceptance and browser evidence, plus the remaining verification limitations, are recorded in [quickstart.md](quickstart.md#amendment-evidence--2026-10-30); previous evidence remains historical.

The requested `.specify/scripts/bash/update-agent-context.sh codex` invocation failed with exit 127 because no updater script exists in the installed script inventory. `AGENTS.md` is maintained manually.

## Phase 2: Task Handoff

The regenerated [task backlog](tasks.md) orders catalog/runtime ownership before integration, serializes shared viewer work, and follows layout and acceptance with integrated verification and production isolation. Original completed tasks are historical and do not implement this amendment.

## Complexity and Risks

The registry is necessary for independent startup and no refetch; presentation remains at most two model roots even though all parsed assets are retained. Higher catalog size can increase bandwidth and CPU/GPU memory with no specified bound; record observed limits rather than silently weakening the startup contract. Context loss, noncancelable parse completion, concurrent request tickets and first-draw errors require explicit ownership tests. A passing design review is not runtime, visual or timing proof.
