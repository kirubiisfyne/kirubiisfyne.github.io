# Validation Guide: NES Game Viewer Layout

**Status**: Future implementation checks, not a claim of current passing results.
See [UI contract](./contracts/ui.md) and [data model](./data-model.md) for expected behavior.

## Prerequisites

- Existing npm dependencies installed (`npm ci` when needed).
- Supplied TV assets and `gltf/NESController/NESController.glb` present.
- Original FBX accessible only for one-time layout calibration; final app/build must not require it.
- Playwright Chromium available. Existing acceptance configuration owns port 5489 and desktop/mobile projects.

## Commands

```bash
npm run dev
npm run typecheck
npm run build
npm run test:acceptance -- tests/acceptance/game-showcase-*.spec.ts
npm run test:acceptance
npm run preview
```

Run focused acceptance tests after updates, then complete suite before declaring implementation done. Existing public assets/catalog discovery rules remain unchanged.

## 1. Composition

On desktop 1280 × 832 and mobile 375 × 812:
- Compare actual render with FBX-derived reference composition and recorded transform rationale.
- Confirm TV/controller front orientation, relative placement/scale, and no clipping including cable.
- Resize between widths; check framing remains stable after each asset loads.
- Verify existing TV transform overrides still affect TV, not controller.
- Save actual browser captures. Do not label design/reference images as implementation evidence.

## 2. Real controller interaction

Use pointer coordinates on rendered D-pad, not only programmatic HTML button clicks:
- Left selects previous; right selects next; ten activations wrap correctly.
- Each completed click/tap changes exactly one game.
- Up/down/center, A/B, Start/Select, cable, shell, TV, and empty canvas do nothing.
- Drag, pointercancel, and touch-scroll gestures do not navigate.
- Check mouse and touch, including mobile browser touch emulation.

## 3. Semantics and alignment

- Tab to Previous/Next; visible focus aligns with correct D-pad regions.
- Enter/Space and assistive activation navigate once with correct announcement.
- Repeat after resize and under existing root zoom; verify pointer and focus alignment.
- If model targets are too small/offscreen, visible native alternatives remain usable and non-overlapping.
- Empty/single catalogs disable buttons and raycast actions safely.

## 4. TV regressions

- Initial and rapid-navigation screen, title, description, and Play URL match.
- Existing 300 ms static interlude, screen UV/rotation, noise, pointer tilt, and reduced-motion behavior remain.
- Play uses selected itch.io URL in a safe new tab.
- Existing image load ordering/generation guards prevent stale textures replacing current selection.
- Background, project carousel, and unrelated sections remain unchanged.

## 5. Failure and cleanup matrix

Using existing acceptance asset gates:
- Fail/hold controller independently: TV still works; visible native controls and links work.
- Fail TV with controller ready: controller/native navigation and links work.
- Fail image; reorder image responses; navigate rapidly: latest selection remains authoritative.
- Disable WebGL; trigger terminal context loss; deliver late assets afterward: usable fallback, no late recovery/update errors.
- Mount/unmount repeatedly under Strict Mode, including held controller loads: stable canvas/listener/resource lifecycle, no console errors.
- Hide tab/scroll scene offscreen; restore visibility; verify existing motion/noise suspension behavior.

## 6. Production

Serve production build and verify controller textures load with no external texture-path errors. Inspect emitted dependency graph for no runtime FBXLoader/external FBX reference and no acceptance-only fixtures/hooks. Confirm source asset bytes unchanged.
