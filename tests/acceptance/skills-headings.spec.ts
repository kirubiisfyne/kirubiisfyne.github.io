import { expect, test } from '@playwright/test';

test('skill heading highlights and subtitles retain their layout', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);

  const headings = page.locator('.skills-main-heading, .skills-category-heading');
  await expect(headings).toHaveCount(3);
  for (const heading of await headings.all()) {
    const layout = await heading.evaluate((element) => {
      const bar = element.querySelector<HTMLElement>('[aria-hidden="true"]')!;
      const art = bar.querySelector<HTMLElement>('pre')!;
      const subtitle = element.querySelector<HTMLElement>('h2, h3')!;
      const barBox = bar.getBoundingClientRect();
      const artBox = art.getBoundingClientRect();
      const subtitleBox = subtitle.getBoundingClientRect();
      return {
        barWidth: barBox.width,
        artWidth: artBox.width,
        gap: subtitleBox.top - barBox.bottom,
        lineHeight: parseFloat(getComputedStyle(art).lineHeight),
        fontSize: parseFloat(getComputedStyle(art).fontSize),
      };
    });
    expect(Math.abs(layout.barWidth - layout.artWidth)).toBeLessThan(2);
    expect(layout.gap).toBeGreaterThanOrEqual(8);
    expect(layout.lineHeight / layout.fontSize).toBeCloseTo(4 / 3, 2);
  }

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
});
