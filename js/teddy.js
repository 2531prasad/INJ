/* Blue Velvet: authored move data, reactive decisions and the one-shot shrink event.
 * Shared combat owns all damage; renderer owns art. No selected-winner logic. */
(function (App) {
  'use strict';
  const TEDDY_TUNING = { health: 140, height: App.FIGHTER_HEIGHT * 1.1, tinyScale: 0.34 };
  const TEDDY_MOVES = {
    velvetCross: {
      startup: 0.22,
      active: 0.13,
      recovery: 0.32,
      dmg: 9,
      box: [12, -77, 61, 28],
      kb: 95,
      frame: 4,
      prepare: 0,
      drive: 60,
      name: 'VELVET VERDICT'
    },
    curtainCall: {
      startup: 0.38,
      active: 0.18,
      recovery: 0.56,
      dmg: 16,
      box: [12, -101, 77, 58],
      kb: 155,
      frame: 6,
      prepare: 11,
      heavy: true,
      knockdown: true,
      name: 'CURTAIN CALL'
    },
    royalSweep: {
      startup: 0.3,
      active: 0.18,
      recovery: 0.44,
      dmg: 12,
      box: [8, -27, 72, 28],
      kb: 140,
      frame: 7,
      prepare: 9,
      drive: 120,
      type: 'low',
      knockdown: true,
      name: 'BOW TO ME'
    },
    dramaBomb: {
      startup: 0.4,
      active: 0.38,
      recovery: 0.62,
      dmg: 15,
      box: [-24, -73, 88, 78],
      kb: 155,
      frame: 14,
      prepare: 12,
      jump: -330,
      drive: 190,
      heavy: true,
      knockdown: true,
      name: 'DRAMA BOMB'
    },
    tinyFury: {
      startup: 0.15,
      active: 0.33,
      recovery: 0.42,
      dmg: 4,
      box: [3, -30, 43, 29],
      kb: 18,
      frame: 4,
      prepare: 12,
      drive: 230,
      pulses: 3,
      type: 'low',
      name: 'TINY TEMPER · 1 2 3'
    },
    tinyRocket: {
      startup: 0.25,
      active: 0.25,
      recovery: 0.46,
      dmg: 11,
      box: [-4, -34, 55, 37],
      kb: 125,
      frame: 8,
      prepare: 9,
      jump: -275,
      drive: 350,
      name: 'POCKET ROCKET'
    },
    tinyUpper: {
      startup: 0.22,
      active: 0.22,
      recovery: 0.4,
      dmg: 10,
      box: [0, -61, 43, 60],
      kb: 125,
      frame: 5,
      prepare: 12,
      jump: -245,
      drive: 170,
      heavy: true,
      name: 'NOT YOUR TOY'
    },
    micDrop: {
      startup: 0.4,
      active: 0.38,
      recovery: 0.7,
      dmg: 15,
      box: [-18, -40, 61, 46],
      kb: 160,
      frame: 14,
      prepare: 11,
      jump: -355,
      drive: 230,
      heavy: true,
      knockdown: true,
      name: 'MIC DROP'
    }
  };
  for (const [key, move] of Object.entries(TEDDY_MOVES))
    App.MOVES[key] = { type: 'high', ...move, key, worldBox: true, teddy: true };

  const teddyHeight = (f) => TEDDY_TUNING.height * f.teddyScale;
  function teddyHurtbox(f) {
    const s = f.teddyScale;
    const crouch = f.state === 'crouch' || f.atk?.key === 'royalSweep';
    return {
      x: f.x - 30 * s,
      y: f.y - (crouch ? 72 : 106) * s,
      w: 60 * s,
      h: (crouch ? 72 : 106) * s
    };
  }
  function startTeddyAttack(f, key) {
    const def = App.MOVES[key];
    if (f.atk || !def?.teddy) return;
    f.atk = { key, def, t: 0, hasHit: false, launched: false, pulse: -1 };
    f.state = 'attack';
    f.vx = 0;
    App.Sfx.play('swing');
  }
  function stepTeddyAttack(f, dt, op) {
    const a = f.atk,
      d = a.def;
    const before = a.t;
    a.t += dt;
    if (a.t >= d.startup && !a.launched) {
      a.launched = true;
      if (d.jump && f.grounded) {
        f.vy = d.jump;
        f.grounded = false;
        App.Sfx.play('jump');
      }
    }
    const driveTime = Math.max(
      0,
      Math.min(a.t, d.startup + d.active) - Math.max(before, d.startup)
    );
    if (d.drive && driveTime > 0) {
      // A barrage closes to punching distance, without passing through its target.
      const step = Math.min(d.drive * driveTime, Math.max(0, Math.abs(op.x - f.x) - 28));
      f.x += f.facing * step;
    }
    if (a.t >= d.startup && a.t < d.startup + d.active) {
      const pulse = d.pulses ? Math.floor((a.t - d.startup) / (d.active / d.pulses)) : 0;
      if (pulse !== a.pulse) {
        a.pulse = pulse;
        a.hasHit = false;
      }
      if (!a.hasHit) App.tryHit(f, op);
    }
    if (f.atk === a && a.t >= d.startup + d.active + d.recovery) {
      f.atk = null;
      f.state = f.grounded ? 'idle' : 'jump';
    }
  }
  function restTeddy(f) {
    f.restT = (f.tiny ? 0.48 : 0.65) + App.rnd() * 0.35;
    f.openingT = f.tiny ? 0.3 : 0.42;
    f.burstLeft = 0;
  }
  function controlTeddy(f, op, dt) {
    for (const key of ['aiT', 'openingT', 'dodgeCooldown', 'reactionT'])
      f[key] = Math.max(0, f[key] - dt);
    if (App.game.state !== 'fight' || f.state === 'ko') {
      App.physics(f, dt);
      return;
    }
    if (f.state === 'knockdown') {
      f.knockT += dt;
      if (f.grounded && f.knockT >= (f.tiny ? 0.65 : 0.9)) {
        f.state = 'idle';
        f.invuln = 0.25;
        restTeddy(f);
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
    const gap = Math.abs(op.x - f.x),
      dir = Math.sign(op.x - f.x) || f.facing;
    const missile = App.projectiles.find(
      (p) => p.owner === op && (f.x - p.x) * p.vx > 0 && Math.abs(f.x - p.x) < 110
    );
    const threat = missile || (op.atk && !op.atk.hasHit && gap < 115 ? op.atk : null);
    if (threat && threat !== f.observedMove) {
      f.observedMove = threat;
      f.reactionT = f.tiny ? 0.16 : 0.23;
    }
    if (f.atk) {
      stepTeddyAttack(f, dt, op);
      if (!f.atk) {
        if (f.burstLeft > 0) {
          f.burstLeft--;
          f.aiT = 0.16;
        } else restTeddy(f);
      }
    } else if (f.blockT > 0) {
      f.state = 'block';
      f.blockT = Math.max(0, f.blockT - dt);
      if (!f.blockT) restTeddy(f);
    } else if (
      threat &&
      threat !== f.lastThreat &&
      !f.openingT &&
      !f.dodgeCooldown &&
      !f.reactionT &&
      f.grounded
    ) {
      f.lastThreat = threat;
      f.dodgeCooldown = 1.2;
      if (App.rnd() < 0.65) {
        f.facing = dir;
        f.blockT = 0.24;
        f.state = 'block';
      } else restTeddy(f);
    } else if (f.restT > 0) {
      f.restT = Math.max(0, f.restT - dt);
      f.state = f.grounded ? 'idle' : 'jump';
    } else if (!f.aiT) {
      f.facing = dir;
      if (gap > (f.tiny ? 65 : 88)) {
        if (gap > 145 && f.rushStep % 3 === 0) {
          f.rushStep++;
          App.startAttack(f, f.tiny ? 'tinyRocket' : 'dramaBomb');
        } else App.moveWalking(f, dir * Math.min((f.tiny ? 230 : 110) * dt, gap - 48));
      } else {
        const normal = ['velvetCross', 'curtainCall', 'royalSweep', 'dramaBomb'];
        const tiny = ['tinyFury', 'tinyRocket', 'tinyFury', 'micDrop'];
        const key = !op.grounded
          ? f.tiny
            ? 'tinyUpper'
            : 'curtainCall'
          : op.state === 'block' && !f.tiny
            ? 'royalSweep'
            : (f.tiny ? tiny : normal)[f.rushStep++ % 4];
        if (f.tiny && !f.burstLeft && key === 'tinyFury') f.burstLeft = 1;
        App.startAttack(f, key);
      }
    }
    App.physics(f, dt);
    if (!f.atk) f.facing = op.x > f.x ? 1 : -1;
  }
  function queueTeddyShrink(f) {
    if (!App.isTeddy(f) || f.shrinkUsed || f.hp <= 0 || f.hp > f.maxHp * 0.67) return;
    f.shrinkUsed = true;
    f.shrinkDelay = 0.45 + App.rnd() * 1.05;
  }
  function beginTeddyShrink() {
    const f = App.dummy;
    f.shrinkDelay = -1;
    for (const actor of [f, App.player]) {
      Object.assign(actor, {
        atk: null,
        teleport: null,
        vx: 0,
        vy: 0,
        grounded: true,
        y: App.GROUND,
        hitstun: 0,
        flash: 0,
        crouching: false,
        state: 'idle'
      });
    }
    f.state = 'shrinking';
    App.game.state = 'shrink';
    App.game.t = 0;
    App.game.hitStop = App.game.shake = App.game.shakeX = App.game.shakeY = 0;
    App.projectiles.length = App.afterimages.length = App.particles.length = 0;
    App.resetCombo();
    App.resetInput();
    App.game.msg = { text: 'DORAEMON · SHRINK RAY', sub: '', big: 8 };
    App.Sfx.play('shrink');
  }
  function stepTeddyShrink(dt) {
    const f = App.dummy;
    if (App.game.state === 'fight') {
      if (!App.isTeddy(f)) return;
      queueTeddyShrink(f);
      if (f.shrinkDelay >= 0 && f.hp > 0) {
        f.shrinkDelay -= dt;
        if (f.shrinkDelay <= 0 && !App.player.teleport) beginTeddyShrink();
        else f.shrinkDelay = Math.max(0, f.shrinkDelay);
      }
      return;
    }
    if (App.game.state !== 'shrink') return;
    App.game.t += dt;
    f.teddyScale = App.lerp(1, TEDDY_TUNING.tinyScale, App.smooth((App.game.t - 0.75) / 0.85));
    if (App.game.t >= 1.65)
      App.game.msg = { text: 'TINY TEMPER', sub: '66% SMALLER. ALL ATTITUDE.', big: 10 };
    if (App.game.t >= 2.35) {
      Object.assign(f, {
        tiny: true,
        teddyScale: TEDDY_TUNING.tinyScale,
        state: 'idle',
        restT: 0.7,
        openingT: 0.5,
        burstLeft: 0,
        invuln: 0.2,
        blockT: 0
      });
      App.game.state = 'fight';
      App.game.msg = null;
      App.resetInput();
    }
  }
  Object.assign(App, {
    TEDDY_TUNING,
    TEDDY_MOVES,
    teddyHeight,
    teddyHurtbox,
    startTeddyAttack,
    stepTeddyAttack,
    controlTeddy,
    queueTeddyShrink,
    stepTeddyShrink
  });
})(window.INJ);
