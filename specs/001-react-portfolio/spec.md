# Feature Specification: React Portfolio Main Page

**Feature Branch**: Not created; no branch hook configured.

**Created**: 2026-10-28

**Status**: Implemented and browser-verified on 2026-10-28; see [quickstart.md](quickstart.md) for evidence and limits.

**Input**: Set up React and Tailwind CSS; construct React components `H1`, `H2`, and `ProjectCarousel`; construct the Figma “MacBook Air - 1” main page, retaining the existing metaball background instead of the design's flat `#023FCC` background.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View the designed portfolio (Priority: P1)

A visitor sees Kirby Bilbao's portfolio in the supplied design, with the existing animated ASCII metaballs visible behind the content.

**Why this priority**: The main page and its existing background are the requested experience.

**Independent Test**: Open the page at 1280 × 832 and compare it with the referenced frame, allowing the explicitly requested background substitution and vertical scrolling.

**Acceptance Scenarios**:

1. **Given** the main page, **When** a visitor opens it, **Then** the greeting, wordmark, introduction, repeated greeting strip, Projects heading, 3D Art section, and project carousel appear in the design's order.
2. **Given** the design's flat blue background, **When** the main page renders, **Then** the existing ASCII metaballs appear behind the content rather than being hidden by an opaque page fill.
3. **Given** normal motion settings, **When** a visitor moves the pointer or resizes the viewport, **Then** the existing background retains its animation, pointer response, and full-viewport coverage without blocking content interaction.
4. **Given** reduced-motion preferences, **When** the page opens, **Then** the background retains its existing non-deforming, non-pointer-responsive behavior and the content remains usable.

### User Story 2 - Read consistent section headings (Priority: P1)

A visitor recognizes the Projects and 3D Art sections through the design's distinct ASCII headings and readable labels.

**Why this priority**: These are the two explicitly named heading components and establish the page's hierarchy.

**Independent Test**: Render each heading independently and compare its artwork, label, alignment, and supporting text with its Figma component.

**Acceptance Scenarios**:

1. **Given** the Projects section, **When** its heading appears, **Then** its ASCII artwork and `[ PROJECTS ]` label match the H1 reference.
2. **Given** the 3D Art section, **When** its heading appears, **Then** its ASCII artwork, `[ 3D Art ]` label, and description match the H2 reference.
3. **Given** assistive technology, **When** a visitor navigates headings, **Then** meaningful section names are available without reading decorative ASCII character by character.

### User Story 3 - Browse project artwork (Priority: P2)

A visitor views a project's title, image, and description and uses the carousel's previous and next controls when multiple projects are available.

**Why this priority**: The carousel presents the portfolio work beneath the headings.

**Independent Test**: Render the carousel with the supplied project, then with multiple distinct projects, and operate it by pointer and keyboard.

**Acceptance Scenarios**:

1. **Given** the supplied project, **When** the carousel appears, **Then** `[ practice_axe.fbx ]`, the supplied axe render, description, and arrow artwork follow the ProjectCarousel reference.
2. **Given** multiple projects, **When** a visitor activates next or previous, **Then** the title, image, and description change together to the adjacent project.
3. **Given** a keyboard user, **When** they reach the carousel controls, **Then** visible focus and accessible previous/next names allow equivalent navigation.

### Edge Cases

- With one project, navigation is disabled without inventing additional projects; retain the reference layout.
- With multiple projects, next after the last returns to the first and previous before the first returns to the last.
- With no projects, omit the project card and disable navigation; do not show fabricated work.
- At narrow viewport widths, headings and artwork fit the available width, descriptions remain readable, and controls stay reachable without page-level horizontal scrolling.
- When a project image cannot load, its descriptive alternative identifies the artwork and the other project information remains available.
- Returning to or remounting the page must not duplicate the background or accelerate its animation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The main page MUST reproduce frame `1:2`, “MacBook Air - 1,” from the supplied Figma file, preserving content order, artwork, typography, alignment, spacing, and foreground colors at the reference size, except for the requested background substitution.
- **FR-002**: The page MUST show the existing ASCII metaball background behind its content, retaining its current appearance, motion preferences, pointer interaction, and viewport behavior. Foreground wrappers MUST NOT obscure it with the frame's solid blue fill.
- **FR-003**: The Projects heading MUST reproduce the H1 reference's ASCII artwork and readable label.
- **FR-004**: The 3D Art heading MUST reproduce the H2 reference's ASCII artwork, readable label, and description.
- **FR-005**: The carousel MUST display each project's title, artwork, and description as one coherent selection, using the supplied project content and previous/next artwork.
- **FR-006**: Carousel controls MUST support pointer and keyboard activation, visible focus, descriptive accessible names, and the boundary behavior stated under Edge Cases.
- **FR-007**: Decorative artwork and the background MUST NOT obstruct interaction or produce redundant screen-reader output; meaningful project imagery MUST have descriptive alternatives.
- **FR-008**: The page MUST remain readable and operable on smaller viewports, adapting the desktop layout without losing content or requiring page-level horizontal scrolling. Vertical scrolling is permitted.

### Key Entities

- **Project**: A portfolio item with a stable identity, displayed title, artwork, image alternative, and description. The supplied item is `practice_axe.fbx`.
- **Project collection**: The ordered projects available for browsing and the current selection. No remote service or persistence is required.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At 1280 × 832, all seven main-page content groups named in Story 1 appear in the reference order; a side-by-side visual review confirms matching typography, artwork, alignment, and spacing, excluding the background substitution.
- **SC-002**: The existing background remains visible behind the foreground before and after viewport resizing; pointer interaction and reduced-motion behavior each pass direct browser checks.
- **SC-003**: With at least two distinct projects, pointer and keyboard navigation each reach every item in both directions, with no mismatched title, image, or description; first/last wrapping and the single-item state behave as specified.
- **SC-004**: At widths of 375 and 1280 pixels, all text and controls remain available with zero page-level horizontal overflow and no clipped heading artwork.

## Assumptions

- **Explicit delivery constraints**: Set up React with TypeScript and Tailwind CSS in this existing project. Implement reusable React components named `H1`, `H2`, and `ProjectCarousel` first, then compose the main page from them, as confirmed during `/speckit.plan`. These are user-mandated constraints, not framework choices introduced by this specification; technical setup belongs in the implementation plan.
- **Presentation override**: After implementation, the user requested a default 125% content scale. Apply it to the foreground page without changing browser preferences or the existing viewport-sized background. Figma dimensions describe the source layout before that scale; this user-requested enlargement supersedes an unscaled pixel-for-pixel presentation.
- **Design source**: [Figma — Untitled, Page 1](https://www.figma.com/design/8Qb17gg8m0JsxFuEScxxsG/Untitled?node-id=0-1). Verified through Figma MCP: main frame `1:2` is 1280 × 832 with 64-pixel padding and 20-pixel main gaps; H1 is `10:19`, H2 is `10:13`, and ProjectCarousel is `11:39`.
- **Asset dependencies**: Reuse the supplied wordmark, heading artwork, project image, arrow artwork, and typography (JetBrains Mono and MS W98 UI) rather than substitute newly invented artwork or content. Asset export and font availability must be resolved during planning before implementation.
- **Existing background**: Reuse `ascii-metaballs.js` and its `mountAsciiMetaballs` lifecycle; do not rebuild the effect. Its current blue base (`#023FCC`) and light glyphs (`#EBEBEB`) remain. The change replaces a flat page background with this existing animated treatment, not a new palette or a transparent canvas.
- **Content**: Preserve the reference's greeting, labels, project, and existing placeholder descriptions until the user supplies replacement copy. No additional projects are invented to demonstrate navigation.
- **Responsive behavior**: The desktop frame is the visual source of truth; smaller screens adapt its composition without introducing new sections.
- **Scope**: Delivered the requested single-page portfolio, typed components, and existing background integration. No additional pages, backend, authentication, project editor, or deployment platform is included.
- **Governance**: The installed constitution is still an unfilled template and supplies no adopted project-specific rules.
