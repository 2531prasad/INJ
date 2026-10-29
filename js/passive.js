/* Colossus reward: a three-hit escape using existing fighter art.
 * Runtime dependencies: state.js, core.js, combat.js, movement.js. */
(function (App) {
  'use strict';
  const BURST = { grow: 0.1, shrink: 0.3, scale: 1.6, radius: 130, stun: 1, chainWindow: 2 };
  function resetBurstChain() {
    App.player.burstHits = 0;
    App.player.burstWindow = 0;
  }
  function resetPassive() {
    resetBurstChain();
    App.player.burst = null;
    for (const f of [App.player, App.dummy, App.giantEncounter.minion])
      if (f) f.burstStun = 0;
  }
  function registerBurstHit() {
    const f = App.player;
    if (!App.progress.unlocks.colossusBurst || f.hp <= 0 || f.burst || App.game.state !== 'fight') return;
    f.burstHits = f.burstWindow > 0 ? f.burstHits + 1 : 1;
    f.burstWindow = BURST.chainWindow;
    if (f.burstHits < 3) return;
    resetBurstChain();
    f.burst = { t: 0, pulsed: false };
    f.atk = null;
    f.teleport = null;
    f.hitstun = f.knockT = f.vx = f.vy = 0;
    f.grounded = f.y >= App.GROUND;
    f.state = 'burst';
    App.game.hitStop = 0;
    App.Sfx.play('charge');
  }
  function passiveScale(f) {
    if (!f.burst) return 1;
    const t = f.burst.t;
    const amount = t < BURST.grow
      ? App.smooth(t / BURST.grow)
      : 1 - App.smooth((t - BURST.grow) / BURST.shrink);
    return App.lerp(1, BURST.scale, App.clamp(amount, 0, 1));
  }
  function pulseBurst() {
    const p = App.player;
    for (const f of App.playerTargets()) {
      const box = App.hurtbox(f);
      if (f.invuln > 0 || Math.abs(f.x - p.x) > BURST.radius + box.w / 2 ||
        box.y > p.y + 12 || box.y + box.h < p.y - App.FIGHTER_HEIGHT * BURST.scale) continue;
      Object.assign(f, {
        atk: null, state: 'hurt', hitstun: 0, burstStun: BURST.stun,
        blockT: 0, dodgeT: 0, counterMove: null, burstLeft: 0,
        vx: (Math.sign(f.x - p.x) || p.facing) * 290
      });
      // A dedicated stun overrides even the giant's ordinary flinch resistance.
      // No damage, meter, hit combo, invulnerability or health refill is awarded.
    }
    App.Sfx.play('block');
  }
  function stepPassive(dt) {
    if (App.game.state !== 'fight') return;
    const f = App.player;
    f.burstWindow = Math.max(0, f.burstWindow - dt);
    if (!f.burstWindow) f.burstHits = 0;
    if (!f.burst) return;
    f.burst.t += dt;
    if (f.burst.t + 1e-9 >= BURST.grow && !f.burst.pulsed) {
      f.burst.pulsed = true;
      pulseBurst();
    }
    if (f.burst.t + 1e-9 >= BURST.grow + BURST.shrink) {
      f.burst = null;
      f.state = f.grounded ? 'idle' : 'jump';
    }
  }
  function stepBurstStun(f, dt) {
    if (f.burstStun <= 0 || f.hp <= 0 || App.game.state !== 'fight') return false;
    f.burstStun = Math.max(0, f.burstStun - dt);
    f.atk = null;
    f.hitstun = 0;
    f.state = f.burstStun > 1e-9 ? 'hurt' : f.grounded ? 'idle' : 'jump';
    App.physics(f, dt);
    return true;
  }
  Object.assign(App, { BURST, resetBurstChain, resetPassive, registerBurstHit, passiveScale, stepPassive, stepBurstStun });
})(window.INJ);
