import { expect, test } from '@playwright/test';

type Draw = { phase: string; participants: { modelId: string; position: [number, number, number] }[] };

test('empty catalog mounts no viewer', async ({ page }) => {
  await page.goto('/tests/acceptance/index.html?catalog=empty');
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Next project' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Previous project' })).toBeDisabled();
});

test('single catalog has one presentation and disabled navigation', async ({ page }) => {
  await page.goto('/tests/acceptance/index.html?catalog=single');
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  await expect(page.getByRole('button', { name: 'Next project' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Previous project' })).toBeDisabled();
  await expect.poll(async () => page.evaluate(() => (window.__ACCEPTANCE__!.presentationDraws as unknown as Draw[]).at(-1)?.participants.map(p => p.modelId))).toEqual(['fixture-a']);
});

for (const direction of ['Next', 'Previous'] as const) {
  test(`two entries ${direction} use distinct participants and right-only rest`, async ({ page }) => {
    await page.goto('/tests/acceptance/index.html?catalog=two');
    await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
    await expect.poll(async () => page.evaluate(() => (window.__ACCEPTANCE__!.presentationDraws as unknown as Draw[]).at(-1)?.participants.length)).toBe(2);
    await page.evaluate(() => window.__ACCEPTANCE__!.reset());
    await page.getByRole('button', { name: `${direction} project` }).click();
    await expect(page.locator('.project-title')).toContainText('Beta');
    await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
    const draws = await page.evaluate(() => window.__ACCEPTANCE__!.presentationDraws as unknown as Draw[]);
    for (const draw of draws) expect(new Set(draw.participants.map(p => p.modelId)).size).toBe(draw.participants.length);
    const moving = draws.filter(d => d.phase === 'moving');
    expect(moving.length).toBeGreaterThan(1);
    if (direction === 'Previous') {
      const neighborPath = moving.map(d => d.participants.find(p => p.modelId === 'fixture-b')).filter(p => p !== undefined);
      expect(neighborPath.some(p => p.position[0] < 0)).toBe(true);
      expect(neighborPath.some(p => p.position[2] < -1.2)).toBe(true);
    }
    const rest = draws.filter(d => d.phase === 'ready').at(-1)!;
    expect(rest.participants.map(p => p.modelId).sort()).toEqual(['fixture-a', 'fixture-b']);
    expect(rest.participants.find(p => p.modelId === 'fixture-a')!.position[0]).toBeGreaterThan(rest.participants.find(p => p.modelId === 'fixture-b')!.position[0]);
  });
}

test('three-entry shared neighbor crosses once through the rear', async ({ page }) => {
  await page.goto('/tests/acceptance/index.html');
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  await page.evaluate(() => window.__ACCEPTANCE__!.reset());
  await page.getByRole('button', { name: 'Next project' }).click();
  await expect(page.locator('.project-title')).toContainText('Beta');
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  const draws = await page.evaluate(() => window.__ACCEPTANCE__!.presentationDraws as unknown as Draw[]);
  for (const draw of draws) expect(new Set(draw.participants.map(p => p.modelId)).size).toBe(draw.participants.length);
  const path = draws.filter(d => d.phase === 'moving').map(d => d.participants.find(p => p.modelId === 'fixture-c')).filter(p => p !== undefined);
  expect(path.length).toBeGreaterThan(1);
  expect(path[0].position[0]).toBeLessThan(0);
  expect(path.at(-1)!.position[0]).toBeGreaterThan(0);
  expect(Math.min(...path.map(p => p.position[2]))).toBeLessThan(-1.2);
});
