import { expect, test } from '@playwright/test';

test('project headings keep Figma highlight and subtitle spacing', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);

  for (const id of ['art', 'game-showcase-heading']) {
    const layout = await page.locator(`#${id}`).evaluate((subtitle) => {
      const container = subtitle.parentElement!;
      const bar = container.firstElementChild!.getBoundingClientRect();
      const label = subtitle.getBoundingClientRect();
      const description = container.querySelector('p')!.getBoundingClientRect();
      return { barHeight: bar.height, labelGap: label.top - bar.bottom, descriptionGap: description.top - label.bottom, descriptionHeight: description.height };
    });
    expect(layout.barHeight).toBeCloseTo(32, 0);
    expect(layout.labelGap).toBeCloseTo(10, 0);
    expect(layout.descriptionGap).toBeCloseTo(10, 0);
    expect(layout.descriptionHeight).toBeGreaterThanOrEqual(48);
  }

  const gameArt = page.locator('.game-showcase .game-dev-artwork pre');
  await expect(gameArt).toHaveCSS('line-height', '16px');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
});
