import type { Page } from '@playwright/test';

/** Install before mounting the harness so a model request can be held or failed independently. */
export async function holdModelLoad(page: Page, modelUrl: string) {
  const released = Promise.withResolvers<void>();
  const requested = Promise.withResolvers<void>();
  let fail = false;
  await page.route(`**${modelUrl}`, async (route) => {
    requested.resolve();
    await released.promise;
    if (fail) await route.abort();
    else await route.continue();
  });
  return {
    requested: requested.promise,
    release: () => released.resolve(),
    fail: () => { fail = true; released.resolve(); },
  };
}
