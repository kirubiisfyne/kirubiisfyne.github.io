import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'

const root = resolve('src/content/technical-breakdowns')
const project = resolve(root, 'acceptance-test-breakdown')
const draft = resolve(root, 'acceptance-test-draft')

test.beforeAll(() => {
  for (const directory of [project, draft]) if (existsSync(directory)) throw new Error(`Refusing to overwrite ${directory}`)
  mkdirSync(resolve(project, 'screenshots/overview'), { recursive: true })
  mkdirSync(resolve(project, 'recordings/debugging'), { recursive: true })
  mkdirSync(draft)
  writeFileSync(resolve(project, 'screenshots/overview/image.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="red"/></svg>')
  writeFileSync(resolve(project, 'recordings/debugging/clip.gif'), Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAAAAAAALAAAAAABAAEAAAIBRAA7', 'base64'))
  writeFileSync(resolve(project, 'article.md'), '---\ntitle: "Acceptance test breakdown"\ndescription: "A temporary test description."\ndate: "2026-03-15"\npublished: true\ncover: "./screenshots/overview/image.svg"\n---\n\n## The **process**\n\n### Tradeoffs\n\n![Test illustration](./screenshots/overview/image.svg)\n\n![Debugging clip](./recordings/debugging/clip.gif)\n')
  writeFileSync(resolve(draft, 'article.md'), '---\npublished: false\n---\n\nSecret test draft.\n')
})

test.afterAll(() => {
  for (const directory of [project, draft]) rmSync(directory, { recursive: true, force: true })
})

test('published breakdown opens directly with local media; draft stays hidden', async ({ page }) => {
  await page.goto('http://127.0.0.1:5489/game-dev/')
  const link = page.getByRole('link', { name: /Acceptance test breakdown/ })
  await expect(link).toBeVisible()
  await expect(link.locator('.technical-breakdown-card-image')).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: '[ Technical Breakdowns ]' })).toBeVisible()
  await expect(link.getByText('[ Technical Breakdown ]')).toBeVisible()
  await expect(page.getByText('Secret test draft')).toHaveCount(0)
  await link.click()
  await expect(page).toHaveURL(/\/game-dev\/acceptance-test-breakdown\/$/)
  await expect(page.getByRole('heading', { level: 2, name: 'The process' }).locator('strong')).toHaveText('process')
  const image = page.getByRole('img', { name: 'Test illustration' })
  await expect(image).toBeVisible()
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBe(10)
  const recording = page.getByRole('img', { name: 'Debugging clip' })
  await expect(recording).toBeVisible()
  await expect.poll(() => recording.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBe(1)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Acceptance test breakdown' })).toBeVisible()
})

test('missing local media fails with article context', async ({ request }) => {
  const invalid = resolve(root, 'acceptance-invalid-media')
  if (existsSync(invalid)) throw new Error(`Refusing to overwrite ${invalid}`)
  mkdirSync(invalid)
  try {
    writeFileSync(resolve(invalid, 'article.md'), '---\ntitle: Invalid\ndescription: Test\ndate: "2026-01-01"\npublished: true\n---\n\n![Missing](./screenshots/missing.png)\n')
    const response = await request.get('http://127.0.0.1:5489/game-dev/acceptance-invalid-media/')
    expect(response.status()).toBe(500)
    expect(await response.text()).toContain('Missing or invalid local media')
  } finally {
    rmSync(invalid, { recursive: true, force: true })
  }
})

test('existing Kontexto URL remains available', async ({ page }) => {
  await page.goto('http://127.0.0.1:5489/game-dev/kontexto-task-system-refactor/')
  await expect(page.getByRole('heading', { name: 'KonTEXTo', exact: true })).toBeVisible()
  await expect(page.locator('.technical-breakdown-header time')).toHaveCount(0)
  await expect(page.getByRole('img', { name: 'Interacting with NPCs and world objects' })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Accepting and handing in a task' })).toBeVisible()
  await expect(page.getByRole('img', { name: "Enzo's task and dialogue event bindings" })).toBeVisible()
})
