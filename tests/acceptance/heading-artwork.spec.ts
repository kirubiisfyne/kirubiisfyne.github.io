import { expect, test } from '@playwright/test'
import { technicalBreakdownsAscii, technicalBreakdownsShortAscii } from '../../src/data/heading-artwork'

test('technical breakdowns artwork fits without scrolling and titles are bold', async ({ page }) => {
  for (const [width, height] of [[1280, 832], [375, 812], [320, 812], [760, 812], [761, 812], [812, 375]]) {
    await page.setViewportSize({ width, height })
    await page.goto('http://127.0.0.1:5489/game-dev/')
    await page.evaluate(() => document.fonts.ready)
    const heading = page.locator('#technical-breakdowns-heading')
    const artwork = heading.locator('xpath=preceding-sibling::*[1]')
    const text = artwork.locator('pre:visible')
    await expect(artwork).toHaveAttribute('aria-hidden', 'true')
    await expect(artwork).not.toHaveAttribute('tabindex')
    await expect(text).toHaveText(width <= 760 ? technicalBreakdownsShortAscii : technicalBreakdownsAscii)
    expect(await artwork.evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(await artwork.evaluate((element) => element.clientWidth))
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    for (const title of [heading, page.getByRole('heading', { name: 'Anii! Grow to Know' }), page.getByRole('heading', { name: 'KonTEXTo' }).first()]) {
      await expect(title).toHaveCSS('font-weight', '700')
    }
  }
})
