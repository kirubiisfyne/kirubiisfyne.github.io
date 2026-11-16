# Feature Specification: NES Game Viewer Layout

**Status**: Proposed; planning only. No runtime implementation.
**Foundation**: Existing feature 005 retro TV showcase.

## Confirmed direction

- `GameViewer.fbx` is a layout reference, not the runtime model.
- Runtime controller comes from `gltf/NESController/`.
- Controller is interactive 3D. D-pad left selects previous game; right selects next.
- Infer composition from FBX; no screenshot is required.
- Preserve TV's existing functionality.

## User stories

1. Visitors see supplied TV and textured NES controller arranged from FBX reference.
2. Visitors click or tap D-pad left/right to browse games; selection wraps.
3. Keyboard and assistive-technology users browse the same catalog using named controls.
4. Visitors can still browse games and follow Play links when graphics or assets fail.

## Functional requirements

- **FR-001**: Derive relative model placement, pose, and scale from supplied FBX. Correct unit/basis differences and fit a usable shared camera rather than blindly copying its raw frustum.
- **FR-002**: Render existing TV and supplied NES controller together in one game-section scene, renderer, and canvas. Preserve source asset bytes and materials.
- **FR-003**: Map only D-pad left/right to previous/next. Other controller buttons have no new behavior.
- **FR-004**: Keep selection in GameShowcase; all interaction paths use the same wrapping action. Zero/one-entry catalogs disable navigation.
- **FR-005**: Preserve TV image UV mapping and authored image rotation, 300 ms static interlude, shader noise, pointer-follow tilt, reduced-motion/visibility behavior, and stale-image guards.
- **FR-006**: Preserve matching title, description, Play URL, new-tab safety, and polite selection announcement.
- **FR-007**: Provide native Previous/Next buttons with keyboard operation and visible focus at projected D-pad locations. Expose visible fallback controls while controller navigation is unavailable.
- **FR-008**: Support mouse/touch without trapping page scrolling or navigating on drags, cancelled gestures, or non-navigation controller areas.
- **FR-009**: Keep both models unclipped on desktop/mobile. Fit combined composition instead of retaining TV-only 80%-height framing. Preserve existing editable whole-TV transform as an additional TV-local adjustment.
- **FR-010**: TV/controller loading and failures are independent. WebGL/context loss retains usable native navigation and links. Late results and Strict Mode replay clean up safely.
- **FR-011**: Preserve existing model carousel, background effect, and unrelated sections. Do not add unrequested controller actions, libraries, or asset catalogs.

## Acceptance outcomes

- Ten sequential next/previous actions wrap correctly; pointer, touch, and keyboard all select the matching game, image, details, and Play URL.
- D-pad hit regions and keyboard focus remain aligned after resize and with existing root zoom.
- Non-navigation controller areas do not change selection; disabled catalogs do not respond.
- Failed/held controller loads do not block TV; failed TV loads do not block controller/navigation.
- Desktop 1280 × 832 and mobile 375 × 812 show unclipped composition and usable controls.
- Existing TV regression tests pass, except explicitly replaced TV-only framing assertions.
