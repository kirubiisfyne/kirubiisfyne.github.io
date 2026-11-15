import { expect, test } from '@playwright/test'
import { showcaseUrl } from './game-showcase-fixtures'

test('default TV occupies about 80 percent of canvas height', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(showcaseUrl())
  await expect(page.locator('[data-tv-state]')).toHaveAttribute('data-tv-state', 'ready', { timeout: 20000 })
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
  expect(ratio).toBeGreaterThan(0.74)
  expect(ratio).toBeLessThan(0.85)
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
  test(`cursor tilt ${reduced ? 'respects reduced motion' : 'moves toward pointer'}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' })
    await page.goto(showcaseUrl())
    await expect(page.locator('[data-tv-state]')).toHaveAttribute('data-tv-state', 'ready', { timeout: 20000 })
    await page.addStyleTag({ content: '.game-carousel nav { visibility: hidden }' })
    const canvas = page.locator('.tv-canvas')
    await canvas.scrollIntoViewIfNeeded()
    const viewport = page.viewportSize()!
    await page.mouse.move(viewport.width * 0.1, viewport.height * 0.5)
    await page.waitForTimeout(800)
    const left = await canvas.screenshot()
    await page.mouse.move(viewport.width * 0.9, viewport.height * 0.5)
    await page.waitForTimeout(800)
    const right = await canvas.screenshot()
    expect(left.equals(right)).toBe(reduced)
  })
}
