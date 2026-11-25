import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs'
import { extname, join, relative, resolve, sep } from 'node:path'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { parse } from 'yaml'
import type { Plugin } from 'vite'

const directory = resolve(import.meta.dirname, '../content/technical-breakdowns')
const virtualId = 'virtual:technical-breakdowns'
const resolvedId = `\0${virtualId}`
const aliases: Record<string, string> = { 'kontexto-task-system-refactor': 'kontexto' }
const mediaExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.svg'])

type MarkdownNode = { type: string; url?: string; children?: MarkdownNode[] }

function readBreakdowns() {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const slug = entry.name
      const project = join(directory, slug)
      const path = join(project, 'article.md')
      if (!existsSync(path)) return null
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Invalid breakdown folder: ${project}`)
      const content = readFileSync(path, 'utf8')
      const match = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)([\s\S]*)$/.exec(content)
      if (!match) throw new Error(`Missing YAML frontmatter: ${path}`)
      const metadata = parse(match[1]) as Record<string, unknown> | null
      if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) throw new Error(`Invalid frontmatter: ${path}`)
      if (metadata.published === false) return null
      if (metadata.published !== true) throw new Error(`Set published to true or false: ${path}`)
      for (const field of ['title', 'description', 'date']) {
        if (typeof metadata[field] !== 'string' || !metadata[field].trim()) throw new Error(`Missing ${field}: ${path}`)
      }
      const date = metadata.date as string
      const parsedDate = new Date(`${date}T00:00:00Z`)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) throw new Error(`Invalid date (use YYYY-MM-DD): ${path}`)
      const assets: Record<string, string> = {}
      const addMedia = (url: string) => {
        if (!url.startsWith('./') || !mediaExtensions.has(extname(url).toLowerCase())) throw new Error(`Invalid local media path ${url}: ${path}`)
        const target = resolve(project, url)
        const rel = relative(project, target)
        if (rel.startsWith(`..${sep}`) || rel === '..' || !existsSync(target) || !statSync(target).isFile()) throw new Error(`Missing or invalid local media ${url}: ${path}`)
        const realRelative = relative(realpathSync(project), realpathSync(target))
        if (realRelative === '..' || realRelative.startsWith(`..${sep}`)) throw new Error(`Missing or invalid local media ${url}: ${path}`)
        assets[url] = target
      }
      if (metadata.cover !== undefined) {
        if (typeof metadata.cover !== 'string') throw new Error(`Invalid cover: ${path}`)
        addMedia(metadata.cover)
      }
      const body = match[2].trim()
      const visit = (node: MarkdownNode) => {
        if (node.url && (node.type === 'image' || node.type === 'definition' || node.type === 'link')) {
          const url = node.url
          if (!/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url) && (node.type === 'image' || mediaExtensions.has(extname(url).toLowerCase()))) addMedia(url)
        }
        node.children?.forEach(visit)
      }
      visit(unified().use(remarkParse).parse(body) as MarkdownNode)
      return { slug, title: metadata.title as string, description: metadata.description as string, date, cover: (metadata.cover as string | undefined) ?? null, body, assets }
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug))
}

export function technicalBreakdownPlugin(): Plugin {
  return {
    name: 'technical-breakdown-pages',
    resolveId(id) { if (id === virtualId) return resolvedId },
    load(id) {
      if (id !== resolvedId) return
      const breakdowns = readBreakdowns()
      const imports: string[] = []
      const entries = breakdowns.map(({ assets, ...entry }) => {
        const mappings = Object.entries(assets).map(([path, file]) => {
          const name = `asset${imports.length}`
          imports.push(`import ${name} from ${JSON.stringify(`${file}?url`)}`)
          return `${JSON.stringify(path)}: ${name}`
        })
        return `{...${JSON.stringify(entry)}, assets: {${mappings.join(',')}}}`
      })
      return `${imports.join('\n')}\nexport default [${entries.join(',')}]`
    },
    configureServer(server) {
      server.watcher.add(directory)
      const refresh = (file: string) => {
        if (!file.startsWith(`${directory}${sep}`)) return
        const module = server.moduleGraph.getModuleById(resolvedId)
        if (module) server.moduleGraph.invalidateModule(module)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', refresh).on('change', refresh).on('unlink', refresh)
      server.middlewares.use((req, _res, next) => {
        const path = (req.url ?? '').split('?')[0]
        const match = /^\/(game-dev|development)\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:\/index\.html)?\/?$/.exec(path)
        if (match && readBreakdowns().some((entry) => entry.slug === (aliases[match[2]] ?? match[2]))) req.url = `/${match[1]}/`
        next()
      })
    },
    writeBundle(options) {
      const outDir = resolve(options.dir ?? 'dist')
      const breakdowns = readBreakdowns()
      for (const route of ['game-dev', 'development']) {
        const template = join(outDir, route, 'index.html')
        const slugs = [...breakdowns.map((entry) => entry.slug), ...Object.keys(aliases).filter((alias) => breakdowns.some((entry) => entry.slug === aliases[alias]))]
        for (const slug of slugs) {
          const target = join(outDir, route, slug)
          mkdirSync(target, { recursive: true })
          copyFileSync(template, join(target, 'index.html'))
        }
      }
    },
  }
}
