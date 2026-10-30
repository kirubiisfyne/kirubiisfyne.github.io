import { expect, test } from '@playwright/test';
import { holdModelLoad } from './load-gate';

type Draw = { phase: string; participants: { modelId: string }[] };
const fixture = (id: string) => `/tests/support/fixtures/${id}.glb`;

test('held adjacent load does not block center and joins without announcement', async ({ page }) => {
  const gate = await holdModelLoad(page, fixture('b'));
  await page.goto('/tests/acceptance/index.html?catalog=four');
  await gate.requested;
  await expect(page.locator('.project-title')).toHaveText('[ Fixture Model Alpha ]');
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  await expect.poll(async () => page.evaluate(() => (window.__ACCEPTANCE__!.presentationDraws as unknown as Draw[]).at(-1)?.participants.map(p => p.modelId).sort())).toEqual(['fixture-a', 'fixture-d']);
  await page.evaluate(() => window.__ACCEPTANCE__!.reset());
  gate.release();
  await expect.poll(async () => page.evaluate(() => (window.__ACCEPTANCE__!.presentationDraws as unknown as Draw[]).at(-1)?.participants.map(p => p.modelId).sort())).toEqual(['fixture-a', 'fixture-b', 'fixture-d']);
  expect(await page.evaluate(() => window.__ACCEPTANCE__!.observedMutations.filter(m => m.type === 'position'))).toHaveLength(0);
});

test('neighbor released during movement joins only at rest', async ({ page }) => {
  const gate = await holdModelLoad(page, fixture('c'));
  await page.goto('/tests/acceptance/index.html?catalog=four');
  await gate.requested;
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  await page.evaluate(() => window.__ACCEPTANCE__!.reset());
  await page.getByRole('button', { name: 'Previous project' }).click();
  await expect.poll(async () => page.evaluate(() => (window.__ACCEPTANCE__!.presentationDraws as unknown as Draw[]).some(d => d.phase === 'moving'))).toBe(true);
  const response = page.waitForResponse(result => result.url().endsWith('/c.glb'));
  gate.release();
  await response;
  await expect(page.locator('.project-title')).toHaveText('[ Fixture Model Delta ]');
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  await expect.poll(async () => page.evaluate(() => (window.__ACCEPTANCE__!.presentationDraws as unknown as Draw[]).at(-1)?.participants.map(p => p.modelId).sort())).toEqual(['fixture-a', 'fixture-c', 'fixture-d']);
  const draws = await page.evaluate(() => window.__ACCEPTANCE__!.presentationDraws as unknown as Draw[]);
  expect(draws.filter(d => d.phase === 'moving').every(d => !d.participants.some(p => p.modelId === 'fixture-c'))).toBe(true);
  const announcements = await page.evaluate(() => window.__ACCEPTANCE__!.observedMutations.filter(m => m.type === 'position'));
  expect(announcements).toHaveLength(1);
  expect(announcements[0].value).toContain('Delta');
});

test('late nonadjacent load remains hidden', async ({ page }) => {
  const gate = await holdModelLoad(page, fixture('b'));
  await page.goto('/tests/acceptance/index.html?catalog=four');
  await gate.requested;
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  await page.getByRole('button', { name: 'Previous project' }).click();
  await expect(page.locator('.project-title')).toHaveText('[ Fixture Model Delta ]');
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  await page.evaluate(() => window.__ACCEPTANCE__!.reset());
  const response = page.waitForResponse(result => result.url().endsWith('/b.glb'));
  gate.release();
  await response;
  await page.waitForTimeout(200);
  const draws = await page.evaluate(() => window.__ACCEPTANCE__!.presentationDraws as unknown as Draw[]);
  expect(draws.length).toBeGreaterThan(0);
  expect(draws.every(d => !d.participants.some(p => p.modelId === 'fixture-b'))).toBe(true);
  expect(await page.evaluate(() => window.__ACCEPTANCE__!.observedMutations.filter(m => m.type === 'position'))).toHaveLength(0);
});

test('selected held destination shows loading and can be superseded', async ({ page }) => {
  const gate = await holdModelLoad(page, fixture('b'));
  await page.goto('/tests/acceptance/index.html?catalog=four');
  await gate.requested;
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  await page.getByRole('button', { name: 'Next project' }).click();
  await expect(page.locator('.viewer-stage')).toHaveAttribute('data-state', 'loading');
  await expect(page.locator('canvas')).toHaveAttribute('aria-label', '3D model loading');
  await page.getByRole('button', { name: 'Next project' }).click();
  await expect(page.locator('.project-title')).toHaveText('[ Fixture Model Gamma ]');
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  gate.release();
  await expect(page.locator('.carousel-position')).toContainText('Gamma');
  expect(await page.evaluate(() => window.__ACCEPTANCE__!.observedMutations.filter(m => m.type === 'position' && m.value.includes('Beta')))).toHaveLength(0);
});

test('failed adjacent load is isolated until selected, then onward navigation works', async ({ page }) => {
  const gate = await holdModelLoad(page, fixture('b'));
  await page.goto('/tests/acceptance/index.html?catalog=four');
  await gate.requested;
  gate.fail();
  await expect(page.locator('.project-title')).toHaveText('[ Fixture Model Alpha ]');
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  await page.getByRole('button', { name: 'Next project' }).click();
  await expect(page.locator('.viewer-stage')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('.viewer-message')).toContainText('Fixture Model Beta');
  await expect(page.locator('.carousel-position')).not.toContainText('Beta');
  await page.getByRole('button', { name: 'Next project' }).click();
  await expect(page.locator('.project-title')).toHaveText('[ Fixture Model Gamma ]');
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
});

for (const mode of ['rendered', 'clay', 'wireframe'] as const) {
  test(`preview validation failure in ${mode} does not fail center`, async ({ page }) => {
    const gate = await holdModelLoad(page, fixture('b'));
    await page.goto('/tests/acceptance/index.html?catalog=four');
    await gate.requested;
    await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
    await page.evaluate(mode => (window.__ACCEPTANCE__ as unknown as { failPreview: (id: string, mode: string) => void }).failPreview('fixture-b', mode), mode);
    if (mode !== 'rendered') await page.getByRole('button', { name: mode === 'clay' ? 'Clay' : 'Wireframe', exact: true }).click();
    const response = page.waitForResponse(result => result.url().endsWith('/b.glb'));
    gate.release();
    await response;
    await page.waitForTimeout(200);
    await expect(page.locator('.viewer-stage')).not.toHaveAttribute('data-state', 'error');
    await expect(page.locator('.project-title')).toHaveText('[ Fixture Model Alpha ]');
    const draws = await page.evaluate(() => window.__ACCEPTANCE__!.presentationDraws as unknown as Draw[]);
    expect(draws.at(-1)!.participants.some(p => p.modelId === 'fixture-b')).toBe(false);
  });
}
test('candidate draw failure does not announce success and allows onward navigation', async ({ page }) => {
  await page.goto('/tests/acceptance/index.html?catalog=four');
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  await page.evaluate(() => {
    window.__ACCEPTANCE__!.reset();
    const controls = window.__ACCEPTANCE__ as unknown as { failCandidate: (id: string, mode: string) => void };
    controls.failCandidate('fixture-b', 'rendered');
  });
  await page.getByRole('button', { name: 'Next project' }).click();
  await expect(page.locator('.viewer-stage')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('.viewer-message')).toContainText('Fixture Model Beta');
  expect(await page.evaluate(() => window.__ACCEPTANCE__!.observedMutations.filter(m => m.type === 'position' && m.value.includes('Beta')))).toHaveLength(0);
  await page.getByRole('button', { name: 'Next project' }).click();
  await expect(page.locator('.project-title')).toHaveText('[ Fixture Model Gamma ]');
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
});


test('context loss is terminal', async ({ page }) => {
  await page.goto('/tests/acceptance/index.html');
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  await page.locator('.model-canvas').evaluate(canvas => (canvas as HTMLCanvasElement).getContext('webgl2')!.getExtension('WEBGL_lose_context')!.loseContext());
  await expect(page.locator('.viewer-stage')).toHaveAttribute('data-state', 'unavailable');
  await expect(page.locator('.viewer-message')).toBeVisible();
  await expect(page.locator('.viewer-message')).toContainText('The graphics context was lost. Reload the page to view models again.');
  await expect(page.getByRole('button', { name: 'Clay', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Next project' }).click();
  await expect(page.locator('.viewer-stage')).toHaveAttribute('data-state', 'unavailable');
  await expect(page.locator('.viewer-message')).toContainText('Fixture Model Beta');
});
