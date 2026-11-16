# Research: NES Game Viewer Layout

## 1. Runtime asset

**Decision**: Import `gltf/NESController/NESController.glb?url` through Vite.

**Evidence**: GLB contains one embedded binary buffer (8,255,496 bytes) and three embedded PNG images. No external image/buffer URI is needed. Supplied GLTF instead references `Grid_normal.png`; supplied texture filename is `Grid_Normal.png`, unsafe on case-sensitive hosts.

**Rationale**: Owner-supplied bytes remain intact; embedded version removes external dependency remapping and filename-case risk. Source tree can keep alternate exports without bundling them.

**Rejected**: Runtime FBX conversion, invented controller geometry, new public model root, or moving controller into carousel catalog.

## 2. Reference scene and camera

**Decision**: Bake common-unit/basis-corrected object transforms into typed local layout configuration. Validate viewing direction and refit camera to combined reference bounds.

**Evidence from offline FBX inspection**:
- TV group `RootNode001`: bounds center approximately (-887.79, 157.18, -855.46), size (990.68, 727.09, 959.96).
- Controller group `RootNode`: center approximately (224.32, 431.03, 81.82), size (768.52, 482.84, 798.36), including full exported geometry.
- Camera position approximately (122.92, 516.22, 1100.98), FOV 38.58°, aspect 1, far plane 100.
- Three.js's raw parsed projection puts both model centers outside horizontal frustum. Camera parameters are not directly usable as a final browser view.

These measurements establish relationships, not final normalized config values. During implementation, align matching source geometry, correct basis, and confirm inferred composition visually before freezing transform constants.

**Rationale**: FBX remains layout guide, not a new runtime dependency. Preserve reference relationships without inheriting unusable clipping/orientation or source-unit inconsistencies.

**Rejected**: Copying raw camera blindly, guessing unrelated side-by-side positions, or independently centering/scaling each object and losing reference composition.

## 3. Renderer ownership and TV preservation

**Decision**: Extend `createRetroTvViewer`; controller helper owns no renderer. TV and controller load independently into one scene.

**Rationale**: Existing TV already owns image guards, material/UV handling, shader static, 300 ms React-side interlude, pointer tilt, observers, and context cleanup. Replacing that pipeline increases regression risk.

**Preservation**: TV tilt applies to TV only; reduced-motion/visibility rules stay intact. Existing editable TV transform is composed locally after reference placement.

**Rejected**: Two game-section canvases, replacement with react-three-fiber, or rewriting existing screen shader while adding navigation.

## 4. Picking and projected semantics

**Decision**: Verify D-pad mesh/local regions from supplied geometry; raycast camera-space pointer against scoped regions. Project associated world anchors for native named controls.

**Evidence**: Export nodes are generic (`Circle`, `NurbsPath`, `Plane` variants), not semantic previous/next buttons. Three.js r186 documentation supports `Raycaster.setFromCamera` and `Vector3.project(camera)` for picking and HTML alignment.

**Rationale**: Distinguish left/right on a possibly single cross mesh without modifying source geometry. Pointer/overlay coordinates must derive from actual displayed canvas bounds and overlay scale, including existing root zoom.

**Rejected**: Whole-controller click target, fixed percentage screen positions, generic name guesses, or per-frame React projection state.

**Documentation consulted**: Context7 `/mrdoob/three.js/r186`, Raycaster and HTML-to-3D alignment examples.

## 5. Accessibility and failure behavior

**Decision**: Retain one native Previous/Next control pair. Project to D-pad when healthy; show labeled fallback controls when asset/graphics state or projected size makes navigation unusable.

**Rationale**: Canvas alone cannot convey focus, control semantics, or reliable failure navigation. Controller errors must not become TV errors. Use shared selection action to avoid double activation and stale index closures.

**Rejected**: Keyboard-only global shortcuts, inaccessible canvas-only buttons, hidden controls during WebGL failure, and overlapping enlarged touch hotspots.

## 6. Regression scope

**Decision**: Reuse permanent game-showcase acceptance fixtures and failure gates. Replace TV-only 80%-height assertions with combined-composition visibility assertions.

**Rationale**: Existing tests already cover wrapping, empty/single catalogs, screen/link synchronization, load ordering, failures, transforms, static/motion, and Strict Mode cleanup. Preserve those behaviors rather than replacing test suite.

No unresolved product decisions remain. Geometry calibration and browser composition verification are implementation steps, not missing user requirements.
