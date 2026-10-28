# Feature Specification: Textured 3D Model Carousel

**Feature Branch**: Not created; no branch hook configured. Feature identifier: `002-gltf-model-carousel`.

**Created**: 2026-10-28

**Status**: Planned — clarified to self-contained `.glb` and updated Figma display-mode/hover controls on 2026-10-28; not implemented or browser-verified.

**Input**: User description: "i want a three.js to replace that placeholder \"practice_axeRender1\" to be able to display a .gltf model with textures. i want the model to be lit by a \"Three-Point Lighting\" method, a setup best to showcase a textured 3D model. i want the model to be able to be rotated to 360 degrees in both axis able to do a full rotation, in the vertical axis (or the Z axis in Blender). i want the models to be showcased in a carousel, clicking the \"NextButton\" and \"PreviousButton\" will cycle to the next or previous model. i want this to be modular, gltfs will be located in a single folder, and all gltfs in that folder will be automatically included in this carousel."

## Clarifications

### Session 2026-10-28

- Q: Which model format and packaging should the carousel use? → A: Self-contained `.glb` instead of `.gltf`, embedding geometry, buffers, and textures in each file to avoid managing separate assets. This user-supplied clarification supersedes the format in the original input above.
- Q: What do the updated Figma buttons control? → A: Apply the newer NextButton and ViewControlButton designs and hover appearances; the three Clay, Rendered, and Wireframe buttons change the display of the active carousel model, not the selected model asset.
- Q: What is the model folder after the owner renames it? → A: Repository-root `glb/` replaces `gltf/` as the sole model catalog root. Discover only self-contained `.glb` files there; do not retain an old-folder fallback. The feature identifier remains `002-gltf-model-carousel`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Inspect a model in three display modes (Priority: P1)

A portfolio visitor sees an actual textured 3D model instead of the static axe render, then uses Clay, Rendered, and Wireframe controls to inspect its shape, authored appearance, and triangle structure. Three-point lighting showcases Rendered and Clay views.

**Why this priority**: The live, textured model presentation is the central replacement requested by the user.

**Independent Test**: Supply a textured model with recognizable surface detail, open the portfolio in its default Rendered mode, and inspect it from different sides. Operate each mode by pointer, touch, and keyboard and compare the updated button default/hover appearances with Figma.

**Acceptance Scenarios**:

1. **Given** a valid self-contained `.glb` with embedded textures, **When** the portfolio loads, **Then** the live model replaces the placeholder artwork, displays its authored textures without external asset requests, and is fully visible and centered in the available viewing area.
2. **Given** Rendered or Clay mode, **When** its lighting is inspected, **Then** a dominant key defines form, a weaker fill reveals shadow-side detail, and a rear/side rim separates the silhouette from the background.
3. **Given** a material with recognizable color, roughness, and metallic detail, **When** the model is viewed from different sides in Rendered mode, **Then** those authored material properties remain represented rather than being replaced by a uniform showcase material.
4. **Given** a model is loading, cannot load, or cannot be rendered on the device, **When** the visitor views its card, **Then** the card identifies the selected model and presents an appropriate loading or unavailable status instead of silently showing the old image as a successful 3D view.
5. **Given** a loaded model, **When** Clay is activated, **Then** the same geometry becomes a neutral, untextured, nonmetallic solid under the showcase lights, without texture-derived normal/bump detail.
6. **Given** Clay or Wireframe mode, **When** Rendered is activated, **Then** the original authored materials and textures return without reloading the model or losing its rotation.
7. **Given** a loaded model, **When** Wireframe is activated, **Then** its triangle edges appear without filled or textured surfaces, while full rotation remains available.
8. **Given** one selected mode, **When** a visitor selects another or changes models, **Then** exactly one mode remains visibly and accessibly selected; switching modes preserves orientation/framing, and carousel navigation retains the chosen mode while resetting the new model's orientation as already specified.

### User Story 2 - Inspect every side with unrestricted rotation (Priority: P1)

A visitor drags the model horizontally and vertically to inspect every side, including the underside and a complete end-over-end turn. Horizontal dragging turns it about its upright axis, corresponding to Blender's Z axis for an upright export.

**Why this priority**: Both complete rotations are explicitly requested; a viewer that stops at the top or bottom would not satisfy this interaction.

**Independent Test**: Use a model with distinguishable front, rear, top, and underside features. Complete two consecutive full turns in each direction on each axis using pointer, touch, and keyboard input.

**Acceptance Scenarios**:

1. **Given** a focused or pointer-operated viewer, **When** the visitor rotates horizontally through 360 degrees, **Then** the front, sides, rear, and front become visible in sequence, and rotation can continue beyond one revolution without a stop.
2. **Given** the model at its initial orientation, **When** the visitor rotates vertically through 360 degrees, **Then** it passes through top, inverted, underside, and initial views without a pole clamp or forced upright reset; reverse rotation is equally unrestricted.
3. **Given** a touch device or keyboard-only visitor, **When** the visitor drags inside the viewer or uses its documented arrow-key controls while focused, **Then** the same two full-turn rotations are available without activating carousel navigation.
4. **Given** an ongoing drag, **When** the visitor releases or cancels it, **Then** the model stops responding to that drag; interactions outside the viewer still allow normal page scrolling and button use.

### User Story 3 - Browse the model carousel (Priority: P1)

A visitor uses the existing NextButton and PreviousButton artwork controls to cycle through the available models without leaving the portfolio.

**Why this priority**: Existing carousel controls must select actual models rather than static project images.

**Independent Test**: Temporarily supply three visually distinct models. Activate next and previous by pointer and keyboard, cross both boundaries, and navigate quickly while a model is still loading.

**Acceptance Scenarios**:

1. **Given** multiple discovered models, **When** NextButton or PreviousButton is activated, **Then** the adjacent model becomes the selected item, with a matching title and any associated description.
2. **Given** the last or first model is selected, **When** next or previous respectively is activated, **Then** selection wraps to the first or last model.
3. **Given** a model was rotated, **When** another model is selected or the previous model is revisited, **Then** the selected model starts at its own centered, fitted, initial orientation; previous rotations do not carry over.
4. **Given** a pending load for an earlier selection, **When** the visitor selects another model before it completes, **Then** late completion cannot replace the current selection or mismatch its title and model.
5. **Given** zero or one discovered model, **When** the carousel renders, **Then** both navigation controls are disabled; one model is still viewable and rotatable, while zero models produces an explicit empty state without invented work.
6. **Given** an unavailable model among valid models, **When** its card is selected, **Then** its error does not prevent navigation to other entries.
7. **Given** an enabled navigation or mode button, **When** the pointer enters and leaves it or keyboard focus reaches it, **Then** its updated Figma hover-equivalent/focus appearance is available without changing the active model or mode until activation. Disabled navigation does not acquire an actionable hover treatment.

### User Story 4 - Publish models by adding files to one folder (Priority: P2)

The portfolio owner adds self-contained `.glb` files under one designated folder. Every binary model is included automatically on the next build without editing a project list, component, or registration file; separate buffers or texture files are not required.

**Why this priority**: Folder-based discovery makes the viewer reusable for new work without repeating integration changes.

**Independent Test**: Start with an empty folder, then add two self-contained `.glb` files, rebuild, and browse both. Remove one model, rebuild again, and verify only the remaining entry is listed.

**Acceptance Scenarios**:

1. **Given** self-contained `.glb` files anywhere under the designated folder, **When** the site is rebuilt, **Then** every binary model appears exactly once in a deterministic carousel order without manual registration.
2. **Given** a `.glb` containing its geometry and textures, **When** the deployed site loads that model, **Then** it displays using that file alone; `.gltf`, `.bin`, and standalone images are not carousel entries.
3. **Given** a newly added model with no custom title artwork or description, **When** it appears in the carousel, **Then** a readable filename-derived title identifies it without requiring additional metadata or borrowing the axe's title, image, or description.
4. **Given** an existing model is removed, **When** the site is rebuilt and refreshed, **Then** its entry disappears without editing application code.

### Edge Cases

- Empty and single-model collections retain the carousel layout and disabled-navigation behavior; no demonstration models ship as portfolio work.
- Models of different sizes or displaced origins are initially centered and fitted without altering their internal proportions, authored materials, or relative part placement. A full rotation does not clip the model against the viewing area's edges or camera limits.
- Corrupt or truncated binary models, invalid embedded geometry or images, external buffer/texture references, and unsupported rendering produce an accessible unavailable state rather than an indefinitely loading or apparently successful but untextured model. A `.glb` extension alone does not establish self-contained packaging.
- Two models with the same basename in different subfolders remain separate entries; their visible identities include enough relative-path context to distinguish them.
- Rapid navigation cannot leave multiple visible models, stale selection content, or controls that only operate the previous model.
- At 375- and 1280-pixel viewport widths, the viewer and controls remain usable without page-level horizontal overflow. Touch gestures captured inside the viewer do not disable scrolling elsewhere.
- Leaving the viewer, cancelling a gesture, switching models, or remounting the page must not leave active drag handlers, duplicate viewers, or background rendering work belonging to discarded models.
- Reduced-motion preferences do not remove user-directed rotation; there is no automatic model spin or carousel autoplay.
- Mode controls remain usable for a single healthy model even though next/previous are disabled. They are disabled while loading, empty, or unavailable; Clay/Wireframe do not bypass invalid GLB or texture-decoding errors.
- Rapid mode changes never fetch/reparse the GLB, reset rotation/framing, mutate or dispose authored materials, or leave a previous mode's filled surface visible behind Wireframe. Hover alone never switches modes.
- At narrow widths, the new mode-button row may wrap or stack while preserving Clay → Rendered → Wireframe order and readable labels; the new controls must not be clipped by the old artwork/card height.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The portfolio MUST replace the static `practice_axeRender1` artwork with a live model viewer in the existing carousel area, applying the updated Figma navigation buttons and the new mode row while preserving the surrounding page composition.
- **FR-002**: The viewer MUST load each selected self-contained `.glb` with embedded geometry, buffers, and textures, preserve authored material properties for Rendered mode, and clearly distinguish loading, successfully displayed, and unavailable states. A binary model with corrupt embedded resources or external buffer/texture references MUST be unavailable in every mode; the viewer MUST NOT fetch separate model assets or disguise a failed load as a successful Clay/Wireframe view.
- **FR-003**: Rendered and Clay modes MUST use three-point showcase lighting: a dominant front/side key, weaker opposing fill, and rear/side rim. Lighting remains stable during model rotation; Rendered retains texture detail and Clay reveals geometric form. Wireframe uses readable untextured lines without filled-surface shading.
- **FR-004**: Each selected model MUST start centered and fitted in a consistent viewing area, maintain its proportions, and remain viewable throughout full rotations at desktop and narrow widths.
- **FR-005**: Visitors MUST be able to rotate the model continuously in both directions about its upright axis and a perpendicular horizontal axis. Both axes MUST permit complete 360-degree turns and repeated revolutions, including end-over-end inversion; vertical rotation MUST NOT stop at poles. Interaction MUST not introduce an unrelated coordinate-axis requirement merely because the source model was exported from Blender.
- **FR-006**: Rotation MUST support pointer drag, touch drag, and documented keyboard arrow controls when the viewer is focused. The viewer MUST provide an accessible model identity, concise interaction instructions, visible keyboard focus, and no keyboard trap. Rotation input MUST NOT inadvertently select another model.
- **FR-007**: NextButton and PreviousButton MUST select adjacent models, wrap at both ends for multiple entries, and remain disabled for zero or one entry. These are the existing controls with accessible names `Next project` and `Previous project`, not a requirement to introduce new component names.
- **FR-008**: The selected model, visible title, any description, and accessible selection announcement MUST remain coherent during loading, errors, and rapid navigation. Selection changes MUST retain focus on the activated navigation control and start the selected model at its fitted initial orientation.
- **FR-009**: All `.glb` files under repository-root `glb/`, including its subfolders, MUST be automatically included exactly once when building the site. `.gltf`, `.bin`, and standalone textures MUST NOT become carousel entries. Adding or removing binary models MUST NOT require editing a hard-coded collection, UI code, or mandatory metadata file. Discovery MUST NOT fall back to the former model folder.
- **FR-010**: Discovery MUST produce a deterministic order by ascending relative binary-model path, using a consistent case-sensitive comparison. Each selected model MUST display from its single `.glb` file without requesting external buffers or textures.
- **FR-011**: Every discovered model MUST have a stable relative-path identity and a readable filename-derived title without depending on pre-exported title artwork. Duplicate basenames MUST be distinguishable. Existing supplied descriptive copy may remain associated with the matching axe model only; missing descriptions MUST NOT be fabricated or copied from another model.
- **FR-012**: An empty collection MUST show an explicit no-models state. Model/resource failure MUST identify the affected selection without preventing navigation to other models. Unsupported 3D rendering MUST show a readable unavailable state while preserving surrounding portfolio content.
- **FR-013**: The viewer MUST be usable at 375- and 1280-pixel viewport widths with the current default content scale, reachable navigation controls, no page-level horizontal overflow, and normal scrolling outside the interactive surface.
- **FR-014**: Switching models and unmounting/remounting MUST release discarded rendering resources and input ownership so that no obsolete model remains interactive or continues its own rendering work. The existing ASCII metaball effect, its lifecycle, blue base, light glyphs, pointer response, reduced-motion behavior, and transparent foreground treatment MUST remain unchanged.
- **FR-015**: A three-button group below the viewer and above its description MUST offer `Clay`, `Rendered`, and `Wireframe` in the updated Figma order. Rendered is the initial mode; Clay is a neutral untextured nonmetallic solid with no texture-derived surface maps, Rendered restores authored materials/textures, and Wireframe shows triangle edges only.
- **FR-016**: Mode activation MUST update the current loaded model without fetching/reparsing the GLB, changing geometry, selecting another asset, resetting orientation/framing, or creating another renderer. The chosen mode persists across model navigation for the mounted carousel; a fresh mount starts Rendered. Exactly one mode is visibly selected and exposed to assistive technology.
- **FR-017**: Navigation and mode controls MUST reproduce the updated Figma default and hover appearance, support native pointer/touch/Enter/Space activation and visible keyboard focus, and avoid layout shifts on hover. Hover/focus alone MUST NOT activate a control. Mode controls are enabled for a ready model, including a one-item collection, and disabled for loading/empty/error states. Their responsive row MUST remain readable and reachable.

### Key Entities

- **Model asset**: One self-contained `.glb` file with embedded geometry, buffers, textures, and materials, its relative-path identity, and its filename-derived display title. Optional existing descriptive copy is not a discovery prerequisite.
- **Model catalog**: The automatically discovered, deterministically ordered collection beneath the designated folder. It is fixed for a deployed build and changes when the site is rebuilt.
- **Viewer selection**: The currently selected catalog entry, loading/display/error state, and user-controlled orientation. Orientation resets on selection changes; no selection or orientation persistence is required.
- **Showcase lighting**: The key, fill, and rim roles used consistently to reveal each model's form and textured materials.
- **Display mode**: One of Clay, Rendered, or Wireframe; changes only the active model's presentation. The selected value belongs to the mounted viewer, is independent of model identity/orientation, and is not persisted across page reloads.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In initial Rendered mode, the supplied textured reference model replaces the static artwork and is fully framed on initial display and throughout rotation at both 375- and 1280-pixel widths. Front, side, and rear inspection confirms recognizable authored surface details, readable shadow-side detail, and rim separation rather than a uniform flat appearance.
- **SC-002**: Using a distinguishable reference model, a visitor completes two consecutive 360-degree turns in each direction on each of the two rotation axes, including inversion, with no hard stop or forced upright reset. Pointer, touch, and keyboard each pass this scenario.
- **SC-003**: With three distinct temporary models, pointer and keyboard navigation each reach every model, wrap correctly in both directions, and retain matching selection content. A rapid sequence of ten navigation activations during pending loads ends on the expected selected model with no stale replacement.
- **SC-004**: Adding two self-contained `.glb` files under the designated folder, including one in a subfolder, then rebuilding produces exactly two entries without application or registration edits. Repeating the build preserves order; removing one model and rebuilding leaves exactly one entry. With only the model files supplied, both display their embedded textures and make zero external buffer/texture requests. `.gltf`, `.bin`, and standalone images never become entries.
- **SC-005**: Empty, single-model, corrupt/truncated binary, corrupt embedded image, external-reference, and unsupported-rendering scenarios each present the specified usable state. A failing entry does not block browsing valid entries, and ten model switches followed by a page remount leave only the current viewer active while the original background continues its existing behavior.
- **SC-006**: On the supplied textured GLB, pointer, touch, and keyboard each reach all three modes; Clay has no authored texture/map appearance, Wireframe has no filled surface, and returning to Rendered restores the authored appearance. Ten consecutive mode switches preserve orientation/framing, make zero additional model requests, and retain one viewer. A mode chosen before next/previous remains selected on the adjacent model.
- **SC-007**: At 1280- and 375-pixel widths, all three mode buttons and both navigation controls remain within the page, their labels are readable, and default/hover/focus states match the updated Figma references without shifting surrounding content. Exactly one mode stays visibly/accessibly selected after hover ends; disabled/loading/error cases behave as specified.

## Assumptions

- **Explicit technology constraint**: The user requests Three.js with self-contained `.glb` support, superseding the original `.gltf` format. These are delivery constraints, not newly selected architecture; renderer integration, dependency choices, asset paths, light settings, and input algorithms belong in the implementation plan.
- **Rotation interpretation**: “Both axis” means unrestricted horizontal turntable rotation and vertical end-over-end rotation, not only upright camera orbit. Blender's Z-up denotes the model's upright axis; equivalent orientation after export is the requirement, not using a particular engine axis label. Zoom, panning, roll controls, and automatic spin are not requested.
- **Discovery timing and folder scope**: Automatic inclusion occurs at build time for the existing static site, not through runtime filesystem access or uploads. The sole model root is `glb/`, with recursive discovery of `.glb` files; adding/removing entries requires restart/rebuild. The owner has completed the physical folder rename; no further asset move is required.
- **Asset packaging**: Owners provide valid glTF 2.0 binary `.glb` exports containing all geometry, buffers, and textures. Embedded buffer views or data URIs are self-contained; external asset URIs are not. JSON `.gltf`, external sidecar assets, remote model URLs, arbitrary exporter extensions, animation playback, model editing, and runtime upload/administration are outside this request.
- **Available assets**: The supplied model is present at `glb/practice_axeTexture.glb`. It was previously checked with the official Khronos validator before the folder rename: zero errors and zero warnings. It is self-contained, with two meshes, one PBR material, three embedded 2048 × 2048 PNG textures, and no external buffer/image references. Separate `.bin`/PNG files are unnecessary. Rendered appearance and lighting still require implementation/browser acceptance.
- **Existing presentation and current Figma**: This feature supersedes the prior static-image/manual-collection contract and now also the old carousel button treatment. Figma file `8Qb17gg8m0JsxFuEScxxsG` confirms carousel `11:39`, ViewControlButton set `27:82` (Default `27:81`, OnHover `27:83`), navigation NextButton set `27:99` (Default `27:98`, OnHover `27:100`), and mode row `27:45` with Clay `27:85`, Rendered `27:89`, Wireframe `27:93`. The new row sits between media and description. [Exported carousel](design/carousel.png) and [view](design/view-control-variants.png)/[navigation variants](design/navigation-variants.png) record the updated design, not application evidence. Unrelated headings, page copy, default 125% foreground scale, highlights, and metaball background remain unchanged.
- **Scope**: One active model viewer within the existing carousel; no extra portfolio pages, backend, persistence, lighting editor, per-model configuration requirement, or unrelated visual redesign.
- **Mode defaults and terminology**: Solid/Clay is the single `Clay` button, not a fourth mode. Default Rendered preserves the portfolio's authored presentation; retaining a chosen mode across next/previous supports comparison. These are conventional defaults, not an unobserved Figma selected-state specification. Use a persistent selected indicator distinct from transient hover, and no saved user preference.
- **Design evidence limits**: Full-file Figma metadata and PNG/SVG exports were inspected. Additional targeted metadata requests returned rate-limit errors, so prototype transition timing was not verified. Use the observed Default/OnHover states directly, without inventing animation timing; keyboard focus provides an equivalent treatment plus a focus indicator.
- **Governance**: The installed constitution remains an unfilled template, not adopted project governance.
