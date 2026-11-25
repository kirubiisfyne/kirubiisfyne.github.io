import { test as base, type Page, type Route } from '@playwright/test'

export { expect } from '@playwright/test'

export const test = base.extend({
  page: async ({ page }, use) => {
    // Native embeds are tested locally; real YouTube playback is checked separately.
    await page.route('https://www.youtube-nocookie.com/embed/**', route => route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html><body style="margin:0;background:#111;color:white;display:grid;place-items:center;min-height:100vh"><button aria-label="Play trailer">YouTube trailer fixture</button></body></html>',
    }))
    await use(page)
  },
})

/** Catalog fixtures are selected only by the acceptance-only HTML entry point. */
export function showcaseUrl(catalog: 'default' | 'empty' | 'single' | 'extended' | 'media-empty' | 'media-single' = 'default'): string {
  return `/tests/acceptance/game-showcase.html?catalog=${catalog}`
}

/** Navigate through the same keyboard-accessible viewer used when WebGL is unavailable. */
export async function navigateGame(page: Page, direction: 'previous' | 'next'): Promise<void> {
  const viewer = page.getByRole('application', { name: 'Game navigation' })
  await viewer.focus()
  await viewer.press(direction === 'previous' ? 'ArrowLeft' : 'ArrowRight')
  await viewer.blur()
}

/** Override authored transform in the dev acceptance module only. */
export async function useTvTransform(page: Page, transform: {
  position: readonly [number, number, number]
  rotation: readonly [number, number, number]
  scale: readonly [number, number, number]
}): Promise<void> {
  await page.route('**/src/data/tv-transform.ts*', (route) => route.fulfill({
    contentType: 'text/javascript',
    body: `export const tvTransform = ${JSON.stringify(transform)};`,
  }))
}

/** Intercept the asset request, not Vite's ?url JavaScript import. */
export async function interceptAsset(page: Page, pattern: string, handler: (route: Route) => Promise<void>): Promise<void> {
  await page.route(pattern, async (route) => {
    if (route.request().resourceType() === 'script') return route.continue()
    await handler(route)
  })
}

/** Hold matching responses until released; separate gates allow out-of-order delivery. */
export async function holdAsset(page: Page, pattern: string) {
  let release!: () => void
  let reportRequest!: () => void
  const held = new Promise<void>((resolve) => { release = resolve })
  const requested = new Promise<void>((resolve) => { reportRequest = resolve })
  await interceptAsset(page, pattern, async (route) => {
    reportRequest()
    await held
    try { await route.continue() } catch { /* Page may have been closed while held. */ }
  })
  return { requested, release }
}

export async function failAsset(page: Page, pattern: string): Promise<void> {
  await interceptAsset(page, pattern, (route) => route.abort('failed'))
}

/** Simulate lack of WebGL before React mounts; no production code path required. */
export async function disableWebGL(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null
      return (original as (...params: unknown[]) => RenderingContext | null).call(this, type, ...args)
    } as typeof HTMLCanvasElement.prototype.getContext
  })
}
