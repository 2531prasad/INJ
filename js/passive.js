/* Permanent Colossus reward: damage-charged shield and existing-art enlargement.
 * Runtime dependencies: state.js, core.js, combat.js, movement.js. */
(function (App) {
  'use strict';
  const BURST = { grow: 0.1, shrink: 0.3, scale: 2.5, radius: 130, stun: 1, damageFraction: 0.25 };
  let lastUI = '';
  function burstThreshold() {
    return App.player.maxHp * BURST.damageFraction;
  }
  function updatePassiveUI() {
    const f = App.player, node = document.getElementById('passiveHud');
    if (!node) return;
    const ready = f.burst ? !f.burst.pulsed : f.burstDamage >= burstThreshold();
    const active = f.burst?.pulsed || f.burstNotice > 0;
    const percent = ready || active ? 100 : Math.floor(100 * f.burstDamage / burstThreshold());
    const hidden = !App.progress.unlocks.colossusBurst || ['ko', 'victory'].includes(App.game.state);
    const state = ready ? 'ready' : active ? 'active' : 'charging';
    const key = [hidden, state, percent, burstThreshold()].join(':');
    if (lastUI === key) return;
    lastUI = key;
    node.hidden = hidden;
    node.dataset.state = state;
    node.style.setProperty('--shield-charge', percent / 100);
    node.setAttribute('aria-valuenow', String(percent));
    node.setAttribute('aria-valuetext', ready ? 'Shield ready, automatic burst' : active
      ? 'Shield fired, enemy stunned' : percent + '% charged; triggers after ' + burstThreshold() + ' HP damage');
    node.querySelector('.passive-label').textContent = ready ? 'SHIELD READY' : active ? 'SHIELD FIRED' : 'SHIELD ' + percent + '%';
  }
  function resetPassive({ preserveCharge = false } = {}) {
    if (!preserveCharge) App.player.burstDamage = 0;
    App.player.burst = null;
    App.player.burstNotice = 0;
    for (const f of [App.player, App.dummy, App.giantEncounter.minion])
      if (f) f.burstStun = 0;
    updatePassiveUI();
  }
  function beginBurst(source) {
    const f = App.player;
    f.burst = { t: 0, pulsed: false, source };
    f.atk = null;
    f.teleport = null;
    f.hitstun = f.knockT = f.vx = f.vy = 0;
    f.grounded = f.y >= App.GROUND;
    f.state = 'burst';
    App.game.hitStop = 0;
    App.Sfx.play('charge');
  }
  function registerBurstDamage(damage, source) {
    const f = App.player;
    if (!App.progress.unlocks.colossusBurst || !Number.isFinite(damage) || damage <= 0 || f.hp <= 0 || f.burst || App.game.state !== 'fight') return;
    f.burstDamage = Math.min(burstThreshold(), f.burstDamage + damage);
    if (f.burstDamage + 1e-9 >= burstThreshold()) beginBurst(source?.sourceActor || source);
    updatePassiveUI();
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
    const p = App.player, targets = App.playerTargets();
    const source = targets.includes(p.burst.source) ? p.burst.source : App.playerTarget(p);
    for (const f of targets) {
      const box = App.hurtbox(f);
      // The triggering attacker is always stunned, including ranged attacks and
      // temporary dodge/wakeup protection. The enlargement also repels nearby foes.
      if (f !== source && (Math.abs(f.x - p.x) > BURST.radius + box.w / 2 ||
        box.y > p.y + 12 || box.y + box.h < p.y - App.FIGHTER_HEIGHT * BURST.scale)) continue;
      Object.assign(f, {
        atk: null, state: 'hurt', hitstun: 0, burstStun: BURST.stun,
        invuln: 0, blockT: 0, dodgeT: 0, counterMove: null, burstLeft: 0,
        vx: (Math.sign(f.x - p.x) || p.facing) * 290
      });
    }
    p.burstDamage = 0;
    p.burstNotice = BURST.stun;
    App.Sfx.play('block');
  }
  function stepPassive(dt) {
    if (App.game.state !== 'fight') return;
    const f = App.player;
    f.burstNotice = Math.max(0, f.burstNotice - dt);
    if (!f.burst && App.progress.unlocks.colossusBurst && f.burstDamage >= burstThreshold())
      beginBurst(App.playerTarget(f));
    if (f.burst) {
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
    updatePassiveUI();
  }
  function stepBurstStun(f, dt) {
    if (f.burstStun <= 0 || f.hp <= 0 || App.game.state !== 'fight') return false;
    f.burstStun = Math.max(0, f.burstStun - dt);
    if (f.burstStun < 1e-9) f.burstStun = 0;
    f.atk = null;
    f.hitstun = 0;
    f.state = f.burstStun > 1e-9 ? 'hurt' : f.grounded ? 'idle' : 'jump';
    App.physics(f, dt);
    return true;
  }
  Object.assign(App, { BURST, burstThreshold, resetPassive, registerBurstDamage, passiveScale, stepPassive, stepBurstStun, updatePassiveUI });
})(window.INJ);
