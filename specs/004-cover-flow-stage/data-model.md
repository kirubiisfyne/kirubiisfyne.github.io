# Data Model: 3D Cover Flow Stage

## Catalog entry and load

An immutable ordered project has a unique ID, model URL, title and optional description. Existing per-ID load records retain their scene, resource ownership, readiness/error, initial fitted pose and per-mode validation state (`unvalidated`, `queued`, `valid`, or `failed`). Loads start independently and live until viewer disposal; stale or disposed completions cannot mutate a newer runtime.

## Stage assignment

A derived map assigns each distinct ID at most one role: center, left, right, transitioning, or hidden. For N≥3, neighbors are `(index−1+N)%N` and `(index+1)%N`; for N=2, the sole neighbor rests on the right; N=1 has center only and N=0 has no viewer. Readiness filters visible models, not catalog adjacency: an unavailable immediate neighbor leaves a hole rather than substituting a farther entry. Hidden objects are not drawn. Each side preview is at its own initial rotation and uses current mode.

## Transition transaction

A transaction has the existing monotonically increasing request ID, destination ID, direction, activation/deadline, metadata ticket and readiness proof, plus per-ID start/end transforms, participation and visible-time progress. N≥4 can have four distinct participants; N=3 uses a single shared neighbor on a back path; N=2 uses two participants and ends with the previous active on the right. No ID has two presentations. Accepted navigation clears inspection, retains mode and hides metadata; pending loading can be superseded, moving-state controls follow existing guard semantics.

## Lifecycle and invariants

- Loading → candidate validation → metadata-ready movement → final centered draw → synchronous matching metadata reveal and one position message → ready. Failure yields destination-specific error without successful announcement; stale request IDs cannot finalize.
- A preview's load or render failure leaves that slot empty and does not change the active transaction. If it later becomes ready while still adjacent, update the stage without a selection announcement.
- Only settled center owns automatic rotation and input; previews reset to initial pose. Departure transitions pose continuously to the initial preview pose. Hidden, offscreen and inactive intervals freeze progress; reduced motion completes slot/pose updates without intermediate animation, subject to readiness and active inspection rules.
- Camera, clipping and transforms are recalculated on resize without changing model identity, inspection ownership or transaction correctness. Resource disposal and terminal context loss retain feature 003 behavior.

## Validation and transition membership

A preview validation queue is independent of active selection status. Only validated entries in the current mode can occupy visible preview slots. Candidate validation has priority; all diagnostic renders are offscreen and excluded from presentation evidence. Mode changes require the relevant validation, without making missing previews a prerequisite for the centered model.

Transition snapshots freeze distinct participants at movement start, retaining start/end roles and normalized progress. Late-ready entries join the final resting stage after movement if still adjacent. Resize regenerates geometry at the same normalized progress. A superseded loading request restores the last settled stage and derives a fresh target; returning to that same entry avoids self-orbit. Failure clears the active destination presentation and old identity as in feature 003; healthy catalog entries remain retained for onward selection.
