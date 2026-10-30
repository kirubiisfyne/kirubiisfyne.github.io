# Data Model: Portfolio

The static-image Project contract was superseded by [feature 002](../002-gltf-model-carousel/data-model.md). Heading/background ownership remains unchanged.

## Project

A readonly TypeScript record defined in `src/types/project.ts`:

| Field | Type | Invariant |
| --- | --- | --- |
| `id` | `string` | Exact relative `.glb` path; unique within the generated catalog |
| `title` | `string` | Filename including `.glb`; parent context distinguishes duplicate basenames; UI adds brackets |
| `modelUrl` | `string` | Vite `BASE_URL` plus encoded path segments at the public root, not a `/glb/` URL prefix |
| `description` | optional `string` | Supplied copy only for exact `practice_axeTexture.glb`; no fabricated copy for other models |

`vite.config.ts` discovers sorted regular lowercase `.glb` paths recursively from repository-root `glb/` at start/build. `src/data/projects.ts` derives the readonly collection from that snapshot. Restart/rebuild after membership changes; no manual registration or image/title-art fields remain.

## Carousel state

- Input: static readonly `projects` for this component instance.
- State: `activeIndex`, initially `0`.
- Derived: selected project and `canNavigate = projects.length > 1`.
- With zero projects: explicit `No models available`; no viewer is mounted; previous/next disabled; never perform modulo zero.
- With one project: index `0`; both controls disabled.
- With `n > 1`: next becomes `(index + 1) % n`; previous becomes `(index - 1 + n) % n`. Use functional state updates.
- Title, model, optional description, and position status derive from the same selected record. `ModelViewer` owns coarse loading/error status and the selected display mode, never orientation/frame state in React.
- This page does not edit or reload collections. Replacement collections in a development harness remount the component; live collection mutation is not a requested API.
- A fresh viewer starts Rendered. Clay/Wireframe are reversible material overrides; changing mode retains pose and authored material assignments. Selection resets orientation/framing and retains mode; generation guards reject stale completion. Mode controls are enabled only for a ready current model, independently of zero/one navigation rules.

## Heading content

H1/H2 accept an `id`, a readable `label`, and an `artworkSrc`; H2 also accepts `description`. They own their design-specific layout and have no carousel/page state. Label content is native heading text; decorative artwork has empty alternative text.

## Background lifecycle

No new application data model. The existing background renderer owns all transient animation/pointer state. React owns only setup and disposer invocation. Its mount, cleanup, and remount leave exactly one background canvas while mounted and none after its cleanup. A healthy model viewer adds a separate second canvas with independent ownership.

## Persistence

None. Reload starts at the first discovered model in Rendered mode. Model URLs use Vite public assets; foreground artwork/font remain bundled locally. See feature 002 for self-contained GLB loading and resource ownership.
