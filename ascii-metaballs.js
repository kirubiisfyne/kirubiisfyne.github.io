// Edit these settings, then reload the page.
// Masks affect visibility only; the two clusters keep their corner-based motion.
const METABALL_CONFIG = {
  backgroundColor: '2', // Any CSS color, including 'transparent'.
  asciiColor: '#EBEBEB',      // Six-digit hex: #RRGGBB.
  deformSpeed: 1,            // Animation multiplier; 0 freezes deformation.
  maxAlpha: 0.3,            // 0–1: maximum glyph opacity.
  // ~70% occupied cells at 1440x900; motion and aspect ratio affect coverage.
  blobDiameterMin: 0.47,    // >= 0: fraction of shorter viewport side; 0.1 = 10%.
  blobDiameterMax: 0.53,    // >= min; set both equal for a fixed diameter.
  // These size individual field sources; merged shapes can appear larger.

  cornerMaskEnabled: false, // Enable only for corner coverage (at most 50%).
  cornerReach: 5.2,         // > 0: coverage relative to viewport width/height.
  cornerFeather: 0.4,      // 0–0.5: fade before quadrant edges; 0 = hard edge.

  centerDeadzoneEnabled: true,
  centerDeadzoneRadius: 0.1, // 0–1.42: normalized radius; larger = more empty space.
  // Radius units: 1 reaches edge midpoints; sqrt(2) reaches viewport corners.
  centerDeadzoneFeather: 0.6, // >= 0: fade width outside radius; 0 = hard edge.
  centerFalloff: 2,       // >= 0: higher = stronger fade; 0 = linear curve.

  cursorEnabled: true,
  cursorRadius: 240,         // Interaction distance in CSS pixels; must be > 0.
  cursorStrength: 12,        // Maximum attraction in CSS pixels; 0 disables it.
};

/**
 * Mount a fixed ASCII background behind the host's content.
 * The host needs isolation: isolate; avoid transformed ancestors.
 * Returns an idempotent cleanup function for page/component unmounts.
 * Two clusters orbit the top-left and bottom-right corners and follow the cursor.
 * Corner and center masks are independent; disable either in METABALL_CONFIG.
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
  const minRadius = METABALL_CONFIG.blobDiameterMin / 2;
  const radiusRange = (METABALL_CONFIG.blobDiameterMax
    - METABALL_CONFIG.blobDiameterMin) / 2;
  const hex = Number.parseInt(METABALL_CONFIG.asciiColor.slice(1), 16);
  const rgb = `${hex >> 16 & 255},${hex >> 8 & 255},${hex & 255}`;
  const colors = Array.from({ length: 128 }, (_, i) =>
    `rgba(${rgb},${(i / 127) * peak})`);
  const blobs = Array.from({ length: 8 }, (_, i) => ({
    corner: i < 4 ? 0 : 1,
    phase: i * 2.39996,
    speed: 0.28 + (i % 4) * 0.045,
    x: 0, y: 0, r2: 0,
  }));
  let width = 0, height = 0, dpr = 0;
  let cells = [], frame = 0, last = 0, time = 0, disposed = false;
  let pointerX = 0, pointerY = 0, pointerActive = false, cursorBlend = 0;

  function smoothstep(value) {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  }

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
        let mask = 1;
        if (METABALL_CONFIG.cornerMaskEnabled) {
          // Keep complete glyph cells inside the two supported quadrants.
          const corner = x + step / 2 <= width / 2 && y + step / 2 <= height / 2 ? 0
            : x - step / 2 >= width / 2 && y - step / 2 >= height / 2 ? 1 : -1;
          if (corner < 0) continue;
          const localX = (corner ? width - x : x) / width;
          const localY = (corner ? height - y : y) / height;
          const edge = Math.max(0, 1
            - Math.hypot(localX, localY) / METABALL_CONFIG.cornerReach);
          const feather = METABALL_CONFIG.cornerFeather;
          const boundaryFade = feather === 0 ? 1
            : smoothstep((0.5 - localX) / feather)
              * smoothstep((0.5 - localY) / feather);
          mask *= edge * edge * boundaryFade;
        }
        if (METABALL_CONFIG.centerDeadzoneEnabled) {
          // Radius 1 reaches the midpoint of an edge; sqrt(2) reaches a corner.
          const distance = Math.hypot(2 * x / width - 1, 2 * y / height - 1);
          const radius = METABALL_CONFIG.centerDeadzoneRadius;
          const feather = METABALL_CONFIG.centerDeadzoneFeather;
          const outside = feather === 0 ? Number(distance > radius)
            : Math.max(0, Math.min(1, (distance - radius) / feather));
          const falloff = METABALL_CONFIG.centerFalloff;
          const centerFade = falloff === 0 ? outside
            : Math.expm1(falloff * outside) / Math.expm1(falloff);
          mask *= smoothstep(centerFade * 2);
        }
        if (mask * peak >= 0.01) cells.push({ x, y, mask });
      }
    }
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const scale = Math.min(width, height);
    for (const blob of blobs) {
      const angle = time * blob.speed + blob.phase;
      let x = width * (0.13 + 0.11 * Math.sin(angle));
      let y = height * (0.13 + 0.11 * Math.cos(angle * 0.83));
      x = blob.corner ? width - x : x;
      y = blob.corner ? height - y : y;
      const dx = pointerX - x, dy = pointerY - y;
      const distance = Math.hypot(dx, dy);
      const proximity = Math.max(0, 1 - distance / METABALL_CONFIG.cursorRadius);
      const pull = cursorBlend * proximity * proximity
        * Math.min(distance, METABALL_CONFIG.cursorStrength);
      blob.x = x + dx / Math.max(1, distance) * pull;
      blob.y = y + dy / Math.max(1, distance) * pull;
      const growth = 0.5 + 0.5 * Math.sin(angle * 1.31);
      const radius = scale * (minRadius + radiusRange * growth);
      blob.r2 = radius * radius;
    }
    for (const cell of cells) {
      let field = 0;
      for (const blob of blobs) {
        const dx = cell.x - blob.x, dy = cell.y - blob.y;
        field += blob.r2 / Math.max(1, dx * dx + dy * dy);
      }
      if (field <= 0.8) continue;
      // A soft isocontour reveals merging lobes with transparent edges.
      const intensity = smoothstep((field - 0.8) / 1.4);
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
