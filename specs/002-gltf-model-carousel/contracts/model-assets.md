# Model Asset and Publishing Contract

## Single owner-facing folder

Repository-root `glb/` is the sole model catalog root; the owner has completed the rename, and the supplied model is present at `glb/practice_axeTexture.glb`. Models may be grouped into subfolders; all regular files ending in exact lowercase `.glb` are discovered recursively. No former-folder alias/fallback; JSON `.gltf`, `.bin`, and standalone images are not entries. No further physical rename is required.

Example owner layout, not additional production portfolio content:

```text
glb/
├── practice_axeTexture.glb
└── another-project/
    └── model.glb
```

Only owner-supplied real work ships. Temporary validation models must be removed before production. The supplied axe GLB has passed official Khronos structural validation with zero errors/warnings and embeds its buffer and three textures; no sidecar prerequisite remains.

## Packaging rules

- glTF 2.0 binary `.glb` with all geometry, buffers, and textures embedded. Embedded buffer views or data URIs are self-contained. A `.glb` extension by itself is not sufficient.
- External buffer/image URIs are unsupported, whether relative, absolute, or remote. On selection, report an unavailable self-contained-packaging error before requesting any sidecar. Do not silently fetch separate files, strip textures, or skip the discovered entry.
- Standard PBR materials and embedded PNG/JPEG images are supported through GLTFLoader. Preserve original material settings and maps unchanged for Rendered mode. Do not replace the authored Rendered appearance with a uniform material or disguise a failed load with any fallback material. User-selected Clay/Wireframe inspection may use reversible scene material overrides; those overrides must not mutate the authored materials or bypass resource validation.
- JSON `.gltf`, external sidecars, compressed formats requiring extra decoder setup, arbitrary unsupported required extensions, remote model URLs, animation playback, uploads, and model editing are outside this feature. Unsupported content reports unavailable rather than silently substituting work.
- Preserve glTF's exported upright orientation. Blender exporters normally perform coordinate conversion; do not force an additional Z-axis turn simply because the authoring tool is Z-up.
- Directory symlinks are not followed for discovery. A missing/empty model root is a supported empty state. Non-GLB files never become catalog entries.
- This folder becomes Vite's public directory: every contained file is publicly served/copied. Store only intended model assets here, never secrets, site `index.html`, or files that collide with the app's generated bundles.

## Discovery and identity

- At dev-server start or production build, scan filenames recursively and serialize sorted relative model paths into `__MODEL_PATHS__`.
- Sort case-sensitively by code-unit ordering of POSIX relative paths. No OS traversal order, locale-dependent sort, manually curated array, or mandatory metadata file.
- A path is a stable catalog identity. Renaming/moving a file changes that identity; removing it removes the entry on next build.
- Each `.glb` yields exactly one entry regardless of how many meshes/scenes it contains. Distinct paths with the same basename remain distinct; append parent-path context to their visible filename titles.
- Keep corrupt, truncated, or non-self-contained binary entries visible with a selected-item error. Do not silently filter the catalog down to only models that happen to load.
- The existing axe's supplied description may be associated with exact path `practice_axeTexture.glb`; other entries work without a description or title artwork.

## URL and build contract

`vite.config.ts` will set `publicDir: 'glb'`, mapping the folder contents to the public site root. It does not preserve a leading `glb/` URL segment. Renaming only the source root leaves relative catalog IDs and public model URLs unchanged.

| Source path | Root-base URL | Nested-base URL example |
| --- | --- | --- |
| `glb/practice_axeTexture.glb` | `/practice_axeTexture.glb` | `/portfolio/practice_axeTexture.glb` |
| `glb/another-project/model.glb` | `/another-project/model.glb` | `/portfolio/another-project/model.glb` |

Client URLs prepend `import.meta.env.BASE_URL` and encode individual relative-path segments. Fetch only the selected `.glb`; verify binary framing and parse its embedded resources with `GLTFLoader.parseAsync`. The loader's pre-dependency packaging check rejects external buffer/image URIs, and the parse manager blocks network resource URLs. No buffer/texture path rewriting or separate asset requests are needed.

Vite copies the folder hierarchy unchanged into `dist/`. The existing GitHub Actions workflow runs `npm ci`, type-checks, builds, and deploys `dist/`; the GitHub user-site base remains `/`. No server directory listing, runtime scanning, per-model registration, copy plugin, tracked generated manifest, or deployment workflow rewrite.

## Owner publishing flow

1. Export a self-contained `.glb` and place the single file beneath the existing `glb/` root; no folder rename, `.bin`, image copy, metadata, or project registration is required.
2. Restart `npm run dev` after changing catalog membership, or run a new production build. No hot-discovery guarantee is introduced.
3. Preview and inspect the real model, textures, full rotations, and controls.
4. Commit the binary models and application changes as appropriate; push to the existing `main` deployment workflow. Only the rebuilt catalog is published.
5. To remove a model, remove its `.glb` from the folder and rebuild/redeploy. There are no shared sidecars to reconcile.

There is no HTTP API or external registration schema. This filesystem-and-static-URL boundary is the integration contract.
