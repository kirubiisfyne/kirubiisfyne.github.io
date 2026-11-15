const RADIUS = 100
const RETURN_MS = 300
const MAX_REPLACEMENT = 0.35
const RETURN_GLYPHS = '@#=+-:.'
const GLYPH_GROUPS = ['.:;', '-+xX', '*&$%', '#@=']

type Icon = {
  element: HTMLElement
  original: string
  rows: string[]
  current: string
  cells: Map<string, { changed: string; returningAt: number | null }>
}

/** Mount one position-driven effect for all skill artwork in a section. */
export function mountAsciiShimmer(section: HTMLElement) {
  const icons: Icon[] = Array.from(section.querySelectorAll<HTMLElement>('.skill-art'), (element) => {
    const original = element.textContent ?? ''
    return { element, original, rows: original.split('\n'), current: original, cells: new Map() }
  })
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let pointer: { x: number; y: number } | null = null
  let frame: number | null = null
  let disposed = false

  const restore = () => {
    for (const icon of icons) {
      icon.cells.clear()
      if (icon.current !== icon.original) {
        icon.element.textContent = icon.original
        icon.current = icon.original
      }
    }
  }
  const stop = () => {
    if (frame !== null) cancelAnimationFrame(frame)
    frame = null
    pointer = null
    restore()
  }
  const schedule = () => {
    if (!disposed && frame === null && !motion.matches && !document.hidden) {
      frame = requestAnimationFrame(draw)
    }
  }
  const draw = (time: number) => {
    frame = null
    if (disposed || motion.matches || document.hidden) return
    let returning = false

    for (const icon of icons) {
      const bounds = icon.element.getBoundingClientRect()
      if (bounds.bottom < 0 || bounds.top > window.innerHeight || bounds.right < 0 || bounds.left > window.innerWidth) {
        icon.cells.clear()
        if (icon.current !== icon.original) { icon.element.textContent = icon.original; icon.current = icon.original }
        continue
      }
      const columns = Math.max(...icon.rows.map((row) => row.length))
      const cellWidth = bounds.width / columns
      // offsetHeight is unzoomed; the displayed bounds include root zoom.
      const scale = icon.element.offsetHeight ? bounds.height / icon.element.offsetHeight : 1
      const lineHeight = parseFloat(getComputedStyle(icon.element).lineHeight) * scale
      const result = icon.rows.map((row, y) => Array.from(row, (character, x) => {
        if (character === ' ') return character
        const key = `${x},${y}`
        const distance = pointer ? Math.hypot(pointer.x - (bounds.left + (x + 0.5) * cellWidth), pointer.y - (bounds.top + (y + 0.5) * lineHeight)) : Infinity
        const proximity = Math.max(0, 1 - distance / RADIUS)
        const hash = ((x * 73 + y * 151 + x * y * 17) % 997) / 997
        const group = GLYPH_GROUPS.find((glyphs) => glyphs.includes(character))
        if (group && hash < MAX_REPLACEMENT * proximity * proximity) {
          const changed = group[(group.indexOf(character) + 1 + ((x * 11 + y * 7) % (group.length - 1))) % group.length]
          icon.cells.set(key, { changed, returningAt: null })
          return changed
        }
        const cell = icon.cells.get(key)
        if (!cell) return character
        cell.returningAt ??= time
        const progress = (time - cell.returningAt) / RETURN_MS
        if (progress >= 1) { icon.cells.delete(key); return character }
        returning = true
        // Step through intermediate glyphs, then restore the exact original.
        const start = RETURN_GLYPHS.indexOf(cell.changed)
        const trail = cell.changed + RETURN_GLYPHS.slice(start < 0 ? 0 : start + 1)
        return trail[Math.min(trail.length - 1, Math.floor(progress * trail.length))]
      }).join('')).join('\n')
      if (result !== icon.current) { icon.element.textContent = result; icon.current = result }
    }
    if (returning) schedule()
  }
  const onPointer = (event: PointerEvent) => {
    if (event.pointerType === 'touch' || motion.matches || document.hidden) return
    pointer = { x: event.clientX, y: event.clientY }
    schedule()
  }
  const returnToOriginal = () => {
    if (!pointer) return
    pointer = null
    schedule()
  }
  const onVisibility = () => { if (document.hidden) stop() }
  const onMotion = () => { if (motion.matches) stop() }
  const onLayout = () => { if (pointer) schedule() }
  window.addEventListener('pointermove', onPointer, { passive: true })
  window.addEventListener('blur', returnToOriginal)
  document.documentElement.addEventListener('pointerleave', returnToOriginal)
  window.addEventListener('scroll', onLayout, { passive: true })
  window.addEventListener('resize', onLayout)
  document.addEventListener('visibilitychange', onVisibility)
  motion.addEventListener('change', onMotion)
  void document.fonts.ready.then(() => { if (!disposed) onLayout() })

  return () => {
    disposed = true
    stop()
    window.removeEventListener('pointermove', onPointer)
    window.removeEventListener('blur', returnToOriginal)
    document.documentElement.removeEventListener('pointerleave', returnToOriginal)
    window.removeEventListener('scroll', onLayout)
    window.removeEventListener('resize', onLayout)
    document.removeEventListener('visibilitychange', onVisibility)
    motion.removeEventListener('change', onMotion)
  }
}
