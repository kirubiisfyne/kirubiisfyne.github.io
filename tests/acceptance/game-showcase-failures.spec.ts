import { expect, test } from '@playwright/test'
import { disableWebGL, failAsset, holdAsset, navigateGame, showcaseUrl } from './game-showcase-fixtures'

test('failed TV model leaves game navigation and links usable', async ({ page }) => {
  await failAsset(page, '**/practice_tv.gltf*')
  await page.goto(showcaseUrl())
  await expect(page.getByText('TV image unavailable.', { exact: false })).toBeVisible()
  await navigateGame(page, 'next')
  await expect(page.getByRole('heading', { name: 'Anii! Grow to Know' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Play/ })).toHaveAttribute('href', 'https://kirubiisfyne.itch.io/anii-grow-to-know')
})

test('failed image cannot block selection or link', async ({ page }) => {
  await failAsset(page, '**/games/anii/emissive.png*')
  await page.goto(showcaseUrl())
  await expect(page.locator('[data-tv-state]')).toHaveAttribute('data-tv-state', 'ready', { timeout: 20000 })
  await navigateGame(page, 'next')
  await expect(page.locator('[data-tv-state]')).toHaveAttribute('data-tv-state', 'unavailable')
  await expect(page.getByRole('heading', { name: 'Anii! Grow to Know' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Play/ })).toHaveAttribute('href', 'https://kirubiisfyne.itch.io/anii-grow-to-know')
})

test('WebGL unavailable retains game controls', async ({ page }) => {
  await disableWebGL(page)
  await page.goto(showcaseUrl())
  await expect(page.locator('[data-tv-state]')).toHaveAttribute('data-tv-state', 'unavailable')
  await navigateGame(page, 'next')
  await expect(page.getByRole('heading', { name: 'Anii! Grow to Know' })).toBeVisible()
})

test('held image request resumes when released', async ({ page }) => {
  const gate = await holdAsset(page, '**/games/anii/emissive.png*')
  await page.goto(showcaseUrl())
  await expect(page.locator('[data-tv-state]')).toHaveAttribute('data-tv-state', 'ready', { timeout: 20000 })
  await navigateGame(page, 'next')
  await gate.requested
  await expect(page.locator('[data-tv-state]')).toHaveAttribute('data-tv-state', 'loading')
  gate.release()
  await expect(page.locator('[data-tv-state]')).toHaveAttribute('data-tv-state', 'ready')
})

test('late image cannot replace the current game after rapid navigation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const gate = await holdAsset(page, '**/games/anii/emissive.png*')
  await page.goto(showcaseUrl())
  await expect(page.locator('[data-tv-state]')).toHaveAttribute('data-tv-state', 'ready', { timeout: 20000 })
  const canvas = page.locator('.tv-canvas')
  await page.mouse.move(0, 0)
  const initial = await canvas.screenshot()
  await navigateGame(page, 'next')
  await gate.requested
  await navigateGame(page, 'previous')
  await expect(page.getByRole('heading', { name: 'KonTEXTo' })).toBeVisible()
  await expect(page.locator('[data-tv-state]')).toHaveAttribute('data-tv-state', 'ready')
  const lateResponse = page.waitForResponse((response) => response.url().includes('/games/anii/emissive.png'))
  gate.release()
  await lateResponse
  await page.waitForTimeout(200)
  await expect(page.getByRole('link', { name: /Play/ })).toHaveAttribute('href', 'https://kirubiisfyne.itch.io/kontexto')
  await page.mouse.move(0, 0)
  expect((await canvas.screenshot()).equals(initial)).toBe(true)
})

test('out-of-order images retain the latest selected screen', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const first = await holdAsset(page, '**/games/kontexto/emissive.png*')
  const second = await holdAsset(page, '**/games/anii/emissive.png*')
  await page.goto(showcaseUrl(), { waitUntil: 'domcontentloaded' })
  await first.requested
  await navigateGame(page, 'next')
  await second.requested
  second.release()
  await expect(page.locator('[data-tv-state]')).toHaveAttribute('data-tv-state', 'ready', { timeout: 20000 })
  const canvas = page.locator('.tv-canvas')
  await page.mouse.move(0, 0)
  const selected = await canvas.screenshot()
  const lateResponse = page.waitForResponse((response) => response.url().includes('/games/kontexto/emissive.png'))
  first.release()
  await lateResponse
  await page.waitForTimeout(200)
  await expect(page.getByRole('heading', { name: 'Anii! Grow to Know' })).toBeVisible()
  await page.mouse.move(0, 0)
  expect((await canvas.screenshot()).equals(selected)).toBe(true)
})

test('context loss remains unavailable after late texture delivery', async ({ page }) => {
  const gate = await holdAsset(page, '**/games/anii/emissive.png*')
  await page.goto(showcaseUrl())
  await expect(page.locator('[data-tv-state]')).toHaveAttribute('data-tv-state', 'ready', { timeout: 20000 })
  await navigateGame(page, 'next')
  await gate.requested
  await page.locator('.tv-canvas').evaluate((canvas) => canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })))
  await expect(page.locator('[data-tv-state]')).toHaveAttribute('data-tv-state', 'unavailable')
  const lateResponse = page.waitForResponse((response) => response.url().includes('/games/anii/emissive.png'))
  gate.release()
  await lateResponse
  await page.waitForTimeout(200)
  await expect(page.locator('[data-tv-state]')).toHaveAttribute('data-tv-state', 'unavailable')
  await navigateGame(page, 'previous')
  await expect(page.locator('[data-tv-state]')).toHaveAttribute('data-tv-state', 'unavailable')
})

test('unmount during a held image load does not throw', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const gate = await holdAsset(page, '**/games/anii/emissive.png*')
  await page.goto(showcaseUrl())
  await expect(page.locator('[data-tv-state]')).toHaveAttribute('data-tv-state', 'ready', { timeout: 20000 })
  await navigateGame(page, 'next')
  await gate.requested
  await page.goto('about:blank')
  gate.release()
  await page.waitForTimeout(200)
  expect(errors).toEqual([])
})
