import { expect, test } from '@playwright/test';

test('three slots wrap across five entries without duplicate resting occurrences', async ({ page }) => {
  await page.goto('/tests/acceptance/index.html?catalog=green-five&start=4');
  const check = async (center: number) => {
    await expect(page.locator('.project-title')).toHaveText(`[ Green ${center} ]`);
    await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
    const expected = [-1, 0, 1].map(offset => `green-${(center + offset + 10) % 5}`);
    await expect.poll(async () => page.evaluate(() => window.__ACCEPTANCE__!.presentationDraws.at(-1)?.participants.slice().sort((a, b) => a.position[0] - b.position[0]).map(p => p.modelId))).toEqual(expected);
  };
  await check(4);
  await page.evaluate(() => window.__ACCEPTANCE__!.reset());
  await page.getByRole('button', { name: 'Next project' }).click();
  await check(0);
  const moving = await page.evaluate(() => window.__ACCEPTANCE__!.presentationDraws.filter(draw => draw.phase === 'moving'));
  expect(moving.length).toBeGreaterThan(0);
  for (const draw of moving) {
    expect(draw.participants).toHaveLength(4);
    expect(new Set(draw.participants.map(p => p.instanceId)).size).toBe(4);
    expect(new Set(draw.participants.map(p => p.modelId)).size).toBe(4);
  }
  await page.getByRole('button', { name: 'Previous project' }).click();
  await check(4);
});
