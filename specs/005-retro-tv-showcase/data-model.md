# Data Model: Retro TV Game Showcase

## Game

Ordered readonly catalog entry: stable unique `id`, nonblank `name`, nonblank plain-text `description`, Vite-resolved `emissiveUrl`, and absolute HTTPS itch.io `playUrl`. Empty catalog is supported. Initial order is KonTEXTo then Anii! Grow to Know; order is editable.

- **KonTEXTo**: An immersive campus life simulator where every word counts. Explore, socialize, and master the art of text editing. Image: `games/kontexto/emissive.png`. Play: https://kirubiisfyne.itch.io/kontexto
- **Anii! Grow to Know**: An educational farming simulator where you plant crops, take quizzes, and learn about Filipino Bahay Kubo crops. Image: `games/anii/emissive.png`. Play: https://kirubiisfyne.itch.io/anii-grow-to-know

## TV transform

One shared position `[x,y,z]`, Euler rotation `[x,y,z]` in explicit degrees (convert to radians at boundary; define axis order), and positive finite scale `[x,y,z]`. Position and scale use scene units. Apply to a parent containing the whole TV; camera responsiveness is separate.

## Runtime state

Selection is an index into the ordered catalog, or none for empty catalog. Adjacent selection wraps modulo count; disable navigation when count < 2. Metadata and link derive from selection, never from load completion.

Screen state is `loading`, `ready`, or `unavailable` for the currently selected image. A monotonically increasing request token invalidates stale loads; only the matching selected game may become visible. On loading/failure use neutral fallback, not a prior game's screen. Cache successful textures as appropriate and dispose all owned resources on teardown.

Viewer state is `loading`, `ready`, or `unavailable`; viewer failure does not invalidate catalog selection or external links.
