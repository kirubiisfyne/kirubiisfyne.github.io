# Portfolio internship improvements

## Implemented

- Kept the ASCII identity, wordmark, blue/paper palette, animations, existing project sections, and footer links. Added the requested gameplay title, technology line, and concise leadership/freelance/multidisciplinary introduction. Four hero contact shortcuts were subsequently removed at the owner's request; existing footer links remain. The title now uses unhighlighted 12px MS W98 UI Bold; the repeated hero internship block was removed at the owner's request, retaining the existing footer message.
- Retained existing footer professional/social URLs and its resume link, which downloads as `Kirby_Bilbao_Resume.pdf`; PDF contents remain unchanged. Removed unused hero contact markup, imports/styles, and the now-unused email URL export.
- Added optional game role lists, team size, duration, development period, engine, languages, classification, status, personal contributions, team-developed systems, and public source URL. Extra metadata remains stored but its separate visible rows are omitted in the current Figma layout.
- GameInfo now follows the owner-selected Figma panel: two action links, Role/Contribution in the top desktop row, Description / Game Info/Game Features below, thin 9px paper bars, chevron lists, and 10px internal spacing. Mobile stacks all four groups. All content stays visible; prior disclosures and metadata rows were replaced.
- KonTEXTo uses owner-confirmed Figma roles (Lead Unity Developer, Technical Artist) and personal credits for Task & Dialogue Manager / Text Editor System work and 3D asset integration. Anii retains Lead Developer / Game Director roles and explicit team credit for its five systems; individual attribution remains unconfirmed. Engine/language/team/duration/classification data remains stored.
- Added direct game links (`/?game=anii#game-showcase-heading`) that work after refresh on static GitHub Pages hosting. Navigation updates the query while preserving other query parameters. No router or deployment rewrite is needed.
- Verified public Unity source repositories and added descriptive Source Code links for both games. GitHub/itch.io/source links returned HTTP 200 during checking.
- Added professional document title, description, canonical URL, Open Graph/Twitter metadata, a wordmark-derived favicon, and a 1200 × 630 social PNG using existing assets/font/colors.
- Added optional, strictly validated 3D specifications to adjacent model configs. All four original models now show verified geometry counts, three embedded 1024 × 1024 maps, one material, UV0 presence, known software, and PBR metallic-roughness workflow. Captions share the existing synchronized metadata curtain. No original GLB bytes were changed.
- Deferred both 3D renderers and their asset requests until within 200 px of the viewport. Existing retained catalog resources, navigation, modes, preflight, animation, and cleanup behavior remain in place.
- Added a keyboard skip link, one primary hero heading, visible action-link focus styles, and corrected footer spelling. Instruction copy later returned to its original translucent color at the owner's request. Existing reduced-motion and dialog behavior remain intact.

## Files

Created:

- `src/data/contact.ts`
- `src/components/GameInfo.tsx`
- `src/lib/project-caption.ts`
- `glb/branding/favicon.svg`
- `glb/branding/social-preview.png`
- `tests/acceptance/portfolio-positioning.spec.ts`
- `docs/portfolio-improvements.md`
- Earlier production-browser captures in `evidence/portfolio-improvements/` and current Figma GameInfo captures in `evidence/figma-game-info/`.

Modified:

- Hero/heading/footer: `src/pages/PortfolioPage.tsx`, `src/components/H1.tsx`, `src/components/ConnectSection.tsx`, `src/data/site-copy.ts`.
- Games: `src/data/games.ts`, `src/components/GameShowcase.tsx`.
- Model metadata: `src/types/project.ts`, `src/data/projects.ts`, `src/vite-env.d.ts`, `vite.config.ts`, `src/components/CarouselMetadata.tsx`, `src/components/ProjectCarousel.tsx`, and the four `glb/practice_*.config.json` files.
- Loading: `src/components/ModelViewer.tsx`, `src/components/RetroTvViewer.tsx`.
- Styling/metadata: `src/styles.css`, `index.html`.
- Regression assertions: `tests/acceptance/game-media.spec.ts`, `tests/acceptance/game-showcase-display.spec.ts`.
- Documentation: `README.md`, `AGENTS.md`.

Knowledge-graph tooling also refreshed generated `graphify-out/` files. Existing `.DS_Store` changes were not intentionally modified or reverted.

## Existing improvements retained

- Existing downloadable resume, professional/social footer links, supplied artwork, and all game/3D/2D project content.
- Textured, clay, and wireframe viewing; independent model loads; FIFO belt navigation; synchronized selection announcements and details.
- Local optimized WebP game media, descriptive game screenshot alt text, privacy-enhanced YouTube embeds with autoplay off, and native screenshot dialogs.
- Reduced-motion and visibility-aware motion behavior, game viewer keyboard/D-pad controls, and GitHub Actions Pages deployment.

## Deliberately skipped / missing owner information

- No finished technical breakdowns or debugging case studies were supplied or found in this checkout. The owner confirmed publication should be skipped. No placeholder articles, empty article section, Markdown dependency, or unused routing framework was added. Article rendering/media/deep-link verification is therefore not applicable to this change.
- Anii: map each supplied system to individually implemented versus co-developed work before publishing personal ownership claims. All five currently remain team-credited.
- KonTEXTo: team size, development duration/period, status, and specific subsystem-level individual/shared ownership remain unknown. Current personal credits include the owner-confirmed Figma subsystem examples; no broader individual ownership is inferred.
- Both games: exact development dates and current statuses remain omitted. No release dates were inferred from repository creation dates.
- 3D target platforms are unknown and omitted. UV0 presence does not imply non-overlapping UVs or baking quality. Counts refer to exported vertices, including UV/normal seam splits. Reverify sidecars after model re-export.
- No dependencies were added; no asset recompression, renderer redesign, or unrelated bulk formatting was performed.

## Validation

- `npm run typecheck`: passed.
- `npm run build`: passed. Production HTML resolves all local assets, public branding files are copied, source entry is compiled, and no acceptance-fixture directories are published.
- Scoped Biome check: all 16 checked modified/new source and test files passed.
- Focused desktop/mobile acceptance checks: 56 passed; separate config-boundary checks: 2 passed.
- Previous full `npm run test:acceptance` (before the follow-up layout revision): **200 passed** in 9.9 minutes across desktop (1280 × 832) and mobile (375 × 812).
- Previous production bundle served by a plain Python static HTTP server (not Vite's SPA fallback): desktop/mobile root, direct game links, refresh, textured/clay/wireframe selection, model navigation with synchronized specs, keyboard disclosure, and 2D dialog Escape all passed. Unknown paths correctly returned 404. No horizontal overflow, missing image alt attributes, runtime errors, or failed asset requests were observed. Six captures are saved in `evidence/portfolio-improvements/`. YouTube embeds were stubbed for these checks.
- `npm run lint`: still fails on pre-existing debt in untouched source. Baseline was 25 errors and 1 warning; current result is 19 errors and 1 warning. Remaining files include Art2DCarousel, SkillsSection, ascii-shimmer, viewer internals, and unrelated formatter/import issues. No lint rules were weakened globally.
- External link check: GitHub, both game sources, itch.io pages, Facebook redirect, and Instagram returned HTTP 200. LinkedIn rejected automated HEAD with HTTP 405; manual authenticated verification is still needed. A blocked automated request is not proof of a broken profile.

## Follow-up layout revision validation

- Latest focused acceptance run: **42 passed** across desktop/mobile, covering exact title font/size/no highlight, hero availability removal with footer preservation, two-column versus stacked summaries, aligned fact values, independently keyboard-operated disclosures, reset on game change, game/media navigation, and existing project heading behavior.
- Latest `npm run typecheck`, `npm run build`, scoped Biome checks, LSP diagnostics, and tracked diff whitespace check passed.
- Latest production bundle was checked on plain static hosting at 1280 × 832 and 375 × 812. Requested typography, responsive layout, direct game URLs/refresh, independent disclosures, and footer availability all passed, with no runtime errors, failed requests, or horizontal overflow. Six browser captures were refreshed in `evidence/portfolio-improvements/`.
- The entire acceptance suite was not rerun for this focused UI revision; the full 200-test result above belongs to the earlier layout. Existing unrelated global lint debt remains deferred.

## Hero contact shortcut removal

Removed the four links below the main introduction (Download Resume, GitHub, LinkedIn, Email), leaving footer links and game actions unchanged. Removed unused imports/styles and the unused email URL export. **16 focused desktop/mobile acceptance tests passed**, including absence of hero shortcuts, preservation of all six footer links, and the actual footer resume download filename. Type-check, build, scoped lint, and LSP checks passed. Production desktop/mobile checks found no horizontal overflow or runtime errors; both hero captures were refreshed. The full suite was not rerun for this small deletion.

## Subsequent hero and control refinements

- Hero heading is `[ Game Developer & Artist ]`; the technology line is removed.
- Game action links share the 3D view buttons' isolated paper hover/focus bar and difference-blend lettering, while retaining link semantics. Instruction copy uses its original `#ebebeb80` color.

## Current Figma GameInfo implementation

Reference: [file M6YiE4DPEACvwrWhLzm0LN, node 2032:128](https://www.figma.com/design/M6YiE4DPEACvwrWhLzm0LN/BSOD_Portfolio?node-id=2032-128).

- Owner confirmed the new KonTEXTo roles and subsystem wording as personal work, and chose to hide metadata rows omitted from Figma. Anii's shared work remains labeled Team-developed systems.
- Replaced Play/source/permalink styling and disclosures with the reference's two text action links and four always-visible information groups. Direct query URLs still work.
- No new static image/SVG assets were required: this node consists of native text, chevrons, and paper bars. Existing local MS W98 UI Bold and JetBrains Mono fonts are reused. Media and 3D assets remain unchanged.
- Desktop reference geometry verified at 1152 × 334, with heading positions at (10, 52), (581, 52), (10, 153), and (581, 153), and 9px heading bars. Mobile uses fluid stacked groups without text clipping or horizontal overflow.
- Scoped lint, type-check, and production build pass. The complete 88-case game/portfolio/headings selection passed across desktop/mobile. A final hover-plus-keyboard focus-contrast adjustment additionally passed both focused keyboard checks.
- First regression run had one desktop lifecycle failure checking a missing saved WebGL context (87/88 passed). Three isolated lifecycle repeats and the complete 88-case rerun passed without renderer edits or weakening assertions; keep this intermittent environmental/lifecycle flake visible rather than claiming a source fix.
- Four production captures in `evidence/figma-game-info/` cover KonTEXTo and Anii on desktop/mobile. Production audits found no runtime/console errors, horizontal overflow, or clipped text; 320px and 768px smoke checks also passed. Existing ASCII background remains visible. YouTube embeds were stubbed; live playback and deployment were not rechecked. Earlier full-suite results above belong to prior layouts.

## Remaining recommendations

1. Supply missing project attribution, dates/status, and finished articles when ready.
2. Resolve existing repository lint debt separately to avoid unrelated formatter churn in this change.
3. Check real YouTube playback and LinkedIn manually. Acceptance embeds use local fixtures.
4. Confirm live GitHub Pages/social previews after deployment; local builds cannot verify production cache or crawler behavior.
5. The art viewer still retains the full catalog once approached, preserving current interaction guarantees. Revisit asset budgets if the catalog grows substantially.
