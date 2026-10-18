window.INJ = {};
/* core.js — see docs/architecture.md for ownership and startup order.
 * Cross-module dependencies: none.
 * App is the shared INJ namespace; the exported API is listed at the end. */
(function (App) {
  'use strict';
  /* ============================== setup ============================== */
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  const H = 225,
    GROUND = 198,
    FIGHTER_SCALE = 1.5,
    RENDER_SCALE = 2,
    FIGHTER_HEIGHT = 112,
    DEFAULT_ASPECT = 18 / 9;
  const world = { width: H * DEFAULT_ASPECT };
  const clock = { last: performance.now() };
  ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
  ctx.imageSmoothingEnabled = true;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const smooth = (k) => {
    k = clamp(k, 0, 1);
    return k * k * (3 - 2 * k);
  };
  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Shared audio engine; loaded locally before the game. */
  const Sfx = window.InjAudio;
  const rnd = mulberry32(1993);
  function tint(hex, k) {
    if (!hex || typeof hex !== 'string' || hex.charCodeAt(0) !== 35) return hex || '#ffffff';
    const n = parseInt(hex.slice(1), 16);
    if (isNaN(n)) return hex;
    const r = (n >> 16) & 255,
      g = (n >> 8) & 255,
      b = n & 255;
    const m = (c) => Math.round(c + (255 - c) * clamp(k, 0, 1));
    return 'rgb(' + m(r) + ',' + m(g) + ',' + m(b) + ')';
  }

  Object.assign(App, {
    cv,
    ctx,
    H,
    GROUND,
    FIGHTER_SCALE,
    RENDER_SCALE,
    FIGHTER_HEIGHT,
    DEFAULT_ASPECT,
    world,
    clock,
    clamp,
    lerp,
    smooth,
    mulberry32,
    Sfx,
    rnd,
    tint
  });
})(window.INJ);
