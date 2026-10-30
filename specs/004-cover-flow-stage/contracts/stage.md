# Stage and Selection Contract

## Visitor-facing contract

A ready center is full fitted size; immediate ready neighbors are smaller, recessed left/right previews, except that two entries use the right side alone. Unready or failed neighbors leave empty slots. Preview interaction never rotates a neighbor. All visible entries share the selected display mode. Navigation wraps in the requested direction, preserves focus and follows the spec's distinct-entry orbital choreography. One or zero entries disable navigation; zero mounts no viewer.

## Selection boundary

`ProjectCarousel` continues to send increasing request IDs, destination identity, direction and native activation timestamp to the viewer, and supplies ticketed metadata readiness. On accepted navigation it curtains both details from sight and accessibility. The viewer validates the destination independently, renders its centered final stage, then calls the guarded synchronous finalize callback. Only a current ticket can reveal matching details and update the position live region once. Failed or superseded selections never announce success. A preview state change cannot trigger selection status or announcement.

## Runtime boundary

The viewer owns one renderer, one scene presentation per model ID, independently started loads, frame scheduling and inspection state. At rest only assigned ready slots are visible; during movement only distinct participating entries are drawn. Candidate and preview preflight use isolated offscreen draws, restore render state and track validation per mode; preview failures are attributed to that preview; context loss remains terminal. Mode overrides apply to all visible models without mutating authored materials. Cleanup retains existing abort, late-result disposal and Strict Mode context ownership protections.

## Timing and accessibility

Without introduced readiness delay, native activation through actual compositor presentation of centered model and matching details is ≤500 ms. Deliberate delay preserves the curtain until readiness; reduced motion has no intermediate movement. The active viewer remains keyboard-focusable with existing input semantics, while previews have no independent focus or inspection. Hidden/offscreen/inactive motion pauses without catch-up.

Pointer or touch initiation on a visible preview does not start an inspection gesture; other supported canvas inspection remains directed to the active center. Keyboard input remains directed to the centered model.

Transition membership is fixed when movement begins. Newly ready previews can join the final resting stage without delaying the active settlement. Two-entry Previous takes the right-hand neighbor through the rear and left side before it advances to center; both directions end with the sole neighbor on the right. Three-entry shared neighbors take a single visible recessed back path between sides. These exceptions never duplicate an entry.
