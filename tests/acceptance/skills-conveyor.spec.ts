import { expect, test } from '@playwright/test';
import { skillGroups } from '../../src/data/skills';

test('stack belts move, dissolve at edges, pause and resume without duplicate accessible skills', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const viewport = page.locator('.skill-viewport').first();
  await viewport.scrollIntoViewIfNeeded();
  const track = viewport.locator('.skill-track');
  const position = () => track.evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).m41);
  await expect.poll(async () => {
    const first = await position();
    await page.waitForTimeout(150);
    return (await position()) < first;
  }).toBe(true);

  await viewport.focus();
  await page.keyboard.press('Space');
  await expect(viewport).toHaveAttribute('aria-label', 'Tech Stack skills conveyor, paused');
  await page.mouse.move(1, 1);
  await viewport.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const stopped = await position();
  await page.waitForTimeout(250);
  expect(await position()).toBeCloseTo(stopped, 2);
  expect(await viewport.evaluate((element) => getComputedStyle(element).maskImage)).toContain('gradient');
  const first = viewport.locator('.skill-cycle').first();
  expect(await first.locator('.skill-art').first().textContent()).not.toBe(skillGroups[0].items[0].art);
  expect(await first.locator('.skill-art').nth(1).textContent()).toBe(skillGroups[0].items[1].art);
  expect(await viewport.locator('[data-skill-copy]').count()).toBeGreaterThan(0);
  await expect(page.getByRole('listitem').filter({ hasText: 'Unity — Game Engines' })).toHaveCount(1);
  const bounds = (await viewport.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width * 0.7, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * 0.4, bounds.y + bounds.height / 2, { steps: 5 });
  await page.mouse.up();
  const dragged = await position();
  expect(dragged).toBeLessThan(stopped - 30);
  await viewport.focus();
  await page.keyboard.press('ArrowRight');
  expect(await position()).toBeLessThan(dragged - 50);
  await page.keyboard.press('Space');
  await expect(viewport).toHaveAttribute('aria-label', 'Tech Stack skills conveyor, moving');
  const resumed = await position();
  await expect.poll(position).toBeLessThan(resumed);
});

test('reduced motion exposes all skills in a stationary unmasked layout', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole('button', { name: /skill motion/i })).toHaveCount(0);
  const viewports = page.locator('.skill-viewport');
  await expect(viewports).toHaveCount(2);
  for (const viewport of await viewports.all()) {
    await expect(viewport).toHaveAttribute('tabindex', '-1');
    expect(await viewport.evaluate((element) => getComputedStyle(element).maskImage)).toBe('none');
    await expect(viewport.locator('[data-skill-copy]')).toHaveCount(0);
    await expect(viewport.locator('.skill-track')).toHaveCSS('transform', 'none');
  }
  for (const group of skillGroups) {
    for (const skill of group.items) {
      await expect(page.getByRole('listitem').filter({ hasText: `${skill.name} — ${group.title}` })).toHaveCount(1);
    }
  }
});
