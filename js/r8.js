/* R8 attack physics and two distinct opponent controllers; shared combat still owns damage. */
(function (App) {
  'use strict';
  function r8Hurtbox(f) {
    const standing = f.form === 'robot' || f.atk?.key === 'r8Rear';
    return {
      x: f.x - (standing ? 23 : 49),
      y: f.y - (standing ? 109 : 37),
      w: standing ? 46 : 98,
      h: standing ? 109 : 37
    };
  }
  function startR8Attack(f, key) {
    const move = App.MOVES[key],
      profile = App.R8_TUNING[f.form];
    if (!move?.mechanical || f.atk) return;
    f.atk = {
      key,
      def: { ...move, dmg: Math.ceil(move.dmg * profile.damage) },
      t: 0,
      hasHit: false,
      fired: false,
      launched: false
    };
    f.state = 'attack';
    f.vx = 0;
    App.Sfx.play(key === 'r8Wheel' ? 'rim' : 'engine');
  }
  function stepR8Attack(f, dt, op) {
    const a = f.atk,
      d = a.def;
    a.t += dt;
    if (a.t >= d.startup) {
      if (!a.launched) {
        a.launched = true;
        if (d.jump && f.grounded) {
          f.vy = d.jump;
          f.grounded = false;
          App.Sfx.play('boost');
        } else if (d.drive) App.Sfx.play('boost');
      }
      if (a.t < d.startup + d.active) {
        if (d.drive) f.x += f.facing * d.drive * dt;
        if (d.projectile && !a.fired) {
          a.fired = true;
          const y = f.y - 22,
            vx = f.facing * 230,
            aim = op.y - 48;
          App.projectiles.push({
            x: f.x + f.facing * 48,
            y,
            vx,
            vy: ((aim - y) * 230) / Math.max(70, Math.abs(op.x - f.x)),
            life: 2,
            owner: f,
            move: d,
            style: 'rim'
          });
          App.Sfx.play('rim');
        } else if (!d.projectile && !a.hasHit) App.tryHit(f, op);
      }
    }
    if (f.atk === a && a.t >= d.startup + d.active + d.recovery) {
      f.atk = null;
      f.state = f.grounded ? 'idle' : 'jump';
    }
  }
  function evadeR8(f, op) {
    const dir = Math.sign(op.x - f.x) || f.facing;
    f.dodgeFrom = f.x;
    f.dodgeTo = App.clamp(
      f.x - dir * 45,
      App.fighterMargin(f),
      App.world.width - App.fighterMargin(f)
    );
    f.dodgeT = 0.22;
    f.dodgeCooldown = f.form === 'car' ? 1.3 : 0.85;
    f.invuln = 0.08;
    f.state = 'dodge';
    f.burstLeft = 0;
  }
  function restR8(f) {
    const p = App.R8_TUNING[f.form];
    f.restT = p.rest + App.rnd() * p.restRange;
    f.openingT = f.form === 'car' ? 0.4 : 0.32;
  }
  function controlR8(f, op, dt) {
    for (const key of ['dodgeCooldown', 'openingT', 'aiT', 'reactionT'])
      f[key] = Math.max(0, f[key] - dt);
    if (App.game.state !== 'fight' || f.state === 'ko') {
      App.physics(f, dt);
      return;
    }
    if (f.state === 'knockdown') {
      f.knockT += dt;
      if (f.knockT > (f.form === 'car' ? 0.65 : 0.48) && f.grounded) {
        f.state = 'idle';
        f.invuln = 0.22;
        f.restT = 0.12;
        f.openingT = 0.12;
        if (f.form === 'robot' && (op.atk || !op.grounded)) {
          // A guarded rise prevents the same knockdown timing from looping forever.
          f.facing = op.x > f.x ? 1 : -1;
          f.state = 'block';
          f.blockT = 0.2;
          f.counterMove = !op.grounded
            ? 'r8Upper'
            : Math.abs(op.x - f.x) > 85
              ? 'r8Lunge'
              : 'r8Piston';
          f.restT = f.openingT = 0;
        }
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
    const p = App.R8_TUNING[f.form],
      gap = Math.abs(op.x - f.x),
      dir = Math.sign(op.x - f.x) || f.facing;
    if (f.form === 'robot' && op.atk && op.atk !== f.observedMove) {
      f.observedMove = op.atk;
      f.repeatCount = f.repeatedMove === op.atk.key ? f.repeatCount + 1 : 1;
      f.repeatedMove = op.atk.key;
      f.reactionT = 0.12;
    }
    const airborneThreat = !op.grounded && gap < 125 && op.y < App.GROUND - 25;
    // A new leap is a new threat, even when jump is held continuously.
    if (!airborneThreat && f.lastThreat === op) f.lastThreat = null;
    const missile = App.projectiles.find(
      (p) => p.owner === op && (f.x - p.x) * p.vx > 0 && Math.abs(p.x - f.x) < 135
    );
    const threat =
      missile ||
      (airborneThreat ? op : null) ||
      (op.atk && !op.atk.hasHit && gap < 115 ? op.atk : null);
    const repeatedLow =
      f.form === 'robot' && f.repeatCount >= 2 && op.grounded &&
      ['sweep', 'slide', 'cpunch'].includes(f.repeatedMove);
    if (
      repeatedLow && gap < 145 && !f.atk && !f.blockT && !f.dodgeT &&
      f.openingT === 0 && f.dodgeCooldown === 0 && f.reactionT === 0
    ) {
      // Recognized low spam is met with a visible shield, then a closing counter.
      f.facing = dir;
      f.state = 'block';
      f.blockT = 0.16;
      f.counterMove = gap > 80 ? 'r8Lunge' : 'r8Piston';
      f.restT = 0;
      f.dodgeCooldown = 0.8;
    }
    if (
      threat && threat !== f.lastThreat && !f.atk && !f.blockT &&
      f.dodgeT === 0 && f.reactionT === 0
    ) {
      f.lastThreat = threat;
      if (
        !f.atk &&
        f.openingT === 0 &&
        f.dodgeCooldown === 0 &&
        f.grounded &&
        App.rnd() < p.dodge
      ) {
        if (f.form === 'robot' && (missile || airborneThreat || op.atk?.def.knockdown)) {
          f.facing = dir;
          f.state = 'block';
          f.blockT = airborneThreat ? 0.12 : 0.2;
          f.restT = 0;
          f.counterMove = airborneThreat ? 'r8Upper' : missile ? 'r8Lunge' : 'r8Piston';
          f.dodgeCooldown = 0.9;
        } else if (missile) {
          f.vy = -320;
          f.vx = -dir * 65;
          f.grounded = false;
          f.state = 'jump';
          f.dodgeCooldown = 1.1;
          restR8(f);
          App.Sfx.play('boost');
        } else evadeR8(f, op);
      }
    }
    if (f.dodgeT > 0) {
      f.dodgeT = Math.max(0, f.dodgeT - dt);
      f.x = App.lerp(f.dodgeFrom, f.dodgeTo, App.smooth(1 - f.dodgeT / 0.22));
      if (f.dodgeT === 0) restR8(f);
    } else if (f.atk) {
      stepR8Attack(f, dt, op);
      if (!f.atk) {
        if (f.burstLeft > 0) f.aiT = 0.16;
        else restR8(f);
      }
    } else if (f.blockT > 0) {
      f.state = 'block';
      f.blockT = Math.max(0, f.blockT - dt);
      if (f.blockT === 0 && (!op.atk || op.atk.t >= op.atk.def.startup + op.atk.def.active)) {
        const counter = f.counterMove;
        f.counterMove = null;
        if (counter) {
          f.burstLeft = 0;
          App.startAttack(f, counter);
          if (f.form === 'robot' && f.atk) f.atk.guardStartup = true;
        } else restR8(f);
      } else if (f.blockT === 0) f.blockT = 0.04;
    } else if (f.restT > 0) {
      f.restT = Math.max(0, f.restT - dt);
      f.state = f.grounded ? 'idle' : 'jump';
    } else if (f.aiT === 0) {
      f.facing = dir;
      const recovering = op.atk && op.atk.t >= op.atk.def.startup + op.atk.def.active;
      if (f.form === 'robot' && airborneThreat && f.grounded) {
        f.burstLeft = 0;
        App.startAttack(f, 'r8Upper');
      } else if (f.form === 'robot' && recovering && gap < 145) {
        // Punish an actual whiff/recovery instead of pursuing a fixed rotation.
        f.burstLeft = 0;
        App.startAttack(f, gap > 75 ? 'r8Lunge' : 'r8Piston');
      } else if (repeatedLow && gap < 105) {
        f.burstLeft = 0;
        App.startAttack(f, 'r8Dive');
      } else if (f.form === 'car') {
        const sequence = ['r8Dash', 'r8Jump', 'r8Rear', 'r8Wheel'];
        const move =
          !op.grounded && gap < 120
            ? 'r8Jump'
            : gap > 135
              ? f.rushStep % 2
                ? 'r8Wheel'
                : 'r8Dash'
              : sequence[f.rushStep % sequence.length];
        f.rushStep++;
        f.burstLeft = 0;
        App.startAttack(f, move);
      } else if (gap > 90) {
        if (f.rushStep % 3 === 0) {
          f.rushStep++;
          f.burstLeft = 0;
          App.startAttack(f, 'r8Lunge');
        } else App.moveWalking(f, dir * Math.min(p.speed * dt, gap - 85));
      } else {
        if (f.burstLeft === 0) f.burstLeft = App.rnd() < 0.55 ? 2 : 1;
        const sequence = ['r8Piston', 'r8Axle', 'r8Piston', 'r8Upper', 'r8Dive'];
        const move = !op.grounded
          ? 'r8Upper'
          : op.state === 'block' || op.crouching
            ? 'r8Dive'
            : gap > 70
              ? 'r8Axle'
              : sequence[f.rushStep++ % sequence.length];
        f.burstLeft--;
        App.startAttack(f, move);
      }
    }
    App.physics(f, dt);
    if (!f.atk && f.dodgeT === 0) f.facing = op.x > f.x ? 1 : -1;
  }
  Object.assign(App, { r8Hurtbox, startR8Attack, stepR8Attack, controlR8 });
})(window.INJ);
