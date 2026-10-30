# Research: 3D Cover Flow Stage

## Stage ownership

**Decision**: Reuse each catalog load's existing `presentation` and `rotation` groups, with an ordered per-ID stage map and transition snapshot inside `createModelViewer`.  
**Rationale**: The viewer already owns a persistent renderer, parallel catalog loads and one retained scene object per ID. Per-ID ownership prevents accidental duplication and avoids React frame updates.  
**Alternatives considered**: Clone the adjacent model or create separate renderers; these duplicate resources, complicate disposal and violate the two-model rule.

## Slot geometry and motion

**Decision**: Compute smaller, recessed side-slot coordinates from measured aspect ratio and camera projection, and adjust fit and clipping planes for all slot and orbit bounds. Interpolate x, depth and scale with continuous easing, with a back arc for the shared neighbor in three-entry catalogs. Snapshot actual starting transforms for interruption and resize handling. Two-entry transitions have direction-specific paths but end with the other entry on the right.  
**Rationale**: Existing center fitting and `distance ± 1.2` clipping were designed around a normalized radius-one center, not recessed neighbors; geometry and camera must be verified together. A shared entry cannot exit and enter as separate copies.  
**Alternatives considered**: Reuse existing full-canvas slide endpoints or duplicate side previews; the former does not form a resting orbit and the latter violates uniqueness. Exact numerical positions are subject to visual and performance validation.

## Rotation and modes

**Decision**: Animate active inspection and turntable only for the settled center; previews use zeroed fitted initial rotation. Transition the departing active pose toward its initial pose without a visible jump, and reset the incoming center before settlement. Retain scene-wide material override for all participants.  
**Rationale**: Existing rotation groups isolate pose from stage transforms, and the existing override preserves authored materials.  
**Alternatives considered**: Copy the inspected pose into a preview or reload assets on mode changes; these break preview behavior or resource retention.

## Readiness and settlement

**Decision**: Resolve available adjacent entries independently; their missing states do not enter active status. Preflight each selected candidate or prospective preview in isolation using an offscreen render target on the existing renderer, restoring all state afterward. Track validation per entry and mode; prioritize the active candidate and attribute preview failures independently. Preserve ticket guards, synchronous final draw/finalize and dedicated position live region.  
**Rationale**: Current preflight assumes only one displayed model, so visible previews would contaminate validation and error attribution. Metadata gating must continue to protect displayed identities.  
**Alternatives considered**: Wait for every neighbor or treat a failed preview as active failure; both block healthy selections. Rendering candidate with other models visible cannot prove candidate draw success.

## Timing and validation

**Decision**: Preserve the current adaptive navigation budget and eligible visible-time clock, while measuring real native activation to compositor presentation. Expand acceptance-only instrumentation to all drawn participants, and use distinct fixture pixels and DOM accessibility observations to verify actual presentation.  
**Rationale**: Internal transforms alone cannot prove displayed models, correct details or deadline compliance.  
**Alternatives considered**: Mocked clocks, callback-only timing, or relaxing the 500 ms threshold; none establish the existing user-visible contract.

## Pointer targeting

**Decision**: Preserve center inspection through the existing canvas while excluding hits on visible preview geometry from initiating inspection; keyboard input remains directed to the settled center. Hit-test visible stage models once at gesture initiation and reject a preview hit, preserving center/background inspection and verifying touch as well as pointer behavior.  
**Rationale**: The existing full-width canvas starts center inspection anywhere, which becomes ambiguous when a visitor gestures directly over a preview.  
**Alternatives considered**: Allow every flank gesture to rotate the center, which makes the preview appear to accept inspection; give previews independent controls, which is outside scope.

## Refresh decisions

**Decision**: Use the concrete fit invariant, small-catalog routes, late-readiness membership, resize semantics and deadline exhaustion rules in [plan.md](plan.md#resolved-design-rules).  
**Rationale**: Current fitting considers only the center; shared-canvas validation can flash a candidate and contaminate error attribution; the existing minimum movement duration can exceed an already depleted deadline. These need explicit changes rather than relying on the previous two-model presentation assumptions.  
**Alternatives considered**: Leave path choice to implementation, insert late-ready models mid-orbit, or validate previews with the active draw. These create ambiguous choreography, mid-motion popping or failures attributed to the healthy center. The locally installed Three.js declarations expose render targets and hit testing, so no new dependency is proposed.
