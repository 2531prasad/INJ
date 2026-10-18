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
  // Bake the supplied arena plate once. Gameplay and ambient motion stay on Canvas.
  function paintArena() {
    const g = bgx;
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
    sky.addColorStop(0, '#17233d');
    sky.addColorStop(0.65, '#263745');
    sky.addColorStop(1, '#17161f');
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
    g.fillStyle = '#343440';
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
  const arenaImg = new Image();
  arenaImg.onload = paintArena;
  arenaImg.onerror = paintArena;
  arenaImg.src = 'assets/hollow-courtyard.png';
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
    const scene = stageDuelAt(now * 0.001);
    App.ctx.save();
    App.ctx.beginPath();
    App.ctx.rect(138, 70, 126, 96);
    App.ctx.clip();
    App.ctx.globalAlpha *= scene.alpha * 0.85;
    App.ctx.translate(200, 151);
    App.ctx.scale(0.4, 0.4);
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
    const time = now * 0.001;
    App.ctx.save();
    // Match the painted lanterns, rather than floating fire in front of the scenery.
    for (const [x, y, r] of [
      [43, 41, 16],
      [66, 71, 13],
      [178, 72, 10],
      [219, 71, 9],
      [328, 78, 14],
      [352, 48, 16],
      [44, 131, 15],
      [354, 131, 16]
    ]) {
      const glow = App.ctx.createRadialGradient(x, y, 1, x, y, r);
      const alpha = App.reducedMotion ? 0.075 : 0.075 + Math.sin(time * 3 + x) * 0.025;
      glow.addColorStop(0, 'rgba(255,181,73,' + alpha + ')');
      glow.addColorStop(1, '#ffae4500');
      App.ctx.fillStyle = glow;
      App.ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    if (!App.reducedMotion) {
      // Water glints below the far arch, slow ground mist, and drifting red petals.
      App.ctx.fillStyle = '#bdd9ed';
      for (let i = 0; i < 18; i++) {
        const x = 147 + ((i * 19.7) % 101),
          y = 130 + (i % 4) * 1.8;
        App.ctx.globalAlpha = 0.06 + 0.06 * Math.sin(time * 1.7 + i);
        App.ctx.fillRect(x + Math.sin(time * 0.4 + i) * 3, y, 2 + (i % 3), 0.5);
      }
      for (let i = 0; i < 5; i++) {
        const x = ((time * 3 + i * 94) % 520) - 60,
          y = 154 + (i % 2) * 2;
        const mist = App.ctx.createRadialGradient(x, y, 0, x, y, 60);
        mist.addColorStop(0, '#aec7dc0c');
        mist.addColorStop(1, '#aec7dc00');
        App.ctx.globalAlpha = 1;
        App.ctx.fillStyle = mist;
        App.ctx.fillRect(x - 60, y - 18, 120, 36);
      }
      for (let i = 0; i < 18; i++) {
        const phase = (time * 0.025 + i * 0.137) % 1;
        const x = (i * 53 + phase * 68 + Math.sin(phase * 7 + i) * 11) % 400,
          y = 25 + phase * 175;
        App.ctx.globalAlpha = Math.sin(phase * Math.PI) * 0.6;
        App.ctx.fillStyle = i % 3 ? '#bf596e' : '#e6a1a4';
        App.ctx.save();
        App.ctx.translate(x, y);
        App.ctx.rotate(phase * 5 + i);
        App.ctx.fillRect(-1, -0.5, 2, 1);
        App.ctx.restore();
      }
    }
    App.ctx.restore();
  }

  Object.assign(App, {
    bg,
    bgx,
    paintArena,
    arenaImg,
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
