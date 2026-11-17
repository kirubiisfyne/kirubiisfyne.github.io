import { expect, test, type Page } from '@playwright/test';

type Participant = { modelId: string; position: [number, number, number]; scale: [number, number, number]; pose: [number, number] };
type StageDraw = { phase: string; participants: Participant[] };
const ids = ['fixture-a', 'fixture-b', 'fixture-c', 'fixture-d'];
const titles = ['Alpha', 'Beta', 'Gamma', 'Delta'];

async function lastStage(page: Page): Promise<StageDraw> {
  return page.evaluate(() => {
    const draws = window.__ACCEPTANCE__!.presentationDraws as unknown as StageDraw[];
    return draws[draws.length - 1];
  });
}

async function expectRest(page: Page, count: number, index: number, order = ids.slice(0, count), titleOrder = titles.slice(0, count)) {
  await expect(page.locator('.project-title')).toHaveText(`[ Fixture Model ${titleOrder[index]} ]`);
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  const expected = [-1, 0, 1].map(offset => order[(index + offset + count * 2) % count]);
  await expect.poll(async () => (await lastStage(page))?.participants?.slice().sort((a, b) => a.position[0] - b.position[0]).map(p => p.modelId)).toEqual(expected);
  const slots = (await lastStage(page)).participants.slice().sort((a, b) => a.position[0] - b.position[0]);
  expect(slots.map(p => p.position[1])).toEqual([0, 0, 0]);
  for (let i = 0; i < slots.length; i++) {
    expect(slots[i].position[2]).toBe(0);
    expect(slots[i].scale[0]).toBeCloseTo(2.2 * (i === 1 ? 1 : 0.75), 6);
  }
}

test('canvas fills body while preserving stage aspect and center', async ({ page }) => {
  await page.goto('/tests/acceptance/index.html?catalog=four');
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  const geometry = async () => page.evaluate(() => {
    const canvas = document.querySelector('.model-canvas')!.getBoundingClientRect();
    const stage = document.querySelector('.viewer-stage')!.getBoundingClientRect();
    const body = document.body.getBoundingClientRect();
    return {
      canvasLeft: canvas.left, canvasWidth: canvas.width, canvasHeight: canvas.height,
      canvasCenterY: canvas.top + canvas.height / 2,
      stageWidth: stage.width, stageHeight: stage.height, stageCenterY: stage.top + stage.height / 2,
      bodyLeft: body.left, bodyWidth: body.width,
    };
  });
  for (const viewport of [null, { width: 700, height: 700 }]) {
    if (viewport) await page.setViewportSize(viewport);
    await expect.poll(async () => {
      const g = await geometry();
      return Math.abs(g.canvasWidth - g.bodyWidth);
    }).toBeLessThan(1);
    const g = await geometry();
    expect(Math.abs(g.canvasLeft - g.bodyLeft)).toBeLessThan(1);
    expect(Math.abs(g.canvasCenterY - g.stageCenterY)).toBeLessThan(1);
    expect(g.canvasWidth / g.canvasHeight).toBeCloseTo(g.stageWidth / g.stageHeight, 2);
  }
  const overlayOnTop = await page.evaluate(() => {
    const canvas = document.querySelector('.model-canvas')!;
    const bounds = canvas.getBoundingClientRect();
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;left:${bounds.left + bounds.width / 2 - 10}px;top:${bounds.top + bounds.height / 2 - 10}px;width:20px;height:20px;`;
    document.getElementById('root')!.prepend(overlay);
    const elements = document.elementsFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
    const onTop = elements.indexOf(overlay) < elements.indexOf(canvas) && elements.includes(overlay) && elements.includes(canvas);
    overlay.remove();
    return onTop;
  });
  expect(overlayOnTop).toBe(true);
});

test.describe('resting conveyor belt', () => {
  for (const count of [3, 4]) {
    for (let start = 0; start < count; start++) {
      test(`${count} entries from ${start}: ordered neighbors after navigation and wraps`, async ({ page }) => {
        await page.goto(`/tests/acceptance/index.html?catalog=${count === 4 ? 'four' : 'three'}&start=${start}`);
        // The harness rotates the catalog itself, so indices and position text follow that order.
        const order = [...ids.slice(start, count), ...ids.slice(0, start)];
        const titleOrder = [...titles.slice(start, count), ...titles.slice(0, start)];
        const check = (index: number) => expectRest(page, count, index, order, titleOrder);
        await check(0);
        await page.getByRole('button', { name: 'Previous project' }).click();
        await check(count - 1);
        await page.getByRole('button', { name: 'Next project' }).click();
        await check(0);
        await page.getByRole('button', { name: 'Next project' }).click();
        await check(1);
        await page.getByRole('button', { name: 'Previous project' }).click();
        await check(0);
      });
    }
  }

  test('painted preview rejects mouse and touch drags and stays within canvas bounds', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/tests/acceptance/index.html?catalog=four');
    await expectRest(page, 4, 0);
    const box = await page.locator('canvas').boundingBox();
    expect(box).not.toBeNull();
    const nextControl = await page.getByRole('button', { name: 'Next project' }).boundingBox();
    expect(nextControl).not.toBeNull();
    // Reveal the complete preview to detect geometry hidden underneath the control.
    const hiddenControls = await page.addStyleTag({ content: '.navigation-button { visibility: hidden !important; }' });
    const screenshot = await page.screenshot();
    await hiddenControls.evaluate(node => node.parentNode?.removeChild(node));
    const painted = await page.evaluate(async ({ image, box }) => {
      const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${image}`)).blob());
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(bitmap, 0, 0);
      const data = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
      const sx = bitmap.width / window.innerWidth;
      const sy = bitmap.height / window.innerHeight;
      const points: { x: number; y: number }[] = [];
      // Beta's green texture identifies actual painted preview pixels, not its model transform.
      for (let y = Math.ceil(box.y * sy); y < (box.y + box.height) * sy; y++) {
        for (let x = Math.ceil((box.x + box.width * 0.52) * sx); x < (box.x + box.width) * sx; x++) {
          const i = (y * bitmap.width + x) * 4;
          if (data[i + 1] > data[i] * 1.18 && data[i + 1] > data[i + 2] * 1.12 && data[i + 1] > 40) points.push({ x: x / sx, y: y / sy });
        }
      }
      if (!points.length) return null;
      const bounds = points.reduce((result, p) => ({
        minX: Math.min(result.minX, p.x), maxX: Math.max(result.maxX, p.x),
        minY: Math.min(result.minY, p.y), maxY: Math.max(result.maxY, p.y),
      }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
      points.sort((a, b) => a.y - b.y || a.x - b.x);
      return { point: points[Math.floor(points.length / 2)], ...bounds, count: points.length };
    }, { image: screenshot.toString('base64'), box: box! });
    expect(painted, 'green preview must be visible in compositor pixels').not.toBeNull();
    expect(painted!.count).toBeGreaterThan(20);
    expect(painted!.minX).toBeGreaterThan(box!.x + 1);
    expect(painted!.maxX).toBeLessThanOrEqual(box!.x + box!.width);
    expect(painted!.minY).toBeGreaterThan(box!.y + 1);
    expect(painted!.maxY).toBeLessThan(box!.y + box!.height - 1);
    await expect(page.getByRole('button', { name: 'Next project' })).toBeEnabled();
    const before = await lastStage(page);
    const poses = before.participants.map(p => ({ id: p.modelId, pose: p.pose }));
    const { x, y } = painted!.point;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 60, y + 30, { steps: 5 });
    await page.mouse.up();
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 60, y: y + 30 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await cdp.detach();
    await page.waitForTimeout(80);
    const after = await lastStage(page);
    expect(after.participants.map(p => ({ id: p.modelId, pose: p.pose }))).toEqual(poses);
  });

  test('modes, static previews, center inspection and page bounds', async ({ page }) => {
    await page.goto('/tests/acceptance/index.html?catalog=four');
    await expectRest(page, 4, 0);
    const initial = await lastStage(page);
    const preview = initial.participants.find(p => p.modelId === 'fixture-b')!;
    for (const mode of ['Clay', 'Wireframe', 'Rendered']) {
      const button = page.getByRole('button', { name: mode, exact: true });
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await expectRest(page, 4, 0);
    }
    const stage = await page.locator('.viewer-stage').boundingBox();
    expect(stage).not.toBeNull();
    const beforeDrag = await lastStage(page);
    await page.mouse.move(stage!.x + stage!.width / 2, stage!.y + stage!.height / 2);
    await page.mouse.down();
    await page.mouse.move(stage!.x + stage!.width / 2 + 50, stage!.y + stage!.height / 2 + 20, { steps: 5 });
    await expect.poll(async () => (await lastStage(page)).participants.find(p => p.modelId === 'fixture-a')!.pose)
      .not.toEqual(beforeDrag.participants.find(p => p.modelId === 'fixture-a')!.pose);
    await page.mouse.up();

    const canvas = page.locator('canvas');
    await canvas.focus();
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(200);
    await page.keyboard.up('ArrowRight');
    const inspected = await lastStage(page);
    expect(inspected.participants.find(p => p.modelId === 'fixture-b')!.pose).toEqual(preview.pose);
    expect(inspected.participants.find(p => p.modelId === 'fixture-a')!.pose).not.toEqual(initial.participants.find(p => p.modelId === 'fixture-a')!.pose);
    const bounds = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: document.documentElement.clientWidth }));
    expect(bounds.scroll).toBeLessThanOrEqual(bounds.width);
    await expect(page.getByRole('button', { name: 'Next project' })).toBeEnabled();
  });
});
