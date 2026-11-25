import { expect, test, navigateGame, showcaseUrl } from './game-showcase-fixtures'

test('native trailer, 8px gaps and full-width emphasized paragraphs match the game layout', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  const showcase = page.getByRole('region', { name: '[ Game Dev ]' })
  const media = page.getByRole('region', { name: 'KonTEXTo media' })
  await media.scrollIntoViewIfNeeded()
  await expect(media.getByTitle('KonTEXTo trailer', { exact: true })).toBeVisible()
  await expect(media.locator('.game-media-position')).toHaveText('Trailer, 1 of 4')
  await expect(media.locator('iframe')).toHaveCount(1)
  await expect(media.locator('.game-media-play, .instruction-copy')).toHaveCount(0)
  await expect(media.getByRole('link')).toHaveCount(0)
  await expect(media.locator('.art2d-slot')).toHaveCount(3)
  const positionBox = await media.locator('.game-media-position').boundingBox()
  expect(positionBox!.height).toBeLessThanOrEqual(1)
  const neighborWidths = await media.locator('.game-media-stage').evaluate((stage) => {
    const aperture = stage.getBoundingClientRect()
    return [...stage.querySelectorAll('.game-media-slot[aria-hidden="true"]')].map((slot) => {
      const rect = slot.getBoundingClientRect()
      return Math.min(aperture.right, rect.right) - Math.max(aperture.left, rect.left)
    })
  })
  expect(neighborWidths).toHaveLength(2)
  for (const width of neighborWidths) expect(width).toBeGreaterThan(0)
  const dimensions = await media.locator('.game-media-stage').evaluate((stage) => ({
    height: stage.getBoundingClientRect().height,
    mask: getComputedStyle(stage).maskImage,
  }))
  expect(dimensions.mask).toContain('2d-edge-dither')
  expect(dimensions.height).toBeGreaterThanOrEqual(220)
  expect(dimensions.height).toBeLessThanOrEqual(280)
  await expect
    .poll(() =>
      media
        .locator('img')
        .evaluateAll((images) =>
          images.every((img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0)
        )
    )
    .toBe(true)
  for (const name of ['Previous game media', 'Next game media']) {
    const button = media.getByRole('button', { name })
    const box = await button.boundingBox()
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)
    expect(
      await button
        .locator('.navigation-artwork')
        .evaluate(
          (element) =>
            getComputedStyle(element, '::after').maskImage ===
            getComputedStyle(element).getPropertyValue('--navigation-default').trim()
        )
    ).toBe(true)
  }
  const instructions = await showcase.locator('.game-navigation-instructions').boundingBox()
  const mediaBox = await media.boundingBox()
  const playBox = await showcase.getByRole('link', { name: /Play/ }).boundingBox()
  const description = showcase.locator('.game-description')
  const descriptionBox = await description.boundingBox()
  const carouselBox = await showcase.locator('.game-carousel').boundingBox()
  expect(mediaBox!.y - (instructions!.y + instructions!.height)).toBeCloseTo(8, 0)
  expect(playBox!.y - (mediaBox!.y + mediaBox!.height)).toBeCloseTo(8, 0)
  expect(descriptionBox!.y - (playBox!.y + playBox!.height)).toBeCloseTo(8, 0)
  expect(descriptionBox!.width).toBeCloseTo(carouselBox!.width, 0)
  expect(playBox!.height).toBeCloseTo(32, 0)
  await expect(description.locator('p')).toHaveCount(3)
  await expect(description.getByRole('list')).toHaveCount(0)
  expect(await description.textContent()).not.toContain('**')
  expect(await description.evaluate((element) => getComputedStyle(element).fontFamily)).toContain('JetBrains Mono')
  const highlight = description.locator('strong').filter({ hasText: 'campus life simulator' })
  await expect(highlight).toHaveCSS('font-weight', '700')
  expect(await highlight.evaluate((element) => getComputedStyle(element).fontFamily)).toContain('MS W98 UI')
  expect(await page.evaluate(async () => (await document.fonts.load('700 12px "MS W98 UI"')).length)).toBe(1)
  const documentWidth = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }))
  expect(documentWidth.scroll).toBeLessThanOrEqual(documentWidth.client)
  await showcase.screenshot({ path: testInfo.outputPath('game-media.png') })
})

test('media wraps and retains rapid FIFO input without changing selected game', async ({ page }) => {
  await page.goto(showcaseUrl())
  const media = page.getByRole('region', { name: 'KonTEXTo media' })
  const position = media.locator('.game-media-position')
  const previous = media.getByRole('button', { name: 'Previous game media' })
  const next = media.getByRole('button', { name: 'Next game media' })
  await previous.click()
  await expect(position).toHaveText('Screenshot, 4 of 4')
  await next.click()
  await expect(position).toHaveText('Trailer, 1 of 4')
  await next.click()
  await next.click()
  await previous.click()
  await expect(position).toHaveText('Screenshot, 3 of 4')
  await expect(position).toHaveText('Screenshot, 2 of 4')
  await expect(media.locator('[data-moving]')).toHaveCount(0)
  await expect(media.getByRole('button', { name: /Enlarge Kiko exploring/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'KonTEXTo' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Play/ })).toHaveAttribute(
    'href',
    'https://kirubiisfyne.itch.io/kontexto'
  )
})

test('screenshots enlarge, close with Escape or button, and restore focus', async ({ page }, testInfo) => {
  await page.goto(showcaseUrl())
  const media = page.getByRole('region', { name: 'KonTEXTo media' })
  await media.getByRole('button', { name: 'Next game media' }).click()
  const enlarge = media.getByRole('button', { name: /Enlarge Kiko exploring/ })
  await enlarge.focus()
  await enlarge.press('Enter')
  const dialog = media.getByRole('dialog', { name: 'Enlarged screenshot: KonTEXTo' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('img')).toHaveAttribute('alt', 'Kiko exploring a sunlit campus corridor in KonTEXTo')
  await expect(dialog.getByRole('button', { name: 'Close enlarged screenshot' })).toBeFocused()
  await dialog.screenshot({ path: testInfo.outputPath('game-screenshot-enlarged.png') })
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(enlarge).toBeFocused()
  await enlarge.click()
  await dialog.getByRole('button', { name: 'Close enlarged screenshot' }).click()
  await expect(dialog).toBeHidden()
  await expect(enlarge).toBeFocused()
})

test('native players never autoplay, remain unique, and unmount on media or game changes', async ({ page }) => {
  await page.goto(showcaseUrl())
  const media = page.getByRole('region', { name: 'KonTEXTo media' })
  const player = media.getByTitle('KonTEXTo trailer', { exact: true })
  await player.scrollIntoViewIfNeeded()
  await expect(player).toHaveAttribute(
    'src',
    'https://www.youtube-nocookie.com/embed/wYJc2vGsmZU?autoplay=0&rel=0&playsinline=1'
  )
  await expect(player.contentFrame().getByRole('button', { name: 'Play trailer' })).toBeVisible()
  const original = (await player.elementHandle())!
  const playerBox = await player.boundingBox()
  expect(playerBox!.width).toBeGreaterThanOrEqual(200)
  expect(playerBox!.height).toBeGreaterThanOrEqual(200)
  await expect(page.locator('iframe')).toHaveCount(1)
  await media.getByRole('button', { name: 'Next game media' }).click()
  await expect(page.locator('iframe')).toHaveCount(0)
  expect(await original.evaluate((element) => element.isConnected)).toBe(false)
  await expect(media.locator('.game-media-position')).toHaveText('Screenshot, 2 of 4')
  await media.getByRole('button', { name: 'Previous game media' }).click()
  await expect(player).toBeVisible()
  await expect(player).toHaveAttribute('src', /autoplay=0/)
  const beforeGameChange = (await player.elementHandle())!
  await navigateGame(page, 'next')
  const aniiMedia = page.getByRole('region', { name: 'Anii! Grow to Know media' })
  await expect(aniiMedia.locator('.game-media-position')).toHaveText('Trailer, 1 of 6')
  await expect(aniiMedia.getByTitle('Anii! Grow to Know trailer', { exact: true })).toHaveAttribute(
    'src',
    /embed\/xJZeUs_QqVA\?autoplay=0/
  )
  expect(await beforeGameChange.evaluate((element) => element.isConnected)).toBe(false)
  await expect(page.locator('iframe')).toHaveCount(1)
  await expect(page.locator('.game-description')).toContainText('six Bahay Kubo crops')
  await expect(page.locator('.game-description')).toContainText('Ukiyo Studios')
  await navigateGame(page, 'previous')
  await expect(media.locator('.game-media-position')).toHaveText('Trailer, 1 of 4')
  await expect(player).toHaveAttribute('src', /autoplay=0/)
})

test('reduced motion keeps navigation and screenshot closing immediate', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(showcaseUrl())
  const media = page.getByRole('region', { name: 'KonTEXTo media' })
  await media.getByRole('button', { name: 'Next game media' }).click()
  await expect(media.locator('.game-media-position')).toHaveText('Screenshot, 2 of 4')
  expect(
    await media
      .locator('.game-media-slot')
      .first()
      .evaluate((element) => getComputedStyle(element).animationName)
  ).toBe('none')
  await media.getByRole('button', { name: /Enlarge Kiko exploring/ }).click()
  const dialog = media.getByRole('dialog')
  await expect(dialog).toBeVisible()
  expect(await dialog.getByRole('img').evaluate((element) => getComputedStyle(element).animationName)).toBe('none')
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('empty and single-item media collections leave safe controls and game details', async ({ page }) => {
  await page.goto(showcaseUrl('media-empty'))
  await expect(page.locator('.game-media-carousel')).toHaveCount(0)
  await expect(page.getByRole('link', { name: /Play/ })).toBeVisible()
  await expect(page.locator('.game-description p')).toHaveCount(3)
  await page.goto(showcaseUrl('media-single'))
  const media = page.getByRole('region', { name: 'KonTEXTo media' })
  await expect(media.locator('.art2d-slot')).toHaveCount(1)
  await expect(media.locator('.game-media-position')).toHaveText('Screenshot, 1 of 1')
  await expect(media.getByRole('button', { name: 'Previous game media' })).toBeDisabled()
  await expect(media.getByRole('button', { name: 'Next game media' })).toBeDisabled()
  await expect(media.locator('iframe')).toHaveCount(0)
  await media.getByRole('button', { name: /Enlarge Kiko exploring/ }).click()
  await expect(media.getByRole('dialog')).toBeVisible()
})

test('unmount removes pending media motion, dialogs, and embedded players', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`${showcaseUrl()}&lifecycle=1`)
  const toggle = page.getByRole('button', { name: 'Toggle showcase' })
  const media = page.getByRole('region', { name: 'KonTEXTo media' })
  await media.getByRole('button', { name: 'Next game media' }).click()
  await media.getByRole('button', { name: 'Next game media' }).click()
  await toggle.click()
  await expect(media).toHaveCount(0)
  await toggle.click()
  await expect(media.locator('.game-media-position')).toHaveText('Trailer, 1 of 4')
  await expect(page.locator('iframe')).toHaveCount(1)
  await toggle.click()
  await expect(page.locator('iframe')).toHaveCount(0)
  await toggle.click()
  await media.getByRole('button', { name: 'Next game media' }).click()
  await media.getByRole('button', { name: /Enlarge Kiko exploring/ }).click()
  await expect(media.getByRole('dialog')).toBeVisible()
  await page.evaluate(() => (document.querySelector('body > #root > button') as HTMLButtonElement).click())
  await expect(page.locator('dialog')).toHaveCount(0)
  expect(errors).toEqual([])
})
