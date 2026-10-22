/* movement.js — see docs/architecture.md for ownership and startup order.
 * Cross-module dependencies: combat.js, controls.js, core.js, effects.js, encounters.js, state.js, teleport.js.
 * App is the shared INJ namespace; the exported API is listed at the end. */
(function (App) {
  'use strict';
  /* ============================== controllers ============================== */
  // Walk phase measures actual travel in facing coordinates, not elapsed idle time.
  // Reversing movement plays the same footfalls backward; a wall stops the cycle.
  function moveWalking(f, dx) {
    const margin = App.fighterMargin(f);
    const next = App.clamp(f.x + dx, margin, App.fightWidth() - margin),
      travel = next - f.x;
    f.x = next;
    f.walkPhase += travel * f.facing;
    f.state = Math.abs(travel) > 0.00001 ? 'walk' : 'idle';
  }
  function physics(f, dt) {
    if (f.state === 'ko' || f.state === 'knockdown') f.fallT += dt;
    else f.fallT = 0;
    f.invuln = Math.max(0, f.invuln - dt);
    f.x += f.vx * dt;
    f.vx -= f.vx * Math.min(1, dt * 7);
    if (!f.grounded) {
      f.vy += 1140 * dt;
      f.y += f.vy * dt;
      if (f.y >= App.GROUND && f.vy >= 0) {
        f.y = App.GROUND;
        f.vy = 0;
        f.grounded = true;
        if (f.atk && (f.atk.key === 'jkick' || f.atk.key === 'jpunch')) {
          f.atk = null;
          f.state = 'idle';
        }
        App.dust(f.x, App.GROUND);
        App.Sfx.play('fall');
      }
    }
    const margin = App.fighterMargin(f);
    f.x = App.clamp(f.x, margin, App.fightWidth() - margin);
    f.flash = Math.max(0, f.flash - dt);
  }
  function controlPlayer(f, op, dt) {
    f.anim += dt;
    if (f.comboTimer > 0) {
      f.comboTimer -= dt;
      if (f.comboTimer <= 0) f.comboStep = 0;
    }
    const canAct = App.game.state === 'fight';
    if (f.teleport) {
      App.stepTeleport(f, op, dt);
      return;
    }
    // Blink deliberately keeps the boss as its destination; normal combat
    // faces and aims toward the nearest living enemy, including the echo.
    op = App.playerTarget(f);
    if (
      App.giantEncounter.minion?.hp > 0 &&
      !f.atk &&
      f.hitstun <= 0 &&
      !['ko', 'knockdown'].includes(f.state) &&
      Math.abs(op.x - f.x) > 3
    )
      f.facing = op.x > f.x ? 1 : -1;
    if (
      canAct &&
      !f.atk &&
      f.hitstun <= 0 &&
      !['ko', 'knockdown'].includes(f.state) &&
      App.consume('teleport') &&
      App.startTeleport(f)
    )
      return;
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
    } else if (canAct && f.grounded) {
      f.crouching = App.input.down > 0;
      if (App.consume('nitro') && f.meter >= 100) {
        App.startAttack(f, 'nitrokick');
      } else if (App.consume('special')) {
        App.startAttack(f, 'toss');
      } else if (App.consume('upper')) {
        App.startAttack(f, 'uppercut');
      } else if (App.consume('punch')) {
        App.startAttack(f, f.crouching ? 'cpunch' : f.comboStep === 1 ? 'straight' : 'jab');
        f.comboStep = f.comboStep === 1 ? 0 : 1;
        f.comboTimer = 0.55;
      } else if (App.consume('kick')) {
        const forward = f.facing > 0 ? App.input.right : App.input.left;
        App.startAttack(f, f.crouching ? (forward ? 'slide' : 'sweep') : 'roundhouse');
      } else if (App.consume('jump') || App.input.up) {
        App.Sfx.play('jump');
        f.vy = -395;
        f.grounded = false;
        f.state = 'jump';
        f.vx = (App.input.right - App.input.left) * 115; // horizontal leap momentum
      } else {
        if (f.crouching) {
          f.state = 'crouch';
        } else if (App.input.block) {
          f.state = 'block';
        } else {
          const mv = App.input.right - App.input.left;
          if (mv !== 0) {
            moveWalking(f, mv * 96 * dt);
          } else f.state = 'idle';
        }
      }
    } else if (canAct && !f.grounded) {
      // Full Aerial Combat (Jump Kick & Jump Punch!)
      f.x += (App.input.right - App.input.left) * 88 * dt;
      if (App.consume('nitro') && f.meter >= 100) {
        App.startAttack(f, 'nitrokick');
      } else if (App.consume('special')) {
        App.startAttack(f, 'toss');
      } else if (App.consume('kick')) {
        App.startAttack(f, 'jkick');
      } else if (App.consume('punch')) {
        App.startAttack(f, 'jpunch');
      } else if (f.state !== 'hurt' && f.state !== 'knockdown') {
        f.state = 'jump';
      }
    } else {
      if (f.state !== 'hurt' && f.state !== 'knockdown') f.state = f.grounded ? 'idle' : 'jump';
    }
    physics(f, dt);
    if (
      !f.atk &&
      f.grounded &&
      f.state !== 'ko' &&
      f.state !== 'hurt' &&
      f.state !== 'knockdown' &&
      Math.abs(op.x - f.x) > 3
    ) {
      f.facing = op.x > f.x ? 1 : -1;
    }
  }

  Object.assign(App, { moveWalking, physics, controlPlayer });
})(window.INJ);
