# kirubiisfyne portfolio

React + TypeScript + Tailwind CSS portfolio with a textured Three.js model carousel, Figma-derived controls, and the original animated ASCII metaball background.

## Run

Requires Node 22.12+ (or a supported newer release) and npm. Verified locally with Node 26.3.0 and npm 11.16.0.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite.

## Verify and build

```sh
npm run typecheck
npm run test:acceptance
npm run build
npm run preview
```

The production output is `dist/`. Build does not run type-checking automatically; run both commands above.

## Publish to GitHub Pages

In repository **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source, not “Deploy from a branch.” Commit and push `.github/workflows/deploy.yml` to `main`.

The workflow runs `npm ci`, type-checks, builds with Vite, and deploys only `dist/` to https://kirubiisfyne.github.io/. Publishing the repository root serves the uncompiled `/src/main.tsx` entry and cannot run the app.

The default Vite base `/` is correct for this user-site repository. No `gh-pages` branch, committed `dist/`, or additional base-path setting is needed.

## Publish models

Put self-contained glTF 2.0 binary **`.glb`** files anywhere inside repository-root **`glb/`**. Embed geometry and textures; external `.bin`/image references are rejected without fetching them. Restart `npm run dev` after adding/removing models; rebuild/redeploy production. No project registration or metadata file is required.

Only regular, lowercase `.glb` files are discovered, recursively and in case-sensitive path order; symlinks and other formats are not carousel entries. Filenames become titles, with parent-folder context for duplicate names. Missing/empty folders show “No models available.”

For a custom description, add an optional UTF-8 text file beside the model, replacing `.glb` with `.description.txt`:

```text
glb/axes/my axe.glb
glb/axes/my axe.description.txt
```

Write the description as plain text, not JSON or HTML. Restart the dev server or rebuild after adding, editing, or removing it. Leading/trailing whitespace is trimmed; missing, blank, or symlinked description files produce no caption. Descriptions are matched by the full relative model path, so duplicate filenames in separate folders stay independent. Orphan description files never register models. The supplied axe's existing copy now lives in `glb/practice_axeTexture.description.txt`; edit that file to replace it. Description files are public assets, like everything under `glb/`.

Models are served/copied at the **public root**: `glb/axes/my axe.glb` becomes `/axes/my%20axe.glb`, not `/glb/axes/...`. Vite's deployment base is respected. Keep only intended public assets in this folder. Spaces are supported; avoid literal `#` in names because Vite 8.3.5 development serving returns HTML for those encoded public paths.

The carousel starts loading every catalog model when its viewer mounts and presents the initial model as soon as it is ready, without waiting for the rest. Loaded models remain available for navigation until the viewer unmounts; an unavailable model does not stop the others from loading. Only the selected model is drawn at rest, with the outgoing and incoming models drawn during a transition. Preloading increases startup bandwidth and memory use as the catalog grows.

The viewer showcases models with a 24-second continuous turntable rotation. Drag or use arrow keys to inspect freely on both axes; the turntable pauses on first input and smoothly returns to the saved showcase pose (350 ms shortest path) once all pointer and keyboard inspection ends, then resumes without jumping. Reduced motion disables turntable rotation and animated return, instantly restoring the showcase pose.

Navigation uses directional slide and scale transitions (`scale 0.72 ↔ 1`, outgoing left/shrink and incoming right/grow for Next, mirrored for Previous) completing within 500 ms of native activation. Details (title and caption) are curtained visually and from assistive technologies until synchronous finalization occurs after the final centered draw. A dedicated position live region announces settlements once.

**Rendered** starts with the authored materials/textures under key/fill/rim lighting. **Clay** shows neutral untextured surfaces; **Wireframe** shows triangle edges only. Mode changes preserve pose and are retained through navigation; next/previous wraps and retains mode. Navigation is disabled for zero/one model, independently of healthy mode controls. Loading/error disables modes and retains a readable status; unsupported WebGL does not break the surrounding page.

## Structure

- `src/components/H1.tsx`, `H2.tsx`: reusable typed headings; original page composition is preserved.
- `src/components/ProjectCarousel.tsx`, `ModelViewer.tsx`, `ViewModeControls.tsx`: wrapping navigation, lazy viewer ownership, status, and accessible display controls.
- `src/lib/model-viewer.ts`: direct Three.js runtime, three-point lighting, full-turn input, embedded-only loading, and resource cleanup.
- `src/pages/PortfolioPage.tsx`: reference layout, content, and responsive adaptation.
- `vite.config.ts`, `src/data/projects.ts`: build/start-time model discovery and optional description loading into the readonly collection.
- `src/assets/figma/`: exported artwork and outlined control masks. Readable identity/status text remains native; JetBrains Mono is locally bundled.
- `ascii-metaballs.js`: existing renderer retained without feature edits. `MetaballBackground` owns its single cleanup-returning effect and reduced-motion behavior.

The existing blue base and glyph palette are preserved. Foreground page wrappers are transparent; the design's local highlight bars remain. Reference descriptions intentionally retain the supplied Figma copy.

Page content defaults to 125% via `#root { zoom: 1.25; }` in `src/styles.css`. View it with browser zoom at 100% to avoid applying the enlargement twice. The viewport-sized metaball canvas remains outside the scaled root.

[Carousel interaction motion verification](specs/003-carousel-interaction-motion/quickstart.md) · [Completed tasks](specs/003-carousel-interaction-motion/tasks.md) · [Interaction motion specification](specs/003-carousel-interaction-motion/spec.md) · [Historical model carousel feature](specs/002-gltf-model-carousel/quickstart.md) · [Figma source](https://www.figma.com/design/8Qb17gg8m0JsxFuEScxxsG/Untitled?node-id=1-2)
