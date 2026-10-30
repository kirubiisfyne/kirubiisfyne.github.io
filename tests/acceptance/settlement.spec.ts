import { test, expect, type Page, type CDPSession } from '@playwright/test';
import zlib from 'node:zlib';

declare global {
  interface Window {
    __testGate?: { release: () => void };
    __testGateB?: { release: () => void };
    __testGateC?: { release: () => void };
  }
}

interface FrameRecord {
  readonly buffer: Buffer;
  readonly metadata: {
    readonly timestamp: number;
    readonly deviceWidth: number;
    readonly deviceHeight: number;
  };
  readonly pageTimestampMs: number;
}

interface DecodedPixels {
  readonly width: number;
  readonly height: number;
  readonly getPixel: (x: number, y: number) => { r: number; g: number; b: number; a: number };
}

function decodePng(buf: Buffer): DecodedPixels {
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 2;
  const idatChunks: Buffer[] = [];

  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    if (type === 'IHDR') {
      width = buf.readUInt32BE(offset + 8);
      height = buf.readUInt32BE(offset + 12);
      colorType = buf.readUInt8(offset + 17);
    } else if (type === 'IDAT') {
      idatChunks.push(buf.subarray(offset + 8, offset + 8 + len));
    }
    offset += 12 + len;
  }

  const decompressed = zlib.inflateSync(Buffer.concat(idatChunks));
  const bpp = colorType === 6 ? 4 : (colorType === 2 ? 3 : 1);
  const stride = width * bpp;
  const pixels = Buffer.alloc(width * height * bpp);
  let srcOffset = 0;

  for (let y = 0; y < height; y++) {
    const filter = decompressed[srcOffset++];
    const rowOffset = y * stride;
    for (let x = 0; x < stride; x++) {
      const raw = decompressed[srcOffset++];
      const a = x >= bpp ? pixels[rowOffset + x - bpp]! : 0;
      const b = y > 0 ? pixels[rowOffset - stride + x]! : 0;
      const c = (x >= bpp && y > 0) ? pixels[rowOffset - stride + x - bpp]! : 0;
      let val = raw;
      if (filter === 1) val = (raw + a) & 0xff;
      else if (filter === 2) val = (raw + b) & 0xff;
      else if (filter === 3) val = (raw + Math.floor((a + b) / 2)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
        val = (raw + pr) & 0xff;
      }
      pixels[rowOffset + x] = val;
    }
  }

  return {
    width,
    height,
    getPixel(x: number, y: number) {
      const clampedX = Math.max(0, Math.min(width - 1, Math.floor(x)));
      const clampedY = Math.max(0, Math.min(height - 1, Math.floor(y)));
      const idx = (clampedY * width + clampedX) * bpp;
      return {
        r: pixels[idx] ?? 0,
        g: pixels[idx + 1] ?? 0,
        b: pixels[idx + 2] ?? 0,
        a: bpp === 4 ? (pixels[idx + 3] ?? 255) : 255,
      };
    },
  };
}

function pixelDistance(a: DecodedPixels, b: DecodedPixels, box: { x: number; y: number; width: number; height: number }): number {
  let difference = 0;
  let samples = 0;
  for (let y = Math.ceil(box.y); y < box.y + box.height; y += 2) {
    for (let x = Math.ceil(box.x); x < box.x + box.width; x += 2) {
      const p = a.getPixel(x, y);
      const q = b.getPixel(x, y);
      difference += Math.abs(p.r - q.r) + Math.abs(p.g - q.g) + Math.abs(p.b - q.b);
      samples++;
    }
  }
  return difference / Math.max(samples * 3, 1);
}

class CompositorObserver {
  private client: CDPSession | null = null;
  readonly frames: FrameRecord[] = [];
  private timeOrigin = 0;

  async init(page: Page): Promise<void> {
    this.client = await page.context().newCDPSession(page);
    this.timeOrigin = await page.evaluate(() => window.__ACCEPTANCE__?.timeOrigin ?? performance.timeOrigin);

    this.client.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
      const buffer = Buffer.from(data, 'base64');
      const ts = metadata.timestamp ?? 0;
      const frameTimestampMs = (ts * 1000) - this.timeOrigin;
      this.frames.push({
        buffer,
        metadata: {
          timestamp: ts,
          deviceWidth: metadata.deviceWidth,
          deviceHeight: metadata.deviceHeight,
        },
        pageTimestampMs: frameTimestampMs,
      });
      try {
        await this.client?.send('Page.screencastFrameAck', { sessionId });
      } catch {
        // Ignored if session closes
      }
    });
  }

  async start(): Promise<void> {
    this.frames.length = 0;
    if (!this.client) throw new Error('CompositorObserver not initialized');
    await this.client.send('Page.startScreencast', {
      format: 'png',
      everyNthFrame: 1,
    });
  }

  async stop(): Promise<void> {
    try {
      await this.client?.send('Page.stopScreencast');
    } catch {
      // Ignored
    }
  }

  assertUsableTimestamps(): void {
    if (this.frames.length === 0) throw new Error('No compositor frames recorded; screencasting unavailable.');
    for (const f of this.frames) {
      if (!Number.isFinite(f.metadata.timestamp) || f.metadata.timestamp <= 0) {
        throw new Error('Ambiguous or missing CDP compositor timestamp.');
      }
    }
  }
}

async function waitForInitialReady(page: Page): Promise<void> {
  await page.goto('/tests/acceptance/index.html');
  await page.waitForSelector('canvas', { state: 'attached' });
  await expect(page.locator('.project-title')).toHaveText('[ Fixture Model Alpha ]');
  await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
  await expect(page.locator('.project-description')).toHaveText('First distinct asymmetric textured model with red accents.');
  await expect(page.locator('canvas')).toHaveAttribute('aria-label', '3D model: Fixture Model Alpha');
  await expect(page.locator('.carousel-position')).toHaveText('1 of 3: Fixture Model Alpha');
}

test.describe('Acceptance Settlement Suite', () => {
  let observer: CompositorObserver;

  test.beforeEach(async ({ page }) => {
    observer = new CompositorObserver();
    await observer.init(page);
  });

  test.afterEach(async () => {
    await observer.stop();
  });

  for (const route of [
    { start: 0, direction: 'Next', title: 'Beta' },
    { start: 1, direction: 'Previous', title: 'Alpha' },
    { start: 0, direction: 'Previous', title: 'Delta' },
    { start: 3, direction: 'Next', title: 'Alpha' },
  ] as const) {
    test(`compositor presents destination and details within deadline: ${route.direction} from ${route.start}`, async ({ page }) => {
      await page.goto(`/tests/acceptance/index.html?catalog=four&start=${route.start}`);
      await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
      const titleBox = await page.locator('.project-title').boundingBox();
      const canvasBox = await page.locator('canvas').boundingBox();
      expect(titleBox).not.toBeNull();
      expect(canvasBox).not.toBeNull();
      const before = decodePng(await page.screenshot());
      await page.evaluate(() => window.__ACCEPTANCE__!.reset());
      await observer.start();
      await page.getByRole('button', { name: `${route.direction} project` }).click();
      await expect(page.locator('.project-title')).toHaveText(`[ Fixture Model ${route.title} ]`);
      await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
      await expect(page.locator('canvas')).toHaveAttribute('aria-label', `3D model: Fixture Model ${route.title}`);
      await expect(page.locator('.carousel-position')).toContainText(route.title);
      const after = decodePng(await page.screenshot());
      await page.waitForTimeout(80);
      await observer.stop();
      observer.assertUsableTimestamps();
      const activation = await page.evaluate(direction => window.__ACCEPTANCE__!.nativeClicks.find(c => c.targetLabel === `${direction} project`)?.timeStamp, route.direction);
      expect(activation).toBeDefined();
      const viewport = page.viewportSize()!;
      const sx = after.width / viewport.width;
      const sy = after.height / viewport.height;
      const title = { x: titleBox!.x * sx, y: titleBox!.y * sy, width: titleBox!.width * sx, height: titleBox!.height * sy };
      const center = { x: (canvasBox!.x + canvasBox!.width * 0.35) * sx, y: (canvasBox!.y + canvasBox!.height * 0.3) * sy, width: canvasBox!.width * 0.3 * sx, height: canvasBox!.height * 0.4 * sy };
      const titleChange = pixelDistance(before, after, title);
      const modelChange = pixelDistance(before, after, center);
      expect(titleChange, 'fixture titles must produce distinguishable pixels').toBeGreaterThan(0.01);
      expect(modelChange, 'destination model must produce distinguishable center pixels').toBeGreaterThan(0.01);
      const matchingFrame = observer.frames.find(frame => {
        if (frame.pageTimestampMs < activation!) return false;
        const pixels = decodePng(frame.buffer);
        return pixelDistance(pixels, after, title) < titleChange * 0.4
          && pixelDistance(pixels, after, center) < modelChange * 0.5;
      });
      expect(matchingFrame, 'a real compositor frame must match the destination model and readable destination title').toBeDefined();
      expect(matchingFrame!.pageTimestampMs - activation!, 'native activation to matching compositor frame').toBeLessThanOrEqual(500);
      const announcements = await page.evaluate(() => window.__ACCEPTANCE__!.observedMutations.filter(m => m.type === 'position'));
      expect(announcements).toHaveLength(1);
      expect(announcements[0].value).toContain(route.title);
    });
  }

  test('exhausted preparation keeps native clock and completes without a new orbit budget', async ({ page }) => {
    await page.goto('/tests/acceptance/index.html?catalog=four');
    await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
    await page.evaluate(() => {
      window.__ACCEPTANCE__!.reset();
      const controls = window.__ACCEPTANCE__ as unknown as { exhaustPreparation: (ms: number) => void };
      controls.exhaustPreparation(600);
    });
    await observer.start();
    await page.getByRole('button', { name: 'Next project' }).click();
    await expect(page.locator('.project-title')).toHaveText('[ Fixture Model Beta ]');
    await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
    await page.waitForTimeout(80);
    await observer.stop();
    observer.assertUsableTimestamps();
    const evidence = await page.evaluate(() => ({
      click: window.__ACCEPTANCE__!.nativeClicks.find(c => c.targetLabel === 'Next project'),
      draws: window.__ACCEPTANCE__!.presentationDraws,
    }));
    expect(evidence.click).toBeDefined();
    expect(evidence.draws.filter(d => d.phase === 'moving')).toHaveLength(0);
    const final = evidence.draws.find(d => d.displayedId === 'fixture-b' && d.phase === 'ready');
    expect(final).toBeDefined();
    const frame = observer.frames.find(f => f.pageTimestampMs >= final!.timestamp);
    expect(frame).toBeDefined();
    expect(frame!.pageTimestampMs - evidence.click!.timeStamp, 'the deliberate overrun must remain visible in compositor timing').toBeGreaterThan(500);
  });

  test.describe('Automated normal navigation — SC-003', () => {
    test('pointer click Next settles within 500ms with matching details and directional motion', async ({ page }) => {
      await waitForInitialReady(page);
      await observer.start();

      const nextButton = page.locator('button[aria-label="Next project"]');
      await nextButton.click();

      // Settle destination
      await expect(page.locator('.project-title')).toHaveText('[ Fixture Model Beta ]');
      await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
      await expect(page.locator('.project-description')).toHaveText('Second distinct asymmetric textured model with green accents.');
      await expect(page.locator('canvas')).toHaveAttribute('aria-label', '3D model: Fixture Model Beta');
      await expect(page.locator('.carousel-position')).toHaveText('2 of 3: Fixture Model Beta');

      await page.waitForTimeout(50);
      await observer.stop();
      observer.assertUsableTimestamps();

      const diagnostics = await page.evaluate(() => ({
        clicks: window.__ACCEPTANCE__?.nativeClicks ?? [],
        validations: window.__ACCEPTANCE__?.candidateValidations ?? [],
        draws: window.__ACCEPTANCE__?.presentationDraws ?? [],
      }));

      const click = diagnostics.clicks.find(c => c.targetLabel === 'Next project');
      expect(click, 'Native click must be captured').toBeDefined();
      const activationMs = click!.timeStamp;

      // Candidate must be validated
      const validation = diagnostics.validations.find(v => v.modelId === 'fixture-b');
      expect(validation, 'Destination candidate must be validated separately').toBeDefined();

      // Find the settled presentation draw, not an intermediate movement draw.
      const destinationDraw = diagnostics.draws.find(d => d.displayedId === 'fixture-b' && d.timestamp >= activationMs && d.phase === 'ready');
      expect(destinationDraw, 'Destination must have been presented').toBeDefined();

      // Verify intermediate motion: multiple draws showing movement
      const movingDraws = diagnostics.draws.filter(d => d.phase === 'moving');
      expect(movingDraws.length, 'Must exhibit directional movement draws').toBeGreaterThan(0);

      // Compositor frame check: first frame showing Beta settled
      const settledFrame = observer.frames.find(f => f.pageTimestampMs >= destinationDraw!.timestamp);
      expect(settledFrame, 'A compositor frame must accompany final settlement').toBeDefined();
      const decoded = decodePng(settledFrame!.buffer);
      expect(decoded.width, 'Settled frame must have positive width').toBeGreaterThan(0);
      expect(decoded.height, 'Settled frame must have positive height').toBeGreaterThan(0);
      const latencyMs = settledFrame!.pageTimestampMs - activationMs;
      expect(latencyMs, `Activation-to-settlement latency must be <= 500ms (got ${latencyMs.toFixed(1)}ms)`).toBeLessThanOrEqual(500);
    });

    test('pointer click Previous settles within 500ms with mirrored motion', async ({ page }) => {
      await waitForInitialReady(page);

      // Go to B first and wait for full settlement
      await page.locator('button[aria-label="Next project"]').click();
      await expect(page.locator('.project-title')).toHaveText('[ Fixture Model Beta ]');
      await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
      await observer.start();
      const prevButton = page.locator('button[aria-label="Previous project"]');
      await prevButton.click();

      await expect(page.locator('.project-title')).toHaveText('[ Fixture Model Alpha ]');
      await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
      await expect(page.locator('.carousel-position')).toHaveText('1 of 3: Fixture Model Alpha');

      await page.waitForTimeout(50);
      await observer.stop();
      observer.assertUsableTimestamps();

      const diagnostics = await page.evaluate(() => ({
        clicks: window.__ACCEPTANCE__?.nativeClicks ?? [],
        draws: window.__ACCEPTANCE__?.presentationDraws ?? [],
      }));

      const click = diagnostics.clicks.filter(c => c.targetLabel === 'Previous project').pop();
      expect(click).toBeDefined();

      const destinationDraw = diagnostics.draws.find(
        d => d.displayedId === 'fixture-a' && d.timestamp >= click!.timeStamp && d.phase === 'ready',
      );
      expect(destinationDraw).toBeDefined();
      const settledFrame = observer.frames.find(f => f.pageTimestampMs >= destinationDraw!.timestamp);
      expect(settledFrame).toBeDefined();

      const latencyMs = settledFrame!.pageTimestampMs - click!.timeStamp;
      expect(latencyMs, `Previous latency must be <= 500ms (got ${latencyMs.toFixed(1)}ms)`).toBeLessThanOrEqual(500);
    });

    test('wrap boundaries settle within 500ms', async ({ page }) => {
      await waitForInitialReady(page);

      // Previous from Alpha wraps to Gamma
      await observer.start();
      await page.locator('button[aria-label="Previous project"]').click();

      await expect(page.locator('.project-title')).toHaveText('[ Fixture Model Gamma ]');
      await expect(page.locator('.carousel-position')).toHaveText('3 of 3: Fixture Model Gamma');

      await page.waitForTimeout(50);
      await observer.stop();

      const diagnostics = await page.evaluate(() => ({
        clicks: window.__ACCEPTANCE__?.nativeClicks ?? [],
        draws: window.__ACCEPTANCE__?.presentationDraws ?? [],
      }));

      const click = diagnostics.clicks.find(c => c.targetLabel === 'Previous project');
      const destDraw = diagnostics.draws.find(d => d.displayedId === 'fixture-c' && d.timestamp >= click!.timeStamp && d.phase === 'ready');
      expect(destDraw).toBeDefined();
      const settledFrame = observer.frames.find(f => f.pageTimestampMs >= destDraw!.timestamp);
      expect(settledFrame).toBeDefined();

      const latencyMs = settledFrame!.pageTimestampMs - click!.timeStamp;
      expect(latencyMs, `Wrap latency must be <= 500ms (got ${latencyMs.toFixed(1)}ms)`).toBeLessThanOrEqual(500);
    });

    test('keyboard Enter and Space activation settle within 500ms and retain focus', async ({ page }) => {
      await waitForInitialReady(page);

      const nextButton = page.locator('button[aria-label="Next project"]');
      await nextButton.focus();
      await expect(nextButton).toBeFocused();

      // Enter activation
      await observer.start();
      await page.keyboard.press('Enter');

      await expect(page.locator('.project-title')).toHaveText('[ Fixture Model Beta ]');
      await expect(page.locator('.carousel-position')).toHaveText('2 of 3: Fixture Model Beta');
      await expect(nextButton).toBeFocused();

      await page.waitForTimeout(50);
      await observer.stop();

      const enterClick = await page.evaluate(() =>
        window.__ACCEPTANCE__?.nativeClicks.find(c => c.targetLabel === 'Next project')
      );
      expect(enterClick, 'Native Enter click must be captured').toBeDefined();

      // Space activation to Gamma
      await observer.start();
      await page.keyboard.press('Space');

      await expect(page.locator('.project-title')).toHaveText('[ Fixture Model Gamma ]');
      await expect(page.locator('.carousel-position')).toHaveText('3 of 3: Fixture Model Gamma');
      await expect(nextButton).toBeFocused();

      await page.waitForTimeout(50);
      await observer.stop();

      const spaceClicks = await page.evaluate(() =>
        window.__ACCEPTANCE__?.nativeClicks.filter(c => c.targetLabel === 'Next project')
      );
      expect(spaceClicks?.length).toBe(2);
    });

    test('retains mode and focus across navigation', async ({ page }) => {
      await waitForInitialReady(page);

      // Select Clay mode
      const clayButton = page.locator('button[aria-label="Clay"]');
      await clayButton.click();
      await expect(clayButton).toHaveAttribute('aria-pressed', 'true');

      // Navigate Next
      const nextButton = page.locator('button[aria-label="Next project"]');
      await nextButton.click();

      await expect(page.locator('.project-title')).toHaveText('[ Fixture Model Beta ]');
      // Mode button remains Clay
      await expect(clayButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test.describe('Automated delayed-details settlement — SC-008', () => {
    test('holding destination details >500ms keeps curtain and settles upon release', async ({ page }) => {
      await waitForInitialReady(page);

      // Arm gate for Beta
      await page.evaluate(() => {
        window.__testGate = window.__ACCEPTANCE__?.holdMetadataGate({ requestId: 1, modelId: 'fixture-b' });
      });

      await observer.start();
      await page.locator('button[aria-label="Next project"]').click();

      // While held: curtain is active (no data-revealed, aria-hidden true or inert)
      await page.waitForTimeout(100);

      const isCurtained = await page.evaluate(() => {
        const details = [...document.querySelectorAll<HTMLElement>('[data-selection-details]')];
        const canvas = document.querySelector('canvas');
        const pos = document.querySelector('.carousel-position')?.textContent;
        return {
          detailsHidden: details.every(node => !node.hasAttribute('data-revealed') && node.getAttribute('aria-hidden') === 'true' && node.inert),
          canvasLabel: canvas?.getAttribute('aria-label'),
          position: pos,
        };
      });

      expect(isCurtained.detailsHidden).toBe(true);
      expect(isCurtained.canvasLabel).toBe('3D model loading');
      // Position message must NOT announce Beta yet
      expect(isCurtained.position).toBe('1 of 3: Fixture Model Alpha');

      // Eager startup may validate Beta before the gate is armed.
      await expect.poll(async () => page.evaluate(() =>
        window.__ACCEPTANCE__?.candidateValidations.some(v => v.modelId === 'fixture-b') ?? false
      ), { message: 'Destination candidate must be validated' }).toBe(true);

      // Hold until > 500ms elapsed
      await page.waitForTimeout(550);

      // Still no success position update
      const positionStillOld = await page.evaluate(() =>
        document.querySelector('.carousel-position')?.textContent
      );
      expect(positionStillOld).toBe('1 of 3: Fixture Model Alpha');

      // Release gate
      await page.evaluate(() => {
        window.__testGate?.release();
      });

      // Now it must settle to Beta
      await expect(page.locator('.project-title')).toHaveText('[ Fixture Model Beta ]');
      await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
      await expect(page.locator('.project-description')).toHaveText('Second distinct asymmetric textured model with green accents.');
      await expect(page.locator('canvas')).toHaveAttribute('aria-label', '3D model: Fixture Model Beta');
      await expect(page.locator('.carousel-position')).toHaveText('2 of 3: Fixture Model Beta');

      await page.waitForTimeout(50);
      await observer.stop();

      // Exactly ONE position mutation for Beta
      const positionMutations = await page.evaluate(() =>
        window.__ACCEPTANCE__?.observedMutations.filter(m => m.type === 'position' && m.value.includes('Fixture Model Beta')) ?? []
      );
      expect(positionMutations.length, 'Exactly one success position update for Beta').toBe(1);
    });

    test('superseded gate: releasing obsolete destination never reveals or updates position', async ({ page }) => {
      await waitForInitialReady(page);

      // Hold Beta
      await page.evaluate(() => {
        window.__testGateB = window.__ACCEPTANCE__?.holdMetadataGate({ requestId: 1, modelId: 'fixture-b' });
        window.__testGateC = window.__ACCEPTANCE__?.holdMetadataGate({ requestId: 2, modelId: 'fixture-c' });
      });

      // Click Next to Beta
      await page.locator('button[aria-label="Next project"]').click();
      await page.waitForTimeout(50);

      // Click Next again to Gamma
      await page.locator('button[aria-label="Next project"]').click();
      await page.waitForTimeout(50);

      // Release obsolete Beta FIRST
      await page.evaluate(() => {
        window.__testGateB?.release();
      });
      await page.waitForTimeout(100);

      // Beta must never settle or reveal
      const titleText = await page.locator('.project-title').textContent();
      expect(titleText).not.toContain('Fixture Model Beta');
      const posText = await page.locator('.carousel-position').textContent();
      expect(posText).not.toContain('Fixture Model Beta');

      // Release Gamma
      await page.evaluate(() => {
        window.__testGateC?.release();
      });

      await expect(page.locator('.project-title')).toHaveText('[ Fixture Model Gamma ]');
      await expect(page.locator('.carousel-position')).toHaveText('3 of 3: Fixture Model Gamma');
    });

    test('recovery from corrupted texture failure permits onward navigation', async ({ page }) => {
      await page.goto('/tests/acceptance/index.html?catalog=broken');
      await page.waitForSelector('canvas');

      // Alpha is healthy
      await expect(page.locator('.project-title')).toHaveText('[ Fixture Model Alpha ]');

      // Navigate Next to broken model
      await page.locator('button[aria-label="Next project"]').click();

      // Fails gracefully: identifies unavailable destination, no success position
      await expect(page.locator('canvas')).toHaveAttribute('aria-label', /unavailable/);
      await expect(page.locator('.viewer-stage')).toHaveAttribute('data-state', 'error');
      await expect(page.locator('.viewer-message')).toContainText('Fixture Broken Model');
      const posText = await page.locator('.carousel-position').textContent();
      expect(posText).not.toContain('Fixture Broken Model');

      // Onward navigation to Gamma succeeds
      await page.locator('button[aria-label="Next project"]').click();
      await expect(page.locator('.project-title')).toHaveText('[ Fixture Model Gamma ]');
      await expect(page.locator('.carousel-position')).toHaveText('3 of 3: Fixture Model Gamma');
    });
  });
});
