/* opponent.js — see docs/architecture.md for ownership and startup order.
 * Cross-module dependencies: combat.js, core.js, movement.js, state.js.
 * App is the shared INJ namespace; the exported API is listed at the end. */
(function (App) {
  'use strict';
  // Round one is gentle. Awakened rounds favour evasive footwork and short bursts,
  // with committed strikes and visible breathing room that the player can punish.
  function dodgeDummy(f, op, leap = false) {
    if (
      f.dodgeCooldown > 0 ||
      f.hitstun > 0 ||
      ['ko', 'knockdown'].includes(f.state) ||
      App.game.state !== 'fight'
    )
      return false;
    const dir = Math.sign(op.x - f.x) || f.facing;
    const hard = App.isAwakened(f);
    f.atk = null;
    f.vx = 0;
    f.blockT = 0;
    f.dodgeT = hard ? 0.18 : 0.22;
    f.dodgeCooldown = hard ? App.LEVEL_TWO.dodgeCooldown : 1.8;
    f.dodgeFrom = f.x;
    f.dodgeTo = App.clamp(f.x - dir * (hard ? 48 : 24), 26, App.fightWidth() - 26);
    if (hard && Math.abs(f.dodgeTo - f.x) < 18)
      f.dodgeTo = App.clamp(op.x + dir * 62, 26, App.fightWidth() - 26);
    f.state = 'dodge';
    if (hard) {
      f.burstLeft = 0;
      f.invuln = leap ? 0.15 : 0.1;
      if (leap) {
        f.dodgeTo = App.clamp(f.x + dir * 54, 26, App.fightWidth() - 26);
        if (f.grounded) {
          f.grounded = false;
          f.vy = -430;
        }
      }
    }
    return true;
  }
  function controlDummy(f, op, dt) {
    if (
      op.teleport &&
      App.game.state === 'fight' &&
      f.hitstun <= 0 &&
      !['ko', 'knockdown'].includes(f.state)
    ) {
      // Commit an existing swing toward the last seen side. Reacquire after Blink,
      // rather than turning perfectly toward an invisible target mid-animation.
      if (f.atk) App.stepAttack(f, dt, op);
      else if (!(App.isGiant(f) && f.state === 'relax')) {
        f.blockT = Math.max(0, f.blockT - dt);
        f.state = f.blockT > 0 ? 'block' : f.grounded ? 'idle' : 'jump';
      }
      f.restT = Math.max(f.restT, 0.12);
      f.openingT = Math.max(f.openingT, 0.12);
      App.physics(f, dt);
      return;
    }
    if (App.isGiant(f)) {
      App.controlGiant(f, op, dt);
      return;
    }
    if (App.isTeddy(f)) {
      App.controlTeddy(f, op, dt);
      return;
    }
    f.anim += dt;
    if (App.isR8(f)) {
      App.controlR8(f, op, dt);
      return;
    }
    if (App.isAwakened(f)) {
      controlAwakenedDummy(f, op, dt);
      return;
    }
    f.dodgeCooldown = Math.max(0, f.dodgeCooldown - dt);
    if (App.game.state !== 'fight') {
      App.physics(f, dt);
      return;
    }
    if (f.atk) {
      App.stepAttack(f, dt, op);
    } else if (f.state === 'ko') {
      /*falling*/
    } else if (f.state === 'knockdown') {
      f.knockT += dt;
      if (f.knockT > 1.5) {
        f.state = 'idle';
        f.invuln = 0.5;
      }
    } else if (f.hitstun > 0) {
      f.hitstun -= dt;
      f.state = 'hurt';
    } else if (f.dodgeT > 0) {
      f.dodgeT = Math.max(0, f.dodgeT - dt);
      f.x = App.lerp(f.dodgeFrom, f.dodgeTo, App.smooth(1 - f.dodgeT / 0.22));
      if (f.dodgeT === 0) {
        f.state = 'idle';
        f.aiT = 0.65;
      }
    } else if (f.blockT > 0) {
      f.blockT = Math.max(0, f.blockT - dt);
      f.state = 'block';
    } else {
      f.aiT -= dt;
      const distance = Math.abs(op.x - f.x),
        dir = Math.sign(op.x - f.x) || f.facing;
      if (f.aiT <= 0) {
        f.aiT = 0.6 + App.rnd() * 0.8;
        if (distance > 72) f.state = 'walk';
        else if (distance < 56 && App.rnd() < 0.26) App.startAttack(f, 'haymaker');
        else if (App.rnd() < 0.32) {
          f.blockT = 0.55 + App.rnd() * 0.55;
          f.state = 'block';
        } else f.state = 'idle';
      }
      if (f.state === 'walk' && !f.atk) {
        const travel = Math.min(54 * dt, Math.max(0, distance - 54));
        if (travel > 0) App.moveWalking(f, dir * travel);
        else f.state = 'idle';
      }
    }
    App.physics(f, dt);
    if (!f.atk && f.grounded && !['ko', 'hurt', 'knockdown', 'dodge'].includes(f.state))
      f.facing = op.x > f.x ? 1 : -1;
  }

  function controlAwakenedDummy(f, op, dt) {
    f.dodgeCooldown = Math.max(0, f.dodgeCooldown - dt);
    f.aiT = Math.max(0, f.aiT - dt);
    f.openingT = Math.max(0, f.openingT - dt);
    if (App.game.state !== 'fight' || f.state === 'ko') {
      App.physics(f, dt);
      return;
    }
    if (f.state === 'knockdown') {
      f.knockT += dt;
      if (f.knockT > 0.48 && f.grounded) {
        f.state = 'idle';
        f.invuln = 0.16;
      }
      App.physics(f, dt);
      return;
    }
    if (f.hitstun > 0) {
      f.hitstun = Math.max(0, f.hitstun - dt);
      f.state = 'hurt';
      App.physics(f, dt);
      return;
    }
    const distance = Math.abs(op.x - f.x),
      dir = Math.sign(op.x - f.x) || f.facing;
    const melee =
      op.atk &&
      !op.atk.def.projectile &&
      !op.atk.hasHit &&
      op.atk !== f.lastThreat &&
      distance < (op.atk.def.box[0] + op.atk.def.box[2] + 24) * App.FIGHTER_SCALE &&
      Math.abs(op.y - f.y) < 120;
    const missile = App.projectiles.find(
      (p) =>
        p.owner === op && p !== f.lastMissile && (p.x - f.x) * p.vx < 0 && Math.abs(p.x - f.x) < 115
    );
    if (melee || missile) {
      if (melee) f.lastThreat = op.atk;
      if (missile) f.lastMissile = missile;
      // The start of each pause is guaranteed punishable; later it may evade a new
      // threat instead of letting repeated jabs hold it in an endless stun loop.
      if (
        f.openingT === 0 &&
        (!f.atk || f.atk.t < f.atk.def.startup) &&
        App.rnd() < App.LEVEL_TWO.reaction &&
        !f.dodgeT
      ) {
        if (!dodgeDummy(f, op, !!missile) && !f.atk && App.rnd() < 0.35) {
          f.blockT = 0.16;
          f.state = 'block';
        }
      }
    }
    if (f.dodgeT > 0) {
      f.dodgeT = Math.max(0, f.dodgeT - dt);
      f.x = App.lerp(f.dodgeFrom, f.dodgeTo, App.smooth(1 - f.dodgeT / 0.18));
      if (f.dodgeT === 0) {
        f.state = f.grounded ? 'idle' : 'jump';
        f.restT = App.LEVEL_TWO.dodgeRest + App.rnd() * 0.18;
        f.openingT = 0.3;
      }
    } else if (f.atk) {
      if (distance > 65) f.x += dir * (f.grounded ? 45 : 110) * dt;
      App.stepAttack(f, dt, op);
      if (!f.atk) {
        if (f.burstLeft === 0) {
          f.restT = App.LEVEL_TWO.rest + App.rnd() * App.LEVEL_TWO.restRange;
          f.openingT = App.LEVEL_TWO.opening;
        } else f.aiT = 0.1 + App.rnd() * 0.08;
      }
    } else if (f.blockT > 0) {
      f.blockT = Math.max(0, f.blockT - dt);
      f.state = 'block';
    } else if (f.restT > 0) {
      f.restT = Math.max(0, f.restT - dt);
      if (f.grounded && distance < 70) App.moveWalking(f, -dir * 38 * dt);
      else f.state = f.grounded ? 'idle' : 'jump';
    } else {
      f.facing = dir;
      if (distance > 58) {
        if (f.grounded) App.moveWalking(f, dir * Math.min(App.LEVEL_TWO.speed * dt, distance - 54));
        else {
          f.state = 'jump';
          f.x += dir * 170 * dt;
        }
      }
      if (f.aiT === 0 && distance < 90) {
        if (f.burstLeft === 0 && f.dodgeCooldown === 0 && f.grounded && App.rnd() < 0.35) {
          dodgeDummy(f, op);
        } else {
          if (f.burstLeft === 0) f.burstLeft = App.rnd() < 0.45 ? 2 : 1;
          const chain = [
            'jab',
            'straight',
            'roundhouse',
            'jab',
            'sweep',
            'jab',
            'straight',
            'uppercut'
          ];
          App.startAttack(
            f,
            !f.grounded ? 'jkick' : !op.grounded ? 'uppercut' : chain[f.rushStep++ % chain.length]
          );
          f.burstLeft--;
        }
      }
    }
    const landingAttack = f.atk;
    App.physics(f, dt);
    // Landing can finish an aerial strike before stepAttack reaches its recovery.
    if (landingAttack && !f.atk) {
      if (f.burstLeft === 0) {
        f.restT = App.LEVEL_TWO.rest + App.rnd() * App.LEVEL_TWO.restRange;
        f.openingT = App.LEVEL_TWO.opening;
      } else f.aiT = 0.1 + App.rnd() * 0.08;
    }
    if (!f.atk && Math.abs(op.x - f.x) > 3) f.facing = op.x > f.x ? 1 : -1;
  }

  Object.assign(App, { dodgeDummy, controlDummy, controlAwakenedDummy });
})(window.INJ);
