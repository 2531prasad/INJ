/* fighters.js — see docs/architecture.md for ownership and startup order.
 * Cross-module dependencies: core.js, encounters.js, r8-renderer.js, teddy-renderer.js, teleport.js.
 * App is the shared INJ namespace; the exported API is listed at the end. */
(function (App) {
  'use strict';
  /* ============================== authored sprite animation ============================== */
  const spriteSheets = {};
  for (const kind of ['inj', 'dummy']) {
    const image = new Image();
    spriteSheets[kind] = { image, meta: window.InjSpriteFrames[kind], ready: false };
    image.onload = () => {
      if (kind === 'inj') {
        // Cache a runtime recolor; source pixels and alpha remain untouched on disk.
        const green = document.createElement('canvas');
        green.width = image.naturalWidth;
        green.height = image.naturalHeight;
        const g = green.getContext('2d');
        g.drawImage(image, 0, 0);
        g.globalCompositeOperation = 'source-atop';
        g.fillStyle = 'rgba(35,255,92,0.72)';
        g.fillRect(0, 0, green.width, green.height);
        spriteSheets[kind].nitroImage = green;
      }
      spriteSheets[kind].ready = true;
    };
    image.src = 'assets/' + kind + '-sprites-v2.png';
  }
  const walkSheets = {};
  for (const kind of ['inj', 'dummy']) {
    const image = new Image();
    walkSheets[kind] = { image, meta: window.InjWalkFrames[kind], ready: false };
    image.onload = () => {
      walkSheets[kind].ready = true;
    };
    image.src = 'assets/walk-cycle-v3.png';
  }
  const WALK_FRAME_DISTANCE = 14;
  const easeOut = (k) => 1 - Math.pow(1 - App.clamp(k, 0, 1), 3);
  const ATTACK_FRAMES = {
    jab: 4,
    straight: 4,
    cpunch: 9,
    uppercut: 5,
    roundhouse: 6,
    sweep: 7,
    slide: 7,
    nitrokick: 8,
    jkick: 8,
    jpunch: 4,
    toss: 4,
    haymaker: 4
  };
  function sampleAttackAnimation(f) {
    const a = f.atk,
      d = a.def,
      strike = a.key === 'nitrokick' && a.low ? 7 : (ATTACK_FRAMES[a.key] ?? 4);
    const prepare = ['uppercut', 'sweep', 'cpunch', 'slide'].includes(a.key)
      ? 9
      : ['roundhouse', 'jkick'].includes(a.key)
        ? 2
        : 1;
    const rest = f.grounded ? (f.crouching ? 9 : 0) : 1;
    const reach = ['jab', 'straight', 'haymaker', 'jpunch'].includes(a.key)
      ? 16
      : a.key === 'roundhouse'
        ? 10
        : 4;
    if (a.key === 'nitrokick') {
      const coil = a.low ? 9 : f.grounded ? 2 : 1;
      if (a.t < 0.025) return { frame: coil, offset: -3 };
      if (a.t < d.startup + d.active)
        return { frame: strike, offset: 6, phaseKick: a.t >= d.startup };
      const p = App.clamp((a.t - d.startup - d.active) / d.recovery, 0, 1);
      return {
        frame: p < 0.18 ? strike : p < 0.5 ? coil : rest,
        offset: 6 * (1 - easeOut(p))
      };
    }
    if (a.t < d.startup) {
      const p = App.clamp(a.t / d.startup, 0, 1);
      return { frame: p < 0.32 ? prepare : strike, offset: App.lerp(-1.2, reach, easeOut(p)) };
    }
    if (a.t < d.startup + d.active) return { frame: strike, offset: reach };
    const p = App.clamp((a.t - d.startup - d.active) / d.recovery, 0, 1);
    // Hard pose changes only. The root still eases back without dissolving sprites.
    const restAt = 1 - Math.min(0.045, d.recovery * 0.4) / d.recovery;
    return {
      frame: p < 0.25 ? strike : p < restAt ? prepare : rest,
      offset: reach * (1 - easeOut(p))
    };
  }
  function sampleFighterAnimation(f) {
    if (App.isR8(f)) return App.sampleR8Animation(f);
    if (App.isTeddy(f)) return App.sampleTeddyAnimation(f);
    if (f.atk) return sampleAttackAnimation(f);
    const frames = {
      idle: 0,
      block: 1,
      crouch: 9,
      hurt: 10,
      dodge: 1,
      jump: 2,
      knockdown: 10,
      ko: 10,
      victory: 11
    };
    if (f.state === 'walk' && walkSheets[f.kind]?.ready) {
      const frame = ((Math.floor(f.walkPhase / WALK_FRAME_DISTANCE) % 4) + 4) % 4;
      return { frame, atlas: 'walk', offset: 0 };
    }
    return { frame: frames[f.state] ?? 0, offset: 0 };
  }
  function drawSpriteFrame(f, index, atlas) {
    const sheet = (atlas === 'walk' ? walkSheets : spriteSheets)[f.kind];
    if (!sheet?.ready) return;
    const frame = sheet.meta.frames[index],
      scale = App.FIGHTER_HEIGHT / sheet.meta.neutralHeight;
    App.ctx.save();
    App.ctx.drawImage(
      f.kind === 'inj' && (f.atk?.key === 'nitrokick' || f.nitroEcho)
        ? sheet.nitroImage || sheet.image
        : sheet.image,
      frame.x,
      frame.y,
      frame.w,
      frame.h,
      -frame.anchorX * scale,
      -frame.anchorY * scale,
      frame.w * scale,
      frame.h * scale
    );
    App.ctx.restore();
  }
  function drawNitroBlaze(f) {
    const { ctx } = App,
      base = f.atk.low ? -25 : -48;
    for (let i = 0; i < 4; i++) {
      const y = base - 15 + i * 9,
        length = 66 + i * 10 + Math.sin(f.atk.t * 100 + i * 2) * 9;
      const flame = ctx.createLinearGradient(-length, y, 4, y);
      flame.addColorStop(0, '#15ec5b00');
      flame.addColorStop(0.45, '#20ed6799');
      flame.addColorStop(1, '#d7ff9be6');
      ctx.fillStyle = flame;
      ctx.beginPath();
      ctx.moveTo(4, y - 5);
      ctx.quadraticCurveTo(-length * 0.35, y - 10, -length, y + 3);
      ctx.lineTo(-length * 0.62, y + 4);
      ctx.quadraticCurveTo(-length * 0.25, y + 11, 4, y + 5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = '#ceff9ee6';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-100 - i * 5, base - 10 + i * 12);
      ctx.lineTo(-45, base - 10 + i * 12);
      ctx.stroke();
    }
  }
  function drawFighter(f, ghost = false) {
    if (App.isGiant(f)) {
      App.drawGiant(f, ghost);
      return;
    }
    if (App.isTeddy(f)) {
      App.drawTeddy(f, ghost);
      return;
    }
    if (App.isR8(f)) {
      App.drawR8(f, ghost);
      return;
    }
    const pose = sampleFighterAnimation(f);
    if (!spriteSheets[f.kind]?.ready) return;
    if (!ghost && !f.backstage && !f.reflection) {
      App.ctx.save();
      App.ctx.beginPath();
      App.ctx.rect(0, App.GROUND + 2, App.fightWidth(), App.H - App.GROUND - 2);
      App.ctx.clip();
      App.ctx.globalAlpha *= 0.09;
      App.ctx.translate(0, App.GROUND + 2);
      App.ctx.scale(1, -0.18);
      App.ctx.translate(0, -App.GROUND);
      drawFighter({ ...f, reflection: true });
      App.ctx.restore();
    }
    if (!ghost && !f.reflection) {
      App.ctx.save();
      App.ctx.fillStyle = '#05081170';
      if (f.teleport) App.ctx.globalAlpha *= App.teleportVisibility(f);
      const contact = App.clamp(1 - (App.GROUND - f.y) / 200, 0.55, 1);
      App.ctx.beginPath();
      App.ctx.ellipse(f.x, App.GROUND + 1, 23 * contact, 3.2, 0, 0, Math.PI * 2);
      App.ctx.fill();
      if (f.awakenedLook) {
        App.ctx.strokeStyle = f.kind === 'inj' ? '#d7bb6f88' : '#f18b6177';
        App.ctx.lineWidth = 0.6;
        App.ctx.beginPath();
        App.ctx.ellipse(f.x, App.GROUND + 1, 25, 3.2, 0, 0.1, Math.PI - 0.1);
        App.ctx.stroke();
      }
      App.ctx.restore();
    }
    if (f.teleport && !ghost && !f.reflection) App.drawTeleportEffect(f);
    App.ctx.save();
    App.ctx.translate(f.x, f.y);
    if (f.teleport) {
      const visible = App.teleportVisibility(f);
      App.ctx.beginPath();
      App.ctx.rect(-70 * visible, -150, 140 * visible, 170);
      App.ctx.clip();
    }
    if (f.facing < 0) App.ctx.scale(-1, 1);
    if (ghost) App.ctx.globalAlpha *= f.nitroEcho ? 0.7 : 0.28;
    if (f.invuln > 0) App.ctx.globalAlpha *= 0.75;
    if (f.state === 'ko' || f.state === 'knockdown') {
      const p = f.grounded
        ? 1
        : f.fallRot
          ? App.clamp(Math.abs(f.fallRot) / 1.5, 0, 1)
          : App.clamp((f.fallT || 0) / 0.35, 0, 1);
      App.ctx.translate(0, -App.FIGHTER_HEIGHT * 0.45 * (1 - p) - 7 * p);
      App.ctx.rotate(-Math.PI * 0.49 * p);
      App.ctx.translate(0, App.FIGHTER_HEIGHT * 0.45);
    }
    App.ctx.translate(pose.offset, 0);
    if (f.awakenedLook) {
      // A restrained rim glow distinguishes awakened actors without changing their bodies.
      App.ctx.shadowColor = f.kind === 'inj' ? '#aa87eb' : '#ee8f4a';
      App.ctx.shadowBlur = f.backstage ? 2 : 4;
    }
    if (pose.phaseKick && !ghost && !f.reflection && !App.reducedMotion) drawNitroBlaze(f);
    drawSpriteFrame(f, pose.frame, pose.atlas);
    App.ctx.shadowBlur = 0;
    if (f.flash > 0 && !ghost) {
      App.ctx.globalAlpha *= Math.min(0.22, f.flash);
      App.ctx.filter = 'brightness(1.65)';
      drawSpriteFrame(f, pose.frame, pose.atlas);
      App.ctx.filter = 'none';
    }
    App.ctx.restore();
  }

  Object.assign(App, {
    spriteSheets,
    walkSheets,
    WALK_FRAME_DISTANCE,
    easeOut,
    ATTACK_FRAMES,
    sampleAttackAnimation,
    sampleFighterAnimation,
    drawSpriteFrame,
    drawFighter
  });
})(window.INJ);
