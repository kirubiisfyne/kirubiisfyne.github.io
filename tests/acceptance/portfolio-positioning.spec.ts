import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { projectCaption } from '../../src/lib/project-caption'
import { discoverModelConfigs } from '../../vite.config'
import { expect, navigateGame, showcaseUrl, test } from './game-showcase-fixtures'

test('hero stays compact without contact shortcuts while footer keeps contacts and availability', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('Kirby Bilbao — Gameplay Programmer')
  const title = page.getByRole('heading', { level: 1 })
  await expect(title).toHaveText('[ Game Developer & Artist ]')
  await expect(title).toHaveCSS('font-size', '12px')
  await expect(title).toHaveCSS('font-weight', '700')
  await expect(title).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(title).toHaveCSS('padding-left', '0px')
  expect(await title.evaluate((element) => getComputedStyle(element).fontFamily)).toContain('MS W98 UI')
  const hero = page.locator('main > header')
  await expect(hero).not.toContainText('Unity · Godot · C# · GDScript')
  for (const instruction of await page.locator('.instruction-copy').all()) {
    await expect(instruction).toHaveCSS('color', 'rgba(235, 235, 235, 0.5)')
  }
  await expect(hero).toContainText('co-founder and lead developer at Ukiyo Studios')
  await expect(page.locator('.hero-availability')).toHaveCount(0)
  await expect(hero).not.toContainText('Available for internships')
  await expect(page.getByRole('contentinfo')).toContainText('Open for internships and commissions')
  await expect(page.getByRole('navigation', { name: 'Quick contact' })).toHaveCount(0)
  await expect(hero.getByRole('link')).toHaveCount(0)
  const contacts = page.getByRole('navigation', { name: 'Connect links' })
  await expect(contacts.getByRole('link', { name: '[ GitHub ]', exact: true })).toHaveAttribute(
    'href',
    'https://github.com/kirubiisfyne'
  )
  await expect(contacts.getByRole('link', { name: '[ LinkedIn ]', exact: true })).toHaveAttribute(
    'href',
    'https://www.linkedin.com/in/kirby-bilbao-338a70337/'
  )
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    contacts.getByRole('link', { name: '[ CV / Resume ]', exact: true }).click(),
  ])
  expect(download.suggestedFilename()).toBe('Kirby_Bilbao_Resume.pdf')
  expect(await download.failure()).toBeNull()
  await expect(page.getByRole('contentinfo').getByRole('link')).toHaveCount(6)
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://kirubiisfyne.github.io/branding/social-preview.png'
  )
  expect((await page.request.get('/branding/social-preview.png')).ok()).toBe(true)
  expect((await page.request.get('/branding/favicon.svg')).ok()).toBe(true)
  expect(await page.locator('img:not([alt])').count()).toBe(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
})

test('game permalinks retain verified role and ownership content without omitted metadata rows', async ({ page }) => {
  await page.goto('/?game=anii&ref=application')
  await expect(page.locator('.game-title')).toHaveText('Anii! Grow to Know')
  await page.reload()
  const roles = page.locator('.game-info-roles li p')
  await expect(roles).toHaveText(['Lead Developer', 'Game Director'])
  await expect(page.locator('.game-facts')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Team-developed systems' })).toBeVisible()
  await expect(page.locator('.game-info-contributions li')).toHaveCount(5)
  await expect(page.getByRole('link', { name: '[ Link to this game ]', exact: true })).toHaveCount(0)
  await expect(page.getByRole('link', { name: /Source Code: Anii/ })).toHaveAttribute(
    'href',
    'https://github.com/kirubiisfyne/anii-repository'
  )
  await navigateGame(page, 'next')
  await expect(page).toHaveURL(/game=kontexto&ref=application/)
  await expect(roles).toHaveText(['Lead Unity Developer', 'Technical Artist'])
  await expect(page.getByRole('heading', { name: 'Team-developed systems' })).toHaveCount(0)
  await expect(page.locator('.game-info-contributions')).toContainText('Task & Dialogue Manager, Text Editor System')
  await page.reload()
  await expect(page.locator('.game-title')).toHaveText('KonTEXTo')
  await page.goto('/?game=unknown')
  await expect(page).toHaveURL(/game=kontexto/)
})

test('game links work with keyboard while all four information groups stay visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Skip to projects' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#projects')).toBeFocused()
  const source = page.getByRole('link', { name: /Source Code: KonTEXTo/ })
  const play = page.getByRole('link', { name: /Play Game: KonTEXTo/ })
  await source.hover()
  await expect(source).toHaveCSS('position', 'relative')
  expect(await source.evaluate((element) => getComputedStyle(element, '::before').opacity)).toBe('1')
  expect(await source.evaluate((element) => getComputedStyle(element.querySelector('span')!).mixBlendMode)).toBe(
    'difference'
  )
  await source.focus()
  await expect(source).toBeFocused()
  await expect(source).toHaveCSS('outline-color', 'rgb(235, 235, 235)')
  await expect(source).toHaveCSS('outline-style', 'solid')
  await page.keyboard.press('Tab')
  await expect(play).toBeFocused()
  await expect(source).toHaveText('> View on Github <')
  await expect(play).toHaveText('> Get on Itch.io <')
  await expect(page.locator('.game-info details')).toHaveCount(0)
  await expect(page.locator('.game-info-features li')).toHaveCount(4)
  await expect(page.locator('.game-info-description li')).toHaveCount(2)
  await expect(page.locator('.game-info-description p').last()).toBeVisible()
  await navigateGame(page, 'next')
  await expect(page.locator('.game-title')).toHaveText('Anii! Grow to Know')
  await expect(page.locator('.game-info-description p').last()).toBeVisible()
  await expect(page.locator('.game-info-features li')).toHaveCount(4)
})

test('Figma GameInfo uses thin shared desktop bars and stacked mobile groups', async ({ page }) => {
  await page.goto(showcaseUrl())
  await page.evaluate(() => document.fonts.ready)
  const panel = page.locator('.game-info')
  const headings = panel.locator('.game-info-heading')
  await expect(headings).toHaveText(['Role', 'Contribution', 'Description / Game Info', 'Game Features'])
  const bars = await headings.evaluateAll((nodes) =>
    nodes.map((node) => {
      const box = node.getBoundingClientRect()
      const style = getComputedStyle(node)
      return {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        background: style.backgroundColor,
        color: getComputedStyle(node.querySelector('span')!).color,
        blend: getComputedStyle(node.querySelector('span')!).mixBlendMode,
      }
    })
  )
  for (const bar of bars) {
    expect(bar.height).toBe(9)
    expect(bar.background).toBe('rgb(235, 235, 235)')
    expect(bar.color).toBe('rgb(255, 255, 255)')
    expect(bar.blend).toBe('difference')
  }
  if (page.viewportSize()!.width >= 768) {
    const bounds = await panel.boundingBox()
    expect(bounds!.width).toBeCloseTo(1152, 0)
    expect(bounds!.height).toBeCloseTo(334, 0)
    expect(bars[0].y).toBeCloseTo(bars[1].y, 0)
    expect(bars[2].y).toBeCloseTo(bars[3].y, 0)
    expect(bars[1].x - (bars[0].x + bars[0].width)).toBeCloseTo(10, 0)
    expect(bars[2].x).toBeCloseTo(bars[0].x, 0)
  } else {
    for (let index = 1; index < bars.length; index++) {
      expect(bars[index].x).toBeCloseTo(bars[0].x, 0)
      expect(bars[index].y).toBeGreaterThan(bars[index - 1].y + bars[index - 1].height)
    }
  }
  await expect(panel).toHaveCSS('padding', '10px')
  await expect(panel).toHaveCSS('font-size', '12px')
  await expect(panel).toHaveCSS('line-height', '16px')
  await expect(panel.getByRole('link')).toHaveCount(2)
  await expect(panel.getByRole('list')).toHaveCount(4)
  await expect(headings.first()).toHaveCSS('font-weight', '700')
  expect(await headings.first().evaluate((node) => getComputedStyle(node).fontFamily)).toContain('MS W98 UI')
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
})

test('offscreen TV assets wait until stage approaches viewport', async ({ page }) => {
  await page.route('**/tests/acceptance/game-showcase.html?*', async (route) => {
    const response = await route.fetch()
    const html = await response.text()
    await route.fulfill({
      response,
      body: html.replace('</head>', '<style>.game-showcase{margin-top:2500px}</style></head>'),
    })
  })
  const requests: string[] = []
  page.on('request', (request) => {
    if (request.resourceType() !== 'script' && /\/(practice_tv\.gltf|NESController\.glb)(?:\?|$)/.test(request.url()))
      requests.push(request.url())
  })
  await page.goto(showcaseUrl())
  await expect(page.locator('.tv-canvas')).toBeAttached()
  await page.evaluate(
    () => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done())))
  )
  expect(requests).toEqual([])
  await page.locator('.tv-stage').scrollIntoViewIfNeeded()
  await expect(page.locator('[data-tv-state]')).toHaveAttribute('data-tv-state', 'ready', { timeout: 20000 })
  expect(requests).toHaveLength(2)
})

test('art loads on approach and specifications settle with the selected model', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (request) => {
    if (request.resourceType() !== 'script' && /\/practice_(axe|hammer|scythe|sword)\.glb(?:\?|$)/.test(request.url()))
      requests.push(request.url())
  })
  await page.goto('/')
  await expect(page.locator('main > header')).toBeVisible()
  expect(requests).toEqual([])
  const art = page.locator('section[aria-labelledby="art"]')
  await art.scrollIntoViewIfNeeded()
  const caption = art.locator('.project-description')
  await expect(caption).toHaveAttribute('data-revealed', '', { timeout: 20000 })
  await expect(caption).toContainText('Triangles: 128')
  await expect(caption).toContainText('Vertices: 212')
  await expect(caption).toContainText('1024 × 1024 (3 maps)')
  await expect(caption).toContainText('UV0 present')
  await expect(caption).not.toContainText('Target:')
  await art.getByRole('button', { name: 'Next project', exact: true }).click()
  await expect(caption).toHaveAttribute('data-revealed', '')
  await expect(caption).toContainText('Triangles: 508')
  await expect(caption).toContainText('Vertices: 811')
  await expect(art.locator('.carousel-position')).toContainText('Fantasy Paladin Hammer')
})

test('model configs validate optional specifications without modifying owner assets', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'portfolio-config-'))
  const sidecar = resolve(root, 'sample.config.json')
  try {
    writeFileSync(
      sidecar,
      JSON.stringify({ specifications: { triangleCount: 128, software: ' Maya ', uvMapping: ' ' } })
    )
    expect(discoverModelConfigs(root, ['sample.glb'])['sample.glb'].specifications).toEqual({
      triangleCount: 128,
      software: 'Maya',
    })
    for (const specifications of [
      [],
      null,
      { triangleCount: -1 },
      { vertexCount: 1.5 },
      { materialCount: '1' },
      { software: false },
      { unknown: 'value' },
    ]) {
      writeFileSync(sidecar, JSON.stringify({ specifications }))
      expect(() => discoverModelConfigs(root, ['sample.glb'])).toThrow(sidecar)
    }
    writeFileSync(sidecar, '{}')
    expect(discoverModelConfigs(root, ['sample.glb'])['sample.glb'].specifications).toBeUndefined()
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('optional model specifications omit unknown values and match exported GLB geometry', () => {
  expect(projectCaption({ id: 'empty', title: 'Empty', modelUrl: '/empty.glb' })).toBe('')
  expect(
    projectCaption({ id: 'zero', title: 'Zero', modelUrl: '/zero.glb', specifications: { materialCount: 0 } })
  ).toBe('Materials: 0')
  for (const name of ['axe', 'hammer', 'scythe', 'sword']) {
    const path = resolve('glb', `practice_${name}`)
    const bytes = readFileSync(`${path}.glb`)
    const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12))) as {
      accessors: { count: number }[]
      meshes: { primitives: { attributes: { POSITION: number }; indices: number; mode?: number }[] }[]
      materials: unknown[]
    }
    const config = JSON.parse(readFileSync(`${path}.config.json`, 'utf8'))
    const primitives = gltf.meshes.flatMap((mesh) => mesh.primitives)
    expect(primitives.every((primitive) => (primitive.mode ?? 4) === 4)).toBe(true)
    expect(config.specifications.triangleCount).toBe(
      primitives.reduce((total, primitive) => total + gltf.accessors[primitive.indices].count / 3, 0)
    )
    expect(config.specifications.vertexCount).toBe(
      primitives.reduce((total, primitive) => total + gltf.accessors[primitive.attributes.POSITION].count, 0)
    )
    expect(config.specifications.materialCount).toBe(gltf.materials.length)
  }
})
