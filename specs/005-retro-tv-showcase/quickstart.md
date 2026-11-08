# Quickstart: Retro TV Showcase Validation

## Prerequisites

Node/npm dependencies installed with `npm ci`. Keep `gltf/practice_tv/` and `games/` with their model, binary and texture files intact. These are owner-supplied assets and must be included in deployment/build input.

## Owner configuration

Edit the ordered entries in `src/data/games.ts` to add or update game names, descriptions, itch.io links and emissive image imports. Store each game's texture in its `games/<game>/` directory. Set the optional `emissiveRotation: 180` for an image authored upside down (as with Anii); omit it for an upright image. Edit `src/data/tv-transform.ts` to change whole-TV position (scene units), rotation (degrees, XYZ order) and per-axis positive scale. Reload the development page after edits; rebuild for production. Extreme custom transforms may move the TV outside its frame.

## Run

1. Run `npm run dev`; open the local URL. Confirm new Game Dev Showcase follows the existing 3D Art section.
2. Confirm TV image, title, description and Play destination match KonTEXTo. Navigate Next to Anii! Grow to Know and confirm matching image/details/link; navigate in both directions through wraparound.
3. Activate Play for each game; verify correct itch.io page opens in a new tab. Use Tab and Enter/Space to repeat navigation; check visible focus and selection announcement.
4. At 1280 × 832 and 375 × 812, confirm full-browser-width transparent TV canvas, readable metadata, no horizontal page overflow, and existing carousel/background remain functional. Test reduced motion.
5. Change each transform component in config and reload; verify whole TV moves, rotates and scales. Restore values.
6. Exercise empty and single-game catalogs. Simulate failed image, delayed/out-of-order images, model and WebGL failure; confirm neutral fallback and correct details/link, navigation stays usable, no stale image. Restore test changes.
7. Run `npm run typecheck`, `npm run build`, and `npm run test:acceptance`; include new showcase tests plus existing regression suite. Preview a build configured with a non-root Vite base and inspect network: glTF, binary and all dependent textures load without 404, including the supplied default emissive image and both game-specific images.
8. Mount/unmount or exercise Strict Mode replay and repeated navigation; inspect console and renderer/resource cleanup for errors and leaks.

## Acceptance fixtures

`tests/acceptance/game-showcase.html` mounts the test-only showcase; `?catalog=empty`, `?catalog=single`, and `?catalog=extended` select catalog fixtures. `tests/acceptance/game-showcase-fixtures.ts` exports `showcaseUrl`, `useTvTransform`, `failAsset`, `holdAsset` (with independent `requested` and `release` gates), and `disableWebGL`. Use separate gates to force out-of-order responses. These files are acceptance-only and are not production entry points.

## Implementation evidence (in progress)

- `npm run typecheck` and `npm run build` passed during implementation.
- Final validation after lifecycle changes: `npm run typecheck` passed; `npm run build` passed; `npm run test:acceptance` passed all 116 desktop and mobile tests (5.4 minutes).
- Browser review at 1280 × 832 and 375 × 812 with reduced motion: both games rendered upright within the TV, no horizontal overflow, three canvases (background, carousel, TV), and no page errors. The exported opaque TV body covers the image mesh; the viewer draws the image mesh over the body and adjusts the UV island without modifying source files. Anii additionally uses its per-game 180° correction. Automated keyboard focus, selection announcement, fallback tests and existing carousel mode/inspection checks passed on both viewports. A dedicated screen-reader audit was not performed.
- Lifecycle test verifies three repeated Strict Mode mount/navigation/unmount cycles on each viewport, with one live TV canvas, no console errors, and the previous WebGL context lost after unmount. The viewer defers context loss by a microtask so Strict Mode replay can reclaim its canvas.
- Non-root preview passed: `npm run build -- --base=/showcase/`, then `npx vite preview --base=/showcase/ --host 127.0.0.1 --port 5495 --strictPort`. Chromium loaded `/showcase/`, selected both games, observed 11 successful TV/dependency requests including both game images, and reported no HTTP errors. The earlier timeout came from previewing a subpath build without matching `--base`; two obsolete root-relative model preload hints were also removed from `index.html`.

Expected behavior and asset contract: [contracts/showcase.md](contracts/showcase.md).
