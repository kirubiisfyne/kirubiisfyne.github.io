# Feature Specification: Sticky Site Navigation

**Status**: Planning draft  
**Input**: Add a sticky header styled like Connect, with `[ kirubiisfyne ]` on the left and Overview, Development, Gallery on the right. Overview retains existing carousels and conveyor belts. Development and Gallery are new pages.

## User Scenarios & Testing

### 1. Navigate the portfolio (P1)
Visitors can reach all three pages from a shared sticky header and understand which page they are on.

- Given any page, when the visitor scrolls, the header remains visible without blocking controls or page content.
- Given any page, when the visitor selects Overview, Development, Gallery, or the brand, the corresponding page opens; the brand opens Overview.
- Given a page is active, the matching navigation link is visibly and programmatically identified.
- Given a shared link to a page, when opened or refreshed, the same page loads.

### 2. Discover future sections (P1)
Visitors can open Development and Gallery, see their headings and honest empty states, and return to Overview. Development is reserved for development diaries and case studies; Gallery for 3D assets, renders, and 2D art. Do not publish fabricated entries.

### 3. Navigate on mobile and with assistive technology (P1)
At narrow widths, the brand and all three links remain visible in one compact row. Links support keyboard and touch interaction, with clear focus and active states. Content remains readable and page scrolling does not introduce horizontal overflow.

### Edge Cases
- At 320 CSS pixels and browser text zoom, links must remain readable, actionable and not overlap or clip. If a single row cannot meet accessibility requirements at extreme zoom, prioritize usable reflow over forced single-row layout.
- Sticky header must not cover focused content or anchor destinations.
- Back/forward, refresh, direct links and deployment under a base path preserve page identity.
- Existing overview behavior, independent loading, accessibility, and reduced motion must remain intact.

## Requirements

- **FR-001**: Provide a shared sticky header on Overview, Development and Gallery, visually related to the existing paper-colored Connect footer and its black monospace/bracketed-link language.
- **FR-002**: Show `[ kirubiisfyne ]` at left, linking to Overview; show Overview, Development and Gallery navigation at right in that order.
- **FR-003**: Use a compact single-row layout on ordinary mobile widths, with accessible overflow/reflow fallback when needed at extreme zoom.
- **FR-004**: Preserve all current Overview sections, carousels, conveyor interactions, metadata synchronization, and Connect footer.
- **FR-005**: Provide separate Development and Gallery page shells, each with a distinct heading and truthful empty state. Share background and Connect footer across all pages.
- **FR-006**: Indicate the current page visually and to assistive technology; provide visible keyboard focus and semantic navigation links.
- **FR-007**: Make each page independently linkable and refreshable in development and GitHub Pages production, including subpath deployment.
- **FR-008**: Keep sticky navigation above page artwork while avoiding interference with viewer input, focus, and anchor scrolling.
- **FR-009**: Honor existing reduced-motion behavior and do not change the metaball effect.

## Success Criteria
- All three destinations and the brand work by pointer, touch, and keyboard; active page remains correct after back/forward and refresh.
- At 320, 375 and 1280 CSS pixel viewport widths, primary navigation is visible, readable, operable and free of overlaps; ordinary mobile widths use one row.
- Header remains visible during scrolling on all three pages without obscuring focused controls or headings.
- Direct links and refresh work for all three pages on the production-style GitHub Pages deployment, including a non-root base path.
- Existing typecheck, production build and acceptance suite pass; existing showcase behavior remains unchanged.

## Assumptions and Scope
- Header is shared site-wide; Connect footer and background remain shared across pages.
- Development and Gallery contain headings and honest empty states only; content models, authoring tools, grids, filters, diaries, case studies and detail pages are future work.
- Header styling echoes Connect rather than duplicating its full footer layout. Exact visual details are implementation decisions within existing design language.
- Links are real navigation, not cosmetic buttons or in-page section anchors.
