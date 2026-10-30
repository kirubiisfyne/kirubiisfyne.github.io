# Feature Specification: 3D Cover Flow Stage

**Feature Branch**: Not created; the configured branch hook is unavailable.

**Created**: 2026-10-30

**Status**: Draft

**Input**: Extend feature 003 into a three-slot orbiting Cover Flow showcase, preserving its interaction, accessibility, loading, and responsive behavior.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See neighboring projects (Priority: P1)

A visitor sees the selected project prominently in the center, with its neighboring projects suggesting the available direction of travel.

**Why this priority**: The resting stage establishes the requested Cover Flow experience.

**Independent Test**: Open a catalog of three distinct ready models, inspect the centered and flanking models, change display modes, and inspect the centered model manually.

**Acceptance Scenarios**:

1. **Given** at least three ready models, **When** the stage settles, **Then** the selected model is centered at its full fitted scale, the immediate previous model is smaller and recessed to the left, and the immediate next model is smaller and recessed to the right; all other models are hidden and undrawn.
2. **Given** a settled stage, **When** the active model spins or is inspected, **Then** both previews remain static at their own fitted initial poses and cannot be independently inspected.
3. **Given** any display mode, **When** the visitor changes it, **Then** the centered model and all visible previews use the chosen mode without changing the active inspection pose.

### User Story 2 - Orbit between projects (Priority: P1)

A visitor navigates in either direction and sees the models travel around the stage, with the new selection advancing to the center and matching project details appearing at settlement.

**Why this priority**: Directional orbital movement makes the neighboring previews meaningful and preserves coherent selection.

**Independent Test**: Navigate both directions and across wrap boundaries with four ready, distinct models, then repeat with reduced motion and delayed details.

**Acceptance Scenarios**:

1. **Given** at least four ready models, **When** Next is activated, **Then** the active model moves into the left preview slot while shrinking and receding, the right preview advances and grows to the center, the new next model enters the right slot, and the former left preview exits and hides. Previous mirrors these movements, including at wrap boundaries.
2. **Given** a ready destination and details without introduced delay, **When** navigation is activated, **Then** the centered destination and matching visible details settle within 0.5 seconds of activation; the selected display mode is retained and the destination starts at its fitted initial pose.
3. **Given** navigation with reduced motion enabled, **When** the selection is ready to settle, **Then** the stage updates to the new slots without animated intermediate frames and the same details and announcement rules apply.
4. **Given** destination details are delayed, **When** navigation is accepted, **Then** selection details are hidden visually and from assistive technology until the matching centered model and details settle together, with one accessible position announcement and none for abandoned selections.

### User Story 3 - Browse incomplete or small catalogs (Priority: P1)

A visitor can continue browsing even when neighboring projects are unavailable or the catalog contains fewer than three projects.

**Why this priority**: Preview readiness must not undermine the active project's availability or make small catalogs misleading.

**Independent Test**: Exercise empty, one-, two-, and three-model catalogs, holding or failing a neighbor's load and then selecting it.

**Acceptance Scenarios**:

1. **Given** an active ready model and a loading or failed neighbor, **When** the stage rests or settles on the ready model, **Then** the affected preview slot is empty and no neighbor loading or error message obscures the active model or delays its settlement. A preview appears when it becomes ready and remains adjacent.
2. **Given** a loading or failed model is selected as the destination, **When** its state is known, **Then** the existing destination-specific loading or unavailable behavior applies and navigation remains usable.
3. **Given** one model, **When** it is ready, **Then** only that centered model appears and navigation is disabled. An empty catalog mounts no viewer.
4. **Given** two ready models, **When** the stage rests, **Then** the selected model is centered and the other appears only in the right preview slot. Next and Previous each select the other model without displaying a duplicate at any time.
5. **Given** three models, **When** navigation occurs, **Then** each model appears at most once throughout the transition, and the remaining model moves between the vacated and newly adjacent preview positions as needed.

### Edge Cases

- A preview that becomes ready after selection changes appears only if it is still adjacent; a failed preview remains empty until selected, when its failure is identified.
- Rapid accepted navigation, delayed details, and late loads settle only the latest requested selection; stale results never reveal or announce an abandoned selection.
- Navigation ends active inspection; an earlier gesture cannot control a different selection. Regrabs during return retain the original saved pose.
- Hidden, offscreen, or inactive viewing pauses motion progress without jump or catch-up; reduced motion removes intermediate automatic motion without overriding active manual inspection.
- Different model proportions remain framed without distortion. At 375px and 1280px, controls remain usable and no page-level horizontal scrolling occurs.
- An unavailable active destination shows the existing destination-specific error and permits navigation onward; a rendering surface failure retains the existing unavailable behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: At rest with at least three catalog entries, the stage MUST show the ready selected model centered at full fitted scale, the ready immediate previous model to its left, and the ready immediate next model to its right. Previews MUST be smaller and recessed in depth. Other entries MUST be hidden and undrawn.
- **FR-002**: Previews MUST remain at their own fitted initial poses, without automatic rotation or pointer, touch, or keyboard inspection. Only the centered active model MUST spin and accept inspection.
- **FR-003**: All visible models MUST reflect the selected Clay, Rendered, or Wireframe mode. Mode changes MUST preserve the active model's pose and motion or inspection progress; navigation MUST retain the mode.
- **FR-004**: With four or more entries, Next MUST move the outgoing active model left into the recessed, smaller preview position, advance the right preview into the full-scale center, bring the newly adjacent model into the right preview position, and remove the former left preview. Previous MUST mirror these movements. Motion MUST communicate a continuous orbital relationship and wrap in the requested direction. Two- and three-entry catalogs MUST follow the exceptions in FR-005.
- **FR-005**: A model MUST NOT be shown more than once at any instant. With three entries the shared exiting and entering neighbor MUST move between preview positions without duplication; with two entries the only neighbor MUST occupy the right preview at rest and navigation in either direction MUST select it without duplication. With one entry only the center is shown and navigation is disabled; with none no viewer is mounted.
- **FR-006**: Startup MUST begin loading all catalog models independently. Loading or failure of a non-active neighbor MUST leave its slot empty and MUST NOT delay active settlement or display an error over the active model. A newly ready neighbor MUST appear if it is still adjacent, without changing selection or issuing a position announcement.
- **FR-007**: Selecting a loading or failed destination MUST retain feature 003's destination-specific loading or unavailable behavior and allow onward navigation. Stale loads and delayed details MUST NOT replace or announce a later selection.
- **FR-008**: For ready destinations and details without an introduced delay, successful navigation MUST settle the centered model and matching visible details within 0.5 seconds from activation. Deliberately delayed destination readiness or details MUST be assessed separately and MUST NOT produce a false successful settlement.
- **FR-009**: Accepted navigation MUST immediately hide title and optional description visually and from assistive technology. The current destination's matching details and centered model MUST become available together at settlement, with exactly one accessible position announcement. Pending, failed, or abandoned selections MUST NOT produce a successful-selection announcement.
- **FR-010**: The active model MUST retain feature 003's 24-second turntable, unrestricted pointer/touch/keyboard inspection, independent input activity, saved pre-inspection pose, shortest return and regrab behavior, and return within 0.5 seconds of visible viewing time after all inspection ends. Navigation MUST end inspection and reset the destination to its fitted initial pose.
- **FR-011**: Reduced motion MUST suppress automatic turntable, orbital and return animations while retaining manual inspection and navigation. After inspection ends the saved pose MUST appear on the next visible update. Preference changes MUST take effect without reload. Hidden tabs, offscreen viewers, and inactive windows MUST pause motion progress and resume without jump or catch-up.
- **FR-012**: The full-width stage MUST remain behind operable navigation controls. At 375px and 1280px, centered models MUST remain fully framed while rotating, previews and controls MUST remain visible within the stage, and the page MUST NOT scroll horizontally due to the carousel.
- **FR-013**: Existing catalog discovery, owner-supplied assets, descriptions, authored textures, focus behavior, background, and unavailable-surface handling MUST remain intact. This feature supersedes feature 003 FR-016 and its corresponding single-model-at-rest and two-model-only-transition acceptance statements; other feature 003 behavior remains in force.

### Key Entities

- **Catalog entry**: An owner-supplied model and its associated title and optional description, ordered for wrap-around navigation.
- **Stage slot**: The center, left preview, or right preview position; a slot can be empty when its assigned model is unavailable.
- **Active selection**: The current destination whose centered model, details, and accessible position settle together.
- **Preview**: A ready adjacent entry displayed in a smaller, recessed, non-interactive initial pose.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In catalogs of three and four distinct ready models, every settled selection displays exactly the selected entry and its two immediate neighbors in their prescribed positions; all other entries are hidden and undrawn.
- **SC-002**: For Next and Previous, including both wrap boundaries, a ready destination and matching details settle within 0.5 seconds of activation without introduced loading delay; observed transitions follow the specified orbital directions and slot changes.
- **SC-003**: Across zero-, one-, two-, three-, and four-entry catalogs, no entry appears more than once at any moment; navigation and resting slots follow the specified catalog-size rules.
- **SC-004**: With an adjacent load held open or failed, a ready active model and its matching details settle without waiting for that neighbor, and no neighbor error obscures it. Selecting that neighbor yields the appropriate loading or unavailable state; another healthy entry remains reachable.
- **SC-005**: In a delayed-details exercise held longer than 0.5 seconds, no centered destination is paired with readable predecessor details, no pending or abandoned selection produces a successful position announcement, and exactly one announcement becomes available with the correctly settled destination. Test ordinary navigation, supersession, revisiting, and reduced motion.
- **SC-006**: At both 375px and 1280px, visitors can operate navigation and display modes, inspect the center, and see the prescribed stage without page-level horizontal scroll. Previews remain static and the active model completes a turn in 24 seconds ±1 second of visible viewing time when motion is allowed.
- **SC-007**: Pointer, touch, and keyboard inspection, combined inputs, regrabs, visibility pauses, and reduced motion preserve feature 003's return and accessibility outcomes; each uninterrupted animated return completes within 0.5 seconds of visible viewing time, and reduced motion has no intermediate animated frames.

## Assumptions

- Feature 003's implemented catalog, loading, motion, selection synchronization, and responsive behavior are the baseline; this specification changes the stage participation and navigation choreography explicitly described above.
- For two entries, the right preview is the deterministic resting position regardless of the last navigation direction. For three entries, the one shared neighbor moves between sides rather than being duplicated. Exact paths and preview proportions are planning decisions subject to the stated visible outcomes.
- A preview that becomes ready may appear without waiting for another navigation. A preview has no separate loading or error message; active destination states retain their existing messages.
- Only owner-supplied models appear in the portfolio. Distinct verification fixtures do not become published projects. This specification describes future acceptance, not completed implementation or test results.
