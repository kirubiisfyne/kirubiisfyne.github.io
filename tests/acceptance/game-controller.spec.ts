import { expect, test, failAsset, navigateGame, showcaseUrl } from './game-showcase-fixtures'

test('projected D-pad halves select previous and next independently', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(showcaseUrl('extended'))
  const controller = page.locator('[data-controller-state]')
  await expect(controller).toHaveAttribute('data-controller-state', 'ready', { timeout: 20000 })
  await expect(page.locator('[data-tv-state]')).toHaveAttribute('data-tv-state', 'ready', { timeout: 20000 })
  await controller.scrollIntoViewIfNeeded()
  const previous = controller.locator('.navigation-previous')
  const next = controller.locator('.navigation-next')
  const previousBox = (await previous.boundingBox())!
  const nextBox = (await next.boundingBox())!
  const stageBox = (await page.locator('.tv-stage').boundingBox())!
  // Reference camera puts the foreground D-pad to the right of the stage center.
  expect(previousBox.x + previousBox.width / 2).toBeGreaterThan(stageBox.x + stageBox.width * 0.55)
  expect(previousBox.y + previousBox.height / 2).toBeGreaterThan(stageBox.y + stageBox.height * 0.45)
  // The current authored desktop pose places the D-pad at about 82% of stage height.
  expect(previousBox.y + previousBox.height / 2).toBeLessThan(stageBox.y + stageBox.height * 0.85)
  expect(previousBox.x + previousBox.width).toBeLessThanOrEqual(nextBox.x)
  await page.mouse.click(previousBox.x + previousBox.width / 2, previousBox.y + previousBox.height / 2)
  await expect(page.getByRole('heading', { name: 'Fixture Extra Game' })).toBeVisible()
  await page.mouse.click(nextBox.x + nextBox.width / 2, nextBox.y + nextBox.height / 2)
  await expect(page.getByRole('heading', { name: 'KonTEXTo' })).toBeVisible()
  await page.mouse.click(nextBox.x + nextBox.width / 2, nextBox.y + nextBox.height / 2)
  await expect(page.getByRole('heading', { name: 'Anii! Grow to Know' })).toBeVisible()
  await page.mouse.move(nextBox.x + nextBox.width / 2, nextBox.y + nextBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(nextBox.x + nextBox.width / 2 + 20, nextBox.y + nextBox.height / 2)
  await page.mouse.up()
  await expect(page.getByRole('heading', { name: 'Anii! Grow to Know' })).toBeVisible()
  const canvas = page.locator('.tv-canvas')
  const touch = { pointerId: 17, pointerType: 'touch', button: 0, clientX: previousBox.x + previousBox.width / 2, clientY: previousBox.y + previousBox.height / 2 }
  await canvas.dispatchEvent('pointerdown', touch)
  await canvas.dispatchEvent('pointerup', touch)
  await expect(page.getByRole('heading', { name: 'KonTEXTo' })).toBeVisible()
})

test('expanded canvas follows body width and preserves picking when height changes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(showcaseUrl('extended'))
  await page.addStyleTag({ content: '#root { zoom: 1.25 }' })
  const stage = page.locator('.tv-stage')
  const canvas = page.locator('.tv-canvas')
  const controller = page.locator('[data-controller-state]')
  await expect(controller).toHaveAttribute('data-controller-state', 'ready', { timeout: 20000 })
  await expect(stage).toHaveAttribute('data-tv-state', 'ready', { timeout: 20000 })
  await stage.scrollIntoViewIfNeeded()
  const before = (await controller.locator('.navigation-next').boundingBox())!
  const beforeStage = (await stage.boundingBox())!
  const beforeCanvas = (await canvas.boundingBox())!
  await stage.evaluate(element => element.style.setProperty('--game-canvas-height-scale', '2.25'))
  await expect.poll(async () => (await canvas.boundingBox())!.height).toBeGreaterThan(beforeCanvas.height * 1.4)
  const after = (await controller.locator('.navigation-next').boundingBox())!
  const afterStage = (await stage.boundingBox())!
  const afterCanvas = (await canvas.boundingBox())!
  const bodyWidth = await page.evaluate(() => document.body.getBoundingClientRect().width)
  expect(Math.abs(afterCanvas.width - bodyWidth)).toBeLessThan(2)
  expect(Math.abs((afterCanvas.y + afterCanvas.height / 2) - (afterStage.y + afterStage.height / 2))).toBeLessThan(2)
  expect(Math.abs((after.x - afterStage.x) - (before.x - beforeStage.x))).toBeLessThan(2)
  expect(Math.abs((after.y - afterStage.y) - (before.y - beforeStage.y))).toBeLessThan(2)
  await page.mouse.click(after.x + after.width / 2, after.y + after.height / 2)
  await expect(page.getByRole('heading', { name: 'Anii! Grow to Know' })).toBeVisible()
  await navigateGame(page, 'next')
  await expect(page.getByRole('heading', { name: 'Fixture Extra Game' })).toBeVisible()
})

test('floating D-pad remains stable while pressed and navigates on release', async ({ page }) => {
  await page.goto(showcaseUrl('extended'))
  const controller = page.locator('[data-controller-state]')
  await expect(controller).toHaveAttribute('data-controller-state', 'ready', { timeout: 20000 })
  await expect(page.locator('[data-tv-state]')).toHaveAttribute('data-tv-state', 'ready', { timeout: 20000 })
  await page.locator('.tv-stage').scrollIntoViewIfNeeded()
  const previous = controller.locator('.navigation-previous')
  const first = (await previous.boundingBox())!
  await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2)
  const target = (await previous.boundingBox())!
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2)
  await page.mouse.down()
  const held = (await previous.boundingBox())!
  await page.waitForTimeout(250)
  const stillHeld = (await previous.boundingBox())!
  expect(Math.abs(stillHeld.y - held.y)).toBeLessThan(1)
  await page.mouse.up()
  await expect(page.getByRole('heading', { name: 'Fixture Extra Game' })).toBeVisible()
})

test('controller failure preserves TV and accessible navigation', async ({ page }) => {
  await failAsset(page, '**/NESController.glb*')
  await page.goto(showcaseUrl())
  await expect(page.locator('[data-controller-state]')).toHaveAttribute('data-controller-state', 'unavailable', { timeout: 20000 })
  await expect(page.locator('[data-tv-state]')).toHaveAttribute('data-tv-state', 'ready', { timeout: 20000 })
  await navigateGame(page, 'next')
  await expect(page.getByRole('heading', { name: 'Anii! Grow to Know' })).toBeVisible()
})
