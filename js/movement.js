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
  function steerPlayerInAir(f, dt, drive = f.atk?.def.drive) {
    // Ordinary aerial attacks retain the same steering as an empty jump.
    // Slide/Nitro travel stays authored; directional input cannot stack drive.
    if (!f.grounded && !drive)
      f.x += (App.input.right - App.input.left) * 88 * dt;
  }
  function advancePlayerInput(dt) {
    if (App.game.state === 'fight') App.game.inputTime += dt * 1000;
  }
  function controlPlayer(f, op, dt) {
    f.anim += dt;
    if (f.comboTimer > 0) {
      f.comboTimer -= dt;
      if (f.comboTimer <= 0) f.comboStep = 0;
    }
    const canAct = App.game.state === 'fight';
    if (f.burst) {
      advancePlayerInput(dt);
      return;
    }
    // Engine calls stop during hit-stop/pause/cutscenes, so input windows use
    // simulation time and cannot expire merely because rendering stalled.
    if (f.teleport) {
      advancePlayerInput(dt);
      App.stepTeleport(f, op, dt);
      return;
    }
    op = App.playerTarget(f);
    let remaining = dt;
    if (f.atk) {
      const d = f.atk.def;
      const busy = Math.min(remaining, Math.max(0, d.startup + d.active + d.recovery - f.atk.t));
      advancePlayerInput(busy);
      App.stepAttack(f, busy, op);
      steerPlayerInAir(f, busy, d.drive);
      physics(f, busy);
      remaining -= busy;
      if (f.atk || App.game.state !== 'fight') return;
    }
    if (f.state === 'ko') {
      physics(f, remaining);
      return;
    }
    if (f.state === 'knockdown') {
      const busy = Math.min(remaining, Math.max(0, 1.5 - f.knockT));
      advancePlayerInput(busy);
      f.knockT += busy;
      physics(f, busy);
      remaining -= busy;
      if (f.knockT + 1e-9 < 1.5) return;
      f.state = f.grounded ? 'idle' : 'jump';
      f.invuln = 0.5;
    }
    if (f.hitstun > 0) {
      const busy = Math.min(remaining, f.hitstun);
      advancePlayerInput(busy);
      f.hitstun = Math.max(0, f.hitstun - busy);
      f.state = 'hurt';
      physics(f, busy);
      remaining -= busy;
      if (f.hitstun > 1e-9) return;
      f.hitstun = 0;
      f.state = f.grounded ? 'idle' : 'jump';
    }
    if (canAct) {
      if (f.grounded && Math.abs(op.x - f.x) > 3) f.facing = op.x > f.x ? 1 : -1;
      if (App.consume('teleport') && App.startTeleport(f)) {
        advancePlayerInput(remaining);
        return;
      }
      f.crouching = f.grounded && App.input.down > 0;
      // Resolve a jump before an attack so up+Kick means an aerial kick.
      // Grounded attacks still finish their recovery before either can start.
      const jump = f.grounded ? App.consume('jump') : null;
      if (f.grounded && (jump || App.input.up)) {
        App.Sfx.play('jump');
        f.vy = -395;
        f.grounded = false;
        f.crouching = false;
        f.state = 'jump';
        f.vx = (App.input.right - App.input.left || jump?.horizontal || 0) * 115;
      }
      let command;
      if ((command = App.consume('nitro')) && f.meter >= 100) {
        App.startAttack(f, 'nitrokick', command);
      } else if ((command = App.consume('special'))) {
        App.startAttack(f, 'toss');
      } else if (f.grounded && (command = App.consume('upper'))) {
        App.startAttack(f, 'uppercut');
      } else if ((command = App.consume('punch'))) {
        f.crouching = f.grounded && !!command.down;
        const key = !f.grounded
          ? 'jpunch'
          : f.crouching ? 'cpunch' : f.comboStep === 1 ? 'straight' : 'jab';
        App.startAttack(f, key);
        if (f.grounded) {
          f.comboStep = f.comboStep === 1 ? 0 : 1;
          f.comboTimer = 0.55;
        }
      } else if ((command = App.consume('kick'))) {
        f.crouching = f.grounded && !!command.down;
        const key = !f.grounded
          ? 'jkick'
          : f.crouching ? (command.forward ? 'slide' : 'sweep') : 'roundhouse';
        App.startAttack(f, key);
      }
      if (!f.atk) {
        if (!f.grounded) f.state = 'jump';
        else if (App.input.block) f.state = 'block';
        else if (f.crouching) f.state = 'crouch';
        else moveWalking(f, (App.input.right - App.input.left) * 96 * remaining);
      }
      steerPlayerInAir(f, remaining);
    } else if (!['hurt', 'knockdown'].includes(f.state)) {
      f.state = f.grounded ? 'idle' : 'jump';
    }
    advancePlayerInput(remaining);
    physics(f, remaining);
    if (!f.atk && f.grounded && canAct && Math.abs(op.x - f.x) > 3)
      f.facing = op.x > f.x ? 1 : -1;
  }

  Object.assign(App, { moveWalking, physics, controlPlayer });
})(window.INJ);
