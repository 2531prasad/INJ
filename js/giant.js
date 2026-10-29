/* Velvet Colossus: standalone boss flow, committed attacks and one awakened echo.
 * Dependencies: state.js, encounters.js, content.js, combat.js, movement.js, opponent.js.
 * Shared combat owns every HP change; giant-renderer owns camera, poses and HUD. */
(function (App) {
  'use strict';
  const GIANT_TUNING = {
    health: 1200,
    scale: 2,
    zoom: 0.6,
    intro: 4.8,
    minionHP: 40,
    minionLife: 10
  };
  const GIANT_MOVES = {
    colossusSmash: {
      startup: 1.15,
      active: 0.18,
      recovery: 1.4,
      lockAt: 0.55,
      dmg: 20,
      kb: 135,
      box: [12, -180, 250, 184],
      heavy: true,
      knockdown: true,
      name: 'KINGDOM BREAKER',
      hint: 'BLOCK OR BLINK BEHIND'
    },
    colossusStomp: {
      startup: 0.95,
      active: 0.1,
      recovery: 1.35,
      lockAt: 0.4,
      dmg: 12,
      kb: 85,
      box: [0, -30, 20, 30],
      name: 'ROYAL FOOTFALL',
      hint: 'JUMP THE SHOCKWAVE'
    },
    colossusStars: {
      startup: 1.1,
      active: 0.1,
      recovery: 1.65,
      lockAt: 0.4,
      dmg: 10,
      kb: 75,
      box: [0, 0, 0, 0],
      name: 'FALLING OVATION',
      hint: 'LEAVE THE GOLD MARKS'
    },
    colossusSummon: {
      startup: 1.15,
      active: 0.1,
      recovery: 0.3,
      lockAt: 0,
      dmg: 0,
      kb: 0,
      box: [0, 0, 0, 0],
      name: 'ROYAL RECESS',
      hint: 'AN AWAKENED ECHO ANSWERS'
    }
  };
  for (const [key, d] of Object.entries(GIANT_MOVES))
    App.MOVES[key] = { type: 'high', ...d, key, giant: true, worldBox: true };

  function resetGiantEncounter() {
    Object.assign(App.giantEncounter, {
      minion: null,
      impact: null,
      hpTrail: GIANT_TUNING.health,
      revealPlayed: false
    });
    App.giantEncounter.hazards.length = 0;
  }
  function beginGiantIntro() {
    const w = App.fightWidth();
    Object.assign(App.player, { x: w * 0.36, facing: 1 });
    Object.assign(App.dummy, {
      x: w * 0.68,
      facing: -1,
      teddyScale: 1,
      shrinkUsed: true,
      state: 'idle',
      restT: 1.2
    });
    App.game.state = 'enlarge';
    App.game.t = 0;
    App.game.roundTime = null;
    App.resetInput();
  }
  function stepGiantIntro(dt) {
    App.game.t += dt;
    const t = App.game.t;
    App.dummy.teddyScale = App.lerp(1, GIANT_TUNING.scale, App.smooth((t - 1) / 1.9));
    if (t >= 0.8 && !App.giantEncounter.revealPlayed) {
      App.giantEncounter.revealPlayed = true;
      App.Sfx.play('enlarge');
    }
    if (t >= GIANT_TUNING.intro) {
      Object.assign(App.dummy, { teddyScale: GIANT_TUNING.scale, state: 'idle', restT: 1.4 });
      App.game.state = 'fight';
      App.game.msg = null;
      App.game.t = 0;
      App.resetInput();
    }
  }
  function startGiantAttack(f, key) {
    const def = App.MOVES[key];
    if (f.atk || !def?.giant || App.game.state !== 'fight') return;
    f.atk = {
      key,
      def,
      t: 0,
      hasHit: false,
      fired: false,
      targetX: App.player.x,
      directionLocked: false
    };
    f.state = 'attack';
    f.vx = 0;
    f.summonRetreatT = 0;
    App.Sfx.play('bossWindup');
  }
  function summonGiantMinion(f) {
    if (App.giantEncounter.minion) return;
    let x = App.clamp(f.x + f.facing * 155, 40, App.fightWidth() - 40);
    if (Math.abs(x - App.player.x) < 72)
      x = App.clamp(
        App.player.x + (App.player.x < App.fightWidth() / 2 ? 85 : -85),
        40,
        App.fightWidth() - 40
      );
    App.giantEncounter.minion = Object.assign(
      App.makeFighter({
        name: 'AWAKENED ECHO',
        kind: 'dummy',
        pal: { ...App.DUM_PAL, robeHi: '#efcf8b', gold: '#fce0a4' },
        x,
        facing: App.player.x > x ? 1 : -1,
        hp: GIANT_TUNING.minionHP
      }),
      {
        summoned: true,
        spawnT: 0,
        life: GIANT_TUNING.minionLife,
        invuln: 0.45,
        aiT: 0.7,
        restT: 0.7
      }
    );
    App.Sfx.play('summon');
  }
  function stepGiantAttack(f, dt, op) {
    const a = f.atk,
      d = a.def;
    a.t += dt;
    // Follow early windup, then commit. An early Blink can be reacquired; a late
    // Blink exploits the locked facing. Never track an invisible arrival.
    if (!a.directionLocked) {
      if (!op.teleport && a.t < d.lockAt) f.facing = Math.sign(op.x - f.x) || f.facing;
      if (a.t >= d.lockAt) a.directionLocked = true;
    }
    if (a.t >= d.startup && !a.fired) {
      a.fired = true;
      if (a.key === 'colossusStomp') {
        for (const dir of [-1, 1])
          App.giantEncounter.hazards.push({
            type: 'wave',
            x: f.x + dir * 40,
            y: App.GROUND,
            vx: dir * 210,
            t: 0,
            life: 2.7,
            hit: false,
            move: d
          });
      } else if (a.key === 'colossusStars') {
        for (const offset of [-110, 0, 110])
          App.giantEncounter.hazards.push({
            type: 'star',
            x: App.clamp(a.targetX + offset, 30, App.fightWidth() - 30),
            y: -30,
            delay: 0.9 + Math.abs(offset) / 600,
            t: 0,
            life: 2.4,
            hit: false,
            move: d
          });
      } else if (a.key === 'colossusSummon') summonGiantMinion(f);
      if (a.key !== 'colossusSummon') {
        App.giantEncounter.impact = { x: f.x + f.facing * 120, life: 0.5, max: 0.5 };
        App.Sfx.play(a.key === 'colossusStars' ? 'summon' : 'bossSmash');
        if (!App.reducedMotion) App.game.shake = 4;
      }
    }
    if (a.key === 'colossusSmash' && a.t >= d.startup && a.t < d.startup + d.active && !a.hasHit)
      App.tryHit(f, op);
    if (f.atk === a && a.t >= d.startup + d.active + d.recovery) {
      f.atk = null;
      f.state = a.key === 'colossusSummon' ? 'relax' : 'idle';
      f.restT = a.key === 'colossusSummon' ? 7 : 0.65 + App.rnd() * 0.35;
    }
  }
  function controlGiant(f, op, dt) {
    if (App.game.state !== 'fight' || f.state === 'ko') {
      App.physics(f, dt);
      return;
    }
    f.hitstun = 0;
    if (f.atk) stepGiantAttack(f, dt, op);
    else if (f.restT > 0) {
      f.restT = Math.max(0, f.restT - dt);
      if (f.state !== 'relax') f.state = 'idle';
      if (f.state === 'relax' && !App.giantEncounter.minion) f.restT = Math.min(f.restT, 1);
    } else {
      const dir = Math.sign(op.x - f.x) || f.facing,
        gap = Math.abs(op.x - f.x);
      f.facing = dir;
      const pattern = [
        'colossusSmash',
        'colossusStomp',
        'colossusSummon',
        'colossusSmash',
        'colossusStars'
      ];
      const key = pattern[f.rushStep % pattern.length];
      if (key === 'colossusSummon' && gap < 210 && f.summonRetreatT < 0.85) {
        f.summonRetreatT += dt;
        App.moveWalking(f, -dir * 62 * dt);
        // A corner is a valid place to stop retreating and call the echo.
        if (f.state !== 'walk') {
          f.rushStep++;
          startGiantAttack(f, key);
        }
      } else if (key === 'colossusSmash' && gap > 205) App.moveWalking(f, dir * 68 * dt);
      else {
        f.rushStep++;
        startGiantAttack(f, key);
      }
    }
    App.physics(f, dt);
  }
  function defeatGiantMinion(f) {
    f.hp = 0;
    f.atk = null;
    f.state = 'ko';
    f.deadT = 0.55;
    f.vx = f.vy = 0;
    f.grounded = true;
  }
  function stepGiantEncounter(dt) {
    if (!App.isGiant(App.dummy) || App.game.state !== 'fight') return;
    const scene = App.giantEncounter,
      minion = scene.minion;
    scene.hpTrail = Math.max(App.dummy.hp, scene.hpTrail - dt * 55);
    if (scene.impact) {
      scene.impact.life -= dt;
      if (scene.impact.life <= 0) scene.impact = null;
    }
    if (minion) {
      if (minion.state === 'ko') {
        minion.deadT -= dt;
        if (minion.deadT <= 0) scene.minion = null;
      } else {
        minion.spawnT += dt;
        minion.life -= dt;
        if (minion.life <= 0) defeatGiantMinion(minion);
        else App.controlDummy(minion, App.player, dt);
      }
    }
    if (App.game.state !== 'fight') return;
    for (let i = scene.hazards.length - 1; i >= 0; i--) {
      const h = scene.hazards[i];
      h.t += dt;
      h.life -= dt;
      if (h.type === 'wave') h.x += h.vx * dt;
      else if (h.t > h.delay) h.y += 350 * dt;
      const box = App.hurtbox(App.player);
      const contact =
        h.type === 'wave'
          ? h.x + 14 > box.x && h.x - 14 < box.x + box.w && box.y + box.h > App.GROUND - 24
          : h.t > h.delay &&
            h.x + 18 > box.x &&
            h.x - 18 < box.x + box.w &&
            h.y + 18 > box.y &&
            h.y - 18 < box.y + box.h;
      if (
        !h.hit &&
        contact &&
        !App.player.teleport &&
        !App.player.invuln &&
        !['ko', 'knockdown'].includes(App.player.state)
      ) {
        h.hit = true;
        // Area hazards have a real point of origin for directional guarding.
        const source = {
          ...App.dummy,
          sourceActor: App.dummy,
          x: h.type === 'wave' ? h.x - Math.sign(h.vx) * 30 : h.x,
          facing: h.x > App.player.x ? -1 : 1
        };
        App.applyHit(App.player, source, h.move, h.x, Math.min(h.y, App.GROUND - 12));
        if (App.game.state !== 'fight') return;
      }
      if (h.life <= 0 || h.x < -30 || h.x > App.fightWidth() + 30 || h.y > App.GROUND + 30)
        scene.hazards.splice(i, 1);
    }
  }
  Object.assign(App, {
    GIANT_TUNING,
    GIANT_MOVES,
    resetGiantEncounter,
    beginGiantIntro,
    stepGiantIntro,
    startGiantAttack,
    stepGiantAttack,
    controlGiant,
    summonGiantMinion,
    defeatGiantMinion,
    stepGiantEncounter
  });
})(window.INJ);
