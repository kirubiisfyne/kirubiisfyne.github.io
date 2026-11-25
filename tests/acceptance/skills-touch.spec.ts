import { expect, test } from '@playwright/test';

test.use({ hasTouch: true });

test('touch drag moves a belt and tapping pauses it', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const viewport = page.locator('.skill-viewport').first();
  await viewport.scrollIntoViewIfNeeded();
  const bounds = (await viewport.boundingBox())!;
  const x = bounds.x + bounds.width * 0.7;
  const y = bounds.y + bounds.height / 2;
  await page.touchscreen.tap(x, y);
  await expect(viewport).toHaveAttribute('aria-label', 'Tech Stack skills conveyor, paused');
  const track = viewport.locator('.skill-track');
  const position = () => track.evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).m41);
  const before = await position();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 80, y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  expect(await position()).toBeLessThan(before - 50);
  await expect(viewport).toHaveAttribute('aria-label', 'Tech Stack skills conveyor, paused');
});
