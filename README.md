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
npm run lint
npm run test:acceptance
npm run build
npm run preview
```

The production output is `dist/`. Build does not run type-checking automatically; run both commands above.

## Publish to GitHub Pages

In repository **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source, not “Deploy from a branch.” Commit and push `.github/workflows/deploy.yml` to `main`.

The workflow runs `npm ci`, type-checks, builds with Vite, and deploys only `dist/` to https://kirubiisfyne.github.io/. Publishing the repository root serves the uncompiled `/src/main.tsx` entry and cannot run the app.

Build/upload and deployment run in separate jobs to avoid [the immediate artifact lookup race](https://github.com/actions/deploy-pages/issues/451). If only deployment fails, use **Re-run failed jobs** to reuse the uploaded artifact instead of uploading another artifact with the same name.

The default Vite base `/` is correct for this user-site repository. No `gh-pages` branch, committed `dist/`, or additional base-path setting is needed.

## Portfolio content

- Hero positioning lives in `src/pages/PortfolioPage.tsx`; its `[ Game Developer & Artist ]` heading uses unhighlighted 12px MS W98 UI Bold, without a technology line. Introduction copy lives in `src/data/site-copy.ts`. Internship availability stays in the existing footer message in `src/components/ConnectSection.tsx`, without a repeated hero block.
- `src/data/contact.ts` centralizes existing footer professional links and the `Kirby_Bilbao_Resume.pdf` download filename. Hero contact shortcuts were removed at the owner's request; existing footer links and original PDF bytes are unchanged.
- `src/data/games.ts` supports optional role lists, team size, development duration/period, engine, languages, classification, status, personal contributions, team-developed systems, and public source URL. Omit unknown values. KonTEXTo's current roles and subsystem credits are owner-confirmed from the GameInfo Figma reference; Anii's systems are team-credited until individual/shared ownership is supplied. Keep game features separate from personal claims. GameInfo matches the [current Figma panel](https://www.figma.com/design/M6YiE4DPEACvwrWhLzm0LN/BSOD_Portfolio?node-id=2032-128): Role/Contribution above Description / Game Info/Game Features, with thin paper bars and chevron lists. Mobile stacks all four groups. All content stays visible; extra metadata rows are intentionally hidden while their data remains stored.
- Direct links such as `/?game=anii#game-showcase-heading` select a game and survive refresh on GitHub Pages. The visible permalink action is omitted to match Figma, but selection updates the current query without adding a browser-history entry; no server rewrites or routing dependency are required.
- Public Unity source repositories were verified at `github.com/kirubiisfyne/anii-repository` and `github.com/kirubiisfyne/kontexto-repository`. No publication-ready technical articles or Markdown renderer exist in this checkout; article publication is intentionally deferred, with no placeholders or empty section.
- Tab title, description, canonical URL, and social tags live in `index.html`. `glb/branding/` contains the public favicon (first glyph from the existing wordmark) and 1200 × 630 social image (existing wordmark, palette, and font). These non-model assets do not create carousel entries. Update canonical/social URLs if the deployment domain changes.

## Publish models

Put self-contained glTF 2.0 binary **`.glb`** files anywhere inside repository-root **`glb/`**. Embed geometry and textures; external `.bin`/image references are rejected without fetching them. Restart `npm run dev` after adding/removing models; rebuild/redeploy production. No project registration or metadata file is required.

Only regular, lowercase `.glb` files are discovered, recursively and in case-sensitive path order; symlinks and other formats are not carousel entries. Filenames become titles, with parent-folder context for duplicate names. Missing/empty folders show “No models available.”

For per-model settings, add an optional UTF-8 JSON file beside the model, replacing `.glb` with `.config.json`:

```text
glb/axes/my axe.glb
glb/axes/my axe.config.json
```

```json
{
  "zRotation": 0,
  "name": "My Axe",
  "description": "Modeled in Maya, textured in Substance 3D Painter.",
  "specifications": {
    "software": "Maya, Substance 3D Painter"
  }
}
```

- `zRotation`: finite angle in **degrees**, default `0`. Rotates the centered model around its Z axis before turntable/manual inspection, without translating it. Positive angles roll counterclockwise from the initial camera view; negative angles roll clockwise. For example, `45` gives a clear diagonal tilt. The configured roll remains in previews, across modes/navigation, and after inspection returns.
- `name`: display name, also used by the viewer's accessible label. Missing/blank names fall back to the filename, with parent context for duplicate filenames.
- `description`: plain text, never HTML. Missing/blank descriptions omit descriptive text.
- `specifications`: optional object supporting `triangleCount`, `vertexCount`, `materialCount` (nonnegative safe integers), and `textureResolution`, `uvMapping`, `software`, `materialWorkflow`, `targetPlatform` (trimmed plain text). Unknown/blank values stay hidden. Specs share the title/caption settlement curtain; no extra asset fetches are needed.

Current counts come from each GLB's mesh primitive accessors; vertices include export splits at UV/normal seams, not welded authoring vertices. All four assets contain three embedded 1024 × 1024 PNG maps, UV0 attributes, one material, and glTF metallic-roughness textures. Modeling/texturing software comes from existing owner descriptions and GLB exporter metadata. UV0 presence does not claim non-overlapping UVs or baking quality. Target platform is unknown and omitted. Reverify sidecar specs after re-exporting models; acceptance checks compare stored counts against unchanged GLB geometry.

All fields are optional; names/descriptions are trimmed. Missing or symlinked config files use defaults; orphan configs never register models. Invalid JSON, unknown fields, or incorrect field types fail startup/build with the config path. Configs match the full relative model path, so identical filenames in separate folders remain independent. During development, adding, editing, or removing a discovered model's config automatically restarts Vite and reloads the page with fresh values. Production still requires a rebuild. Adding/removing GLB models still requires a manual restart/rebuild. The former `.description.txt` format is no longer read. Config files are public assets, like everything under `glb/`.

Models are served/copied at the **public root**: `glb/axes/my axe.glb` becomes `/axes/my%20axe.glb`, not `/glb/axes/...`. Vite's deployment base is respected. Keep only intended public assets in this folder. Spaces are supported; avoid literal `#` in names because Vite 8.3.5 development serving returns HTML for those encoded public paths.

Both 3D viewers defer renderer creation and asset requests until their canvases approach within 200 px of the viewport. Stage dimensions stay reserved. Once started, the art carousel loads every catalog model and presents the initial model as soon as it is ready, without waiting for the rest. Loaded models remain available for navigation until the viewer unmounts; an unavailable model does not stop the others from loading. The conveyor presents three common-depth slots at rest, with side occurrences at 75% scale; two-/three-item loops share model resources through cloned visual occurrences. Preloading increases startup bandwidth and memory use as the catalog grows.

The viewer showcases models with a 24-second continuous turntable rotation. Drag or use arrow keys to inspect freely on both axes; the turntable pauses on first input and smoothly returns to the saved showcase pose (350 ms shortest path) once all pointer and keyboard inspection ends, then resumes without jumping. Reduced motion disables turntable rotation and animated return, instantly restoring the showcase pose.

Navigation retains FIFO inputs and uses monotonic 700 ms horizontal slide/scale easing, with a 1500 ms settlement deadline from activation when idle or service start when queued. Details (title and caption) are curtained visually and from assistive technologies until synchronous finalization occurs after the final centered draw. A dedicated position live region announces settlements once.

**Rendered** starts with the authored materials/textures under key/fill/rim lighting. **Clay** shows neutral untextured surfaces; **Wireframe** shows triangle edges only. Mode changes preserve pose and are retained through navigation; next/previous wraps and retains mode. Navigation is disabled for zero/one model, independently of healthy mode controls. Loading/error disables modes and retains a readable status; unsupported WebGL does not break the surrounding page.

## Structure

- `src/components/GameInfo.tsx`: Figma-derived game actions and four information groups; body copy remains data-driven and collaboration credits stay explicit.
- `src/components/H1.tsx`, `H2.tsx`: reusable typed headings; original page composition is preserved.
- `src/components/ProjectCarousel.tsx`, `ModelViewer.tsx`, `ViewModeControls.tsx`: wrapping navigation, lazy viewer ownership, status, and accessible display controls.
- `src/lib/model-viewer.ts`: direct Three.js runtime, three-point lighting, full-turn input, embedded-only loading, and resource cleanup.
- `src/pages/PortfolioPage.tsx`: reference layout, content, and responsive adaptation.
- `vite.config.ts`, `src/data/projects.ts`: build/start-time model discovery and optional JSON configuration loading into the readonly collection.
- `src/assets/figma/`: exported artwork and outlined control masks. Readable identity/status text remains native; JetBrains Mono is locally bundled.
- `ascii-metaballs.js`: existing renderer retained without feature edits. `MetaballBackground` owns its single cleanup-returning effect and reduced-motion behavior.

The existing blue base and glyph palette are preserved. Foreground page wrappers are transparent; the design's local highlight bars remain. Reference descriptions intentionally retain the supplied Figma copy.

Current page content uses `#root { zoom: 1; }` in `src/styles.css`. Check layouts with browser zoom at 100%. The viewport-sized metaball canvas remains outside the scaled root.

[Carousel interaction motion verification](specs/003-carousel-interaction-motion/quickstart.md) · [Completed tasks](specs/003-carousel-interaction-motion/tasks.md) · [Interaction motion specification](specs/003-carousel-interaction-motion/spec.md) · [Historical model carousel feature](specs/002-gltf-model-carousel/quickstart.md) · [Figma source](https://www.figma.com/design/8Qb17gg8m0JsxFuEScxxsG/Untitled?node-id=1-2)
