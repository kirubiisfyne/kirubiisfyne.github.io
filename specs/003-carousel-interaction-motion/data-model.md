# Data Model: Carousel Interaction Motion

**Status**: The 2026-10-30 amendment is implemented; see [quickstart.md](quickstart.md#amendment-evidence--2026-10-30) for actual verification and limits. No persistence, server schema or catalog migration; field names describe runtime ownership.

## 1. Existing catalog and display mode

`Project` retains readonly `id`, `title`, `modelUrl` and optional `description`; IDs are complete catalog-relative paths and the readonly collection is static per mount. Discovery/descriptions/encoded BASE_URL keep the [asset contract](../002-gltf-model-carousel/contracts/model-assets.md). `DisplayMode` remains `clay | rendered | wireframe`, initially Rendered, retained across selection and changed without refetch or pose reset.

## 2. Selection transaction and timing identity

| Field / owner | Meaning and validation |
| --- | --- |
| `requestId` / parent | Monotonically increasing per mount, including revisits. Model ID alone cannot authorize current work. |
| `requestedIndex` / coarse React record plus latest-intent ref | Latest accepted wrapped cursor; loading-phase activation advances from it, not last settled index. |
| `direction` | `next`, `previous`, or null for initial selection. Explicit activation direction is preserved across wraps. |
| `activatedAtMs` / immutable request | Native accepted button click `event.timeStamp` in the same page performance time origin as `performance.now()`. Pointer and native Enter/Space all use their actual click. Null only for initial selection. Preserve through lazy registration and all asynchronous work. |
| `deadlineAtMs` / derived runtime | `activatedAtMs + 500`, or null for initial selection. Never recomputed from readiness, movement start, gate release or resume. |
| `resolvedIndex`, `outcome` / coarse React record | Last success or identified failure. Neither controls the immediate curtain/reveal nor starts a latency measurement. |
| `stagedProject` / React | Current destination text/markers behind the curtain; not settled identity. |
| `metadataTicket` / proof ref | `{ requestId, modelId }` plus matching local channel and actual title/caption node identities. Description absence is verified explicitly. |
| `phase` / runtime plus synchronous parent ref | `loading`, `moving`, `ready`, `error`, `unavailable`; waiting for proof/visibility remains supersedable loading. |
| `displayedId` / runtime | Retained displayed/outgoing asset, or null. Candidate preflight is not settlement. |
| `curtained` / bridge | Closed before staged text update/select; no fade. |
| `announcedRequestId` / bridge | Last successful message update; independently idempotent from React text/status commits. |

Noninitial request timestamps must be finite, nonfuture at handling, and comparable to the page's monotonic clock; verify the target browser's event time origin in acceptance. Rejected busy activations change no cursor, token, timestamp or deadline. Initial mount has no SC-003 navigation deadline. No production `deliberatelyDelayed` or timing-waiver field exists.

## 3. Staging and settlement transitions

React exclusively owns actual title/caption text, markers and coarse state. The presentation bridge exclusively owns curtain attributes, canvas accessible name and the children of a stable, empty-in-JSX position region. Refs initialize newly mounted parts hidden before paint; React must not later write those bridge-owned attributes/children. Keep title → media → modes → caption and layout footprints. Scoped opacity 0 plus aria-hidden/inert hide only metadata; never put focused canvas/controls under the curtain. Loading/error status is separate and target-named; busy canvas name is generic.

| Event | State/action |
| --- | --- |
| Empty catalog | No viewer/transaction; explicit empty UI and native disabled navigation. |
| Initial mount | Create one registry entry per catalog model and begin all loads independently; stage the initial model/details behind the curtain without waiting for other entries. |
| Accept Next/Previous | Check moving guard first. Retain native activation timestamp, advance token/cursor, close curtain, stage text and synchronously select the corresponding registry entry. Before registration retain only latest request with original timestamp. End old inspection without starting outgoing return. |
| Current metadata commits | `useLayoutEffect` verifies real current title/caption-or-absence DOM and matching registration; acknowledge via `setMetadataReady(ticket, true)`. Only schedule work, never draw/finalize on the effect stack. |
| Proof cleanup/replacement | Revoke only originating proof. Stale commit/cleanup cannot authorize or revoke a newer ticket/registration. |
| Candidate validates | Validate its resources/bounds and isolated actual draw; restore previous presentation before paint. Both this proof and current metadata proof are required before movement. |
| New request while loading/waiting | Release prior candidate's presentation role, but do not abort its independent catalog load; retain healthy outgoing, invalidate prior proof and accept the new timestamp/deadline. |
| Back to retained model | Hide the previous candidate; stage retained metadata under the new ticket and finalize without self-slide/refetch. Restore its saved inspection target before spin if needed. |
| First eligible movement frame | Choose duration once from the original deadline's remaining budget; keep curtain closed, frozen slot poses and no input. |
| Movement activation | Reject without changing cursor/token or queueing. |
| Visibility/window/size suspension | Freeze presented spatial progress and eligible elapsed time. Retain immutable activation/deadline; no endpoint snap or hidden-time replay. |
| Final centered draw succeeds | Synchronously call bridge `finalize(ticket)`. Recheck actual proof; reveal matching text, name canvas and update independent position region once before callback returns. Only true authorizes ready, hiding outgoing and input/spin. |
| Finalizer returns false | Keep curtain closed/no success message. Restore/redraw the prior valid presentation before paint using saved progress, retain presentation references, and wait in supersedable loading for fresh proof without a busy loop. |
| Current load/decode/draw failure | Stop movement, hide presentation participants and identify the failed destination without destroying healthy registry entries. Reveal failed details only after their current DOM proof, with separate error status and no success-position update. |
| Nonselected load failure or stale selection | Record only the affected asset failure or completion. Never reveal, announce, clear the current presentation or authorize an obsolete request. |
| Context loss/unmount | Invalidate channel/tickets; release capture, registry entries, listeners and scheduler. Abort pending loads; late noncancelable decoders release their own resources. Terminal unavailable requests remain identifiable; no renderer retry. |

Coarse React state may catch up after finalization but cannot reopen an obsolete curtain. Strict Mode setup/cleanup compares originating identities. A success message becoming available is distinct from OS speech delivery/completion; old success text may stay unchanged while a separate loading/error status identifies current pending work.

## 4. Model slots and resources

The registry contains one entry per catalog ID, owned by the viewer runtime: URL, state (`loading`, `ready`, `failed`), abort controller, load/resource tracker, error if any, and parsed presentation/rotation roots when ready. Each load begins at startup and remains independent of selection. Completed entries stay retained until teardown; failed entries retain their error, not a fake asset. Load completion is guarded by runtime/entry lifetime, not the current selection ticket.

At most two model roots participate in presented rendering: displayed outgoing and current candidate. All other loaded assets remain hidden or detached. Each selected request supplies a fresh request ID/ticket even when its entry is already ready. Reset destination yaw/pitch and inspection target when changing selection. A non-presented isolated candidate validation draw may temporarily isolate the candidate, then restores the real presentation before paint.

Preserve container validation, pre-dependency rejection of external buffer/image URIs, embedded decode errors, finite nonempty bounds and deduplicated geometry/material/texture/skeleton/ImageBitmap disposal. Preserve one renderer and shared Clay/Wireframe overrides without rewriting original materials. Teardown aborts pending work and disposes each entry exactly once; noncancelable late parses are tracked and released after completion. Hiding an entry does not release its memory.

## 5. Inspection ownership and saved pose

Chosen `ActiveControllers: Set<ControllerKey>` has a primary-pointer identity and independent keyboard-focus token. No per-frame allocation. Pointer-only focus creates no keyboard entry; key repeat is idempotent and keyup does not delete keyboard ownership.

| Event | Ownership/pose rule |
| --- | --- |
| First controller | Save visible showcase yaw/pitch once and pause spin before applying input. |
| Additional controller | Preserve target; allow both tokens together. |
| Regrab during return | Take visible scalars, interrupt the leg, retain original target. |
| Pointer up/cancel/lost capture | Null capture ownership before release; remove only pointer token. Duplicate notifications do nothing. |
| Keyboard-focus entry/handled arrow | Acquire keyboard token before rotation; arrows keep existing 5° steps/repeat. |
| Keyup | No ownership change. |
| Keyboard focus leaves | Remove only keyboard token; return waits for any pointer too. |
| Window blur | Clear all inspection/capture and suspend automatic motion; prepare ownerless return for eligibility. |
| Last owner ends | Start a new return leg only with a saved target, or restore without interpolation under reduced motion. |
| Accepted navigation/retirement | Clear old ownership without outgoing return or transfer to destination. |

Manual mapping remains one displayed width/height per full turn and reusable `qX(pitch) × qY(yaw)`, without a pole clamp. Destination initializes its own yaw=pitch=0. Actual keyboard focus remaining on a settled canvas may acquire a fresh destination inspection; never reuse the old target/token.

## 6. Visible-time return and turntable

Each return leg holds fixed start axes, original target, shortest per-axis deltas, `returnElapsedVisibleMs` and an eligible segment start timestamp. Design duration 350 ms; externally observed allowance <=500 ms, including visible release/resume-to-frame scheduling. Regrab interrupts a leg; next all-inputs-ended starts a new leg with the original target.

- Compute fixed deltas with `atan2(sin(target-start), cos(target-start))`; deterministic antipodal tie, each axis at most pi. Smoothstep `u*u*(3-2*u)` and exact saved endpoints avoid unwinding or drift.
- Start eligible timing at the release/resume event's monotonic time. On suspension, close the eligible segment and retain accumulated time/last presented pose. On resume, open a fresh segment at that event, not the first later RAF. Never count hidden/offscreen/inactive/zero-size intervals or erase eligible waiting/stalls with a delta cap.
- Reduced motion restores exact ownerless saved axes without interpolation, clears target/clock and schedules an eligible demand draw. With active owners, do not override their pose. Zero animated duration does not claim zero OS delivery/paint latency.
- Finish exact axes before spin resumes on a later interval; do not reuse the entire return-completion delta as spin time. Acceptance compares landmarks/reference views and summed visible intervals, not merely these scalars.

Turntable adds positive yaw at `2*pi/24` radians per eligible visible second. Requires healthy finalized selection, no pending navigation/return, empty ownership and normal motion. Pause at eligibility loss; resume from the last visible pose without hidden catch-up. Mode/resize preserves pose, saved target and progress.

## 7. Navigation budget and shared scheduler

Noninitial selection retains `activatedAtMs`; `deadlineAtMs=activatedAtMs+500`. At the actual first eligible movement callback, after model preflight and metadata proof, take `nowMs=performance.now()` and choose once:

`moveDurationMs = max(120, min(360, deadlineAtMs - nowMs - 75))`

`moveElapsedVisibleMs` accumulates only eligible visible segments and derives normalized progress; `lastPresentedProgress` permits restoring a failed finalization before paint. No per-frame allocation or React state. Initial/no-outgoing and reduced-motion paths still require proof/valid drawing; reduced motion uses zero interpolation. A genuine initial mount has no activation deadline.

The 75 ms reserve is a design allowance for completion scheduling/draw/paint, not a guaranteed platform bound. If preparation or later frame work runs too long, do not restart the deadline, skip validation, label the load intentionally delayed, suppress required movement or claim a timing pass. Finish healthy content safely; the ordinary external measurement remains a failure until implementation performance is corrected. Injected-delay tests alone omit the SC-003 deadline assertion because their setup deliberately exceeds it; runtime has no exemption branch.

For direction `d=+1` Next / `-1` Previous and eased progress `e`, outgoing x=`-d*D*e`, incoming x=`d*D*(1-e)`; outgoing scale=`1-0.28*e`, incoming scale=`0.72+0.28*e`. Resting x=0/scale=1. For radius-1 models, choose conservative `D=(cameraDistance+1)*tan(verticalFov/2)*aspect+1`. Resize changes travel/fit at unchanged normalized progress; card/text/controls never move.

One nullable RAF handle serves dirty draw, spin, return and movement. Cache displayed measurements, preserve existing sphere fit/zoom/DPR cap 2 and reuse scratch math. Eligibility loss freezes navigation progress just like return; resume from its last visible presentation and remaining interpolation, not an endpoint snap. Original activation/deadline remain unchanged as raw evidence. Separate visibility tests prove continuity; they are not reported as passing ordinary continuously-visible latency cases. No busy loop while waiting for proof, dimensions or visibility.

## 8. Validation invariants

- Normal activation-to-presented-settlement latency includes all preparation and must be <=500 ms; internal ready/finalizer time alone cannot pass it.
- Curtain precedes text/selection change; zero observed centered-destination/predecessor-readable-details images.
- Current committed details plus a successful actual draw are necessary; request/status echoes and queued state setters are insufficient.
- Exactly one current success-position update; none for pending/failed/abandoned selections. OS speech completion is not the deadline.
- All inspection must end before return; sum visible portions without reset across suspension; reduced motion has no intermediate return journey.
- Only the latest request/channel can finalize, reveal or announce; busy activations change no intent or timestamp. Asset completion is independent of selection identity.
- One renderer, all-catalog runtime registry, at most two presentation participants and one scheduler; source materials/assets, catalog, page and background remain intact.
