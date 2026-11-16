import { expect, test } from '@playwright/test'
import { showcaseUrl } from './game-showcase-fixtures'

test('enlarged TV and controller composition renders in the canvas', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(showcaseUrl())
  await expect(page.locator('[data-tv-state]')).toHaveAttribute('data-tv-state', 'ready', { timeout: 20000 })
  await expect(page.locator('[data-controller-state]')).toHaveAttribute('data-controller-state', 'ready', { timeout: 20000 })
  await page.addStyleTag({ content: '.game-carousel nav { visibility: hidden }' })
  const image = await page.locator('.tv-canvas').screenshot()
  const ratio = await page.evaluate(async (encoded) => {
    const image = new Image()
    image.src = `data:image/png;base64,${encoded}`
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext('2d')!
    context.drawImage(image, 0, 0)
    const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height)
    const background = [data[0], data[1], data[2]]
    let top = height, bottom = -1
    for (let y = 0; y < height; y++) for (let x = Math.floor(width * 0.4); x < width * 0.6; x++) {
      const i = (y * width + x) * 4
      const difference = Math.abs(data[i] - background[0]) + Math.abs(data[i + 1] - background[1]) + Math.abs(data[i + 2] - background[2])
      if (difference > 60) { top = Math.min(top, y); bottom = Math.max(bottom, y) }
    }
    return (bottom - top + 1) / height
  }, image.toString('base64'))
  expect(ratio).toBeGreaterThan(0.3)
})

for (const catalog of ['default', 'empty'] as const) {
  for (const reduced of [false, true]) {
    test(`screen static ${catalog} ${reduced ? 'stays still with reduced motion' : 'animates'}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' })
      await page.goto(showcaseUrl(catalog))
      const canvas = page.locator('.tv-canvas')
      await canvas.scrollIntoViewIfNeeded()
      if (catalog === 'default') {
        await expect(page.locator('[data-tv-state]')).toHaveAttribute('data-tv-state', 'ready', { timeout: 20000 })
      } else {
        // The empty catalog has no image-ready event; allow the TV model to load.
        await page.waitForTimeout(3000)
      }
      await page.addStyleTag({ content: '.game-carousel nav { visibility: hidden }' })
      await page.mouse.move(0, 0)
      await page.waitForTimeout(1000)
      const first = await canvas.screenshot()
      await page.waitForTimeout(350)
      const second = await canvas.screenshot()
      expect(first.equals(second)).toBe(reduced)
    })
  }
}

for (const reduced of [false, true]) {
  test(`controller floating ${reduced ? 'stops with reduced motion' : 'moves independently of pointer'}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' })
    await page.goto(showcaseUrl())
    const stage = page.locator('.tv-stage')
    await expect(page.locator('[data-controller-state]')).toHaveAttribute('data-controller-state', 'ready', { timeout: 20000 })
    await stage.scrollIntoViewIfNeeded()
    const next = page.locator('.game-controller-navigation .navigation-next')
    const start = (await next.boundingBox())!.y
    if (reduced) {
      await page.waitForTimeout(600)
      expect(Math.abs((await next.boundingBox())!.y - start)).toBeLessThan(0.2)
    } else {
      await expect.poll(async () => Math.abs((await next.boundingBox())!.y - start), { timeout: 3000 }).toBeGreaterThan(0.5)
    }
  })
}

test('pointer movement does not tilt the idle TV or controller', async ({ page }) => {
  await page.route('**/src/data/game-viewer-motion.ts*', route => route.fulfill({
    contentType: 'text/javascript',
    body: 'export const gameViewerMotion = { floatIntensity: 0, floatSpeed: 0, pressTiltDegrees: 8, pressDurationMs: 400 };',
  }))
  await page.goto(showcaseUrl())
  await expect(page.locator('[data-controller-state]')).toHaveAttribute('data-controller-state', 'ready', { timeout: 20000 })
  await page.locator('.tv-stage').scrollIntoViewIfNeeded()
  const next = page.locator('.game-controller-navigation .navigation-next')
  const before = (await next.boundingBox())!
  await page.mouse.move(10, 10)
  await page.mouse.move(page.viewportSize()!.width - 10, 10)
  await page.waitForTimeout(300)
  const after = (await next.boundingBox())!
  expect(Math.abs(after.x - before.x)).toBeLessThan(0.2)
  expect(Math.abs(after.y - before.y)).toBeLessThan(0.2)
})

test('keyboard navigation tilts controller in opposite directions and settles', async ({ page }) => {
  await page.route('**/src/data/game-viewer-motion.ts*', route => route.fulfill({
    contentType: 'text/javascript',
    body: 'export const gameViewerMotion = { floatIntensity: 0, floatSpeed: 0, pressTiltDegrees: 8, pressDurationMs: 800 };',
  }))
  await page.goto(showcaseUrl('extended'))
  await expect(page.locator('[data-controller-state]')).toHaveAttribute('data-controller-state', 'ready', { timeout: 20000 })
  await page.locator('.tv-stage').scrollIntoViewIfNeeded()
  const anchor = page.locator('.game-controller-navigation .navigation-next')
  const baseline = (await anchor.boundingBox())!.y
  await page.getByRole('application', { name: 'Game navigation' }).focus()
  await page.keyboard.press('ArrowRight')
  let right = 0
  await expect.poll(async () => { right = (await anchor.boundingBox())!.y - baseline; return Math.abs(right) }, { timeout: 5000 }).toBeGreaterThan(1)
  await expect.poll(async () => Math.abs((await anchor.boundingBox())!.y - baseline), { timeout: 5000 }).toBeLessThan(0.5)
  await page.keyboard.press('ArrowLeft')
  let left = 0
  await expect.poll(async () => { left = (await anchor.boundingBox())!.y - baseline; return Math.abs(left) }, { timeout: 5000 }).toBeGreaterThan(1)
  expect(right * left).toBeLessThan(0)
  await expect.poll(async () => Math.abs((await anchor.boundingBox())!.y - baseline), { timeout: 5000 }).toBeLessThan(0.5)
})
