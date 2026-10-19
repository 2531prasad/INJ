/* Authored car/robot poses. Hard changes, shared material palette, no sprite crossfades. */
(function (App) {
  'use strict';
  const r8Sheet = { image: new Image(), meta: window.InjR8Frames, ready: false };
  r8Sheet.image.onload = () => {
    r8Sheet.ready = true;
  };
  r8Sheet.image.src = 'assets/r8-sprites-v1.png';
  function sampleR8Animation(f) {
    if (App.game.state === 'transform' && f === App.dummy) {
      return { frame: App.game.t < 0.55 ? 4 : App.game.t < 1.05 ? 6 : App.game.t < 1.6 ? 7 : 8 };
    }
    if (f.state === 'ko' || f.state === 'knockdown' || f.state === 'hurt')
      return { frame: f.form === 'car' ? 4 : 14 };
    if (f.atk) {
      const a = f.atk,
        d = a.def;
      return {
        frame:
          a.t < d.startup
            ? d.prepare
            : a.t < d.startup + d.active
              ? d.frame
              : a.t < d.startup + d.active + d.recovery * 0.45
                ? d.prepare
                : f.form === 'car'
                  ? 0
                  : 8
      };
    }
    if (f.state === 'victory') return { frame: f.form === 'car' ? 0 : 15 };
    if (f.form === 'car') return { frame: f.state === 'dodge' ? 4 : !f.grounded ? 3 : 0 };
    return { frame: f.state === 'block' || f.state === 'dodge' ? 9 : 8 };
  }
  function drawR8(f, ghost = false) {
    if (!r8Sheet.ready) return;
    const { ctx } = App,
      pose = sampleR8Animation(f),
      frame = r8Sheet.meta.frames[pose.frame],
      scale = 112 / r8Sheet.meta.neutralHeight;
    if (!ghost) {
      ctx.save();
      ctx.fillStyle = '#02060a80';
      ctx.beginPath();
      ctx.ellipse(f.x, App.GROUND + 1, f.form === 'car' ? 48 : 25, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.save();
    ctx.translate(f.x, f.y);
    if (f.facing < 0) ctx.scale(-1, 1);
    if (ghost) ctx.globalAlpha = 0.24;
    if (f.flash > 0) ctx.filter = 'brightness(1.5)';
    if (f.state === 'ko') {
      ctx.rotate(-0.16);
    }
    ctx.drawImage(
      r8Sheet.image,
      frame.x,
      frame.y,
      frame.w,
      frame.h,
      -frame.anchorX * scale,
      -frame.anchorY * scale,
      frame.w * scale,
      frame.h * scale
    );
    ctx.restore();
    if (f.atk && f.atk.t < f.atk.def.startup && !App.reducedMotion) {
      // A straight brake-light lane telegraphs the dash; never a hand/floor halo.
      ctx.save();
      ctx.strokeStyle = '#e7bf68aa';
      ctx.lineWidth = 1;
      const reach = f.atk.key === 'r8Dash' ? 95 : 38;
      ctx.beginPath();
      ctx.moveTo(f.x + f.facing * 48, App.GROUND - 2);
      ctx.lineTo(f.x + f.facing * (48 + reach), App.GROUND - 2);
      ctx.stroke();
      ctx.restore();
    }
  }
  function drawR8Health() {
    const f = App.dummy,
      w = App.world.width / 2 - 66,
      x = App.world.width / 2 + 34;
    const { ctx } = App,
      portrait = r8Sheet.meta.frames[f.form === 'car' ? 0 : 8];
    ctx.fillStyle = '#122138';
    ctx.fillRect(App.world.width - 27, 9, 18, 18);
    if (r8Sheet.ready) {
      const s = 16 / Math.max(portrait.w, portrait.h);
      ctx.drawImage(
        r8Sheet.image,
        portrait.x,
        portrait.y,
        portrait.w,
        portrait.h,
        App.world.width - 18 - (portrait.w * s) / 2,
        18 - (portrait.h * s) / 2,
        portrait.w * s,
        portrait.h * s
      );
    }
    const car = f.form === 'car' ? f.hp / f.carMaxHp : 0;
    const robot = f.form === 'robot' ? f.hp / f.robotMaxHp : 1;
    App.drawBar(x, 11, w, 6, car, true, '#185389', '#77c5e8');
    App.drawBar(x, 21, w, 6, robot, true, '#9f7326', '#f2d382');
    App.text(
      f.form === 'car' ? 'I · CAR' : 'II · ASCENDANT',
      App.world.width - 32,
      43,
      4,
      '#edca86',
      'right'
    );
  }
  function drawRim(p, now) {
    const { ctx } = App;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(now * 0.018);
    ctx.fillStyle = '#11151d';
    ctx.strokeStyle = '#edbd5a';
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * 4.6, Math.sin(a) * 4.6);
      ctx.stroke();
    }
    ctx.restore();
  }
  Object.assign(App, { r8Sheet, sampleR8Animation, drawR8, drawR8Health, drawRim });
})(window.INJ);
