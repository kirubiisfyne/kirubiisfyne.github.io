# UI Contracts

## H1

Module: `src/components/H1.tsx`.

Props: readonly `id: string`, `label: string`, `artworkSrc: string`.

- Native `h1` displays `[ PROJECTS ]` for the supplied content; decorative ASCII artwork is excluded from the accessible name.
- Matches Figma `10:19`: centered column, 20-pixel top padding, 8-pixel artwork/label gap. Artwork frame preserves reference fill and scales down without clipping.
- No dependency on page state, background, or global selectors beyond shared typography/tokens.

## H2

Module: `src/components/H2.tsx`.

Props: readonly `id: string`, `label: string`, `artworkSrc: string`, `description: string`.

- Native `h2` displays `[ 3D Art ]`; native paragraph provides the description.
- Matches Figma `10:13`: centered column, 20-pixel top padding, 10-pixel gaps; artwork retains its source proportions. Description can wrap/grow on smaller screens.
- Decorative ASCII artwork has an empty alternative and no duplicate spoken heading.

## ProjectCarousel

Module: `src/components/ProjectCarousel.tsx`.

Props: readonly `projects: readonly Project[]`, using [data-model.md](../data-model.md).

- Named region `Projects`; native `button type="button"` controls named `Previous project` and `Next project`.
- Tab focus is visible; Enter/Space activate buttons. Changing selection never moves focus away from the activated button. Announce the new selection with a concise polite status without making all decorative artwork live.
- Initial card is the first item. Both directions wrap for multiple items; both controls are disabled for zero/one. Empty input omits the card.
- Render the selected title's outlined SVG as decoration alongside equivalent accessible title text; artwork is a normal image with `imageAlt`; description is native text. Every visible field belongs to the same selected project.
- Match Figma `11:39`: row with 32-pixel gaps, 732-pixel desktop main card, original previous/next artwork, and the supplied image's reference proportions/crop. Responsive layout must keep controls reachable and text readable without page overflow.
- No autoplay, routing, external requests, or persistent selection. No additional gesture contract.

## MetaballBackground

Module: `src/components/MetaballBackground.tsx`; renders `null` and takes no props.

- One effect calls the unchanged `mountAsciiMetaballs(document.body)` export and returns its disposer.
- `body` keeps `isolation: isolate`; the original renderer owns the fixed negative-z-index, pointer-transparent, aria-hidden canvas.
- React Strict Mode setup/cleanup/remount must leave one canvas, not two. Unmount removes the canvas and its listeners/animation scheduling through the existing disposer.
- Keep all renderer settings, reduced-motion handling, pointer behavior, and palette unchanged. Remove the old inline mount in `index.html` during React cutover.

## PortfolioPage and entry

- `App` mounts `MetaballBackground` once beside `PortfolioPage`; no router is needed.
- `PortfolioPage` composes greeting, wordmark, introduction, greeting strip, `H1`, `H2`, and `ProjectCarousel` in that order.
- Reference viewport is 1280 × 832. Use 64-pixel outer padding and 20-pixel main gaps at desktop; preserve header's left alignment and centered sections.
- Page/root wrappers are transparent; local light heading/strip highlights from Figma remain. Allow natural vertical scrolling rather than fixing/clipping the whole page to the frame height.
- At 375 pixels wide, scale artwork and reduce outer padding without shrinking body copy into illegibility or requiring horizontal page scrolling.

No network API contract exists; all content and assets ship with the client build.
