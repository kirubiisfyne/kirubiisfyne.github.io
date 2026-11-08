# Feature Specification: Retro TV Game Showcase

**Feature Branch**: `main` (feature directory `005-retro-tv-showcase`)
**Created**: 2026-11-07
**Status**: Draft
**Input**: Add a game development showcase featuring an owner-supplied retro TV and game screen images.

## User Scenarios & Testing

### User Story 1 - Discover games (Priority: P1)
A visitor sees a retro TV displaying a game's image, with its name and description beneath it, in a dedicated portfolio section.

**Independent Test**: Open the portfolio on desktop and mobile and inspect the TV and details.

**Acceptance Scenarios**:
1. **Given** the page loads, **when** the showcase is visible, **then** the TV and initial game's matching name, description, and image appear.
2. **Given** the supplied default TV transform at a desktop or narrow viewport, **when** the showcase is viewed, **then** the entire TV is visible without clipping, controls remain usable, and the page has no horizontal overflow.

### User Story 2 - Change channels and visit a game (Priority: P1)
A visitor browses games using Previous and Next and opens the selected game's itch.io page using Play.

**Independent Test**: Navigate both directions, wrap around the list, and activate Play for each game.

**Acceptance Scenarios**:
1. **Given** a game is selected, **when** Next or Previous is activated, **then** its image, name, description, and Play destination change together to the adjacent game.
2. **Given** the last or first game is selected, **when** Next or Previous respectively is activated, **then** selection wraps to the opposite end.
3. **Given** a selected game, **when** Play is activated, **then** its itch.io page opens in a new tab and the portfolio remains open.
4. **Given** keyboard navigation, **when** a visitor focuses and activates controls, **then** the same actions work and focus remains visible.

### User Story 3 - Maintain showcase (Priority: P2)
The owner updates the game list and adjusts the TV's placement without authoring a new model.

**Independent Test**: Change catalog data and transform values, restart or rebuild, and verify corresponding content and placement.

**Acceptance Scenarios**:
1. **Given** valid game details and an existing compatible screen image, **when** the owner adds a catalog entry, **then** the entry participates in navigation after restart or rebuild.
2. **Given** changed position, rotation, or scale values, **when** the application reloads, **then** the entire TV reflects the configured transform.

### Edge Cases
- An empty catalog shows a useful empty state and no active navigation or Play destination; one game disables navigation while Play remains available.
- Model or graphics failure leaves game details, navigation, and valid Play links usable, with an accessible visual fallback.
- A missing or failed image must not falsely display the previous game's image as the newly selected game; show an unavailable-screen fallback while retaining correct details and link.
- Rapid navigation and late image loads must never replace the selected game's image with a stale result.
- Reduced-motion and keyboard users can access every action; no animation is required.

## Requirements

### Functional Requirements
- **FR-001**: The portfolio MUST contain a distinct game development showcase using the supplied retro TV model.
- **FR-002**: The TV display area MUST span the browser width, and the entire TV MUST remain visible without clipping on desktop and mobile with the supplied default transform.
- **FR-003**: The selected game's supplied screen image MUST appear using the TV's existing screen mapping, without unintended cropping or modification of its asset.
- **FR-004**: The showcase MUST display matching name, description, and Play destination for the selected game.
- **FR-005**: Previous and Next MUST select adjacent games and wrap, with navigation disabled for fewer than two entries.
- **FR-006**: Play MUST open the selected game's itch.io URL in a new tab.
- **FR-007**: The owner MUST be able to edit whole-TV position, rotation, and scale through a shared configuration, without a public transform editor.
- **FR-008**: The owner MUST be able to maintain game metadata, image references, and links in a local catalog; only owner-supplied games and images are shown.
- **FR-009**: Controls MUST have accessible names, support keyboard operation, and show visible keyboard focus; selection changes MUST be perceivable to assistive technology.
- **FR-010**: Image, model, or graphics failures MUST be communicated without breaking navigation or valid links.
- **FR-011**: The feature MUST preserve existing portfolio background, model carousel, and their interactions.

### Key Entities
- **Game**: Display name, description, image reference, and itch.io destination; catalog order determines navigation.
- **TV placement**: Shared position, rotation, and scale applied to the whole TV.
- **Selection**: Current game and its corresponding screen-image readiness.

## Success Criteria

- **SC-001**: On desktop and mobile, visitors can identify the current game and reach either game's page within three control activations.
- **SC-002**: Across ten consecutive navigation actions in either direction, game details and Play link always match selection; no stale image is presented as current.
- **SC-003**: Each of the two supplied games is reachable via keyboard and its Play link opens the correct page in a new tab.
- **SC-004**: With the model or an image unavailable, visitors can still navigate the catalog and open the correct working game link.
- **SC-005**: Editing each transform component changes TV placement on reload without requiring asset modification.

## Assumptions
- Initial catalog contains KonTEXTo and Anii! Grow to Know; the provided itch.io pages supply initial copy and destinations.
- The existing screen images are UV-mapped emissive assets, not conventional aspect-ratio thumbnails. The TV has its own default image; game-specific images live in their respective `games/` folders and are referenced by the catalog.
- One transform applies at all viewport sizes; responsive camera/layout may still adapt. Custom transform values can move or scale the TV outside the frame and may require owner adjustment.
- Catalog changes are picked up on dev restart or production rebuild. Screen transitions and TV interaction are not required.
- The supplied glTF and dependent files must remain available to the browser; no external service or CMS is needed.
