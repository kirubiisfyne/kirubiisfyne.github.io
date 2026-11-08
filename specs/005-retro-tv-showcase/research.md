# Research: Retro TV Game Showcase

## Asset delivery

**Decision**: Import the glTF and each local dependency as Vite asset URLs; resolve glTF-relative requests through an explicit Three.js loading-manager URL map. Load the supplied `m_Screen_emissive.png` as the default, and load selected game textures separately from their game folders. Verify build and non-root base path. Keep source assets untouched.

**Evidence**: `gltf/practice_tv/practice_tv.gltf` references `practice_tv.bin`, six other material images, and the now-present `m_Screen_emissive.png`. Game images live at `games/anii/emissive.png` and `games/kontexto/emissive.png`. Vite `publicDir` is `glb/`, so root `gltf/` and `games/` are not automatically published. Relative asset requests must resolve against emitted URLs, not source disk paths.

**Alternatives**: Relocating files into `glb/` violates its sole model-root contract and could add unwanted carousel models. Serving source root directly fails in production. Editing the source glTF loses asset fidelity. Build-time copying is viable but adds plugin complexity; revisit if static imports fail Vite build verification.

## Screen image swapping

**Decision**: Target the `Image` mesh's named material `m_Screen`; clone and configure replacement textures to match the loader-provided emissive texture's UV channel, mapping, transform, color space, wrapping and orientation. The exported opaque TV body covers the screen mesh; render the cloned screen material over it. Reverse the screen mesh UVs within their existing island to orient the supplied images without changing their crop or source files. Verify visually with supplied screen assets, not generic crop/fit logic. Provide neutral fallback during loading/error and guard stale completions.

**Alternatives**: Replacing base color or overlaying a flat image could change intended authored appearance and mapping; do not do so without visual evidence.

## Renderer and layout

**Decision**: A separate persistent renderer with transparent full-width canvas, an in-flow stage and responsive camera, using existing carousel patterns only where appropriate. Apply one object transform in named configuration. Use demand rendering and cleanup.

**Alternatives**: Reusing the carousel renderer couples independent lifecycles and behavior. A visible gizmo is not requested. Responsive camera changes do not require per-viewport authored transforms.

## Catalog and navigation

**Decision**: A typed local ordered catalog references existing images; maintain names, descriptions and links there. Static imports provide build-time dependency checks. Keep selection and metadata accessible even if graphics fail.

**Alternatives**: Folder discovery introduces avoidable metadata conventions; game folders hold images, while the catalog explicitly registers entries. Runtime fetching of itch.io adds availability and CORS risks.
