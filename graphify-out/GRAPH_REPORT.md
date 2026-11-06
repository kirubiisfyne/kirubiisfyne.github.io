# Graph Report - portfolio  (2026-11-06)

## Corpus Check
- 48 files · ~140,363 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 15 file(s) not represented in the graph (top: .glb 12, (none) 2, .css 1)

## Summary
- 533 nodes · 793 edges · 36 communities (33 shown, 3 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1959d681`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ProjectCarousel.tsx
- createModelViewer
- steps
- @playwright/test
- extension
- biome.json
- PortfolioPage.tsx
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
- vite
- @vitejs/plugin-react

## God Nodes (most connected - your core abstractions)
1. `createModelViewer()` - 50 edges
2. `draw()` - 20 edges
3. `hooks` - 19 edges
4. `releaseRuntime()` - 17 edges
5. `compilerOptions` - 15 edges
6. `Project` - 12 edges
7. `ViewerAcceptanceHooks` - 10 edges
8. `ProjectCarousel()` - 10 edges
9. `mountAsciiMetaballs()` - 10 edges
10. `@playwright/test` - 10 edges

## Surprising Connections (you probably didn't know these)
- `PresentationDraw` --references--> `ViewerStatus`  [EXTRACTED]
  tests/acceptance/harness.tsx → src/lib/model-viewer.ts
- `Window` --references--> `Project`  [EXTRACTED]
  tests/acceptance/harness.tsx → src/types/project.ts
- `HarnessApp()` --calls--> `ProjectCarousel()`  [EXTRACTED]
  tests/acceptance/harness.tsx → src/components/ProjectCarousel.tsx
- `MetaballBackground()` --calls--> `mountAsciiMetaballs()`  [EXTRACTED]
  src/components/MetaballBackground.tsx → ascii-metaballs.js
- `ProjectCarouselProps` --references--> `Project`  [EXTRACTED]
  src/components/ProjectCarousel.tsx → src/types/project.ts

## Import Cycles
- None detected.

## Communities (36 total, 3 thin omitted)

### Community 0 - "ProjectCarousel.tsx"
Cohesion: 0.05
Nodes (36): CarouselMetadata(), CarouselMetadataProps, MetadataAcceptanceHooks, MetadataPart, ModelViewer(), ModelViewerProps, AcceptanceControls, MetadataProof (+28 more)

### Community 1 - "createModelViewer"
Cohesion: 0.13
Nodes (50): attachDither(), createModelViewer(), acquireController(), alive(), animationTime(), applyMode(), applyRotation(), assignments() (+42 more)

### Community 2 - "steps"
Cohesion: 0.06
Nodes (34): args, inputs, integration, scope, spec, default, prompt, type (+26 more)

### Community 3 - "@playwright/test"
Cohesion: 0.07
Nodes (17): @playwright/test@1.64.1, @playwright/test, holdModelLoad(), CompositorObserver, DecodedPixels, FrameRecord, Window, Draw (+9 more)

### Community 4 - "extension"
Cohesion: 0.06
Nodes (31): description, file, name, config, defaults, description, name, required (+23 more)

### Community 5 - "biome.json"
Cohesion: 0.06
Nodes (30): noInteractiveElementToNoninteractiveRole, useSemanticElements, noUnusedVariables, useExhaustiveDependencies, files, includes, formatter, enabled (+22 more)

### Community 6 - "PortfolioPage.tsx"
Cohesion: 0.11
Nodes (15): METABALL_CONFIG, mountAsciiMetaballs(), draw(), resize(), smoothstep(), syncMotion(), tick(), react (+7 more)

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
Cohesion: 0.16
Nodes (14): dependencies, @fontsource/jetbrains-mono@5.3.0, react@19.3.1, react-dom@19.3.1, three@0.186.1, engines, node, name (+6 more)

### Community 12 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, @biomejs/biome@^2.6.4, tailwindcss@4.3.3, @types/node@24.19.2, @types/react@^19.2.0, @types/react-dom@^19.2.0, @types/three@0.186.0, typescript@7.0.2 (+7 more)

### Community 13 - "vite.config.ts"
Cohesion: 0.17
Nodes (7): @tailwindcss/vite@4.3.3, @tailwindcss/vite, discoverModelPaths(), visit(), modelConfigPaths, modelPaths, modelRoot

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

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `PortfolioPage.tsx` to `ProjectCarousel.tsx`, `package.json`, `harness.tsx`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `createModelViewer()` (e.g. with `canvasBlur()` and `canvasFocus()`) actually correct?**
  _`createModelViewer()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Should `ProjectCarousel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05268065268065268 - nodes in this community are weakly interconnected._
- **Why does `createModelViewer()` connect `createModelViewer` to `ProjectCarousel.tsx`, `createLoadResources`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `releaseRuntime()` (e.g. with `canvasBlur()` and `canvasFocus()`) actually correct?**
  _`releaseRuntime()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Should `createModelViewer` be split into smaller, more focused modules?**
  _Cohesion score 0.12571428571428572 - nodes in this community are weakly interconnected._
- **Why does `@playwright/test` connect `@playwright/test` to `package.json`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._