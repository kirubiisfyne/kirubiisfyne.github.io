# Quickstart and Verification

**Status**: Implemented and browser-verified on 2026-10-28.

## Run

Node 22.12+ or a supported newer release and npm are required. Verification used Node 26.3.0/npm 11.16.0.

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

For production:

```sh
npm run typecheck
npm run build
npm run preview -- --host 127.0.0.1
```

Open the URL printed by Vite. `build` emits `dist/`; `typecheck` is a separate command.

## Verification Record

### Commands exercised

- `npm install`: succeeded; dependency versions captured in `package-lock.json`.
- `npm run typecheck`: passed with no diagnostics.
- `npm run build`: passed, 32 modules transformed; built JavaScript 235.62 kB (74.67 kB gzip), CSS 23.27 kB (11.50 kB gzip).
- `npm run preview -- --host 127.0.0.1`: launched successfully at `http://127.0.0.1:4173/`; the actual production output was inspected.

### Components before page assembly

A temporary Vite entry rendered `H1`, `H2`, and later `ProjectCarousel` independently under React Strict Mode. The entry and fixtures were removed after successful checks; there is no permanent gallery or automated test suite.

- **Headings**: Desktop/mobile artwork and highlight bars inspected; native heading names were `[ PROJECTS ]` and `[ 3D Art ]`; decorative artwork was absent from the accessibility tree. No horizontal overflow or clipped artwork.
- **Supplied project**: Correct title artwork, axe render, description, and disabled previous/next controls for the one-item collection.
- **Multiple projects**: Three distinct temporary records (`alpha`, `beta`, `gamma`) with distinguishable title artwork, image alternatives, and descriptions. Next/previous clicks and Enter/Space activation reached all items and crossed both wrap boundaries at 1280- and 375-pixel widths. Visible fields stayed coherent, focus stayed on the activated control, and the keyboard focus outline was 2 pixels.
- **Empty collection**: No card; both controls disabled.
- **Broken image**: Expected failed image request in the temporary harness; descriptive alternative, title, and description remained available. No broken fixture ships in the app.

### Main page and background

- Compared the composed page with the [Figma frame](design/main-page.png): reference content order, original artwork, left-aligned header, centered sections, local highlight bars, and source palette retained. At 1280 pixels, measured outer padding was 64 pixels, header width 1152 pixels, and project card width 732 pixels. Natural vertical scrolling exposes the complete project instead of clipping at the reference frame's bottom.
- Resized between 1280 × 832 and 375 × 812: no horizontal overflow, artwork loaded, controls stayed within the viewport, and the canvas resized to the viewport/device pixel ratio. Root and main backgrounds were transparent; body isolation remained `isolate`.
- Exercised pointer movement while the background was active. Main-world instrumentation of a fresh Strict Mode mount observed two effect setups but one live canvas, one pending animation frame, and one window pointer listener.
- Unmount observed zero canvases, zero pending animation frames, and zero background pointer listeners; remount restored one of each. Instrumentation was browser-injected and is not shipped.
- Toggling reduced motion stopped scheduled background animation. Canvas pixels were unchanged after pointer movement and eight browser frames. Returning to normal motion resumed pixel changes with one pending animation frame. Loading with reduced motion already enabled also produced a static single canvas.
- `ascii-metaballs.js` was not edited; only its React mounting/cleanup integration changed.

### Production preview

At both 1280 × 832 and 375 × 812: one canvas, all nine foreground images loaded, JetBrains Mono loaded, no horizontal overflow, semantic headings present, and both real single-project controls disabled. Canvas pointer events were `none` and z-index was `-1`. No failed resource statuses, JavaScript errors, or console errors were observed on the production page.

Actual production screenshots (not Figma exports):

- [Desktop](evidence/desktop.png)
- [Mobile](evidence/mobile.png)

## Rechecking Behavior

Use [component contracts](contracts/components.md) and [data model](data-model.md) for expected behavior. The production collection intentionally has one item, so multi-item/empty/broken-image checks require an isolated temporary harness with distinct records; do not add demonstration projects to `src/data/projects.ts`.

## Limits and Intentional Constraints

- Visual inspection covered managed Chromium at the two stated viewport sizes; Safari/Firefox and physical-device behavior were not exercised.
- Accessibility inspection covered semantic names, decorative-image exclusion, keyboard activation/focus, and the polite status content; no screen-reader audio session was performed.
- The requested unchanged animated glyphs overlap foreground text in some regions; no additional contrast scrim, altered renderer settings, or palette change was introduced.
- Reference descriptions remain the supplied Figma copy. No additional projects, backend, persistence, routing, or deployment configuration was requested.
