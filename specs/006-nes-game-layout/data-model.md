# Data Model: NES Game Viewer Layout

## Game catalog and selection — unchanged

Existing readonly `Game` collection remains sole source of name, description, screen URL/rotation, and Play URL. GameShowcase owns index. Navigation direction is `-1 | 1`; functional index update wraps only when count >= 2.

## GameViewerLayout — static authored configuration

- Common normalized reference coordinate system and source provenance.
- Separate TV/controller placement transforms.
- Camera viewing direction, reference bounds, and fit padding.
- Verified D-pad mesh path, controller-local left/right hit regions, and local anchor points.
- Existing `tvTransform` remains separate TV-local adjustment.

Validate finite transforms, positive scales/padding, nonempty/disjoint navigation regions, and resolvable mesh path. Do not equate generic export node names with confirmed semantics.

## Asset readiness — independent

- TV: existing `loading | ready | unavailable`.
- Controller: `loading | ready | unavailable`.
- Graphics: active or terminal context-unavailable.
- Catalog navigation enabled: game count >= 2, independent of renderer state.
- Controller pointer navigation enabled: catalog enabled, controller ready, graphics active, valid projection.

A controller error does not mutate TV readiness. A TV error does not disable catalog or ready controller. Terminal graphics failure switches native controls to visible fallback.

## Projection — transient, outside React

Left/right anchor includes viewport position, visibility, and usable hit area. Recompute after camera/layout/size changes; convert into overlay-local CSS coordinates. Store mutable vectors/DOM positioning in viewer/helper, not per-frame React state.

If either region is offscreen, overlapping, or too small for usable interaction, keep visible native alternatives.

## Pointer gesture — transient

`idle -> pressed(direction, pointerId, startPosition) -> activate once | cancel -> idle`.

Activation requires matching pointer, same valid region on release, catalog enabled, and no drag/cancellation. Up/down/center and other controller areas never navigate. Pointer completion and synthetic click cannot each navigate independently.

## Disposal

`active -> disposed` is terminal. Async completions after disposal/context loss are ignored and their resources released. Remove controller listeners with existing TV listeners; shared renderer remains owned by createRetroTvViewer.
