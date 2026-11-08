import { expect, test } from '@playwright/test'
import { showcaseUrl, useTvTransform } from './game-showcase-fixtures'

test('additional catalog entry participates without component registration', async ({ page }) => {
  await page.goto(showcaseUrl('extended'))
  await page.getByRole('button', { name: 'Previous' }).click()
  await expect(page.getByRole('heading', { name: 'Fixture Extra Game' })).toBeVisible()
  await expect(page.locator('[aria-live="polite"]').filter({ hasText: 'Fixture Extra Game' })).toHaveText('Fixture Extra Game, 3 of 3')
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByRole('heading', { name: 'KonTEXTo' })).toBeVisible()
})

test('authored position, rotation, and scale each affect the TV', async ({ page }) => {
  const original = { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] } as const
  const variants = [
    { ...original, position: [0.1, 0, 0] as const },
    { ...original, rotation: [0, 25, 0] as const },
    { ...original, scale: [0.7, 0.7, 0.7] as const },
  ]
  async function capture() {
    await page.goto(showcaseUrl())
    await expect(page.locator('[data-tv-state]')).toHaveAttribute('data-tv-state', 'ready', { timeout: 20000 })
    return page.locator('.tv-canvas').screenshot()
  }
  const baseline = await capture()
  for (const variant of variants) {
    await useTvTransform(page, variant)
    const changed = await capture()
    expect(changed.equals(baseline)).toBe(false)
    await page.unroute('**/src/data/tv-transform.ts*')
  }
})
