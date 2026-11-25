import { expect, test } from '@playwright/test'

const origin = 'http://127.0.0.1:5489'

test('site navigation, direct entries, history, and sticky header', async ({ page }) => {
  await page.goto(`${origin}/game-dev/`)
  const navigation = page.getByRole('navigation', { name: 'Main navigation' })
  await expect(page.getByRole('heading', { name: '[ Game Dev ]' })).toBeVisible()
  await expect(navigation.getByRole('link', { name: 'Game Dev' })).toHaveAttribute('aria-current', 'page')
  await page.reload()
  await expect(page.getByRole('heading', { name: '[ Game Dev ]' })).toBeVisible()
  for (const [link, heading] of [['3D Art', '[ 3D Art ]'], ['Graphic Design', '[ Graphic Design ]']] as const) {
    await navigation.getByRole('link', { name: link }).click()
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
    await expect(navigation.getByRole('link', { name: link })).toHaveAttribute('aria-current', 'page')
  }
  await page.goBack()
  await expect(page.getByRole('heading', { name: '[ 3D Art ]', exact: true })).toBeVisible()
  await page.getByRole('link', { name: '[ kirubiisfyne ]' }).click()
  await expect(navigation.getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page')
  await page.evaluate(() => window.scrollTo(0, 800))
  await expect.poll(async () => page.locator('.site-header').evaluate((element) => Math.round(element.getBoundingClientRect().top))).toBe(0)
  await expect(page.getByRole('contentinfo')).toHaveCount(1)
  await page.goto(`${origin}/development/`)
  await expect(page).toHaveURL(/\/game-dev\/$/)
})

test('navigation fits narrow screens and has visible keyboard focus', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 812 })
  await page.goto(`${origin}/3d-art/`)
  const links = page.locator('.site-header-inner').getByRole('link')
  await expect(links).toHaveCount(5)
  const boxes = await links.evaluateAll((elements) => elements.map((element) => {
    const { left, right } = element.getBoundingClientRect()
    return { left, right }
  }))
  for (const box of boxes) {
    expect(box.left).toBeGreaterThanOrEqual(0)
    expect(box.right).toBeLessThanOrEqual(320)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: '[ kirubiisfyne ]' })).toBeFocused()
  await expect(page.getByRole('link', { name: '[ kirubiisfyne ]' })).toHaveCSS('outline-style', 'solid')
})
