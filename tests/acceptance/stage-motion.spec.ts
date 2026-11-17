import { expect, test } from '@playwright/test';

type Participant = { instanceId: string; modelId: string; position: [number, number, number]; scale: [number, number, number]; pose: [number, number] };
type Draw = { phase: string; timestamp: number; progress: number | null; cameraDistance: number; participants: Participant[] };

for (const direction of ['Next', 'Previous'] as const) {
  test(`${direction} slides participants horizontally and preserves mode`, async ({ page }) => {
    await page.goto('/tests/acceptance/index.html?catalog=four');
    await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
    await page.getByRole('button', { name: 'Clay', exact: true }).click();
    const incoming = direction === 'Next' ? 'fixture-b' : 'fixture-d';
    await expect.poll(async () => page.evaluate(() => (window.__ACCEPTANCE__!.presentationDraws as unknown as Draw[]).at(-1)?.participants.length)).toBe(3);
    const initial = await page.evaluate(() => (window.__ACCEPTANCE__!.presentationDraws as unknown as Draw[]).at(-1)!);
    const initialPose = initial.participants.find(p => p.modelId === incoming)!.pose;
    await page.evaluate(() => window.__ACCEPTANCE__!.reset());
    await page.getByRole('button', { name: `${direction} project` }).click();
    await expect(page.locator('.project-title')).toContainText(direction === 'Next' ? 'Beta' : 'Delta');
    await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
    await expect(page.getByRole('button', { name: 'Clay', exact: true })).toHaveAttribute('aria-pressed', 'true');
    const draws = await page.evaluate(() => window.__ACCEPTANCE__!.presentationDraws as unknown as Draw[]);
    const moving = draws.filter(d => d.phase === 'moving' && d.participants?.some(p => p.modelId === incoming));
    expect(moving.length).toBeGreaterThan(1);
    for (const draw of draws) {
      expect(new Set(draw.participants.map(p => p.instanceId)).size).toBe(draw.participants.length);
      for (const participant of draw.participants) {
        expect(participant.position[1]).toBeCloseTo(0, 6);
        expect(participant.position[2]).toBe(0);
        expect(participant.scale[0]).toBeGreaterThanOrEqual(2.2 * 0.75 - 1e-6);
        expect(participant.scale[0]).toBeLessThanOrEqual(2.2 + 1e-6);
        expect(participant.scale[1]).toBeCloseTo(participant.scale[0], 6);
        expect(participant.scale[2]).toBeCloseTo(participant.scale[0], 6);
      }
    }
    expect(moving.some(d => d.participants.length === 4)).toBe(true);
    const first = moving[0];
    const last = moving[moving.length - 1];
    const find = (d: Draw, id: string) => d.participants.find(p => p.modelId === id)!;
    const sign = direction === 'Next' ? 1 : -1;
    expect(sign * find(first, incoming).position[0]).toBeGreaterThan(sign * find(last, incoming).position[0]);
    expect(sign * find(first, 'fixture-a').position[0]).toBeGreaterThan(sign * find(last, 'fixture-a').position[0]);
    expect(find(last, incoming).scale[0]).toBeGreaterThan(find(first, incoming).scale[0]);
    expect(find(last, 'fixture-a').scale[0]).toBeLessThan(find(first, 'fixture-a').scale[0]);
    for (let i = 1; i < moving.length; i++) {
      expect(find(moving[i], incoming).scale[0]).toBeGreaterThanOrEqual(find(moving[i - 1], incoming).scale[0] - 1e-6);
      expect(find(moving[i], 'fixture-a').scale[0]).toBeLessThanOrEqual(find(moving[i - 1], 'fixture-a').scale[0] + 1e-6);
    }
    const final = draws.slice(draws.lastIndexOf(last) + 1).find(d => d.phase === 'ready' && d.participants.some(p => p.modelId === incoming));
    expect(final).toBeDefined();
    expect(find(final!, incoming).pose).toEqual(initialPose);
    expect(final!.cameraDistance).toBeCloseTo(initial.cameraDistance, 6);
    expect(moving.every(d => Math.abs(d.cameraDistance - initial.cameraDistance) < 1e-6)).toBe(true);
    const outgoingPositions = moving.map(d => sign * find(d, 'fixture-a').position[0]);
    expect(outgoingPositions.at(-1)!).toBeLessThan(outgoingPositions[0]);
    for (let i = 1; i < outgoingPositions.length; i++) {
      expect(outgoingPositions[i]).toBeLessThanOrEqual(outgoingPositions[i - 1] + 1e-6);
    }
    const incomingPositions = moving.map(d => sign * find(d, incoming).position[0]);
    expect(incomingPositions.at(-1)!).toBeGreaterThanOrEqual(0);
    expect(incomingPositions.at(-1)!).toBeLessThan(incomingPositions[0]);
  });
}

test('resize preserves normalized movement progress', async ({ page }) => {
  await page.goto('/tests/acceptance/index.html?catalog=four');
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  await page.evaluate(() => window.__ACCEPTANCE__!.reset());
  await page.getByRole('button', { name: 'Next project' }).click();
  await expect.poll(async () => page.evaluate(() => (window.__ACCEPTANCE__!.presentationDraws as unknown as Draw[]).some(d => d.phase === 'moving'))).toBe(true);
  await page.setViewportSize({ width: 700, height: 700 });
  await expect(page.locator('.project-title')).toContainText('Beta');
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  const progress = await page.evaluate(() => (window.__ACCEPTANCE__!.presentationDraws as unknown as Draw[]).filter(d => d.phase === 'moving' && d.progress !== null).map(d => d.progress!));
  expect(progress.length).toBeGreaterThan(1);
  for (let i = 1; i < progress.length; i++) expect(progress[i]).toBeGreaterThanOrEqual(progress[i - 1]);
});

test('simulated hidden visibility freezes and resumes movement progress', async ({ page }) => {
  await page.goto('/tests/acceptance/index.html?catalog=four');
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  await page.evaluate(() => window.__ACCEPTANCE__!.reset());
  await page.getByRole('button', { name: 'Next project' }).click();
  await expect.poll(async () => page.evaluate(() => (window.__ACCEPTANCE__!.presentationDraws as unknown as Draw[]).some(d => d.phase === 'moving'))).toBe(true);
  const frozen = await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    const draws = window.__ACCEPTANCE__!.presentationDraws as unknown as Draw[];
    return { count: draws.length, progress: draws.filter(d => d.phase === 'moving').at(-1)!.progress! };
  });
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.__ACCEPTANCE__!.presentationDraws.length)).toBe(frozen.count);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('.project-title')).toHaveText('[ Fixture Model Beta ]');
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  const progress = await page.evaluate(count => (window.__ACCEPTANCE__!.presentationDraws as unknown as Draw[]).slice(count).find(d => d.phase === 'moving')?.progress, frozen.count);
  if (progress != null) {
    expect(progress).toBeGreaterThanOrEqual(frozen.progress);
    expect(progress - frozen.progress).toBeLessThan(0.35);
  } else {
    // A near-finished transition may settle on its first resumed frame.
    expect(frozen.progress).toBeGreaterThan(0.5);
  }
});

test('reduced motion suppresses intermediate selection frames', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/tests/acceptance/index.html?catalog=four');
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  await page.evaluate(() => window.__ACCEPTANCE__!.reset());
  await page.getByRole('button', { name: 'Next project' }).click();
  await expect(page.locator('.project-title')).toContainText('Beta');
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  const moving = await page.evaluate(() => (window.__ACCEPTANCE__!.presentationDraws as unknown as Draw[]).filter(d => d.phase === 'moving'));
  expect(moving).toHaveLength(0);
});
