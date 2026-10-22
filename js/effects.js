/* effects.js — see docs/architecture.md for ownership and startup order.
 * Cross-module dependencies: arena.js, combat.js, content.js, core.js, state.js.
 * App is the shared INJ namespace; the exported API is listed at the end. */
(function (App) {
  'use strict';
  function hitSpark(x, y, big) {
    for (let i = 0; i < (big ? 10 : 6); i++) {
      const a = App.rnd() * 6.2832,
        s = (big ? 130 : 85) * (0.4 + App.rnd());
      App.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.22,
        max: 0.22,
        col: '#fff2c8',
        size: big ? 2.6 : 1.8,
        g: 0
      });
    }
  }
  function blockSpark(x, y) {
    for (let i = 0; i < 7; i++) {
      const a = -1.2 + (App.rnd() - 0.5) * 1.8,
        s = 70 + App.rnd() * 70;
      App.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.2,
        max: 0.2,
        col: '#cfe4ff',
        size: 1.8,
        g: 0
      });
    }
  }
  function bloodBurst(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI * 0.5 + (App.rnd() - 0.5) * 2.5,
        s = 45 + App.rnd() * 140;
      App.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.55 + App.rnd() * 0.5,
        max: 1,
        col: App.rnd() > 0.5 ? '#c2242c' : '#8e1620',
        size: 1 + App.rnd() * 2.3,
        g: 1
      });
    }
  }
  function dust(x, y) {
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI * 0.5 + (App.rnd() - 0.5) * 1.6,
        s = 25 + App.rnd() * 45;
      App.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.34,
        max: 0.34,
        col: 'rgba(196,176,150,0.7)',
        size: 1.6 + App.rnd() * 1.8,
        g: 0.25
      });
    }
  }
  /* ============================== projectiles / particles ============================== */
  function updateProjectiles(dt) {
    for (let i = App.projectiles.length - 1; i >= 0; i--) {
      const p = App.projectiles[i];
      p.x += p.vx * dt;
      p.y += (p.vy || 0) * dt;
      p.life -= dt;
      if (App.rnd() < 0.6)
        App.particles.push({
          x: p.x,
          y: p.y,
          vx: -p.vx * 0.06 + (App.rnd() - 0.5) * 30,
          vy: (App.rnd() - 0.5) * 30,
          life: 0.28,
          max: 0.28,
          col: App.rnd() > 0.5 ? '#b3232c' : '#e0603c',
          size: 1.4 + App.rnd() * 1.6,
          g: 0
        });
      let target = p.owner === App.player ? App.dummy : App.player;
      const minion = App.giantEncounter.minion;
      if (p.owner === App.player && minion && minion.hp > 0) {
        const b = App.hurtbox(minion);
        if (p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h) target = minion;
      }
      const ub = App.hurtbox(target);
      if (p.x > ub.x && p.x < ub.x + ub.w && p.y > ub.y && p.y < ub.y + ub.h) {
        const move =
          p.move ||
          (p.charged
            ? { ...App.MOVES.toss, key: 'shadow', dmg: 18, kb: 175, heavy: true, knockdown: true }
            : App.MOVES.toss);
        App.applyHit(target, p.owner, move, p.x, p.y);
        if (App.game.state !== 'fight') return;
        App.projectiles.splice(i, 1);
        continue;
      }
      if (p.life <= 0 || p.x < -20 || p.x > App.fightWidth() + 20) {
        App.projectiles.splice(i, 1);
      }
    }
  }
  function updateParticles(dt) {
    for (let i = App.particles.length - 1; i >= 0; i--) {
      const p = App.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        App.particles.splice(i, 1);
        continue;
      }
      p.vy += (p.g || 0) * 700 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.g && p.y >= App.GROUND - 1) {
        if (p.col.charAt(0) === '#') {
          App.bctx.fillStyle = p.col;
          App.bctx.fillRect(Math.round(p.x) - 1, App.GROUND - 2, 2 + Math.round(App.rnd() * 3), 2);
        }
        App.particles.splice(i, 1);
      }
    }
  }

  Object.assign(App, {
    hitSpark,
    blockSpark,
    bloodBurst,
    dust,
    updateProjectiles,
    updateParticles
  });
})(window.INJ);
