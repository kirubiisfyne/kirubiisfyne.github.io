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

Module: `src/components/ProjectCarousel.tsx`. The static-image presentation is superseded by [feature 002 UI/runtime contracts](../../002-gltf-model-carousel/contracts/components.md).

Props: readonly `projects: readonly Project[]`, using the updated [data-model.md](../data-model.md).

- Named region `Projects`; native controls named `Previous project` and `Next project`. Visible focus, Enter/Space activation, functional wrapping, and activation focus retention remain.
- Initial card is the first entry. Navigation is disabled for zero/one; empty input shows `No models available` and mounts no Three.js renderer.
- Bracketed native filename title, optional description, viewer selection, and polite position announcement derive from one record. One module-scope lazy `ModelViewer` replaces static title/image exports, with local loading/module-unavailable UI.
- Retain the 732-source-pixel desktop card and transparent page composition. Title/media/mode row/description grow naturally; updated native navigation uses fixed footprints, mirrored previous glyphs, and local paper-bar/difference-blend hover/focus artwork. Narrow controls wrap without clipping or page overflow.
- The focusable named canvas supports unrestricted pointer/touch rotation and focused 5° arrow steps, linked visible instructions, and normal Tab exit. One transparent demand-rendered runtime persists through selections.
- Clay, Rendered (initial), and Wireframe are exclusive native pressed buttons. Modes preserve pose and source materials without refetching; selection resets orientation and retains mode. Loading/error disables modes independently of healthy one-item navigation.
- Fetch only the selected self-contained local GLB; show readable failures and permit navigation away. No external model sidecars, autoplay, routing, preferences, or wheel-driven navigation.

## MetaballBackground

Module: `src/components/MetaballBackground.tsx`; renders `null` and takes no props.

- One effect calls the unchanged `mountAsciiMetaballs(document.body)` export and returns its disposer.
- `body` keeps `isolation: isolate`; the original renderer owns the fixed negative-z-index, pointer-transparent, aria-hidden canvas.
- React Strict Mode setup/cleanup/remount leaves one background canvas. A healthy viewer adds its own second canvas; this is not a duplicate background. Background unmount removes only its canvas/listeners/animation scheduling through the existing disposer.
- Keep all renderer settings, reduced-motion handling, pointer behavior, and palette unchanged. Remove the old inline mount in `index.html` during React cutover.

## PortfolioPage and entry

- `App` mounts `MetaballBackground` once beside `PortfolioPage`; no router is needed.
- `PortfolioPage` composes greeting, wordmark, introduction, greeting strip, `H1`, `H2`, and `ProjectCarousel` in that order.
- Reference viewport is 1280 × 832. Use 64-pixel outer padding and 20-pixel main gaps at desktop; preserve header's left alignment and centered sections.
- Page/root wrappers are transparent; local light heading/strip highlights from Figma remain. Allow natural vertical scrolling rather than fixing/clipping the whole page to the frame height.
- At 375 pixels wide, scale artwork and reduce outer padding without shrinking body copy into illegibility or requiring horizontal page scrolling.

No network API contract exists; all content and assets ship with the client build.
