/* combat.js — see docs/architecture.md for ownership and startup order.
 * Cross-module dependencies: passive.js, content.js, controls.js, core.js, effects.js, encounters.js, r8.js, teddy.js, giant.js, rounds.js, state.js.
 * App is the shared INJ namespace; the exported API is listed at the end. */
(function (App) {
  'use strict';
  /* ============================== combat ============================== */
  function resetCombo() {
    App.game.hits = 0;
    App.game.hitTimer = 0;
    App.game.comboTarget = null;
  }
  function playerTargets() {
    return [App.dummy, App.giantEncounter.minion].filter(
      (f) => f && f.hp > 0 && f.state !== 'ko'
    );
  }
  function playerTarget(f = App.player) {
    return (
      playerTargets().sort((a, b) => Math.abs(a.x - f.x) - Math.abs(b.x - f.x))[0] || App.dummy
    );
  }
  function hurtbox(f) {
    if (App.isR8(f)) return App.r8Hurtbox(f);
    if (App.isTeddy(f)) return App.teddyHurtbox(f);
    const low =
      f.state === 'crouch' ||
      (f.state === 'block' && f.crouching) ||
      (f.atk && (['sweep', 'cpunch', 'slide'].includes(f.atk.key) || f.atk.low));
    const scale = App.FIGHTER_SCALE * App.passiveScale(f);
    return {
      x: f.x - 13 * scale,
      y: f.y - (low ? 42 : 66) * scale,
      w: 26 * scale,
      h: (low ? 42 : 66) * scale
    };
  }
  function startAttack(f, key, command) {
    if (f.atk || f.teleport || f.burst || f.burstStun > 0) return;
    if (App.isGiant(f)) {
      App.startGiantAttack(f, key);
      return;
    }
    if (App.isTeddy(f)) {
      App.startTeddyAttack(f, key);
      return;
    }
    const cost = App.MOVES[key]?.meter || 0;
    if (cost && (f !== App.player || f.meter < cost)) return;
    if (cost) {
      f.meter -= cost;
      App.updateChargeUI();
    }
    if (App.isR8(f)) {
      App.startR8Attack(f, key);
      return;
    }
    f.atk = { key: key, def: App.MOVES[key], t: 0, hasHit: false, fired: false };
    if (key === 'nitrokick') {
      f.atk.low = f.grounded && !!(command?.down ?? App.input.down);
      if (f.atk.low) f.atk.def = { ...f.atk.def, box: [10, -30, 48, 28], type: 'low' };
      App.Sfx.play('boost');
    }
    if (App.isAwakened(f)) {
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
    if (f.atk.def.giant) {
      App.stepGiantAttack(f, dt, opp);
      return;
    }
    if (f.atk.def.teddy) {
      App.stepTeddyAttack(f, dt, opp);
      return;
    }
    if (f.atk.def.mechanical) {
      App.stepR8Attack(f, dt, opp);
      return;
    }
    const a = f.atk,
      d = a.def;
    a.t += dt;
    const driveTime = Math.max(
      0,
      Math.min(a.t, d.startup + d.active) - Math.max(a.t - dt, d.startup)
    );
    if (d.drive && driveTime > 0) {
      f.x += f.facing * d.drive * driveTime;
      if (
        a.key === 'nitrokick' &&
        !App.reducedMotion &&
        Math.floor(a.t / 0.035) !== Math.floor((a.t - dt) / 0.035)
      )
        App.afterimages.push({
          f: { ...f, nitroEcho: true, atk: { ...a } },
          life: 0.12,
          max: 0.12
        });
    }
    if (d.projectile) {
      if (!a.fired && a.t >= d.startup) {
        a.fired = true;
        const charged = !!a.charged;
        const originY = f.y - 46 * App.FIGHTER_SCALE,
          aimAtTarget =
            !f.grounded || (App.isR8(opp) && opp.form === 'car') || (App.isTeddy(opp) && opp.tiny),
          targetBox = hurtbox(opp);
        App.projectiles.push({
          x: f.x + f.facing * 18 * App.FIGHTER_SCALE,
          y: originY,
          vx: f.facing * (charged ? 265 : 235),
          vy: aimAtTarget
            ? ((targetBox.y + targetBox.h / 2 - originY) * (charged ? 265 : 235)) /
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
    if (f.atk === a && a.t + 1e-9 >= d.startup + d.active + d.recovery) {
      if (f === App.player && !d.projectile && !a.hasHit) resetCombo();
      f.atk = null;
      if (f.state === 'attack') f.state = f.grounded ? 'idle' : 'jump';
    }
  }
  function tryHit(att, def) {
    const a = att.atk;
    if (!a || a.hasHit) return;
    if (App.game.state !== 'fight') return;
    const d = a.def;
    const scale = d.worldBox ? 1 : App.FIGHTER_SCALE;
    const bx = att.facing > 0 ? att.x + d.box[0] * scale : att.x - (d.box[0] + d.box[2]) * scale;
    const by = att.y + d.box[1] * scale,
      bw = d.box[2] * scale,
      bh = d.box[3] * scale;
    if (att === App.player && App.giantEncounter.minion) {
      // A protected/downed echo still intercepts the swing. Never fall through
      // to the boss just because the closer actor cannot currently take damage.
      const targets = playerTargets().sort((a, b) => Math.abs(a.x - att.x) - Math.abs(b.x - att.x));
      def =
        targets.find((f) => {
          const b = hurtbox(f);
          return bx < b.x + b.w && bx + bw > b.x && by < b.y + b.h && by + bh > b.y;
        }) || def;
    }
    if (def.invuln > 0 || def.teleport || def.burst || ['knockdown', 'ko'].includes(def.state)) return;
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
      def.teleport ||
      def.burst ||
      def.state === 'knockdown' ||
      def.state === 'ko' ||
      App.game.state !== 'fight'
    )
      return;
    const guarding =
      def.state === 'block' ||
      (App.isR8(def) && def.atk?.guardStartup && def.atk.t < def.atk.def.startup);
    const blocked = guarding && Math.sign(att.x - def.x) === def.facing;
    if (def === App.player || (att === App.player && blocked)) resetCombo();
    if (att === App.player && !blocked) {
      if (App.game.hitTimer <= 0 || App.game.comboTarget !== def) resetCombo();
      App.game.comboTarget = def;
      d = { ...d, dmg: Math.round(d.dmg * (1 + App.game.hits / 10)) };
    }
    if (App.isAwakened(def))
      d = { ...d, dmg: Math.max(1, Math.round(d.dmg * App.LEVEL_TWO.armor)), kb: d.kb * 0.8 };
    if (App.isR8(def))
      d = {
        ...d,
        dmg: Math.max(1, Math.round(d.dmg * App.R8_TUNING[def.form].armor)),
        kb: d.kb * 0.55
      };
    const hpBefore = def.hp;
    if (blocked) {
      def.hp = Math.max(0, def.hp - Math.max(1, Math.round(d.dmg * 0.2)));
      def.vx = att.facing * d.kb * 0.45;
      def.flash = 0.1;
      App.blockSpark(cx, cy);
      App.game.shake = 1.5;
      App.game.hitStop = 0.03;
      App.Sfx.play('block');
      if (def.hp <= 0) {
        if (def.summoned) {
          App.defeatGiantMinion(def);
          return;
        }
        if (App.beginR8Transform(def)) return;
        def.state = 'ko';
        def.grounded = false;
        def.vy = -170;
        App.endRound(att);
      }
      if (def === App.player) App.registerBurstDamage(hpBefore - def.hp, att);
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
    const giantPoise = App.isGiant(def);
    const giantAttack = giantPoise ? def.atk : null;
    const giantState = def.state;
    def.atk = null;
    def.blockT = 0;
    def.dodgeT = 0;
    def.hp = Math.max(0, def.hp - d.dmg);
    def.flash = 0.16;
    App.game.hitStop = giantPoise ? 0 : d.heavy ? 0.085 : 0.05;
    App.game.shake = giantPoise ? 1.5 : d.heavy ? 7 : 4;
    def.vx = att.facing * d.kb;
    App.hitSpark(cx, cy, !!d.heavy);
    if (App.isR8(def) || App.isTeddy(def)) App.blockSpark(cx, cy);
    else App.bloodBurst(cx, cy, d.heavy ? 14 : 7);
    if (d.key === 'shadow') App.Sfx.play('shadow');
    else if (d.key === 'uppercut') App.Sfx.play('uppercut');
    else if (d.key === 'jkick') App.Sfx.play('jumpkick');
    else if (d.heavy) App.Sfx.play('kick');
    else App.Sfx.play('punch');
    if (att === App.player) {
      App.game.hits++;
      App.game.bestCombo = Math.max(App.game.bestCombo, App.game.hits);
      App.game.hitTimer = 1.4;
      App.player.meter = Math.min(100, App.player.meter + 20);
      App.updateChargeUI();
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
    if (def === App.player) {
      def.meter = Math.min(100, def.meter + 6);
      App.updateChargeUI();
    }
    if (def.hp <= 0) {
      if (def.summoned) {
        App.defeatGiantMinion(def);
        return;
      }
      if (App.beginR8Transform(def)) return;
      def.state = 'ko';
      def.vy = -235;
      def.grounded = false;
      def.vx = att.facing * d.kb * 1.5;
      App.endRound(att);
    } else if (giantPoise) {
      def.atk = giantAttack;
      def.state = giantState;
      def.vx = 0;
      def.hitstun = 0;
    } else if (def.burstStun > 0) {
      def.atk = null;
      def.state = 'hurt';
      def.hitstun = 0;
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
      if (def.form === 'robot' && def.hitstun > 0) {
        const profile = App.R8_TUNING.robot;
        // Reassess after a stagger instead of perfectly countering every recovery.
        def.aiT = Math.max(
          def.aiT,
          def.hitstun + profile.reassess + App.rnd() * profile.reassessRange
        );
      }
    }
    if (def === App.player) App.registerBurstDamage(hpBefore - def.hp, att);
  }

  Object.assign(App, {
    resetCombo,
    playerTargets,
    playerTarget,
    hurtbox,
    startAttack,
    stepAttack,
    tryHit,
    applyHit
  });
})(window.INJ);
