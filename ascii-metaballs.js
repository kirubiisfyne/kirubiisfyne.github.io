// Edit these settings, then reload the page.
const METABALL_CONFIG = {
  backgroundColor: '#090a0f', // Any CSS color, including 'transparent'.
  asciiColor: '#aab7c8',      // Six-digit hex: #RRGGBB.
  cornerReach: 1.28,         // 0.1–0.5: fraction of viewport width/height.
  deformSpeed: 1.2,            // Animation multiplier; 0 freezes deformation.
  maxAlpha: 0.42,            // 0–1: maximum glyph opacity.
  centerFalloff: 3,          // 0 = linear; higher = stronger fade toward center.
  cursorEnabled: true,
  cursorRadius: 240,         // Interaction distance in CSS pixels; must be > 0.
  cursorStrength: 36,        // Maximum attraction in CSS pixels; 0 disables it.
};

/**
 * Mount a fixed ASCII background behind the host's content.
 * The host needs isolation: isolate; avoid transformed ancestors.
 * Returns an idempotent cleanup function for page/component unmounts.
 * Cursor attraction respects the corner/center masks and fades out on leave.
 * Reduced motion disables deformation and cursor response.
 */
export function mountAsciiMetaballs(host = document.body) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:-1';
  canvas.style.backgroundColor = METABALL_CONFIG.backgroundColor;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is unavailable');
  host.prepend(canvas);

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const glyphs = '.·:+*#%@';
  const step = 14;
  const peak = METABALL_CONFIG.maxAlpha;
  const reach = METABALL_CONFIG.cornerReach;
  const falloff = METABALL_CONFIG.centerFalloff;
  const hex = Number.parseInt(METABALL_CONFIG.asciiColor.slice(1), 16);
  const rgb = `${hex >> 16 & 255},${hex >> 8 & 255},${hex & 255}`;
  const colors = Array.from({ length: 128 }, (_, i) =>
    `rgba(${rgb},${(i / 127) * peak})`);
  const blobs = Array.from({ length: 8 }, (_, i) => ({
    corner: i < 4 ? 0 : 1,
    phase: i * 2.39996,
    speed: 0.17 + (i % 4) * 0.037,
    x: 0, y: 0, r2: 0,
  }));
  let width = 0, height = 0, dpr = 0;
  let cells = [], frame = 0, last = 0, time = 0, disposed = false;
  let pointerX = 0, pointerY = 0, pointerActive = false, cursorBlend = 0;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = '12px "JetBrains Mono", "Fira Code", "SF Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    cells = [];
    for (let y = step / 2; y < height; y += step) {
      for (let x = step / 2; x < width; x += step) {
        const corner = x < width / 2 && y < height / 2 ? 0
          : x > width / 2 && y > height / 2 ? 1 : -1;
        if (corner < 0) continue;
        const nx = (corner ? width - x : x) / (width * reach);
        const ny = (corner ? height - y : y) / (height * reach);
        const edge = Math.max(0, 1 - Math.hypot(nx, ny));
        const distance = Math.hypot(2 * x / width - 1, 2 * y / height - 1);
        // Exact zero inside the central ellipse; exponential fade outside it.
        const outside = Math.max(0, (distance - 0.74) / (Math.SQRT2 - 0.74));
        const centerFade = falloff === 0 ? outside
          : Math.expm1(falloff * outside) / Math.expm1(falloff);
        const mask = edge * edge * centerFade;
        if (mask * peak >= 0.01) cells.push({ x, y, corner, mask });
      }
    }
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const reachScale = reach / 0.48;
    const scale = Math.min(width, height) * reachScale;
    for (const blob of blobs) {
      const angle = time * blob.speed + blob.phase;
      let x = width * reachScale * (0.09 + 0.065 * Math.sin(angle));
      let y = height * reachScale * (0.09 + 0.065 * Math.cos(angle * 0.83));
      x = blob.corner ? width - x : x;
      y = blob.corner ? height - y : y;
      const dx = pointerX - x, dy = pointerY - y;
      const distance = Math.hypot(dx, dy);
      const proximity = Math.max(0, 1 - distance / METABALL_CONFIG.cursorRadius);
      const pull = cursorBlend * proximity * proximity
        * Math.min(distance, METABALL_CONFIG.cursorStrength);
      blob.x = x + dx / Math.max(1, distance) * pull;
      blob.y = y + dy / Math.max(1, distance) * pull;
      const radius = scale * (0.065 + 0.012 * Math.sin(angle * 1.31));
      blob.r2 = radius * radius;
    }
    for (const cell of cells) {
      let field = 0;
      for (let i = cell.corner * 4; i < cell.corner * 4 + 4; i++) {
        const blob = blobs[i];
        const dx = cell.x - blob.x, dy = cell.y - blob.y;
        field += blob.r2 / Math.max(1, dx * dx + dy * dy);
      }
      if (field < 0.01) continue;
      const intensity = 1 - Math.exp(-1.3 * Math.max(0, field - 0.35));
      const alpha = peak * cell.mask * intensity;
      if (alpha < 0.01) continue;
      ctx.fillStyle = colors[Math.round(alpha / peak * 127)];
      ctx.fillText(glyphs[Math.min(7, Math.floor(intensity * 8))], cell.x, cell.y);
    }
  }

  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    time += dt * METABALL_CONFIG.deformSpeed;
    const ease = 1 - Math.exp(-dt * 5);
    cursorBlend += ((pointerActive ? 1 : 0) - cursorBlend) * ease;
    if (dpr !== (window.devicePixelRatio || 1)) resize();
    else draw();
    frame = requestAnimationFrame(tick);
  }

  function syncMotion() {
    cancelAnimationFrame(frame);
    last = 0;
    if (motion.matches) {
      time = 0;
      cursorBlend = 0;
      draw();
    } else if (!document.hidden) {
      frame = requestAnimationFrame(tick);
    }
  }

  function onPointer(event) {
    if (motion.matches || !METABALL_CONFIG.cursorEnabled) return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    pointerActive = true;
  }
  function resetPointer() { pointerActive = false; }

  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('blur', resetPointer);
  document.documentElement.addEventListener('pointerleave', resetPointer);
  document.addEventListener('visibilitychange', syncMotion);
  motion.addEventListener('change', syncMotion);
  resize();
  syncMotion();

  return function destroy() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('blur', resetPointer);
    document.documentElement.removeEventListener('pointerleave', resetPointer);
    document.removeEventListener('visibilitychange', syncMotion);
    motion.removeEventListener('change', syncMotion);
    canvas.remove();
    cells = [];
  };
}
