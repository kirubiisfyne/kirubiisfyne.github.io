# Graph Report - portfolio  (2026-11-16)

## Corpus Check
- 71 files · ~153,145 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 18 file(s) not represented in the graph (top: .glb 13, (none) 2, .bin 1)

## Summary
- 608 nodes · 933 edges · 49 communities (45 shown, 4 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1e17eeb0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- PortfolioPage.tsx
- createModelViewer
- steps
- @playwright/test
- extension
- biome.json
- GameShowcase.tsx
- harness.tsx
- steps
- common.sh
- compilerOptions
- package.json
- devDependencies
- vite.config.ts
- hooks
- scripts
- createLoadResources
- after_analyze
- after_checklist
- after_clarify
- after_constitution
- after_implement
- after_plan
- after_specify
- after_tasks
- after_taskstoissues
- before_analyze
- before_checklist
- before_clarify
- before_implement
- before_plan
- before_tasks
- before_taskstoissues
- settlement.spec.ts
- @vitejs/plugin-react
- mountAsciiMetaballs
- ModelViewer
- model-viewer.ts
- ModelViewer.tsx
- ModelViewerController
- dependencies
- retro-tv-assets.ts
- visit
- ModelViewer.tsx
- SkillsSection.tsx
- PortfolioPage
- ProjectCarousel
- ConnectSection.tsx

## God Nodes (most connected - your core abstractions)
1. `createModelViewer()` - 49 edges
2. `draw()` - 21 edges
3. `@playwright/test` - 21 edges
4. `hooks` - 19 edges
5. `releaseRuntime()` - 17 edges
6. `compilerOptions` - 15 edges
7. `react` - 14 edges
8. `Project` - 12 edges
9. `ViewerAcceptanceHooks` - 10 edges
10. `mountAsciiMetaballs()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Window` --references--> `Project`  [EXTRACTED]
  tests/acceptance/harness.tsx → src/types/project.ts
- `PresentationDraw` --references--> `ViewerStatus`  [EXTRACTED]
  tests/acceptance/harness.tsx → src/lib/model-viewer.ts
- `MetaballBackground()` --calls--> `mountAsciiMetaballs()`  [EXTRACTED]
  src/components/MetaballBackground.tsx → ascii-metaballs.js
- `HarnessApp()` --calls--> `ProjectCarousel()`  [EXTRACTED]
  tests/acceptance/harness.tsx → src/components/ProjectCarousel.tsx
- `Harness()` --calls--> `GameShowcase()`  [EXTRACTED]
  tests/acceptance/game-showcase-harness.tsx → src/components/GameShowcase.tsx

## Import Cycles
- None detected.

## Communities (49 total, 4 thin omitted)

### Community 0 - "PortfolioPage.tsx"
Cohesion: 0.14
Nodes (9): H1(), H1Props, filenameCounts, projects, artDescription, creativeStackDescription, gameDescription, introduction (+1 more)

### Community 1 - "createModelViewer"
Cohesion: 0.12
Nodes (51): attachDither(), createModelViewer(), acquireController(), alive(), animationTime(), applyMode(), applyRotation(), assignments() (+43 more)

### Community 2 - "steps"
Cohesion: 0.06
Nodes (34): args, inputs, integration, scope, spec, default, prompt, type (+26 more)

### Community 3 - "@playwright/test"
Cohesion: 0.11
Nodes (13): @playwright/test, disableWebGL(), failAsset(), holdAsset(), interceptAsset(), showcaseUrl(), useTvTransform(), capture() (+5 more)

### Community 4 - "extension"
Cohesion: 0.06
Nodes (31): description, file, name, config, defaults, description, name, required (+23 more)

### Community 5 - "biome.json"
Cohesion: 0.06
Nodes (30): noInteractiveElementToNoninteractiveRole, useSemanticElements, noUnusedVariables, useExhaustiveDependencies, files, includes, formatter, enabled (+22 more)

### Community 6 - "GameShowcase.tsx"
Cohesion: 0.14
Nodes (10): gameDevAscii, GameShowcase(), navigationArtwork, H2(), H2Props, Game, games, ids (+2 more)

### Community 7 - "harness.tsx"
Cohesion: 0.07
Nodes (23): acceptance, BROKEN_FIXTURE_PROJECTS, CandidateValidation, candidateValidations, CapturedClick, clearGates(), failedCandidates, failedPreviews (+15 more)

### Community 8 - "steps"
Cohesion: 0.07
Nodes (27): concurrency, cancel-in-progress, group, environment, runs-on, steps, name, url (+19 more)

### Community 9 - "common.sh"
Cohesion: 0.15
Nodes (22): check-prerequisites.sh script, check_dir(), check_file(), find_specify_root(), format_speckit_command(), get_current_branch(), get_feature_paths(), get_invoke_separator() (+14 more)

### Community 10 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowJs, checkJs, jsx, lib, module, moduleResolution, noEmit (+8 more)

### Community 11 - "package.json"
Cohesion: 0.18
Nodes (10): @types/node@24.19.2, @types/react@^19.2.0, engines, node, name, private, type, version (+2 more)

### Community 12 - "devDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, @biomejs/biome@^2.6.4, @playwright/test@1.64.1, tailwindcss@4.3.3, @types/react-dom@^19.2.0, @types/three@0.186.0, typescript@7.0.2, @biomejs/biome (+4 more)

### Community 13 - "vite.config.ts"
Cohesion: 0.17
Nodes (7): @tailwindcss/vite@4.3.3, vite@8.3.5, @tailwindcss/vite, vite, modelConfigPaths, modelPaths, modelRoot

### Community 14 - "hooks"
Cohesion: 0.22
Nodes (9): command, description, optional, command, description, optional, hooks, before_constitution (+1 more)

### Community 15 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, format, lint, preview, test:acceptance, typecheck

### Community 16 - "createLoadResources"
Cohesion: 0.50
Nodes (8): createLoadResources(), closeImage(), instrument(), release(), releaseTexture(), track(), trackMaterial(), trackObject()

### Community 17 - "after_analyze"
Cohesion: 0.40
Nodes (5): command, description, optional, prompt, after_analyze

### Community 18 - "after_checklist"
Cohesion: 0.40
Nodes (5): command, description, optional, prompt, after_checklist

### Community 19 - "after_clarify"
Cohesion: 0.40
Nodes (5): command, description, optional, prompt, after_clarify

### Community 20 - "after_constitution"
Cohesion: 0.40
Nodes (5): command, description, optional, prompt, after_constitution

### Community 21 - "after_implement"
Cohesion: 0.40
Nodes (5): command, description, optional, prompt, after_implement

### Community 22 - "after_plan"
Cohesion: 0.40
Nodes (5): command, description, optional, prompt, after_plan

### Community 23 - "after_specify"
Cohesion: 0.40
Nodes (5): command, description, optional, prompt, after_specify

### Community 24 - "after_tasks"
Cohesion: 0.40
Nodes (5): command, description, optional, prompt, after_tasks

### Community 25 - "after_taskstoissues"
Cohesion: 0.40
Nodes (5): command, description, optional, prompt, after_taskstoissues

### Community 26 - "before_analyze"
Cohesion: 0.40
Nodes (5): command, description, optional, prompt, before_analyze

### Community 27 - "before_checklist"
Cohesion: 0.40
Nodes (5): command, description, optional, prompt, before_checklist

### Community 28 - "before_clarify"
Cohesion: 0.40
Nodes (5): command, description, optional, prompt, before_clarify

### Community 29 - "before_implement"
Cohesion: 0.40
Nodes (5): command, description, optional, prompt, before_implement

### Community 30 - "before_plan"
Cohesion: 0.40
Nodes (5): command, description, optional, prompt, before_plan

### Community 31 - "before_tasks"
Cohesion: 0.40
Nodes (5): command, description, optional, prompt, before_tasks

### Community 32 - "before_taskstoissues"
Cohesion: 0.40
Nodes (5): command, description, optional, prompt, before_taskstoissues

### Community 33 - "settlement.spec.ts"
Cohesion: 0.11
Nodes (10): CompositorObserver, DecodedPixels, FrameRecord, Window, expectRest(), ids, lastStage(), Participant (+2 more)

### Community 36 - "mountAsciiMetaballs"
Cohesion: 0.50
Nodes (6): mountAsciiMetaballs(), draw(), resize(), smoothstep(), syncMotion(), tick()

### Community 37 - "ModelViewer"
Cohesion: 0.50
Nodes (3): ModelViewer(), ViewModeControls(), ViewerCallbacks

### Community 38 - "model-viewer.ts"
Cohesion: 0.20
Nodes (15): CarouselMetadataProps, MetadataPart, ModelViewerProps, ProjectCarouselProps, contextOwners, LoadContext, LoadResources, MetadataTicket (+7 more)

### Community 39 - "ModelViewer.tsx"
Cohesion: 0.22
Nodes (3): MetadataAcceptanceHooks, AcceptanceControls, ViewerAcceptanceHooks

### Community 41 - "dependencies"
Cohesion: 0.25
Nodes (8): dependencies, @fontsource/jetbrains-mono@5.3.0, react@19.3.1, react-dom@19.3.1, three@0.186.1, @fontsource/jetbrains-mono, react-dom, three

### Community 42 - "retro-tv-assets.ts"
Cohesion: 0.14
Nodes (7): RetroTvViewer(), tvTransform, tvDependencies, tvModelUrl, contextOwners, createRetroTvViewer(), TvStatus

### Community 44 - "ModelViewer.tsx"
Cohesion: 0.29
Nodes (4): react, modes, ViewModeControlsProps, DisplayMode

### Community 45 - "SkillsSection.tsx"
Cohesion: 0.23
Nodes (9): headingArtwork, SkillConveyor(), SkillsSection(), skillGroups, Belt, collectIcons(), GLYPH_GROUPS, Icon (+1 more)

### Community 46 - "PortfolioPage"
Cohesion: 0.39
Nodes (4): METABALL_CONFIG, App(), MetaballBackground(), PortfolioPage()

### Community 47 - "ProjectCarousel"
Cohesion: 0.19
Nodes (8): CarouselMetadata(), MetadataProof, ModelViewer, modelViewerPromise, navigationArtwork, ProjectCarousel(), Selection, ViewerBoundary

### Community 48 - "ConnectSection.tsx"
Cohesion: 0.40
Nodes (4): ConnectSection(), LinkGroup(), professionalLinks, socialLinks

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `ModelViewer.tsx` to `model-viewer.ts`, `GameShowcase.tsx`, `harness.tsx`, `dependencies`, `retro-tv-assets.ts`, `package.json`, `SkillsSection.tsx`, `PortfolioPage`, `ProjectCarousel`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `createModelViewer()` (e.g. with `canvasBlur()` and `canvasFocus()`) actually correct?**
  _`createModelViewer()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Should `PortfolioPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13725490196078433 - nodes in this community are weakly interconnected._
- **Why does `@playwright/test` connect `@playwright/test` to `settlement.spec.ts`, `package.json`, `devDependencies`, `SkillsSection.tsx`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `releaseRuntime()` (e.g. with `canvasBlur()` and `canvasFocus()`) actually correct?**
  _`releaseRuntime()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Should `createModelViewer` be split into smaller, more focused modules?**
  _Cohesion score 0.1207843137254902 - nodes in this community are weakly interconnected._
- **Why does `createModelViewer()` connect `createModelViewer` to `createLoadResources`, `ModelViewer`, `model-viewer.ts`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._