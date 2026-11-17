import { expect, test } from '@playwright/test';

type Draw = { phase: string; participants: { instanceId: string; modelId: string; position: [number, number, number]; scale: [number, number, number] }[] };

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
  test(`two entries ${direction} use separate repeated occurrences`, async ({ page }) => {
    const requests: string[] = [];
    page.on('request', request => {
      if (/fixtures\/[ab]\.glb/.test(request.url())) requests.push(request.url());
    });
    await page.goto('/tests/acceptance/index.html?catalog=two');
    await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
    await expect.poll(async () => page.evaluate(() => (window.__ACCEPTANCE__!.presentationDraws as unknown as Draw[]).at(-1)?.participants.length)).toBe(3);
    const initial = await page.evaluate(() => (window.__ACCEPTANCE__!.presentationDraws as unknown as Draw[]).at(-1)!);
    expect(initial.participants.map(p => p.modelId).sort()).toEqual(['fixture-a', 'fixture-b', 'fixture-b']);
    expect(new Set(initial.participants.map(p => p.instanceId)).size).toBe(3);
    expect(initial.participants.find(p => p.modelId === 'fixture-a' && p.position[0] === 0)!.scale[0]).toBeCloseTo(2.2, 6);
    for (const neighbor of initial.participants.filter(p => p.modelId === 'fixture-b')) {
      expect(neighbor.scale[0]).toBeCloseTo(2.2 * 0.75, 6);
    }
    const loadedRequests = requests.length;
    await page.evaluate(() => window.__ACCEPTANCE__!.reset());
    await page.getByRole('button', { name: `${direction} project` }).click();
    await expect(page.locator('.project-title')).toContainText('Beta');
    await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
    const draws = await page.evaluate(() => window.__ACCEPTANCE__!.presentationDraws as unknown as Draw[]);
    const moving = draws.filter(d => d.phase === 'moving');
    expect(moving.length).toBeGreaterThan(1);
    for (const draw of moving) {
      expect(draw.participants).toHaveLength(4);
      expect(new Set(draw.participants.map(p => p.instanceId)).size).toBe(4);
      expect(draw.participants.every(p => p.position[1] === 0 && p.position[2] <= 0)).toBe(true);
    }
    const rest = draws.filter(d => d.phase === 'ready').at(-1)!;
    expect(rest.participants.map(p => p.modelId).sort()).toEqual(['fixture-a', 'fixture-a', 'fixture-b']);
    expect(new Set(rest.participants.map(p => p.instanceId)).size).toBe(3);
    expect(rest.participants.find(p => p.modelId === 'fixture-b' && p.position[0] === 0)!.scale[0]).toBeCloseTo(2.2, 6);
    for (const neighbor of rest.participants.filter(p => p.modelId === 'fixture-a')) {
      expect(neighbor.scale[0]).toBeCloseTo(2.2 * 0.75, 6);
    }
    expect(requests.length).toBe(loadedRequests);
  });
}

test('skinned duplicate occurrences use independent skeletons and shared geometry', async ({ page }) => {
  await page.goto('/tests/acceptance/index.html?catalog=skinned-two');
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  await expect.poll(async () => page.evaluate(() => window.__ACCEPTANCE__!.presentationDraws.at(-1)?.participants.filter(p => p.modelId === 'fixture-skinned').length)).toBe(2);
  const copies = await page.evaluate(() => window.__ACCEPTANCE__!.presentationDraws.at(-1)!.participants.filter(p => p.modelId === 'fixture-skinned'));
  expect(copies[0].skeletonIds).toHaveLength(1);
  expect(copies[1].skeletonIds).toHaveLength(1);
  expect(copies[0].skeletonIds[0]).not.toBe(copies[1].skeletonIds[0]);
  expect(copies[0].geometryIds).toEqual(copies[1].geometryIds);
  for (const mode of ['Clay', 'Wireframe', 'Rendered']) {
    await page.getByRole('button', { name: mode, exact: true }).click();
    await page.getByRole('button', { name: 'Next project' }).click();
    await expect(page.locator('.project-title')).toContainText('Skinned');
    await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
    await page.getByRole('button', { name: 'Previous project' }).click();
    await expect(page.locator('.project-title')).toContainText('Alpha');
    await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  }
  await expect(page.locator('.viewer-stage')).toHaveAttribute('data-state', 'ready');
  const beforeUnmount = await page.evaluate(() => ({
    visible: window.__ACCEPTANCE__!.presentationDraws.at(-1)!.participants.filter(p => p.modelId === 'fixture-skinned'),
    disposed: window.__ACCEPTANCE__!.disposedOccurrences.slice(),
  }));
  await page.evaluate(() => window.__ACCEPTANCE__!.setCatalog([]));
  await expect(page.locator('.model-canvas')).toHaveCount(0);
  await expect.poll(async () => page.evaluate(() => window.__ACCEPTANCE__!.disposedOccurrences.length)).toBeGreaterThan(beforeUnmount.disposed.length);
  const disposed = await page.evaluate(() => window.__ACCEPTANCE__!.disposedOccurrences);
  expect(new Set(disposed.map(entry => entry.instanceId)).size).toBe(disposed.length);
  expect(disposed.some(entry => beforeUnmount.visible.some(item => item.instanceId === entry.instanceId) && entry.skeletonIds.length === 1)).toBe(true);
});

test('three-entry wrap uses separate entering and exiting occurrences', async ({ page }) => {
  await page.goto('/tests/acceptance/index.html');
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  await page.evaluate(() => window.__ACCEPTANCE__!.reset());
  await page.getByRole('button', { name: 'Next project' }).click();
  await expect(page.locator('.project-title')).toContainText('Beta');
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  const draws = await page.evaluate(() => window.__ACCEPTANCE__!.presentationDraws as unknown as Draw[]);
  const moving = draws.filter(d => d.phase === 'moving');
  expect(moving.length).toBeGreaterThan(1);
  for (const draw of moving) {
    const copies = draw.participants.filter(p => p.modelId === 'fixture-c');
    expect(copies).toHaveLength(2);
    expect(new Set(copies.map(p => p.instanceId)).size).toBe(2);
    expect(copies.every(p => p.position[2] <= 0)).toBe(true);
  }
  for (const item of moving[0].participants) {
    const path = moving.map(d => d.participants.find(p => p.instanceId === item.instanceId)!.position[0]);
    expect(path.at(-1)!).toBeLessThan(path[0]);
    for (let i = 1; i < path.length; i++) expect(path[i]).toBeLessThanOrEqual(path[i - 1] + 1e-6);
  }
});
