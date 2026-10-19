/* combat.js — see docs/architecture.md for ownership and startup order.
 * Cross-module dependencies: content.js, controls.js, core.js, effects.js, rounds.js, state.js.
 * App is the shared INJ namespace; the exported API is listed at the end. */
(function (App) {
  'use strict';
  /* ============================== combat ============================== */
  function hurtbox(f) {
    if (App.isR8(f)) return App.r8Hurtbox(f);
    const low = f.state === 'crouch' || (f.atk && ['sweep', 'cpunch'].includes(f.atk.key));
    return {
      x: f.x - 13 * App.FIGHTER_SCALE,
      y: f.y - (low ? 42 : 66) * App.FIGHTER_SCALE,
      w: 26 * App.FIGHTER_SCALE,
      h: (low ? 42 : 66) * App.FIGHTER_SCALE
    };
  }
  function startAttack(f, key) {
    if (f.atk) return;
    if (App.isR8(f)) {
      App.startR8Attack(f, key);
      return;
    }
    f.atk = { key: key, def: App.MOVES[key], t: 0, hasHit: false, fired: false };
    if (f === App.dummy && App.game.round >= 2) {
      const move = App.MOVES[key];
      f.atk.def = {
        ...move,
        startup: Math.max(0.07, move.startup * 1.15),
        recovery: Math.max(0.18, move.recovery * 0.85),
        dmg: Math.ceil(move.dmg * App.LEVEL_TWO.damage)
      };
    }
    if (f === App.player && key === 'toss') {
      f.atk.charged = f.charge >= 3;
      if (f.atk.charged) {
        f.charge = 0;
        App.updateChargeUI();
      }
      App.Sfx.play(f.atk.charged ? 'shadow' : 'toss');
    } else App.Sfx.play('swing');
    f.state = 'attack';
  }
  function stepAttack(f, dt, opp) {
    if (f.atk.def.mechanical) {
      App.stepR8Attack(f, dt, opp);
      return;
    }
    const a = f.atk,
      d = a.def;
    a.t += dt;
    if (d.projectile) {
      if (!a.fired && a.t >= d.startup) {
        a.fired = true;
        const charged = !!a.charged;
        const originY = f.y - 46 * App.FIGHTER_SCALE,
          lowTarget = App.isR8(opp) && opp.form === 'car';
        App.projectiles.push({
          x: f.x + f.facing * 18 * App.FIGHTER_SCALE,
          y: originY,
          vx: f.facing * (charged ? 265 : 235),
          vy: lowTarget
            ? ((opp.y - 20 - originY) * (charged ? 265 : 235)) /
              Math.max(16, Math.abs(opp.x - f.x) - 18 * App.FIGHTER_SCALE)
            : 0,
          life: 1.7,
          owner: f,
          charged
        });
        if (charged && !App.reducedMotion)
          App.afterimages.push({
            f: { ...f, pal: { ...f.pal }, atk: { ...a } },
            life: 0.28,
            max: 0.28
          });
      }
    } else if (!a.hasHit && a.t >= d.startup && a.t < d.startup + d.active) {
      tryHit(f, opp);
    }
    if (f.atk === a && a.t >= d.startup + d.active + d.recovery) {
      f.atk = null;
      if (f.state === 'attack') f.state = f.grounded ? 'idle' : 'jump';
    }
  }
  function tryHit(att, def) {
    const a = att.atk;
    if (!a || a.hasHit) return;
    if (
      def.invuln > 0 ||
      def.state === 'knockdown' ||
      def.state === 'ko' ||
      App.game.state !== 'fight'
    )
      return;
    const d = a.def;
    const scale = d.worldBox ? 1 : App.FIGHTER_SCALE;
    const bx = att.facing > 0 ? att.x + d.box[0] * scale : att.x - (d.box[0] + d.box[2]) * scale;
    const by = att.y + d.box[1] * scale,
      bw = d.box[2] * scale,
      bh = d.box[3] * scale;
    const ub = hurtbox(def);
    if (bx < ub.x + ub.w && bx + bw > ub.x && by < ub.y + ub.h && by + bh > ub.y) {
      a.hasHit = true;
      const cx = (Math.max(bx, ub.x) + Math.min(bx + bw, ub.x + ub.w)) / 2;
      const cy = (Math.max(by, ub.y) + Math.min(by + bh, ub.y + ub.h)) / 2;
      applyHit(def, att, d, cx, cy);
    }
  }
  function applyHit(def, att, d, cx, cy) {
    if (
      def.invuln > 0 ||
      def.state === 'knockdown' ||
      def.state === 'ko' ||
      App.game.state !== 'fight'
    )
      return;
    if (App.isAwakened(def))
      d = { ...d, dmg: Math.max(1, Math.round(d.dmg * App.LEVEL_TWO.armor)), kb: d.kb * 0.8 };
    if (App.isR8(def))
      d = {
        ...d,
        dmg: Math.max(1, Math.round(d.dmg * App.R8_TUNING[def.form].armor)),
        kb: d.kb * 0.55
      };
    const facingAttacker = Math.sign(att.x - def.x) === def.facing;
    if (def.state === 'block' && facingAttacker) {
      def.hp = Math.max(0, def.hp - Math.max(1, Math.round(d.dmg * 0.2)));
      def.vx = att.facing * d.kb * 0.45;
      def.flash = 0.1;
      App.blockSpark(cx, cy);
      App.game.shake = 1.5;
      App.game.hitStop = 0.03;
      App.Sfx.play('block');
      if (def.hp <= 0) {
        if (App.beginR8Transform(def)) return;
        def.state = 'ko';
        def.grounded = false;
        def.vy = -170;
        App.endRound(att);
      }
      return;
    }
    // Engine commitment: light hits still damage a winding-up machine, but
    // cannot reset its attack forever. Charged Shadow and sweeps can stagger it.
    const committed =
      App.isR8(def) &&
      def.atk &&
      !d.knockdown &&
      def.atk.t >= 0.06 &&
      def.atk.t < def.atk.def.startup + def.atk.def.active;
    const mechanicalAttack = committed ? def.atk : null;
    def.atk = null;
    def.blockT = 0;
    def.dodgeT = 0;
    def.hp = Math.max(0, def.hp - d.dmg);
    def.flash = 0.16;
    App.game.hitStop = d.heavy ? 0.085 : 0.05;
    App.game.shake = d.heavy ? 7 : 4;
    def.vx = att.facing * d.kb;
    App.hitSpark(cx, cy, !!d.heavy);
    if (App.isR8(def)) App.blockSpark(cx, cy);
    else App.bloodBurst(cx, cy, d.heavy ? 14 : 7);
    if (d.key === 'shadow') App.Sfx.play('shadow');
    else if (d.key === 'uppercut') App.Sfx.play('uppercut');
    else if (d.key === 'jkick') App.Sfx.play('jumpkick');
    else if (d.heavy) App.Sfx.play('kick');
    else App.Sfx.play('punch');
    if (att === App.player) {
      App.game.hits++;
      App.game.hitTimer = 1.4;
      if (d.key !== 'shadow' && App.player.charge < 3) {
        App.player.charge++;
        App.updateChargeUI();
        if (App.player.charge === 3) App.Sfx.play('charge');
      }
      if (d.heavy && !App.reducedMotion)
        App.afterimages.push({
          f: { ...att, atk: att.atk ? { ...att.atk } : null },
          life: 0.18,
          max: 0.18
        });
    }
    if (def.hp <= 0) {
      if (App.beginR8Transform(def)) return;
      def.state = 'ko';
      def.vy = -235;
      def.grounded = false;
      def.vx = att.facing * d.kb * 1.5;
      App.endRound(att);
    } else if (mechanicalAttack) {
      def.atk = mechanicalAttack;
      def.state = 'attack';
      def.vx *= 0.2;
      def.hitstun = 0;
    } else if (d.knockdown) {
      def.state = 'knockdown';
      def.knockT = 0;
      def.vy = App.isAwakened(def) || App.isR8(def) ? -135 : -190;
      def.grounded = false;
      def.hitstun = 0;
    } else {
      def.hitstun = App.isR8(def)
        ? def.form === 'car'
          ? 0.16
          : 0.14
        : App.isAwakened(def)
          ? 0.16
          : d.heavy
            ? 0.4
            : 0.26;
      def.state = 'hurt';
    }
    if (App.isAwakened(def)) {
      def.burstLeft = 0;
      def.restT = Math.max(def.restT, 0.24);
      def.openingT = Math.max(def.openingT, 0.18);
    }
    if (App.isR8(def)) {
      def.burstLeft = 0;
      def.restT = 0;
      def.openingT = Math.max(def.openingT, 0.12);
    }
  }

  Object.assign(App, { hurtbox, startAttack, stepAttack, tryHit, applyHit });
})(window.INJ);
