import { expect, test } from '@playwright/test'
import { navigateGame, showcaseUrl } from './game-showcase-fixtures'

test('Strict Mode replay and repeated mount, navigation, and unmount stay clean', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto(`${showcaseUrl()}&lifecycle=1`)
  const toggle = page.getByRole('button', { name: 'Toggle showcase' })
  for (let cycle = 0; cycle < 3; cycle++) {
    await expect(page.locator('[data-tv-state]')).toHaveAttribute('data-tv-state', 'ready', { timeout: 20000 })
    await expect(page.locator('canvas')).toHaveCount(1)
    await page.locator('canvas').evaluate((canvas) => {
      ;(window as unknown as { previousTvContext: WebGL2RenderingContext | null }).previousTvContext = (canvas as HTMLCanvasElement).getContext('webgl2')
    })
    for (let step = 0; step < 4; step++) await navigateGame(page, 'next')
    await expect(page.getByRole('heading', { name: 'KonTEXTo' })).toBeVisible()
    await toggle.click()
    await expect(page.locator('canvas')).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => (window as unknown as { previousTvContext: WebGL2RenderingContext | null }).previousTvContext?.isContextLost())).toBe(true)
    await toggle.click()
  }
  await expect(page.locator('[data-tv-state]')).toHaveAttribute('data-tv-state', 'ready', { timeout: 20000 })
  await expect(page.locator('canvas')).toHaveCount(1)
  expect(errors).toEqual([])
})
