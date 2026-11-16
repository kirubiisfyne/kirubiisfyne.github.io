const SPEED = 36 // CSS pixels per second
const EDGE_WIDTH = 100
const RADIUS = 100
const RETURN_MS = 300
const MAX_REPLACEMENT = 0.35
const RETURN_GLYPHS = '@#=+-:.'
const GLYPH_GROUPS = ['.:;', '-+xX', '*&$%', '#@=']
const DENSITY = '.:-=+*#%@'

type Icon = {
  element: HTMLElement
  original: string
  rows: string[]
  columns: number
  current: string
  cells: Map<string, { changed: string; returningAt: number | null }>
}

type Belt = {
  viewport: HTMLElement
  track: HTMLElement
  cycle: HTMLElement
  icons: Icon[]
  width: number
  offset: number
  visible: boolean
  paused: boolean
  drag: { id: number; startX: number; startOffset: number; moved: boolean } | null
}

function collectIcons(track: HTMLElement): Icon[] {
  return Array.from(track.querySelectorAll<HTMLElement>('.skill-art'), (element) => {
    const original = element.textContent ?? ''
    const rows = original.split('\n')
    return { element, original, rows, columns: Math.max(...rows.map((row) => row.length)), current: original, cells: new Map() }
  })
}

/** Own movement and glyph changes together so edge dissolves and pointer shimmer compose. */
export function mountSkillConveyors(section: HTMLElement) {
  const belts: Belt[] = Array.from(section.querySelectorAll<HTMLElement>('.skill-viewport'), (viewport) => {
    const track = viewport.querySelector<HTMLElement>('.skill-track')!
    const cycle = track.querySelector<HTMLElement>('.skill-cycle')!
    return { viewport, track, cycle, icons: [], width: 0, offset: 0, visible: true, paused: false, drag: null }
  })
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let pointer: { x: number; y: number } | null = null
  let frame: number | null = null
  let lastTime: number | null = null
  let disposed = false
  const events = new AbortController()

  const restore = (icon: Icon) => {
    icon.cells.clear()
    if (icon.current !== icon.original) {
      icon.element.textContent = icon.original
      icon.current = icon.original
    }
  }
  const stop = () => {
    if (frame !== null) cancelAnimationFrame(frame)
    frame = null
    lastTime = null
  }
  const schedule = () => {
    if (!disposed && frame === null && !document.hidden && !motion.matches) frame = requestAnimationFrame(draw)
  }
  const updateLabel = (belt: Belt) => {
    const state = motion.matches ? 'stationary' : belt.paused ? 'paused' : 'moving'
    belt.viewport.setAttribute('aria-label', `${belt.viewport.dataset.label} skills conveyor, ${state}`)
    belt.viewport.tabIndex = motion.matches ? -1 : 0
  }
  const moveTo = (belt: Belt, offset: number) => {
    if (!belt.width) return
    belt.offset = ((offset % belt.width) + belt.width) % belt.width
    belt.track.style.transform = `translate3d(${-belt.offset}px, 0, 0)`
    schedule()
  }
  const rebuild = () => {
    if (disposed) return
    for (const belt of belts) {
      updateLabel(belt)
      for (const icon of belt.icons) restore(icon)
      belt.track.querySelectorAll('[data-skill-copy]').forEach((copy) => copy.remove())
      const viewportBounds = belt.viewport.getBoundingClientRect()
      const scale = belt.viewport.offsetWidth ? viewportBounds.width / belt.viewport.offsetWidth : 1
      const width = belt.cycle.getBoundingClientRect().width / (scale || 1)
      if (width > 0 && !motion.matches) {
        // One full spare cycle remains available even just before the wrap.
        const copies = Math.ceil(viewportBounds.width / (width * scale))
        for (let i = 0; i < copies; i++) {
          const copy = belt.cycle.cloneNode(true) as HTMLElement
          copy.dataset.skillCopy = ''
          belt.track.append(copy)
        }
      }
      belt.width = width
      belt.offset = width ? belt.offset % width : 0
      belt.track.style.transform = motion.matches ? '' : `translate3d(${-belt.offset}px, 0, 0)`
      belt.icons = collectIcons(belt.track)
    }
    lastTime = null
    schedule()
  }
  const draw = (time: number) => {
    frame = null
    if (disposed || motion.matches || document.hidden) return
    const elapsed = lastTime === null ? 0 : Math.min(time - lastTime, 100)
    lastTime = time
    let returning = false
    let moving = false

    for (const belt of belts) {
      if (!belt.visible) continue
      if (!belt.paused && !belt.drag && belt.width > 0) {
        belt.offset = (belt.offset + SPEED * elapsed / 1000) % belt.width
        belt.track.style.transform = `translate3d(${-belt.offset}px, 0, 0)`
        moving = true
      }
      const viewport = belt.viewport.getBoundingClientRect()
      const scale = belt.viewport.offsetWidth ? viewport.width / belt.viewport.offsetWidth : 1
      const edgeWidth = Math.min(viewport.width * 0.15, EDGE_WIDTH * scale)
      for (const icon of belt.icons) {
        const bounds = icon.element.getBoundingClientRect()
        if (bounds.right <= viewport.left || bounds.left >= viewport.right) {
          restore(icon)
          continue
        }
        const nearEdge = bounds.left < viewport.left + edgeWidth || bounds.right > viewport.right - edgeWidth
        const nearPointer = pointer !== null && pointer.x >= bounds.left - RADIUS && pointer.x <= bounds.right + RADIUS && pointer.y >= bounds.top - RADIUS && pointer.y <= bounds.bottom + RADIUS
        if (!nearEdge && !nearPointer && icon.cells.size === 0) {
          restore(icon)
          continue
        }
        const cellWidth = bounds.width / icon.columns
        const iconScale = icon.element.offsetHeight ? bounds.height / icon.element.offsetHeight : 1
        const lineHeight = parseFloat(getComputedStyle(icon.element).lineHeight) * iconScale
        const result = icon.rows.map((row, y) => Array.from(row, (character, x) => {
          if (character === ' ') return character
          const cellX = bounds.left + (x + 0.5) * cellWidth
          const key = `${x},${y}`
          const distance = pointer ? Math.hypot(pointer.x - cellX, pointer.y - (bounds.top + (y + 0.5) * lineHeight)) : Infinity
          const proximity = Math.max(0, 1 - distance / RADIUS)
          const hash = ((x * 73 + y * 151 + x * y * 17) % 997) / 997
          const group = GLYPH_GROUPS.find((glyphs) => glyphs.includes(character))
          let glyph = character
          if (group && hash < MAX_REPLACEMENT * proximity * proximity) {
            glyph = group[(group.indexOf(character) + 1 + ((x * 11 + y * 7) % (group.length - 1))) % group.length]
            icon.cells.set(key, { changed: glyph, returningAt: null })
          } else {
            const cell = icon.cells.get(key)
            if (cell) {
              cell.returningAt ??= time
              const progress = (time - cell.returningAt) / RETURN_MS
              if (progress >= 1) icon.cells.delete(key)
              else {
                returning = true
                const start = RETURN_GLYPHS.indexOf(cell.changed)
                const trail = cell.changed + RETURN_GLYPHS.slice(start < 0 ? 0 : start + 1)
                glyph = trail[Math.min(trail.length - 1, Math.floor(progress * trail.length))]
              }
            }
          }
          const edge = edgeWidth > 0 ? Math.min(1, Math.max(0, Math.min(cellX - viewport.left, viewport.right - cellX) / edgeWidth)) : 1
          if (edge >= 1) return glyph
          const density = DENSITY.indexOf(glyph)
          const level = Math.floor(((density < 0 ? DENSITY.length - 1 : density) + 1) * edge)
          return level === 0 ? ' ' : DENSITY[level - 1]
        }).join('')).join('\n')
        if (result !== icon.current) { icon.element.textContent = result; icon.current = result }
      }
    }
    if (moving || returning) schedule()
    else lastTime = null
  }
  const onPointer = (event: PointerEvent) => {
    if (event.pointerType === 'touch' || motion.matches || document.hidden) return
    pointer = { x: event.clientX, y: event.clientY }
    schedule()
  }
  const returnToOriginal = () => { if (pointer) { pointer = null; schedule() } }
  const onVisibility = () => {
    if (document.hidden) { stop(); pointer = null; for (const belt of belts) for (const icon of belt.icons) restore(icon) }
    else schedule()
  }
  const onMotion = () => {
    stop()
    pointer = null
    rebuild()
  }
  const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const belt = belts.find((item) => item.viewport === entry.target)
      if (belt) belt.visible = entry.isIntersecting
    }
    lastTime = null
    schedule()
  })
  const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(rebuild)
  for (const belt of belts) {
    observer?.observe(belt.viewport)
    resizeObserver?.observe(belt.viewport)
    const options = { signal: events.signal }
    belt.viewport.addEventListener('pointerdown', (event) => {
      if (motion.matches || !event.isPrimary || event.button !== 0) return
      belt.drag = { id: event.pointerId, startX: event.clientX, startOffset: belt.offset, moved: false }
      belt.viewport.setPointerCapture(event.pointerId)
      belt.viewport.dataset.dragging = 'true'
      lastTime = null
    }, options)
    belt.viewport.addEventListener('pointermove', (event) => {
      const drag = belt.drag
      if (!drag || event.pointerId !== drag.id) return
      const delta = event.clientX - drag.startX
      if (Math.abs(delta) > 5) drag.moved = true
      if (!drag.moved) return
      const bounds = belt.viewport.getBoundingClientRect()
      const scale = belt.viewport.offsetWidth ? bounds.width / belt.viewport.offsetWidth : 1
      moveTo(belt, drag.startOffset - delta / (scale || 1))
    }, options)
    const finishDrag = (event: PointerEvent, cancelled: boolean) => {
      const drag = belt.drag
      if (!drag || drag.id !== event.pointerId) return
      belt.drag = null
      delete belt.viewport.dataset.dragging
      if (!cancelled && !drag.moved) { belt.paused = !belt.paused; updateLabel(belt) }
      lastTime = null
      schedule()
    }
    belt.viewport.addEventListener('pointerup', (event) => finishDrag(event, false), options)
    belt.viewport.addEventListener('pointercancel', (event) => finishDrag(event, true), options)
    belt.viewport.addEventListener('lostpointercapture', (event) => finishDrag(event, true), options)
    belt.viewport.addEventListener('keydown', (event) => {
      if (motion.matches) return
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        if (event.repeat) return
        belt.paused = !belt.paused
        updateLabel(belt)
        lastTime = null
        schedule()
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        moveTo(belt, belt.offset + (event.key === 'ArrowRight' ? 80 : -80))
      }
    }, options)
  }
  window.addEventListener('pointermove', onPointer, { passive: true })
  window.addEventListener('blur', returnToOriginal)
  document.documentElement.addEventListener('pointerleave', returnToOriginal)
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', rebuild)
  document.addEventListener('visibilitychange', onVisibility)
  motion.addEventListener('change', onMotion)
  rebuild()
  void document.fonts.ready.then(() => { if (!disposed) rebuild() })

  return {
    dispose() {
      disposed = true
      stop()
      events.abort()
      observer?.disconnect()
      resizeObserver?.disconnect()
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('blur', returnToOriginal)
      document.documentElement.removeEventListener('pointerleave', returnToOriginal)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', rebuild)
      document.removeEventListener('visibilitychange', onVisibility)
      motion.removeEventListener('change', onMotion)
      for (const belt of belts) {
        for (const icon of belt.icons) restore(icon)
        belt.track.querySelectorAll('[data-skill-copy]').forEach((copy) => copy.remove())
        belt.track.style.transform = ''
      }
    },
  }
}
