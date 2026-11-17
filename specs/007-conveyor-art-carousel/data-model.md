# Data Model: Conveyor Art Carousel

This feature adds no persistence or catalog fields. Types below describe planned runtime ownership, not required export names.

## Artwork Asset

**Identity**: Existing catalog `modelId`, stable for the viewer lifetime.

**Fields**:

- Existing model URL, authored `zRotation`, generation/request guard, abort controller and loading manager.
- Parsed GLTF, centered/normalized source hierarchy, source bounds and retained asset resource tracker.
- Load/error/retired state and per-display-mode validation (`unvalidated | valid | failed`).
- Optional existing readiness-fade/material state shared consistently by occurrences; no per-occurrence transition fade.

**Ownership**: One fetch/parse and one owner for geometry, materials, textures and original skeleton resources. One asset may be referenced by several belt instances. Resource trackers remain responsible for aborted/late parser results.

**Validation**: Continue rejecting external buffer/image URIs, embedded decode failures and empty/nonfinite bounds. Missing/failed previews do not prevent a different healthy asset from being centered. Retiring an asset detaches all its instances before releasing its resources.

## Belt Instance

**Identity**: Viewer-local `instanceId`, unique independently of `modelId`.

**Fields**:

- Reference to its artwork asset.
- Presentation group, inspection-rotation group, normalized/authored-roll child hierarchy.
- Current signed slot coordinate and role (`center`, `neighbor`, `entering`, `exiting`).
- Instance-local yaw/pitch, transition snapshot and center inspection/return fields as appropriate.
- Clone-owned skeleton/resource set, visible/retired state.

**Ownership**: Own transforms, hierarchy and cloned skeletons. Borrow asset-owned geometry/material/texture resources. Repeated identities must never share mutable rotation/presentation groups. Only active-center instance receives turntable or deliberate inspection updates.

**Bounds**: Zero instances for empty catalog, one for a one-artwork catalog, three rest occurrences when neighbors are ready, at most four transition occurrences. Missing/failed assets reduce drawn count without collapsing coordinates. Pooling must not retain an unbounded number of clone-owned skeleton resources.

**Lifecycle**: Create/reuse → assign artwork/slot → validate participation → render → rebase at settlement or detach/recycle → dispose private skeleton resources when discarded. Never dispose borrowed resources during recycling.

## Belt Layout

**Fields**:

- Center normalized scale `S > 0`, side scale `0.75S`, and spacing `D > 0`.
- Shared `y = 0` and `z = 0` for all slot centers.
- Rest coordinate range [-1, +1]; movement range [-1, +2] for Next or [-2, +1] for Previous.
- Horizontal clip aperture, measured body/stage/canvas dimensions, root CSS scale, camera projection and DPR cap.

**Mapping**: For count `n > 1`, logical asset at physical coordinate `q` is `((s + q) % n + n) % n`, where `s` is the current serviced starting index. A single-artwork catalog is a special no-neighbor/no-navigation case.

**Motion**: Let `p = q - direction * ease(progress)` and `x = p * D`, with Next direction +1, Previous -1, eased progress in [0,1]. Scale is `0.75S + 0.25S * (1 - min(1, abs(p)))`; Y and Z stay constant. Authored orientation and pose changes are independent of translation.

**Resize**: Recompute projection, spacing/aperture and positions from the existing normalized progress; keep service identity, participants and elapsed visual time. No new selection or metadata update.

## Queued Input

**Fields**:

- Monotonic input `sequence`.
- Direction `next | previous`.
- Original normalized native `enqueuedAtMs` timestamp.

**Owner**: Per-`ProjectCarousel` ref-owned FIFO; no module-global queue. Enqueue is independent of destination metadata and renderer selection.

**Rules**: Retain every activation in order; no cancellation, coalescing or supersession. Resolve destination only when dequeued. No model instances, resource trackers or React DOM nodes in queue entries. Clear on unmount/terminal animation failure. Subsequent unavailable-state navigation uses existing fallback behavior rather than a dormant animation queue.

## Serviced Selection

**Fields**:

- Monotonic viewer `requestId` and input sequence.
- Resolved destination asset/index and direction.
- Original activation timestamp, `serviceStartedAtMs`, and `deadlineAtMs`.
- Metadata ticket `{requestId, modelId}` and preparation/proof readiness.
- Previous displayed center instance, destination center instance, up to four transition participants.
- Visual progress/duration, outgoing pose snapshot and finalization state.

**Timing**: Idle deadline uses native activation +1500 ms; a previously queued request uses start of service +1500 ms. Preserve both original activation and service timing for instrumentation. Queue wait is not animation time. Late preparation consumes service budget but never invalidates readiness gates.

**Invariants**:

1. At most one serviced selection owns metadata proof and movement.
2. Metadata identity is logical artwork/request identity; visual duplicates never receive separate tickets or live-region updates.
3. Successful finalization follows the validated centered draw and happens at most once per service.
4. The next queue item starts on a later animation frame after successful ready reporting or established recoverable error.
5. Generational checks reject stale work after failure, unmount, or terminal context loss.

## State Transitions

```text
idle/ready
  └─ enqueue + dispatch head → preparing (details curtained)
       ├─ more activations → append FIFO only
       ├─ candidate + metadata ready → moving
       │    └─ centered final draw + finalize → ready
       │         └─ subsequent animation frame → dispatch next head
       ├─ reduced motion / no movement budget → final draw + finalize → ready
       ├─ recoverable failure → error selection established
       │    └─ subsequent animation frame → dispatch next head from logical error index
       └─ terminal loss / unmount → cancel scheduled drain, clear FIFO, release runtime
```

Inspection remains orthogonal: only a ready active center may acquire pointer/keyboard ownership; navigation clears active inspection and snapshots pose for return. Visibility eligibility freezes visual time and queue dispatch, not resource ownership or request identity.

## Acceptance Samples

Extend existing development-only samples with `instanceId`, logical `modelId`, physical coordinate/role and optional aperture information. Keep position, scale, pose, phase and progress. Record input sequence, immutable native activation time and service start separately. Tests must compare occurrences by instance ID while checking selection/metadata by logical ID. All additions remain eliminated from production bundles.
