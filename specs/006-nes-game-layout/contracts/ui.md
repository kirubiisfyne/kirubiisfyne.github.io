# UI and Integration Contracts

## Selection contract

- One `onNavigate(direction: -1 | 1)` action updates GameShowcase selection.
- Raycast pointer activation, native button activation, and fallback controls call same action exactly once.
- Previous/Next wrap. Count < 2 disables all navigation paths.
- No new actions on A/B, Start/Select, D-pad up/down, cable, or TV.

## Viewer contract

Extend existing viewer without replacing `setImage(url, rotation)` or `dispose()` semantics.

- Input: image URL/rotation, catalog navigation enabled state, stable navigation callback, control elements/anchor bridge.
- Output: existing TV status plus independent controller readiness sufficient to select projected/fallback presentation.
- Lifetime: one renderer/canvas for game section; models persist across selection changes.
- Projection/hover updates are imperative, not React animation state.
- Preserve current TV shader, UV mapping, stale request protection, static interlude, and TV-local tilt/transform behavior.

Exact helper signatures may follow existing coding patterns; observable behavior above is required.

## Pointer contract

- Canvas changes from decorative pointer-events:none to scoped interactive surface while controller is usable.
- Use displayed canvas bounds for normalized pointer coordinates; do not normalize against whole window.
- Test verified local left/right regions, not entire controller bounds.
- Drag/cancel does not select. Touch page scrolling remains possible outside deliberate control activation.
- Prevent duplicate canvas/HTML activation; transparent semantic overlays must not obstruct raycast delivery.
- No global keyboard handlers that interfere with project carousel or page scrolling.

## Accessible controls

- One native button pair: accessible names Previous and Next, grouped as Game navigation.
- Healthy state: visible keyboard focus follows projected D-pad positions.
- Fallback state: labeled controls visibly usable during loading/failure or insufficient projected target space.
- Enter/Space and assistive activation select same game as pointer picking.
- Disabled state uses native disabled plus corresponding raycast guard.
- Existing polite game announcement remains single selection announcement; controller status must not duplicate it.

## Responsive composition

- Both supplied objects remain unclipped at desktop/mobile viewport sizes.
- Relative pose/scale/placement comes from reference, with camera fitting adapted to viewport.
- Projected controls follow actual full-width canvas, root zoom, and overlay coordinate space.
- Avoid overlapping invisible hit targets. Retain visible native alternatives when controller is too small.
- TV-only 80%-height target is superseded; full-width stage and whole-TV visibility remain required.

## Failure and lifecycle contract

- Controller fetch/decode failure: TV continues; fallback navigation remains.
- TV failure: details/Play and controller/native navigation remain.
- Screen image failure: existing error/static behavior remains; selection/Play not blocked.
- Missing WebGL or context loss: native controls and links remain functional.
- Late loads, Strict Mode replay, and unmount dispose resources and listeners without updates after disposal.
- Reduced motion and document/intersection visibility preserve existing TV behavior; new feedback, if added, follows same rules.

## Packaging boundary

Vite imports supplied GLB directly. No build/runtime dependency on external FBX path, no carousel catalog registration, no shipped FBXLoader, no production acceptance fixtures/hooks.
