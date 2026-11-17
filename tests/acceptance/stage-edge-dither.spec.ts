import { expect, test } from '@playwright/test';

for (const dpr of [1, 2]) {
  test.describe(`edge dither at DPR ${dpr}`, () => {
    test.use({ deviceScaleFactor: dpr });

    test('both viewport edges dither away while the center stays solid and modes remain available', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/tests/acceptance/index.html?catalog=green-five');
      await expect(page.locator('.project-title')).toHaveAttribute('data-revealed', '');
      await expect.poll(async () => page.evaluate(() => window.__ACCEPTANCE__!.presentationDraws.at(-1)?.participants.length)).toBe(3);
      const screenshot = await page.screenshot();
      const counts = await page.evaluate(async image => {
        const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${image}`)).blob());
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d')!;
        context.drawImage(bitmap, 0, 0);
        const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
        const green = Array<number>(width).fill(0);
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
            if (g > 60 && g > r * 1.3 && g > b * 1.1) green[x]++;
          }
        }
        const edge = Math.max(2, Math.round(width * 0.01));
        const average = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
        return {
          rightPeak: Math.max(...green.slice(Math.floor(width * 0.6))),
          leftPeak: Math.max(...green.slice(0, Math.floor(width * 0.4))),
          rightEdge: average(green.slice(-edge)),
          leftEdge: average(green.slice(0, edge)),
          centerGreen: Math.max(...green.slice(Math.floor(width * 0.35), Math.floor(width * 0.65))),
        };
      }, screenshot.toString('base64'));
      expect(counts.rightPeak).toBeGreaterThan(30 * dpr);
      expect(counts.leftPeak).toBeGreaterThan(20 * dpr);
      expect(counts.rightEdge).toBeLessThan(counts.rightPeak * 0.2);
      expect(counts.leftEdge).toBeLessThan(counts.leftPeak * 0.2);
      expect(counts.centerGreen).toBeGreaterThan(80 * dpr);
      for (const mode of ['Clay', 'Wireframe', 'Rendered']) {
        const button = page.getByRole('button', { name: mode, exact: true });
        await button.click();
        await expect(button).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('.viewer-stage')).toHaveAttribute('data-state', 'ready');
        if (mode === 'Clay') {
          // Check the override material's actual pixels, not only its selected state.
          const clay = await page.screenshot();
          const profile = await page.evaluate(async image => {
            const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${image}`)).blob());
            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width; canvas.height = bitmap.height;
            const context = canvas.getContext('2d')!;
            context.drawImage(bitmap, 0, 0);
            const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
            const counts = Array<number>(width).fill(0);
            for (let y = Math.floor(height * 0.1); y < Math.floor(height * 0.65); y++) {
              for (let x = Math.floor(width * 0.65); x < width; x++) {
                const i = (y * width + x) * 4;
                const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
                if (r > 40 && Math.abs(r - g) < 15 && Math.abs(g - b) < 15) counts[x]++;
              }
            }
            const edgeWidth = Math.max(2, Math.round(width * 0.01));
            return { peak: Math.max(...counts), edge: counts.slice(-edgeWidth).reduce((a, b) => a + b, 0) / edgeWidth };
          }, clay.toString('base64'));
          expect(profile.peak).toBeGreaterThan(20 * dpr);
          expect(profile.edge).toBeLessThan(profile.peak * 0.2);
        }
      }
    });
  });
}
