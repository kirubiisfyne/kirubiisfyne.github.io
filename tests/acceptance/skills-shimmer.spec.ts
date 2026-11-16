import { expect, test } from '@playwright/test';

test('skill artwork shimmers locally and restores on exit', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.skill-viewport').first().focus();
  await page.keyboard.press('Space');
  await page.mouse.move(1, 1);
  const art = page.locator('.skill-cycle').first().locator('.skill-art').nth(1);
  await art.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const original = await art.textContent();
  const bounds = (await art.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await expect.poll(() => art.textContent()).not.toBe(original);
  const changed = (await art.textContent())!;
  expect(changed.length).toBe(original!.length);
  for (let i = 0; i < changed.length; i++) {
    if (original![i] === ' ' || original![i] === '\n') expect(changed[i]).toBe(original![i]);
  }
  await page.waitForTimeout(100);
  expect(await art.textContent()).toBe(changed);
  await page.mouse.move(1, 1);
  await page.waitForTimeout(200);
  const returning = await art.textContent();
  expect(returning).not.toBe(changed);
  await expect(art).toHaveText(original!);
});

test('reduced motion keeps original skill artwork', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const art = page.locator('.skill-art').first();
  await art.scrollIntoViewIfNeeded();
  const original = await art.textContent();
  const bounds = (await art.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.waitForTimeout(200);
  expect(await art.textContent()).toBe(original);
});
