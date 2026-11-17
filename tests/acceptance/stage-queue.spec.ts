import { expect, test } from '@playwright/test';

test('rapid navigation is serviced in FIFO order with one announcement per selection', async ({ page }) => {
  await page.goto('/tests/acceptance/index.html?catalog=four');
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  await page.evaluate(() => {
    window.__ACCEPTANCE__!.reset();
    const next = document.querySelector<HTMLButtonElement>('button[aria-label="Next project"]')!;
    const previous = document.querySelector<HTMLButtonElement>('button[aria-label="Previous project"]')!;
    next.click(); next.click(); previous.click(); next.click();
  });
  await expect.poll(async () => page.evaluate(() => window.__ACCEPTANCE__!.observedMutations
    .filter(entry => entry.type === 'position').map(entry => entry.value)), { timeout: 15000 })
    .toEqual(['2 of 4: Fixture Model Beta', '3 of 4: Fixture Model Gamma', '2 of 4: Fixture Model Beta', '3 of 4: Fixture Model Gamma']);
  await expect(page.locator('.project-title')).toContainText('Gamma');
  const frames = await page.evaluate(() => window.__ACCEPTANCE__!.presentationDraws);
  const settled = frames.filter(frame => frame.phase === 'ready' && frame.requestId > 0);
  const firstByRequest = new Map<number, (typeof settled)[number]>();
  for (const frame of settled) if (!firstByRequest.has(frame.requestId)) firstByRequest.set(frame.requestId, frame);
  expect([...firstByRequest.keys()]).toEqual([1, 2, 3, 4]);
  for (const frame of firstByRequest.values()) {
    expect(frame.activatedAtMs).not.toBeNull();
    const origin = frame.serviceStartedAtMs ?? frame.activatedAtMs!;
    expect(frame.timestamp - origin).toBeLessThan(1500);
  }
  for (const frame of [...firstByRequest.values()].slice(1)) {
    expect(frame.serviceStartedAtMs).not.toBeNull();
    expect(frame.serviceStartedAtMs!).toBeGreaterThan(frame.activatedAtMs!);
  }
});

test('reduced motion services every queued direction without intermediate motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/tests/acceptance/index.html?catalog=four');
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  await page.evaluate(() => {
    window.__ACCEPTANCE__!.reset();
    const next = document.querySelector<HTMLButtonElement>('button[aria-label="Next project"]')!;
    const previous = document.querySelector<HTMLButtonElement>('button[aria-label="Previous project"]')!;
    next.click(); next.click(); previous.click(); next.click();
  });
  await expect.poll(async () => page.evaluate(() => window.__ACCEPTANCE__!.observedMutations
    .filter(entry => entry.type === 'position').map(entry => entry.value)), { timeout: 15000 })
    .toEqual(['2 of 4: Fixture Model Beta', '3 of 4: Fixture Model Gamma', '2 of 4: Fixture Model Beta', '3 of 4: Fixture Model Gamma']);
  const frames = await page.evaluate(() => window.__ACCEPTANCE__!.presentationDraws);
  expect(frames.filter(frame => frame.phase === 'moving')).toHaveLength(0);
});

test('hidden document freezes queued service until visible again', async ({ page }) => {
  await page.goto('/tests/acceptance/index.html?catalog=four');
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  await page.evaluate(() => {
    window.__ACCEPTANCE__!.reset();
    const next = document.querySelector<HTMLButtonElement>('button[aria-label="Next project"]')!;
    next.click(); next.click();
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__ACCEPTANCE__!.observedMutations.filter(entry => entry.type === 'position'))).toHaveLength(0);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(async () => page.evaluate(() => window.__ACCEPTANCE__!.observedMutations
    .filter(entry => entry.type === 'position').map(entry => entry.value)), { timeout: 15000 })
    .toEqual(['2 of 4: Fixture Model Beta', '3 of 4: Fixture Model Gamma']);
});

test('offscreen viewer pauses queued selections until it returns', async ({ page }) => {
  await page.goto('/tests/acceptance/index.html?catalog=four');
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  await page.evaluate(() => {
    window.__ACCEPTANCE__!.reset();
    const next = document.querySelector<HTMLButtonElement>('button[aria-label="Next project"]')!;
    next.click(); next.click();
    const spacer = document.createElement('div');
    spacer.id = 'test-offscreen-spacer';
    spacer.style.height = '3000px';
    document.body.prepend(spacer);
  });
  await page.waitForTimeout(500);
  const before = await page.evaluate(() => window.__ACCEPTANCE__!.observedMutations.filter(entry => entry.type === 'position').length);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__ACCEPTANCE__!.observedMutations.filter(entry => entry.type === 'position').length)).toBe(before);
  await page.evaluate(() => document.getElementById('test-offscreen-spacer')!.remove());
  await expect.poll(async () => page.evaluate(() => window.__ACCEPTANCE__!.observedMutations
    .filter(entry => entry.type === 'position').map(entry => entry.value)), { timeout: 15000 })
    .toEqual(['2 of 4: Fixture Model Beta', '3 of 4: Fixture Model Gamma']);
});

test('recoverable failure releases queued navigation without announcing failure', async ({ page }) => {
  await page.goto('/tests/acceptance/index.html?catalog=four');
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  await page.evaluate(() => {
    window.__ACCEPTANCE__!.reset();
    window.__ACCEPTANCE__!.failCandidate('fixture-b', 'rendered');
    const next = document.querySelector<HTMLButtonElement>('button[aria-label="Next project"]')!;
    next.click(); next.click();
  });
  await expect(page.locator('.project-title')).toContainText('Gamma', { timeout: 15000 });
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  const announcements = await page.evaluate(() => window.__ACCEPTANCE__!.observedMutations.filter(entry => entry.type === 'position'));
  expect(announcements.map(entry => entry.value)).toEqual(['3 of 4: Fixture Model Gamma']);
});
