/* Blue Velvet / Doraemon atlas ownership, grounded anchors and shrink choreography. */
(function (App) {
  'use strict';
  const teddySheets = {};
  for (const [kind, source] of [
    ['teddy', 'teddy-sprites-v1.png'],
    ['cameo', 'doraemon-sprites-v1.png']
  ]) {
    const sheet = { image: new Image(), meta: window.InjTeddyFrames[kind], ready: false };
    sheet.image.onload = () => {
      sheet.ready = true;
    };
    sheet.image.src = 'assets/' + source;
    teddySheets[kind] = sheet;
  }
  function drawTeddyFrame(kind, index, height) {
    const sheet = teddySheets[kind];
    if (!sheet.ready) return;
    const frame = sheet.meta.frames[index],
      s = height / sheet.meta.neutralHeight;
    App.ctx.drawImage(
      sheet.image,
      frame.x,
      frame.y,
      frame.w,
      frame.h,
      -frame.anchorX * s,
      -frame.anchorY * s,
      frame.w * s,
      frame.h * s
    );
  }
  function sampleTeddyAnimation(f) {
    if (f.state === 'shrinking') return { frame: App.game.t < 1.65 ? 15 : 12 };
    if (['hurt', 'knockdown', 'ko'].includes(f.state)) return { frame: 10 };
    if (f.atk) {
      const a = f.atk,
        d = a.def;
      if (a.t < d.startup) return { frame: d.prepare };
      if (a.t < d.startup + d.active) return { frame: d.pulses && a.pulse % 2 ? 13 : d.frame };
      return { frame: a.t < d.startup + d.active + d.recovery * 0.5 ? d.prepare : 0 };
    }
    if (f.state === 'walk')
      return { frame: 2 + (Math.abs(Math.floor(f.walkPhase / (f.tiny ? 5 : 14))) % 2) };
    return { frame: { block: 1, crouch: 9, jump: 8, victory: 11 }[f.state] ?? 0 };
  }
  function drawTeddy(f, ghost = false) {
    const { ctx } = App,
      height = App.teddyHeight(f),
      pose = sampleTeddyAnimation(f);
    if (!ghost) {
      ctx.save();
      ctx.fillStyle = '#04091780';
      ctx.beginPath();
      ctx.ellipse(f.x, App.GROUND + 1, 29 * f.teddyScale, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(f.facing, 1);
    if (ghost) ctx.globalAlpha *= 0.25;
    if (f.flash > 0) ctx.filter = 'brightness(1.5)';
    if (f.state === 'ko' || f.state === 'knockdown') {
      ctx.translate(0, -height * 0.3);
      ctx.rotate(-1.3);
      ctx.translate(0, height * 0.3);
    }
    if (
      f.atk &&
      f.atk.t >= f.atk.def.startup &&
      f.atk.t < f.atk.def.startup + f.atk.def.active &&
      !App.reducedMotion
    ) {
      if (f.atk.def.frame === 14) {
        // An authored curled pose spins as a whole; there is never a pose dissolve.
        ctx.translate(0, -height * 0.4);
        ctx.rotate((f.atk.t - f.atk.def.startup) * 17);
        ctx.translate(0, height * 0.4);
      } else if (f.atk.def.pulses) ctx.translate(f.atk.pulse % 2 ? 3 : 0, 0);
    }
    drawTeddyFrame('teddy', pose.frame, height);
    ctx.restore();
    if (f.atk && f.atk.t < f.atk.def.startup && !ghost)
      App.text(
        f.atk.def.name,
        App.clamp(f.x, 90, App.world.width - 90),
        Math.max(69, f.y - height - 9),
        4,
        '#b9eaff',
        'center'
      );
  }
  function drawTeddyCameo() {
    if (App.game.state !== 'shrink') return;
    const { ctx, game, dummy: f } = App;
    const side = f.x > App.world.width / 2 ? -1 : 1;
    const x = App.clamp(f.x + side * 112, 38, App.world.width - 38),
      facing = -side;
    const t = game.t,
      frame = t < 0.35 ? 0 : t < 0.7 ? 1 : t < 1.65 ? 2 : 3;
    const grow = App.reducedMotion ? 1 : App.smooth(t / 0.22);
    ctx.save();
    ctx.translate(x, App.GROUND);
    ctx.scale(facing * grow, grow);
    drawTeddyFrame('cameo', frame, 65);
    ctx.restore();
    if (t >= 0.7 && t < 1.65) {
      const sx = x + facing * 32,
        sy = App.GROUND - 38;
      const tx = f.x,
        ty = f.y - App.teddyHeight(f) * 0.48;
      ctx.save();
      if (!App.reducedMotion) {
        const g = ctx.createLinearGradient(sx, sy, tx, ty);
        g.addColorStop(0, '#d9ffb955');
        g.addColorStop(1, '#78f4bc18');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty - 13);
        ctx.lineTo(tx, ty + 13);
        ctx.closePath();
        ctx.fill();
      }
      ctx.strokeStyle = '#caffac';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.restore();
    }
  }
  function drawTeddyHealth() {
    const { ctx, dummy: f } = App;
    App.drawBar(
      App.world.width / 2 + 34,
      12,
      App.world.width / 2 - 66,
      9,
      f.hp / f.maxHp,
      true,
      '#197fba',
      '#a1eaff'
    );
    ctx.save();
    ctx.fillStyle = '#10253b';
    ctx.fillRect(App.world.width - 27, 9, 18, 18);
    ctx.translate(App.world.width - 18, 26);
    drawTeddyFrame('teddy', f.tiny ? 12 : 0, 17);
    ctx.restore();
    if (f.tiny) App.text('TINY TEMPER', App.world.width - 32, 41, 4, '#a1eaff', 'right');
  }
  Object.assign(App, {
    teddySheets,
    drawTeddyFrame,
    sampleTeddyAnimation,
    drawTeddy,
    drawTeddyCameo,
    drawTeddyHealth
  });
})(window.INJ);
