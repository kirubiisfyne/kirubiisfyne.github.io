# Feature Specification: Conveyor Art Carousel

**Feature Branch**: `007-conveyor-art-carousel`<br>
**Created**: 2026-11-17<br>
**Status**: Clarified; ready for planning<br>
**Input**: Replace the 3D Art Carousel's orbital Cover Flow movement with a conveyor belt: Next slides showcased models left; Previous slides them right.

## Side-scaling revision

Three-slot layout remains, with side models at 75% of center scale. Models smoothly grow or shrink as they move between center and sides; common depth, sharp rendering and spatial edge dither remain.

## Current three-slot revision

The latest request supersedes five-slot depth and pixelation revisions below. Restore three equally scaled, sharp, common-depth models at rest (one for a single-item catalog), with gradual spatial edge dither and up to four occurrences while navigating. Center inspection, FIFO navigation, readiness isolation, accessibility and reduced motion remain unchanged.

## Pixelation revision

Progressive pixelation replaces blur on side artworks: inner and outer blocks measure 4 and 7 CSS pixels respectively, interpolating toward sharp center during navigation. Center remains sharp; depth, scaling, composition and all interaction rules remain unchanged.

## Superseding visual revision

The later five-slot request supersedes all original references below to three resting positions, four transition occurrences, equal depth, and uniform side scale. Ready catalogs with multiple items show five positions (repeating visual occurrences for fewer than five entries); single-item catalogs remain single. Up to six occurrences participate during a slide. The centered model stays sharp and forward; inner and outer neighbors progressively recede, shrink, and blur, with smooth interpolation. Desktop fits five; mobile preserves center size and may crop outer positions. Horizontal FIFO navigation, readiness isolation, accessibility, metadata synchronization, and reduced motion remain unchanged.

## Clarifications

### Session 2026-11-17

- At rest: selected model centered with previous/next neighbors alongside it.
- Presentation originally used uniform slot scale; this was superseded by the later request to make side models smaller. Neighbors remain front-facing and at the same depth as the center.
- Navigation: straight smooth horizontal slides, not continuous movement, anticipation, overshoot, or stepped motion.
- Preserve existing controls, inspection, display modes, metadata synchronization, wrapping, and reduced-motion support.
- Preserve the centered model's idle turntable; neighbors stay at default front-facing poses.
- Repeated visual instances of an artwork are allowed when needed for seamless wrapping, including two- and three-artwork catalogs. They do not create new catalog entries.
- On narrow screens, preserve the center's prominence and allow neighbors to be cropped instead of shrinking the whole row to fit.
- Queue every Next/Previous activation, including those received during preparation or movement; finish each requested one-slot selection in input order.
- Replace the concentrated spotlight appearance with even lighting; progressively dither only model portions approaching the left and right visible edges, keeping central portions opaque.
- Scale side models down; initial implementation uses 75% of the center's normalized scale and smoothly grows/shrinks models as they enter/leave center.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate a horizontal belt (Priority: P1)

As a visitor, I can move through artwork with Next and Previous while the entire visible row slides in one direction, keeping the selected artwork centered after each move.

**Why this priority**: This is the requested change and establishes the conveyor's visual identity.

**Independent Test**: With four ready artworks, activate Next and Previous and observe smaller side models travel horizontally and smoothly grow or shrink as they change slots.

**Acceptance Scenarios**:

1. **Given** a ready center and ready neighbors, **When** at rest, **Then** their centers share a horizontal line and depth, side slots use 75% of the center's normalized display scale, and neighbors use their default front-facing pose.
2. **Given** a ready belt, **When** Next is accepted, **Then** every moving instance travels left by one slot, without vertical travel, depth arcs, anticipation, or overshoot; the incoming artwork grows and the outgoing center shrinks smoothly.
3. **Given** a ready belt, **When** Previous is accepted, **Then** the same behavior occurs toward the right and the previous artwork settles centered.
4. **Given** an outgoing center with an inspected or turntable pose, **When** navigation occurs, **Then** its pose returns smoothly to its default while its position follows the same horizontal slide; the destination settles in its default pose before resuming the existing turntable.

### User Story 2 - Browse seamless loops on any screen (Priority: P1)

As a visitor, I can navigate past either end without seeing the belt reverse, teleport across the visible row, or break on small catalogs or narrow screens.

**Why this priority**: A belt must maintain directional continuity through wrapping, not only in the middle of a large collection.

**Independent Test**: Cycle both directions through two-, three-, and four-artwork catalogs on desktop and mobile.

**Acceptance Scenarios**:

1. **Given** the final artwork centered, **When** Next is accepted, **Then** the first artwork enters from the right and settles centered while the row slides left; Previous wraps symmetrically.
2. **Given** two artworks, **When** at rest or navigating, **Then** visual copies may fill both neighbor positions and entering/exiting slots without adding logical artworks, duplicate announcements, or extra selection stops.
3. **Given** three artworks, **When** navigating, **Then** the artwork crossing the loop boundary may appear in distinct exiting and entering instances, never sweeping backward across the center.
4. **Given** a narrow viewport, **When** viewing or navigating, **Then** center prominence is retained, neighbors may be cropped, controls remain usable, and the page gains no horizontal scrolling.

### User Story 3 - Keep inspection and trustworthy selection (Priority: P2)

As a visitor, I can inspect the selected model and use existing modes and accessible controls without the new choreography changing selection semantics or resource reliability.

**Why this priority**: The visual update must not regress established interaction and readiness behavior.

**Independent Test**: Inspect the center, change modes, navigate under delayed preparation, and repeat with reduced motion and keyboard-only input.

**Acceptance Scenarios**:

1. **Given** a ready center, **When** I drag or use its inspection keys, **Then** existing center-only inspection, pause/regrab behavior, return motion, and focus behavior remain intact; copies do not become separately selectable.
2. **Given** a selected display mode, **When** navigation completes, **Then** the mode is retained across every visible instance and the center's inspection orientation resets as before.
3. **Given** a destination still preparing, **When** navigation is requested, **Then** destination details remain curtained and unavailable to assistive technologies until its final centered draw and synchronized selection finalization; the position announcement updates exactly once.
4. **Given** reduced motion, **When** navigation is accepted and preparation finishes, **Then** selection updates without belt travel, automatic turntable motion, or decorative movement.
5. **Given** a destination loading or a slide in progress, **When** I activate Next, Next, Previous, Next, **Then** all four directions are queued and serviced in that order after the active move, with each selection settling and announcing once before the following request starts.

### Edge Cases

- Zero entries: retain the current no-viewer behavior. One entry: show one centered instance, no repeated neighbors, and disabled navigation.
- Two entries: both neighbor slots refer to the other artwork; instances have separate transforms but one logical identity.
- Three entries: wraparound requires separate exiting/entering instances of one logical artwork during a slide.
- A neighbor is loading or fails validation: leave its slot empty rather than substitute another artwork or block a healthy center.
- The destination fails loading or validation: retain established error/navigation behavior; never finalize it as successfully displayed.
- Rapid navigation and reversals: enqueue every activation in order, including alternating directions, and finish each before starting the next; do not collapse opposite inputs or skip intermediate selections. Mode changes, resize, visibility loss, and late load completion retain generation guards; stale work must not settle a newer selection.
- Context loss or unmount: retain unavailable UI, safe navigation, and complete cleanup, including repeated visual instances.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Replace orbital Cover Flow positioning with three horizontal rest slots: previous, selected, next. Ready neighbors participate; absent or failed neighbors leave empty slots.
- **FR-002**: Side slots MUST use 75% of the center's normalized model scale at rest while preserving equal slot depth and vertical center. Artwork moving into or out of center MUST interpolate smoothly between side and center scale. Different authored proportions may still produce different silhouettes.
- **FR-003**: Preserve authored roll and default model orientation. Neighbors remain front-facing by default; the center retains its existing turntable and inspection behavior.
- **FR-004**: Next MUST translate the belt left by one evenly spaced slot; Previous MUST translate it right. Travel MUST be smooth and monotonic with zero vertical/depth displacement, no anticipation, and no overshoot; the center/side scale transition follows the same eased progress.
- **FR-005**: Navigation MUST remain activation-driven, not continuously scrolling. Existing controls remain, but every Next/Previous activation during preparation or movement MUST enter a first-in, first-out queue. Each queued direction is resolved relative to the logical selection when its turn begins. Do not drop, merge, reverse-cancel, or supersede queued inputs during healthy operation. Belt-drag navigation and clickable previews are out of scope.
- **FR-006**: Preserve collection order and bidirectional wrapping. Loop-boundary changes MUST occur outside the visible row or through equivalent visual instances, never by reversing a visible instance across the center.
- **FR-007**: Visual instances MAY repeat artwork identities when needed for seamless wrapping. They MUST NOT change catalog size, metadata, navigation order, accessibility announcements, or shared loading semantics. Single-entry catalogs MUST NOT repeat.
- **FR-008**: Preserve center-only unrestricted inspection, independent pointer/keyboard inspection ownership, existing pause/return behavior, orientation reset on selection, and mode persistence. Authored roll remains intact.
- **FR-009**: Preserve per-artwork/per-mode readiness validation, independent retained loads, synchronized final centered draw and metadata finalization, stale-request rejection, and one position announcement per settled navigation.
- **FR-010**: Preserve the 1500 ms settlement budget under supported ready/preparable conditions, measured from activation for an idle belt and from start of service for a queued request. Queue waiting time is excluded; end-to-end waiting grows with queue length. Proportionally shorten animation for late preparation and never bypass readiness to meet a deadline. Requests held beyond their service budget settle without additional decorative travel once preparation completes.
- **FR-011**: Preserve full-width canvas alignment, stage-relative center sizing, responsive layout, existing controls, focus behavior, and no horizontal page overflow. Narrow viewports MAY crop neighboring models.
- **FR-012**: Reduced motion MUST remove belt travel and automatic/decorative motion while preserving deliberate inspection, selection, readiness, and accessible metadata updates.
- **FR-013**: Preserve loading failure, terminal context-loss, visibility-aware rendering, and resource cleanup behavior. Repeated visual instances MUST NOT trigger duplicate artwork downloads or separately owned copies of shared render resources.
- **FR-014**: This feature MUST NOT change the game showcase, skills conveyor, page artwork, model discovery/configuration format, or supplied model files.
- **FR-015**: After successful settlement, begin the next queued request without overlapping selections. A recoverable selection failure MUST release the queue for onward navigation using the existing logical error-selection semantics; unmount or terminal viewer failure MUST clear pending animation work and preserve established unavailable-navigation behavior.
- **FR-016**: Use even illumination without a concentrated spotlight appearance while preserving visible authored materials and form.
- **FR-017**: Progressively dither model fragments near both visible horizontal edges so they disappear before clipping; retain full coverage away from the edges. Apply this spatial fade in all display modes, independently of navigation and reduced-motion preferences.

### Key Entities

- **Artwork**: One logical catalog entry with stable identity, source model, authored roll, title, and optional description.
- **Belt instance**: A visual occurrence of an artwork in a rest or transition slot; several instances may reference one artwork without becoming separate selections.
- **Belt slot**: An evenly spaced horizontal position with shared depth and vertical alignment; side slots use a smaller normalized scale than the center.
- **Navigation request**: One accepted direction, destination, activation time, readiness gate, and synchronized settlement outcome.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For ready two-, three-, and four-or-more-artwork catalogs, every accepted Next/Previous move shifts visible instances exactly one slot in the requested direction; sampled positions show no vertical/depth travel, while center/side scale changes smoothly and monotonically.
- **SC-002**: At desktop 1280 × 832 and mobile 375 × 812, ready side slots use 75% of center normalized scale and share horizontal alignment; center remains prominent, controls usable, and page horizontal overflow is zero.
- **SC-003**: A complete forward and backward cycle visits each logical artwork exactly once before repeating, including two- and three-artwork catalogs, with no visible wrong-way wrap traversal.
- **SC-004**: Under the existing supported acceptance conditions, idle activations and each serviced queued request settle within their 1500 ms service budget; delayed readiness never reveals destination metadata early and produces exactly one position announcement after each final centered presentation.
- **SC-005**: Inspection, all three display modes, reduced motion, keyboard navigation, zero/one-entry behavior, readiness failures, and context cleanup pass regression validation on both target viewport sizes.
- **SC-006**: A rapid sequence of Next, Next, Previous, Next produces four ordered one-slot settlements and four position updates, with no lost or merged inputs, on both viewport sizes.

## Assumptions

- 75% is an initial tuning choice for side models, not a user-specified exact ratio. Normalized scale does not imply differently shaped artworks occupy identical pixel bounds.
- Front-facing describes the default pose, not an instruction to disable the explicitly retained center turntable or manual inspection.
- Use a 700 ms smooth slide when preparation permits, within the retained 1500 ms deadline; this timing is an initial implementation default, not an additional user-selected visual requirement.
- Preserve center prominence at approximately its current resting display size; neighbors are smaller and may be cropped. Existing spacing and edge dither remain unchanged.
- Queueing explicitly replaces the old policy of superseding requests during loading and ignoring activations during movement. FIFO waiting necessarily extends total activation-to-settlement latency; the 1500 ms budget applies once each queued move starts service.
- No queue cap, cancellation gesture, or fast-forward behavior is introduced in this feature. Queue entries hold only lightweight input records; model preparation and selection remain serial.
- This specification supersedes feature 004's unequal/depth-offset slots, tilted orbital movement, non-duplicated visual participation limits, small-catalog orbital paths, and busy-input policy, plus subsequent anticipation/overshoot choreography. It preserves loading, inspection, metadata, accessibility, and lifecycle guarantees except for the explicitly redefined queue service budget.
