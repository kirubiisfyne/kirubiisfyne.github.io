# Adding a technical breakdown

Create a project folder here with a lowercase, hyphenated name and an `article.md`. The folder name becomes its URL: `my-project/article.md` → `/game-dev/my-project/`. Each project has one evolving article.

```markdown
---
title: "Your title"
description: "A short introduction."
date: "2026-01-15"
published: true
cover: "./screenshots/overview/cover.webp"
---

## System overview

![Describe the diagram](./diagrams/system.svg)

![Task state updating during debugging](./recordings/debugging/session.gif)
```

- `title`, `description`, `date` (YYYY-MM-DD), and `published` are required for published articles. `cover` is optional and decorative. Start the body with `##` headings.
- Organize screenshots and recordings into `overview/`, `systems/`, `debugging/`, and `development/`; put diagrams in `diagrams/`. Reference media relative to `article.md`, starting with `./`.
- PNG, JPEG, WebP, GIF, AVIF, and SVG images render inline. Use descriptive alt text. Put GIF recordings in `recordings/` and embed them with image syntax. Keep GIFs compressed to limit deployment size.
- Media must exist inside its project folder. Missing or escaping paths fail startup/build with the article path. Paths are case-sensitive.
- Set `published: false` for a draft. Drafts and their media are excluded from the listing and production output; do not commit private material to a public repository.
- Markdown supports headings, links, lists, quotes, code blocks, and tables. Raw HTML is not rendered.
- Articles appear newest first by frontmatter date; the date is not displayed in the article header. Run `npm run dev` to preview and `npm run build` before publishing.
