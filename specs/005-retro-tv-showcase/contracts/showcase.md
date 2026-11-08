# Showcase UI and Asset Contract

## Catalog

Catalog entries supply unique stable ID, name, description, emissive image URL and HTTPS itch.io URL. Initial entries and ordering are in [data-model.md](../data-model.md). Paths resolve through Vite in development and production, including non-root base paths. TV assets, including the default emissive image, remain in `gltf/practice_tv/`; game-specific images reside in `games/kontexto/` and `games/anii/`.

## Visitor interaction

- Previous/Next are named buttons, wrap order, disabled for 0–1 entries.
- Play is an anchor for current game, opens a new tab with `noopener noreferrer`; absent/disabled when no game exists.
- Name, description and link immediately follow selected catalog entry. Announce selection through a polite live region without repeatedly announcing unrelated content.
- The viewer is decorative relative to textual game information; loading/failure status is accessible. Viewer failure does not disable valid controls or links.
- Screen image reflects selected game only; pending/failed requests cannot show the previous game as current. Late image completion is ignored after a newer selection or unmount.
- All actions work with keyboard; visible focus and responsive reflow are required.

## Owner controls

Whole-TV position, Euler rotation in degrees and scale live in a documented local configuration. No interactive gizmo or separate mobile transform. Changes take effect after reload/rebuild as applicable.
