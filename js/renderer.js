/* renderer.js — see docs/architecture.md for ownership and startup order.
 * Cross-module dependencies: arena.js, core.js, fighters.js, state.js, teddy-renderer.js.
 * App is the shared INJ namespace; the exported API is listed at the end. */
(function (App) {
  'use strict';
  function text(str, x, y, size, col, align) {
    App.ctx.font = size + 'px "Press Start 2P", monospace';
    App.ctx.textAlign = align || 'left';
    App.ctx.textBaseline = 'alphabetic';
    App.ctx.fillStyle = 'rgba(8,5,8,0.9)';
    App.ctx.fillText(str, x + 1.2, y + 1.2);
    App.ctx.fillStyle = col;
    App.ctx.fillText(str, x, y);
  }
  function drawBar(x, y, w, h, pct, flip, c1, c2) {
    App.ctx.fillStyle = '#120b0b';
    App.ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    App.ctx.fillStyle = '#3a2222';
    App.ctx.fillRect(x, y, w, h);
    const fw = Math.round(w * App.clamp(pct, 0, 1));
    const g = App.ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, c2);
    g.addColorStop(1, c1);
    App.ctx.fillStyle = g;
    App.ctx.fillRect(flip ? x + w - fw : x, y, fw, h);
    App.ctx.fillStyle = 'rgba(255,255,255,0.16)';
    App.ctx.fillRect(x, y, w, 2);
  }
  function drawVictory() {
    const { ctx, game } = App;
    ctx.save();
    ctx.drawImage(App.bg, 0, 0, App.world.width, App.H);
    ctx.fillStyle = '#0c0914b8';
    ctx.fillRect(0, 0, App.world.width, App.H);
    ctx.globalAlpha = 0.24;
    App.drawFighter({
      ...App.dummy,
      x: App.world.width * 0.78,
      y: App.GROUND,
      state: 'ko',
      atk: null,
      grounded: true,
      flash: 0
    });
    ctx.globalAlpha = 1;
    if (!App.reducedMotion) {
      for (let i = 0; i < 16; i++) {
        const x = (i * 53 + 23) % App.world.width,
          y = (i * 31 + game.t * (13 + (i % 4))) % App.H;
        ctx.fillStyle = i % 3 ? '#eacb7b88' : '#fff1c388';
        ctx.fillRect(x, y, i % 2 ? 1 : 2, 2);
      }
    }
    const x = App.world.width * 0.25,
      zoom = App.reducedMotion ? 1.12 : 1 + App.smooth(game.t / 0.8) * 0.12;
    ctx.save();
    ctx.translate(x, App.GROUND);
    ctx.scale(zoom, zoom);
    ctx.translate(-x, -App.GROUND);
    App.drawFighter({
      ...App.player,
      x,
      y: App.GROUND,
      facing: 1,
      state: 'victory',
      atk: null,
      grounded: true,
      flash: 0,
      invuln: 0
    });
    ctx.restore();
    ctx.fillStyle = '#08060dcc';
    ctx.fillRect(0, 0, App.world.width, 8);
    ctx.fillRect(0, App.H - 8, App.world.width, 8);
    ctx.restore();
  }
  function render(now) {
    if (App.game.state === 'victory') {
      drawVictory();
      return;
    }
    // Repaint the full frame so camera shake cannot leave stale pixels at the edges.
    App.ctx.drawImage(App.bg, 0, 0, App.world.width, App.H);
    App.ctx.save();
    App.ctx.translate(App.game.shakeX, App.game.shakeY);
    App.ctx.drawImage(App.bg, 0, 0, App.world.width, App.H);
    // Keep the painted stage, terrace duel and atmosphere in the same camera.
    App.ctx.save();
    const arenaScale = App.world.width / 400;
    App.ctx.translate(0, App.GROUND * (1 - arenaScale));
    App.ctx.scale(arenaScale, arenaScale);
    App.drawStageDuel(now);
    App.drawArenaAtmosphere(now);
    App.ctx.restore();
    App.ctx.drawImage(App.bloodCv, 0, 0, App.world.width, App.H);

    for (const ghost of App.afterimages) {
      App.ctx.save();
      App.ctx.globalAlpha = (ghost.life / ghost.max) * (ghost.f.nitroEcho ? 0.42 : 0.25);
      App.drawFighter(ghost.f, true);
      App.ctx.restore();
    }

    App.drawFighter(App.dummy);
    App.drawFighter(App.player);
    App.drawTeddyCameo();

    for (const p of App.projectiles) {
      if (p.style === 'rim') {
        App.drawRim(p, now);
        continue;
      }
      const radius = p.charged ? 16 : 12;
      const g = App.ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, radius);
      g.addColorStop(0, p.charged ? '#ffe7a4' : '#c2a6ed');
      g.addColorStop(0.4, p.charged ? '#a37635' : '#594275');
      g.addColorStop(1, 'rgba(58,30,65,0)');
      App.ctx.fillStyle = g;
      App.ctx.beginPath();
      App.ctx.arc(p.x, p.y, radius, 0, 6.2832);
      App.ctx.fill();
      App.ctx.fillStyle = p.charged ? '#fff0c4' : '#e2d3ff';
      App.ctx.beginPath();
      App.ctx.arc(p.x, p.y, p.charged ? 4 : 3, 0, 6.2832);
      App.ctx.fill();
      App.ctx.strokeStyle = p.charged ? '#e9bb56' : '#9c81ba';
      App.ctx.lineWidth = 1;
      App.ctx.beginPath();
      App.ctx.arc(p.x, p.y, radius * 0.58, now * 0.01, now * 0.01 + Math.PI * 1.4);
      App.ctx.stroke();
    }
    for (const p of App.particles) {
      App.ctx.globalAlpha = App.clamp(p.life / p.max, 0, 1);
      App.ctx.fillStyle = p.col;
      App.ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    App.ctx.globalAlpha = 1;
    App.ctx.restore();

    /* HUD */
    // INJ avatar & frame
    App.ctx.fillStyle = '#0c0c10';
    App.ctx.fillRect(8, 8, 20, 20);
    App.ctx.strokeStyle = '#d9a441';
    App.ctx.lineWidth = 1;
    App.ctx.strokeRect(8, 8, 20, 20);
    if (App.injAvatarImg.complete && App.injAvatarImg.naturalWidth > 0) {
      App.ctx.drawImage(App.injAvatarImg, 9, 9, 18, 18);
    } else {
      App.ctx.fillStyle = '#1c1c24';
      App.ctx.fillRect(9, 9, 18, 18);
      App.ctx.fillStyle = '#e9dcc4';
      App.ctx.beginPath();
      App.ctx.arc(18, 18, 5, 0, 6.2832);
      App.ctx.fill();
    }

    // DUMMY avatar & frame
    App.ctx.fillStyle = '#0c0c10';
    App.ctx.fillRect(App.world.width - 28, 8, 20, 20);
    App.ctx.strokeStyle = '#7a5a36';
    App.ctx.lineWidth = 1;
    App.ctx.strokeRect(App.world.width - 28, 8, 20, 20);
    App.ctx.fillStyle = '#9c7c4c';
    App.ctx.fillRect(App.world.width - 27, 9, 18, 18);
    App.ctx.fillStyle = '#cbb287';
    App.ctx.beginPath();
    App.ctx.arc(App.world.width - 18, 18, 5, 0, 6.2832);
    App.ctx.fill();
    App.ctx.strokeStyle = '#4c3a24';
    App.ctx.beginPath();
    App.ctx.moveTo(App.world.width - 22, 16);
    App.ctx.lineTo(App.world.width - 14, 20);
    App.ctx.stroke();

    drawBar(
      32,
      12,
      App.world.width / 2 - 66,
      9,
      App.player.hp / App.player.maxHp,
      false,
      '#b3232c',
      '#e8b24c'
    );
    if (App.isR8(App.dummy)) App.drawR8Health();
    else if (App.isTeddy(App.dummy)) App.drawTeddyHealth();
    else
      drawBar(
        App.world.width / 2 + 34,
        12,
        App.world.width / 2 - 66,
        9,
        App.dummy.hp / App.dummy.maxHp,
        true,
        '#b3232c',
        '#e8b24c'
      );
    text(App.player.name, 32, 32, 7, '#e8d9b0', 'left');
    text(App.dummy.name, App.world.width - 32, 32, 7, '#e8d9b0', 'right');
    if (App.isAwakened(App.dummy))
      text('AWAKENED', App.world.width - 32, 41, 4, '#ff9275', 'right');
    for (let i = 0; i < 3; i++) {
      App.ctx.fillStyle = App.player.charge > i ? '#edc878' : '#544354';
      App.ctx.fillRect(32 + i * 8, 37, 5, 2);
    }
    if (App.player.charge >= 3) text('SHADOW +', 60, 40, 4, '#edc878');
    const meterWidth = Math.min(90, App.world.width / 2 - 66);
    drawBar(32, 47, meterWidth, 4, App.player.meter / 100, false, '#624178', '#cfabe8');
    text(
      App.player.meter >= 100 ? 'NITRO READY' : 'NITRO',
      32,
      59,
      4,
      App.player.meter >= 100 ? '#edc878' : '#cfabe8'
    );
    text(
      String(Math.ceil(App.game.roundTime)).padStart(2, '0'),
      App.world.width / 2,
      26,
      13,
      '#e8b24c',
      'center'
    );
    text(
      App.player.teleportCooldown > 0
        ? 'BLINK ' + Math.ceil(App.player.teleportCooldown) + 's'
        : 'BLINK E · READY',
      32,
      68,
      4,
      '#c4b0f3'
    );
    if (App.game.hits > 1 && App.game.hitTimer > 0) {
      const x = App.world.width / 2;
      text(App.game.hits + ' HIT KOMBO', x, 46, 8, '#f4d59a', 'center');
      text(
        'x' + (1 + (App.game.hits - 1) / 10).toFixed(1) + ' DAMAGE',
        x,
        61,
        9,
        '#ffad75',
        'center'
      );
    }

    if (App.game.msg) {
      text(
        App.game.msg.text,
        App.world.width / 2,
        112,
        App.game.msg.big || 14,
        '#f0d27a',
        'center'
      );
      if (App.game.msg.sub)
        text(App.game.msg.sub, App.world.width / 2, 126, 8, '#e8d9b0', 'center');
    }
  }

  Object.assign(App, { text, drawBar, render });
})(window.INJ);
