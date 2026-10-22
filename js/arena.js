/* arena.js — see docs/architecture.md for ownership and startup order.
 * Cross-module dependencies: content.js, core.js, fighters.js, state.js.
 * App is the shared INJ namespace; the exported API is listed at the end. */
(function (App) {
  'use strict';
  /* ============================== background bake ============================== */
  const bg = document.createElement('canvas');
  bg.width = App.world.width * App.RENDER_SCALE;
  bg.height = App.H * App.RENDER_SCALE;
  const bgx = bg.getContext('2d');
  bgx.scale(App.RENDER_SCALE, App.RENDER_SCALE);
  // Each encounter owns a plate. Selection derives from the round, never combat RNG.
  const arenaStages = [
    {
      id: 'training',
      name: 'CEDAR COURTYARD',
      sky: '#685044',
      floor: '#514335',
      accent: '#f2cd85',
      glows: [
        [60, 76, 14],
        [282, 109, 11],
        [332, 76, 14]
      ]
    },
    {
      id: 'awakened',
      name: 'STORM SANCTUM',
      sky: '#282344',
      floor: '#272538',
      accent: '#bf9fda',
      glows: [
        [31, 88, 13],
        [195, 96, 9],
        [365, 86, 13]
      ],
      duel: true
    },
    {
      id: 'goldline',
      name: 'GOLDLINE FOUNDRY',
      sky: '#12303d',
      floor: '#162b32',
      accent: '#78e0df',
      glows: [
        [30, 85, 12],
        [200, 42, 18],
        [370, 85, 12]
      ]
    },
    {
      id: 'velvet',
      name: 'TOYBOX OPERA',
      sky: '#29203c',
      floor: '#67412e',
      accent: '#f5c888',
      glows: [
        [131, 35, 10],
        [166, 30, 10],
        [202, 28, 10],
        [237, 30, 10],
        [271, 35, 10]
      ]
    }
  ];
  function arenaStage(round = App.game.round) {
    return arenaStages[App.clamp(Math.floor(round) - 1, 0, arenaStages.length - 1)];
  }
  // Bake only on load, encounter change or resize. The source plates stay intact.
  function paintArena() {
    const g = bgx,
      stage = arenaStage(),
      arenaImg = stage.image;
    g.clearRect(0, 0, App.world.width, App.H);
    if (arenaImg.complete && arenaImg.naturalWidth) {
      const scale = App.world.width / 400;
      g.drawImage(arenaImg, 0, App.GROUND * (1 - scale), App.world.width, App.H * scale);
      // A little depth behind the fighters keeps their silhouettes legible.
      const shade = g.createLinearGradient(0, 80, 0, App.H);
      shade.addColorStop(0, '#05091400');
      shade.addColorStop(0.55, '#05091420');
      shade.addColorStop(1, '#05091445');
      g.fillStyle = shade;
      g.fillRect(0, 0, App.world.width, App.H);
      return;
    }
    // Immediate local fallback also covers a missing or unavailable art asset.
    const sky = g.createLinearGradient(0, 0, 0, App.H);
    sky.addColorStop(0, stage.sky);
    sky.addColorStop(0.65, stage.sky);
    sky.addColorStop(1, stage.floor);
    g.fillStyle = sky;
    g.fillRect(0, 0, App.world.width, App.H);
    g.fillStyle = '#111622';
    g.fillRect(137, 33, 126, 12);
    g.fillRect(137, 33, 16, 119);
    g.fillRect(247, 33, 16, 119);
    g.fillStyle = '#6a543b';
    g.beginPath();
    g.ellipse(200, 84, 13, 24, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = stage.floor;
    g.fillRect(0, 155, App.world.width, App.H - 155);
    g.strokeStyle = '#79717a55';
    g.lineWidth = 1;
    for (let y = 160; y < App.H; y += 12) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(App.world.width, y);
      g.stroke();
    }
    for (let x = -200; x < 600; x += 70) {
      g.beginPath();
      g.moveTo(200 + (x - 200) * 0.3, 155);
      g.lineTo(x, App.H);
      g.stroke();
    }
  }
  for (const stage of arenaStages) {
    stage.image = new Image();
    stage.image.onload = paintArena;
    stage.image.onerror = paintArena;
    stage.image.src = 'assets/stage-' + stage.id + '-v1.png';
  }
  const arenaImg = arenaStages[0].image; // Initial-plate compatibility API.
  paintArena();

  const injAvatarImg = new Image();
  injAvatarImg.src = 'inj_avatar.png';
  const bloodCv = document.createElement('canvas');
  bloodCv.width = App.world.width * App.RENDER_SCALE;
  bloodCv.height = App.H * App.RENDER_SCALE;
  const bctx = bloodCv.getContext('2d');
  bctx.scale(App.RENDER_SCALE, App.RENDER_SCALE);
  /* A deterministic, cosmetic duel on the distant terrace. These actors never enter
   combat controllers, damage handling, projectiles, RNG, or the audio engine. */
  const STAGE_DUEL_LENGTH = 18;
  const stageInj = {
    ...App.makeFighter({
      name: 'AWAKENED INJ',
      kind: 'inj',
      pal: { ...App.INJ_PAL, robe: '#4b3b64', robeHi: '#a399bd', gold: '#f7d890' },
      x: 145,
      facing: 1,
      hp: 120
    }),
    backstage: true,
    awakenedLook: true,
    charge: 3
  };
  const stageDummy = {
    ...App.makeFighter({
      name: 'AWAKENED DUMMY',
      kind: 'dummy',
      pal: { ...App.DUM_PAL, robeHi: '#d9b475' },
      x: 255,
      facing: -1,
      hp: 130
    }),
    backstage: true,
    awakenedLook: true
  };
  function stageDuelAt(seconds, still = App.reducedMotion) {
    const clock = Math.floor(seconds * 12) / 12;
    const t = still ? 0 : ((clock % STAGE_DUEL_LENGTH) + STAGE_DUEL_LENGTH) % STAGE_DUEL_LENGTH;
    const inj = { ...stageInj, anim: t * 1.6, x: 171, atk: null },
      dum = { ...stageDummy, anim: t * 1.6, x: 229, atk: null };
    const scene = {
      time: t,
      phase: 'approach',
      inj,
      dummy: dum,
      shot: null,
      impact: 0,
      winner: null,
      alpha: still ? 1 : Math.min(1, t / 0.45, (18 - t) / 0.6)
    };
    const attack = (f, key, local, period = 0.5) => {
      const def = App.MOVES[key],
        total = def.startup + def.active + def.recovery;
      f.state = 'attack';
      f.atk = { key, def, t: ((((local % period) + period) % period) / period) * total };
    };
    if (still) {
      inj.x = 150;
      dum.x = 250;
      return scene;
    }
    if (t < 1.5) {
      const p = App.smooth(t / 1.5);
      inj.x = App.lerp(135, 171, p);
      dum.x = App.lerp(265, 229, p);
      inj.state = dum.state = 'walk';
      inj.walkPhase = inj.x - 135;
      dum.walkPhase = 265 - dum.x;
    } else if (t < 3.8) {
      scene.phase = 'guard';
      inj.state = 'block';
      attack(dum, t < 2.6 ? 'jab' : 'straight', t - 1.5, 0.5);
      if (dum.atk.t > 0.08 && dum.atk.t < 0.15) scene.impact = 0.4;
    } else if (t < 5) {
      scene.phase = 'dodge';
      const p = (t - 3.8) / 1.2;
      inj.state = 'dodge';
      const elapsed = t - 3.8;
      inj.x =
        elapsed < 0.15
          ? App.lerp(171, 143, App.easeOut(elapsed / 0.15))
          : elapsed < 0.72
            ? 143
            : App.lerp(143, 171, App.easeOut((elapsed - 0.72) / 0.38));
      attack(dum, 'roundhouse', p, 0.9);
    } else if (t < 7.8) {
      scene.phase = 'counter';
      attack(inj, t < 6.4 ? 'jab' : 'straight', t - 5, 0.48);
      const beat = (t - 5) % 0.48;
      dum.state = beat < 0.22 ? 'hurt' : 'block';
      dum.x =
        229 + (beat < 0.055 ? (beat / 0.055) * 5 : 5 * (1 - App.easeOut((beat - 0.055) / 0.16)));
      dum.flash = beat < 0.1 ? 0.04 : 0;
      if (inj.atk.t > 0.07 && inj.atk.t < 0.13) scene.impact = 0.65;
    } else if (t < 9.5) {
      scene.phase = 'aerial';
      const p = (t - 7.8) / 1.7;
      inj.state = 'crouch';
      dum.x = App.lerp(246, 220, p);
      dum.y = App.GROUND - Math.sin(p * Math.PI) * 64;
      dum.grounded = false;
      attack(dum, 'jkick', p, 0.8);
    } else if (t < 11.4) {
      scene.phase = 'shadow';
      inj.x = 166;
      dum.x = 238;
      dum.state = 'block';
      attack(inj, 'toss', t - 9.5, 0.95);
      const p = ((t - 9.5) / 0.95) % 1;
      scene.shot = { x: App.lerp(193, 225, p), y: App.GROUND - 69, alpha: Math.sin(p * Math.PI) };
    } else if (t < 12.2) {
      scene.phase = 'finisher';
      const p = (t - 11.4) / 0.8;
      inj.x = App.lerp(166, 190, App.smooth(Math.min(1, p * 2)));
      dum.x = 230;
      if (p < 0.35) {
        inj.state = 'dodge';
        attack(dum, 'haymaker', p, 0.8);
      } else {
        attack(inj, 'uppercut', (p - 0.35) * 0.5, 0.8);
        dum.state = 'hurt';
        scene.impact = p > 0.53 && p < 0.75 ? 1 : 0;
      }
    } else if (t < 14.1) {
      scene.phase = 'launch';
      const p = (t - 12.2) / 1.9;
      inj.x = 190;
      dum.state = 'ko';
      dum.hp = 0;
      dum.x = App.lerp(230, 254, p);
      dum.y = App.GROUND - Math.sin(p * Math.PI) * 87;
      dum.fallRot = App.lerp(-0.3, -1.5, p);
      dum.grounded = p >= 1;
      if (p < 0.15) {
        attack(inj, 'uppercut', 0.16 + p, 0.8);
        scene.impact = 1 - p / 0.15;
      }
    } else {
      scene.phase = 'victory';
      scene.winner = 'INJ';
      inj.x = 190;
      inj.state = 'victory';
      dum.x = 254;
      dum.state = 'ko';
      dum.hp = 0;
    }
    return scene;
  }
  function drawStageDuel(now) {
    if (!arenaStage().duel) return;
    const scene = stageDuelAt(now * 0.001);
    App.ctx.save();
    App.ctx.beginPath();
    App.ctx.rect(163, 66, 76, 46);
    App.ctx.clip();
    App.ctx.globalAlpha *= scene.alpha * 0.85;
    App.ctx.translate(200, 109);
    App.ctx.scale(0.3, 0.3);
    App.ctx.translate(-200, -App.GROUND);
    if (scene.phase === 'dodge' || scene.phase === 'finisher') {
      App.ctx.save();
      App.ctx.globalAlpha *= 0.2;
      App.drawFighter({ ...scene.inj, x: scene.inj.x - 14 }, true);
      App.ctx.restore();
    }
    App.drawFighter(scene.dummy);
    App.drawFighter(scene.inj);
    if (scene.shot) {
      const p = scene.shot;
      App.ctx.globalAlpha *= p.alpha;
      const glow = App.ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, 14);
      glow.addColorStop(0, '#fff0b9');
      glow.addColorStop(0.25, '#bd94ec');
      glow.addColorStop(1, '#bd94ec00');
      App.ctx.fillStyle = glow;
      App.ctx.fillRect(p.x - 14, p.y - 14, 28, 28);
    }
    if (scene.impact && !App.reducedMotion) {
      App.ctx.strokeStyle = scene.phase === 'guard' ? '#b4d4ee' : '#f0d59b';
      App.ctx.lineWidth = 1.3;
      App.ctx.globalAlpha *= scene.impact;
      const x = scene.phase === 'guard' ? 193 : 211,
        y = App.GROUND - 72;
      for (let i = 0; i < 5; i++) {
        const a = i * Math.PI * 0.4;
        App.ctx.beginPath();
        App.ctx.moveTo(x + Math.cos(a) * 3, y + Math.sin(a) * 3);
        App.ctx.lineTo(x + Math.cos(a) * 10, y + Math.sin(a) * 10);
        App.ctx.stroke();
      }
    }
    App.ctx.restore();
  }
  function drawArenaAtmosphere(now) {
    const time = now * 0.001,
      stage = arenaStage(),
      { ctx } = App;
    ctx.save();
    for (const [x, y, r] of stage.glows) {
      const glow = ctx.createRadialGradient(x, y, 1, x, y, r);
      ctx.globalAlpha = App.reducedMotion ? 0.07 : 0.07 + Math.sin(time * 2 + x) * 0.02;
      glow.addColorStop(0, stage.accent);
      glow.addColorStop(1, stage.accent + '00');
      ctx.fillStyle = glow;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    if (!App.reducedMotion) {
      // Quiet, deterministic motes: leaves, rain, ion sparks or theatre dust.
      for (let i = 0; i < 20; i++) {
        const rain = stage.id === 'awakened';
        const phase = (time * (rain ? 0.27 : 0.022) + i * 0.137) % 1;
        const x = (i * 53 + phase * (rain ? -25 : 44) + 400) % 400;
        const y = 26 + phase * 150;
        ctx.globalAlpha = Math.sin(phase * Math.PI) * (rain ? 0.18 : 0.25);
        ctx.fillStyle = stage.accent;
        if (rain) ctx.fillRect(x, y, 0.35, 5);
        else ctx.fillRect(x + Math.sin(phase * 6 + i) * 6, y, 0.7, 0.7);
      }
    }
    ctx.restore();
  }

  Object.assign(App, {
    bg,
    bgx,
    paintArena,
    arenaImg,
    arenaStages,
    arenaStage,
    injAvatarImg,
    bloodCv,
    bctx,
    STAGE_DUEL_LENGTH,
    stageInj,
    stageDummy,
    stageDuelAt,
    drawStageDuel,
    drawArenaAtmosphere
  });
})(window.INJ);
