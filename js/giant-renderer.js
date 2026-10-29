/* Kingdom of Giants camera, hard-switched authored boss poses, tells and boss HUD.
 * Dependencies: core.js, state.js, arena.js, giant.js, teddy-renderer.js, fighters.js, renderer.js.
 * Registration only. Gameplay, damage and summons stay in giant.js/shared combat. */
(function (App) {
  'use strict';
  function giantCamera() {
    if (App.reducedMotion || App.game.state !== 'enlarge') return App.GIANT_TUNING.zoom;
    return App.lerp(1, App.GIANT_TUNING.zoom, App.smooth((App.game.t - 1.1) / 2.2));
  }
  function giantScreenX(x) {
    return App.world.width / 2 + (x - App.fightWidth() / 2) * giantCamera();
  }
  function giantPose(f) {
    if (f.state === 'ko' || f.burstStun > 0) return { kind: 'teddy', frame: 10 };
    if (f.state === 'walk') return App.sampleTeddyAnimation(f);
    const a = f.atk;
    if (a?.key === 'colossusSmash')
      return { kind: 'giant', frame: a.t < a.def.startup ? 0 : a.t < a.def.startup + 0.28 ? 1 : 2 };
    if (a?.key === 'colossusStomp') return { kind: 'teddy', frame: a.t < a.def.startup ? 3 : 12 };
    if (a?.key === 'colossusStars') return { kind: 'teddy', frame: 11 };
    if (f.state === 'relax' || a?.key === 'colossusSummon') return { kind: 'giant', frame: 3 };
    return { kind: 'teddy', frame: 0 };
  }
  function drawGiant(f, ghost = false) {
    const { ctx } = App,
      pose = giantPose(f),
      height = App.teddyHeight(f);
    if (!ghost) {
      ctx.save();
      ctx.fillStyle = '#130e2899';
      ctx.beginPath();
      ctx.ellipse(f.x, App.GROUND + 1, 31 * f.teddyScale, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(f.facing, 1);
    if (f.state === 'ko') {
      ctx.translate(0, -height * 0.2);
      ctx.rotate(-1.25);
      ctx.translate(0, height * 0.2);
    }
    if (f.flash > 0) ctx.filter = 'brightness(1.16)';
    if (ghost) ctx.globalAlpha *= 0.25;
    App.drawTeddyFrame(pose.kind || 'teddy', pose.frame, height);
    ctx.restore();
  }
  function drawGiantCameo() {
    if (App.game.state !== 'enlarge') return;
    const { ctx, dummy: f, game } = App,
      t = game.t;
    if (t > 3.9) return;
    const x = f.x - 150,
      frame = t < 0.45 ? 0 : t < 1 ? 1 : t < 2.95 ? 2 : 3;
    const size = App.reducedMotion ? 1 : App.smooth(t / 0.35) * (1 - App.smooth((t - 3.55) / 0.35));
    ctx.save();
    ctx.translate(x, App.GROUND);
    ctx.scale(size, size);
    App.drawTeddyFrame('cameo', frame, 65);
    ctx.restore();
    if (t >= 1 && t < 2.95) {
      const sx = x + 32,
        sy = App.GROUND - 38,
        tx = f.x,
        ty = f.y - App.teddyHeight(f) * 0.5;
      ctx.save();
      ctx.fillStyle = '#e9d28d26';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty - 32);
      ctx.lineTo(tx, ty + 32);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fff2b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      if (!App.reducedMotion)
        for (let i = 0; i < 9; i++) {
          const p = (t * 1.4 + i / 9) % 1;
          ctx.fillStyle = '#fff2bd';
          ctx.fillRect(App.lerp(sx, tx, p), App.lerp(sy, ty, p) - Math.sin(p * Math.PI) * 9, 2, 2);
        }
      ctx.restore();
    }
  }
  function drawGiantTells() {
    const { ctx, dummy: f, giantEncounter: scene } = App,
      a = f.atk;
    ctx.save();
    if (a?.key === 'colossusSmash' && a.t < a.def.startup + a.def.active) {
      const x = f.facing > 0 ? f.x + 12 : f.x - 262;
      ctx.fillStyle = a.directionLocked ? '#ffad733b' : '#f0d99a1a';
      ctx.fillRect(x, App.GROUND - 4, 250, 5);
      ctx.strokeStyle = a.directionLocked ? '#ffbc85' : '#efce88';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, App.GROUND + 1);
      ctx.lineTo(x + 250, App.GROUND + 1);
      ctx.stroke();
      // Small fixed chevrons make committed direction readable without pulsing.
      for (let i = 0; i < 4; i++) {
        const tx = x + 26 + i * 57;
        ctx.beginPath();
        ctx.moveTo(tx - f.facing * 5, App.GROUND - 9);
        ctx.lineTo(tx, App.GROUND - 6);
        ctx.lineTo(tx - f.facing * 5, App.GROUND - 3);
        ctx.stroke();
      }
    }
    for (const h of scene.hazards) {
      if (h.type === 'wave') {
        ctx.strokeStyle = '#ffe7a0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(h.x, App.GROUND, 13, 22, 0, Math.PI, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#c7a35c99';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(h.x - Math.sign(h.vx) * 10, App.GROUND, 18, 15, 0, Math.PI, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#f8d78f';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(h.x, App.GROUND - 1, 23, 4, 0, 0, Math.PI * 2);
        ctx.stroke();
        if (h.t > h.delay) {
          ctx.fillStyle = '#fff0ac';
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4 - Math.PI / 2,
              radius = i % 2 ? 6 : 17;
            ctx.lineTo(h.x + Math.cos(angle) * radius, h.y + Math.sin(angle) * radius);
          }
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = '#ffe5a7';
          ctx.fillRect(h.x - 1, App.GROUND - 19, 2, 10);
        }
      }
    }
    const impact = scene.impact;
    if (impact) {
      ctx.globalAlpha = impact.life / impact.max;
      ctx.strokeStyle = '#efcf9a';
      ctx.lineWidth = 2;
      const radius = App.reducedMotion ? 38 : 12 + (1 - impact.life / impact.max) * 84;
      ctx.beginPath();
      ctx.ellipse(impact.x, App.GROUND, radius, radius * 0.12, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
  function drawGiantHUD() {
    const { ctx, game, dummy: f } = App,
      w = App.world.width;
    const reveal = game.state === 'enlarge' ? App.smooth((game.t - 3) / 0.65) : 1;
    ctx.save();
    const shade = ctx.createLinearGradient(0, 0, 0, 63);
    shade.addColorStop(0, '#120e24fa');
    shade.addColorStop(0.65, '#120e24dc');
    shade.addColorStop(1, '#120e2400');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, w, 63);
    App.text('INJ', 13, 12, 5, '#f3e1b9');
    App.drawBar(13, 17, 86, 4, App.player.hp / App.player.maxHp, false, '#9c344d', '#efb99e');
    App.text(
      game.state === 'enlarge' && game.t < 2.9 ? "DORAEMON'S SECOND ACT" : 'VELVET COLOSSUS',
      w / 2,
      12,
      7,
      '#f6dfac',
      'center'
    );
    App.text('KINGDOM OF GIANTS', w / 2, 21, 3.8, '#bbabc9', 'center');
    App.text(Math.ceil(f.hp) + ' / ' + f.maxHp, w - 14, 22, 4, '#e9d5a8', 'right');
    ctx.globalAlpha = reveal;
    const x = 14,
      width = w - 28,
      y = 29;
    ctx.fillStyle = '#0a0914';
    ctx.fillRect(x - 2, y - 2, width + 4, 11);
    ctx.strokeStyle = '#b79a64';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x - 2, y - 2, width + 4, 11);
    ctx.fillStyle = '#7d5267';
    ctx.fillRect(x, y, (width * App.giantEncounter.hpTrail) / f.maxHp, 7);
    const fill = ctx.createLinearGradient(0, y, 0, y + 7);
    fill.addColorStop(0, '#d5f3ed');
    fill.addColorStop(0.45, '#80b5c9');
    fill.addColorStop(1, '#3b567e');
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, (width * f.hp) / f.maxHp, 7);
    ctx.fillStyle = '#f4dfb8';
    for (const edge of [x - 5, x + width + 5]) {
      ctx.beginPath();
      ctx.moveTo(edge, y - 3);
      ctx.lineTo(edge + 3, y + 3.5);
      ctx.lineTo(edge, y + 10);
      ctx.lineTo(edge - 3, y + 3.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#161326aa';
    for (let i = 1; i < 4; i++) ctx.fillRect(x + (width * i) / 4, y, 1, 7);
    ctx.globalAlpha = 1;
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = App.player.charge > i ? '#f5d390' : '#65506d';
      ctx.fillRect(14 + i * 7, 44, 4, 2);
    }
    App.drawBar(43, 43, 47, 3, App.player.meter / 100, false, '#624178', '#cfabe8');
    App.text(App.player.meter >= 100 ? 'NITRO READY' : 'NITRO', 96, 47, 3.5, '#ddc3eb');
    App.text(
      App.player.teleportCooldown > 0
        ? 'BLINK ' + Math.ceil(App.player.teleportCooldown) + 's'
        : 'BLINK READY',
      w - 14,
      47,
      4,
      '#d1bde9',
      'right'
    );
    if (f.atk) {
      const a = f.atk,
        locked = a.key === 'colossusSmash' && a.directionLocked && a.t < a.def.startup;
      App.text(
        a.def.name + (locked ? ' · LOCKED' : ''),
        w / 2,
        58,
        5.5,
        locked ? '#ffbc85' : '#f4da9d',
        'center'
      );
      App.text(
        a.t < a.def.startup
          ? a.def.hint
          : a.key === 'colossusSummon'
            ? 'TEDDY RESTS · WATCH THE ECHO'
            : a.key === 'colossusStars'
              ? 'MOVE OFF THE GOLD MARKS'
              : a.key === 'colossusStomp'
                ? 'JUMP OR GUARD THE WAVES'
                : a.t < a.def.startup + a.def.active
                  ? 'IMPACT · HOLD GUARD'
                  : 'RECOVERING · YOUR OPENING',
        w / 2,
        66,
        4.3,
        '#ddd0df',
        'center'
      );
    } else if (f.state === 'relax')
      App.text('ROYAL RECESS · ECHO SUMMONED', w / 2, 58, 4, '#f2d99f', 'center');
    if (game.hits > 1 && game.hitTimer > 0) {
      App.text(
        game.hits + ' HIT  x' + (1 + (game.hits - 1) / 10).toFixed(1),
        w / 2,
        79,
        6,
        '#ffe0aa',
        'center'
      );
    }
    if (game.state === 'enlarge') {
      App.text(
        game.t < 1
          ? 'ONE MORE GADGET...'
          : game.t < 3
            ? 'ENLARGE RAY'
            : 'A KINGDOM BUILT FOR GIANTS',
        w / 2,
        78,
        game.t < 3 ? 7 : 5,
        '#fff1c7',
        'center'
      );
    }
    ctx.restore();
  }
  function renderGiant(now) {
    const { ctx, game, giantEncounter: scene } = App,
      zoom = giantCamera(),
      w = App.world.width;
    ctx.save();
    // The plate starts cropped; the same pullback reveals its monumental edges.
    const plateZoom = zoom / App.GIANT_TUNING.zoom;
    ctx.translate(w / 2, App.GROUND);
    ctx.scale(plateZoom, plateZoom);
    ctx.translate(-w / 2, -App.GROUND);
    ctx.drawImage(App.bg, 0, 0, w, App.H);
    ctx.restore();
    ctx.save();
    ctx.translate(game.shakeX, game.shakeY);
    ctx.translate(w / 2, App.GROUND);
    ctx.scale(zoom, zoom);
    ctx.translate(-App.fightWidth() / 2, -App.GROUND);
    drawGiantTells();
    App.drawFighter(App.dummy);
    const echo = scene.minion;
    if (echo) {
      ctx.save();
      if (echo.state === 'ko') ctx.globalAlpha = Math.max(0, echo.deadT / 0.55);
      if (echo.spawnT < 0.65 && echo.hp > 0) {
        ctx.strokeStyle = '#f9dda3';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(echo.x, App.GROUND, 34, 6, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.save();
      const appear = App.reducedMotion || echo.state === 'ko' ? 1 : App.smooth(echo.spawnT / 0.4);
      ctx.translate(echo.x, App.GROUND);
      ctx.scale(appear, appear);
      ctx.translate(-echo.x, -App.GROUND);
      App.drawFighter(echo);
      ctx.restore();
      if (echo.hp > 0)
        App.drawBar(
          echo.x - 24,
          echo.y - 119,
          48,
          3,
          echo.hp / echo.maxHp,
          false,
          '#947140',
          '#efdb9c'
        );
      ctx.restore();
    }
    for (const ghost of App.afterimages) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ghost.life / ghost.max) * 0.3;
      App.drawFighter(ghost.f, true);
      ctx.restore();
    }
    App.drawFighter(App.player);
    drawGiantCameo();
    for (const p of App.projectiles) {
      ctx.fillStyle = p.charged ? '#ffe6a1' : '#c3a9e8';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.charged ? 8 : 5, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const p of App.particles) {
      ctx.globalAlpha = App.clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.col;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.restore();
    if (game.state === 'victory') {
      ctx.fillStyle = '#100b24b8';
      ctx.fillRect(0, 0, w, App.H);
      ctx.save();
      ctx.translate(w * 0.25, App.GROUND);
      ctx.scale(1.12, 1.12);
      ctx.translate(-App.player.x, -App.GROUND);
      App.drawFighter({
        ...App.player,
        state: 'victory',
        atk: null,
        grounded: true,
        y: App.GROUND
      });
      ctx.restore();
    } else {
      drawGiantHUD();
      if (game.state === 'ko' && game.msg)
        App.text(game.msg.text, w / 2, 108, 10, '#f5d99f', 'center');
    }
  }
  Object.assign(App, { giantCamera, giantScreenX, giantPose, drawGiant, renderGiant });
})(window.INJ);
