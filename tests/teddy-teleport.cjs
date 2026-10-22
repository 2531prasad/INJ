/* Real-browser encounter, animation and timed-ability integration. */
const path = require('node:path');
module.exports = async function verifyTeddyTeleport(page, check, root) {
  await page.waitForFunction(() => Object.values(INJ.teddySheets).every((s) => s.ready));
  const results = await page.evaluate(() => {
    const a = INJ,
      out = {},
      sound = a.Sfx.play,
      random = a.rnd;
    a.Sfx.play = () => {};
    function setup(round = 4) {
      a.game.round = round - 1;
      a.resetRound();
      a.game.state = 'fight';
      a.game.paused = true;
      a.game.msg = null;
      a.player.x = 140;
      a.dummy.x = 240;
      a.dummy.facing = -1;
    }
    try {
      setup();
      out.ladder = a.dummy.kind === 'teddy' && a.dummy.form === null && !a.dummy.robotMaxHp;
      out.authoredAtlases =
        a.teddySheets.teddy.meta.frames.length === 16 &&
        a.teddySheets.cameo.meta.frames.length === 4 &&
        Object.values(a.teddySheets).every((s) =>
          s.meta.frames.every(
            (f) =>
              f.x >= 0 &&
              f.y >= 0 &&
              f.x + f.w <= s.image.naturalWidth &&
              f.y + f.h <= s.image.naturalHeight
          )
        );
      const scratch = document.createElement('canvas');
      scratch.width = a.cv.width;
      scratch.height = a.cv.height;
      const ctx = scratch.getContext('2d', { willReadFrequently: true }),
        live = a.ctx;
      const walkDraws = [],
        imageDraw = ctx.drawImage;
      try {
        a.ctx = ctx;
        ctx.drawImage = (image, ...args) => {
          walkDraws.push({ image, args, facing: Math.sign(ctx.getTransform().a) });
          imageDraw.call(ctx, image, ...args);
        };
        for (const facing of [1, -1])
          for (const tiny of [false, true]) {
            for (const phase of [0, tiny ? 5 : 14])
              a.drawTeddy({
                ...a.dummy,
                state: 'walk',
                walkPhase: phase,
                facing,
                tiny,
                teddyScale: tiny ? 0.34 : 1
              });
          }
      } finally {
        a.ctx = live;
        ctx.drawImage = imageDraw;
      }
      out.walkLeftUsesCorrectedPose = walkDraws[0].image === a.teddySheets.walkLeft.image;
      const originalRight = a.teddySheets.teddy.meta.frames[3];
      out.walkRightKeepsOriginalPose =
        walkDraws[1].image === a.teddySheets.teddy.image &&
        walkDraws[1].args.slice(0, 4).join() ===
          [originalRight.x, originalRight.y, originalRight.w, originalRight.h].join();
      out.walkPosesShareGroundAndHeight =
        walkDraws.every((d) => Math.abs(d.args[5] + d.args[7]) < 0.001) &&
        Math.abs(walkDraws[0].args[7] - walkDraws[1].args[7]) < 1;
      out.correctedWalkBothSizesAndDirections =
        walkDraws.every(
          (d, i) =>
            d.facing === (i < 4 ? 1 : -1) &&
            d.image === (i % 2 ? a.teddySheets.teddy.image : a.teddySheets.walkLeft.image)
        ) && Math.abs(walkDraws[2].args[7] / walkDraws[0].args[7] - 0.34) < 0.001;
      function bounds(f) {
        ctx.clearRect(0, 0, scratch.width, scratch.height);
        ctx.save();
        ctx.scale(2, 2);
        ctx.translate(180, a.GROUND);
        if (f.kind === 'teddy') a.drawTeddyFrame('teddy', 0, a.teddyHeight(f));
        else a.drawSpriteFrame(f, 0);
        ctx.restore();
        const pixels = ctx.getImageData(0, 0, scratch.width, scratch.height).data;
        let min = scratch.height,
          max = 0;
        for (let i = 3; i < pixels.length; i += 4)
          if (pixels[i] > 96) {
            const y = Math.floor(i / 4 / scratch.width);
            min = Math.min(min, y);
            max = Math.max(max, y);
          }
        return { height: max - min + 1, bottom: max };
      }
      let full, inj, tiny;
      try {
        a.ctx = ctx;
        full = bounds(a.dummy);
        inj = bounds(a.player);
        a.dummy.teddyScale = 0.34;
        tiny = bounds(a.dummy);
        a.dummy.teddyScale = 1;
      } finally {
        a.ctx = live;
      }
      out.actualSpriteHeight = full.height / inj.height > 1.08 && full.height / inj.height < 1.12;
      out.tinyHeightAndFootAnchor =
        tiny.height / full.height > 0.33 &&
        tiny.height / full.height < 0.35 &&
        Math.abs(tiny.bottom - full.bottom) <= 1;
      a.dummy.hp = 94;
      a.stepTeddyShrink(0);
      out.notBeforeThreshold = !a.dummy.shrinkUsed && a.game.state === 'fight';
      const delays = [];
      for (let i = 0; i < 12; i++) {
        setup();
        a.dummy.hp = 93;
        a.stepTeddyShrink(0);
        delays.push(a.dummy.shrinkDelay);
      }
      out.randomEligibleDelay =
        delays.every((d) => d >= 0.45 && d <= 1.5) &&
        new Set(delays.map((d) => d.toFixed(3))).size > 8;
      a.stepTeddyShrink(a.dummy.shrinkDelay - 0.01);
      out.delayActuallyWaits = a.game.state === 'fight';
      Object.assign(a.player, { hp: 83, charge: 2, meter: 80, teleportCooldown: 4.3 });
      a.game.roundTime = 61;
      a.game.hits = 3;
      a.projectiles.push({ x: 200 });
      a.input.right = 1;
      a.dummy.dodgeT = 0.1;
      a.dummy.blockT = 0.1;
      a.dummy.counterMove = 'royalSweep';
      a.dummy.repeatCount = 3;
      a.dummy.lowMemoryT = 3;
      a.stepTeddyShrink(0.02);
      out.cameoProtectedEntry =
        a.game.state === 'shrink' && !a.projectiles.length && !a.input.right && !a.game.hits;
      out.shrinkClearsInterruptedDefense =
        !a.dummy.dodgeT &&
        !a.dummy.blockT &&
        !a.dummy.counterMove &&
        a.dummy.repeatCount === 3 &&
        a.dummy.lowMemoryT === 3;
      const hp = a.dummy.hp;
      a.applyHit(a.dummy, a.player, { ...a.MOVES.jab, dmg: 999 }, 240, 180);
      a.applyHit(a.player, a.dummy, { ...a.MOVES.jab, dmg: 999 }, 140, 180);
      out.cutsceneDamageProtected = a.dummy.hp === hp && a.player.hp === 83;
      a.update(1);
      out.pauseFreezesShrink = a.game.t === 0 && a.dummy.teddyScale === 1;
      a.game.paused = false;
      a.update(0.8);
      const firstScale = a.dummy.teddyScale;
      a.update(0.6);
      out.continuousGroundedShrink =
        firstScale < 1 &&
        a.dummy.teddyScale < firstScale &&
        a.dummy.teddyScale > 0.34 &&
        a.dummy.y === a.GROUND;
      a.update(0.96);
      out.oneHealthPool =
        a.game.state === 'fight' &&
        a.dummy.tiny &&
        a.dummy.teddyScale === 0.34 &&
        a.dummy.hp === hp &&
        a.dummy.maxHp === 140;
      out.resourcesAndClockPreserved =
        a.player.hp === 83 &&
        a.player.charge === 2 &&
        a.player.meter === 80 &&
        Math.abs(a.player.teleportCooldown - 4.3) < 0.02 &&
        a.game.roundTime === 61;
      a.dummy.hp = 30;
      a.stepTeddyShrink(3);
      out.shrinkOnlyOnce = a.game.state === 'fight' && a.dummy.shrinkDelay === -1;
      out.tinyHurtbox = a.hurtbox(a.dummy).h < a.hurtbox(a.player).h * 0.4;
      a.player.atk = null;
      a.player.x = 140;
      a.dummy.x = 190;
      a.player.facing = 1;
      a.dummy.invuln = 0;
      a.startAttack(a.player, 'toss');
      a.stepAttack(a.player, 0.11, a.dummy);
      out.groundShadowAimsAtTiny = a.projectiles[0].vy > 0;
      const tinyHp = a.dummy.hp;
      for (let i = 0; i < 60 && a.dummy.hp === tinyHp; i++) a.updateProjectiles(1 / 120);
      out.groundShadowHitsTiny = a.dummy.hp < tinyHp;
      setup();
      a.dummy.tiny = true;
      a.dummy.teddyScale = 0.34;
      a.dummy.x = 180;
      a.player.x = 145;
      const damage = a.player.hp;
      a.startAttack(a.dummy, 'tinyFury');
      for (let i = 0; i < 60; i++) if (a.dummy.atk) a.stepAttack(a.dummy, 1 / 120, a.player);
      out.threeRealPunches = damage - a.player.hp === 12;
      for (const key of Object.keys(a.TEDDY_MOVES)) {
        setup();
        a.dummy.x = 180;
        a.player.x = 140;
        a.startAttack(a.dummy, key);
        const before = a.player.hp,
          start = a.dummy.x,
          d = a.dummy.atk.def;
        a.stepAttack(a.dummy, d.startup - 0.01, a.player);
        const telegraph = a.player.hp === before && a.dummy.x === start;
        a.stepAttack(a.dummy, 0.02, a.player);
        const connected = a.player.hp < before;
        for (let i = 0; i < 200 && a.dummy.atk; i++) a.stepAttack(a.dummy, 1 / 120, a.player);
        out[key + 'TelegraphsHitsRecovers'] = telegraph && connected && !a.dummy.atk;
      }
      setup();
      a.dummy.x = 180;
      a.dummy.aiT = 0;
      a.dummy.restT = 0.5;
      a.dummy.openingT = 0.3;
      a.startAttack(a.player, 'jab');
      a.controlTeddy(a.dummy, a.player, 0.02);
      out.punishablePause = a.dummy.state === 'idle' && !a.dummy.atk && a.dummy.restT > 0.4;
      setup();
      a.dummy.x = 190;
      a.dummy.aiT = 0;
      a.projectiles.push({ owner: a.player, x: 145, vx: 235 });
      a.rnd = () => 0;
      a.controlTeddy(a.dummy, a.player, 0.01);
      const noInstant = !a.dummy.blockT;
      a.dummy.atk = null;
      a.controlTeddy(a.dummy, a.player, 0.24);
      out.reactiveGuardHasDelay = noInstant && a.dummy.blockT > 0;
      a.rnd = () => 0.8;
      setup();
      Object.assign(a.dummy, { tiny: true, teddyScale: 0.34, x: 195, aiT: 9 });
      a.player.crouching = true;
      a.startAttack(a.player, 'sweep');
      a.controlTeddy(a.dummy, a.player, 0.01);
      out.firstLowIsNotPerfectlyRead =
        a.dummy.repeatCount === 1 && !a.dummy.dodgeT && !a.dummy.blockT && a.dummy.grounded;
      a.dummy.state = 'knockdown';
      a.dummy.knockT = 0;
      a.player.atk = null;
      a.startAttack(a.player, 'slide');
      a.controlTeddy(a.dummy, a.player, 0.01);
      out.learnsDistinctLowsWhileDown = a.dummy.repeatCount === 2 && a.dummy.lowMemoryT === 4;
      a.dummy.knockT = 0.65;
      a.controlTeddy(a.dummy, a.player, 0.01);
      out.adaptiveWakeupHop =
        a.dummy.dodgeT > 0 &&
        !a.dummy.grounded &&
        a.dummy.vy < 0 &&
        a.dummy.dodgeTo !== a.dummy.dodgeFrom;
      for (let i = 0; i < 30; i++) a.controlTeddy(a.dummy, a.player, 1 / 120);
      out.dodgeActuallyMovesAndExposesRecovery =
        a.dummy.x !== a.dummy.dodgeFrom &&
        a.dummy.y < a.GROUND - 20 &&
        a.dummy.dodgeT === 0 &&
        a.dummy.openingT > 0;
      a.dummy.repeatCount = 0;
      a.dummy.lowMemoryT = 0;
      setup();
      Object.assign(a.dummy, {
        tiny: true,
        teddyScale: 0.34,
        x: a.world.width - 16,
        repeatCount: 3,
        lowMemoryT: 4,
        aiT: 9
      });
      a.player.x = a.dummy.x - 35;
      a.player.crouching = true;
      a.controlTeddy(a.dummy, a.player, 0.01);
      out.cornerEscapeIsPhysical = a.dummy.dodgeTo < a.player.x && a.dummy.invuln === 0;
      setup();
      Object.assign(a.dummy, {
        tiny: true,
        teddyScale: 0.34,
        x: 180,
        repeatCount: 3,
        repeatedMove: 'sweep',
        lowMemoryT: 4,
        aiT: 9
      });
      a.player.crouching = true;
      a.startAttack(a.dummy, 'tinyFury');
      a.dummy.atk.t = 0.47;
      a.dummy.atk.hasHit = true;
      a.stepAttack(a.dummy, 0.02, a.player);
      out.learnedLowRecoveryHop =
        a.dummy.atk.recoveryHop &&
        !a.dummy.grounded &&
        a.dummy.vy < 0 &&
        a.dummy.invuln === 0 &&
        a.sampleTeddyAnimation(a.dummy).frame === 8;
      setup();
      a.dummy.repeatCount = 3;
      a.dummy.lowMemoryT = 0.01;
      a.dummy.aiT = 9;
      a.controlTeddy(a.dummy, a.player, 0.02);
      out.lowMemoryExpires = a.dummy.repeatCount === 0 && a.dummy.lowMemoryT === 0;
      setup();
      a.dummy.repeatCount = 3;
      a.dummy.lowMemoryT = 3;
      a.dummy.aiT = 9;
      a.dummy.x = 190;
      a.startAttack(a.player, 'jab');
      a.controlTeddy(a.dummy, a.player, 0.01);
      out.variedHighAttacksDisruptLowRead = a.dummy.repeatCount === 2;
      setup();
      Object.assign(a.dummy, {
        tiny: true,
        teddyScale: 0.34,
        x: 190,
        y: 145,
        grounded: false,
        state: 'jump',
        invuln: 0
      });
      a.player.x = 140;
      a.startAttack(a.player, 'roundhouse');
      a.stepAttack(a.player, 0.09, a.dummy);
      out.highKickCanPunishTheHop = a.dummy.hp === 129 && a.dummy.state === 'knockdown';
      setup();
      Object.assign(a.dummy, { tiny: true, teddyScale: 0.34, x: 180, aiT: 9 });
      a.player.x = 140;
      const tinyHP = a.dummy.hp;
      a.applyHit(a.dummy, a.player, a.MOVES.sweep, 180, 190);
      out.smarterWithoutMoreHPOrArmor = tinyHP === 140 && a.dummy.hp === 131;
      a.rnd = random;
      for (const stance of ['standing', 'crouching', 'airborne']) {
        setup();
        a.player.crouching = stance === 'crouching';
        if (stance === 'airborne') {
          a.player.grounded = false;
          a.player.y -= 50;
        }
        a.game.paused = false;
        a.queueAction('teleport');
        const started = !!a.player.teleport && a.player.teleportCooldown === 10;
        a.stepTeleport(a.player, a.dummy, 0.2);
        out['teleportFrom' + stance] = started && a.player.x > a.dummy.x && a.player.facing === -1;
      }
      const p = a.player,
        playerHP = p.hp;
      a.applyHit(p, a.dummy, a.MOVES.velvetCross, p.x, p.y - 40);
      out.teleportUntargetable = p.hp === playerHP && !p.atk;
      const slices = [0.01, 0.1, 0.19, 0.24, 0.35, 0.46].map((t) => {
        p.teleport.t = t;
        return a.teleportVisibility(p);
      });
      out.vanishAndReappear =
        slices[0] > slices[1] &&
        slices[2] === 0 &&
        slices[3] > 0 &&
        slices[4] > slices[3] &&
        slices[5] === 1;
      a.stepTeleport(p, a.dummy, 0.01);
      out.teleportEndsNormally = !p.teleport && p.state === 'idle';
      const oldCooldown = p.teleportCooldown;
      a.queueAction('teleport');
      out.noCooldownBypass = !p.teleport && p.teleportCooldown === oldCooldown;
      a.tickTeleport(9.9);
      out.stillCoolingAt99 = !a.startTeleport(p);
      a.tickTeleport(0.11);
      out.reusableAfter10Seconds = a.startTeleport(p);
      a.game.paused = true;
      const time = p.teleport.t,
        cooldown = p.teleportCooldown;
      a.update(2);
      out.pauseFreezesTeleportAndCooldown =
        p.teleport.t === time && p.teleportCooldown === cooldown;
      setup();
      a.dummy.facing = 1;
      a.startTeleport(a.player);
      a.dummy.x = 260;
      a.stepTeleport(a.player, a.dummy, 0.2);
      out.tracksCurrentOpponentAtRelocation =
        a.player.x < 260 && a.player.x > 160 && a.player.facing === 1;
      const walls = [];
      for (const edge of ['left', 'right']) {
        setup();
        a.dummy.x =
          edge === 'left' ? a.fighterMargin(a.dummy) : a.world.width - a.fighterMargin(a.dummy);
        a.dummy.facing = edge === 'left' ? 1 : -1;
        a.startTeleport(a.player);
        a.stepTeleport(a.player, a.dummy, 0.2);
        walls.push(
          a.player.x >= 26 &&
            a.player.x <= a.world.width - 26 &&
            Math.sign(a.player.x - a.dummy.x) === -a.dummy.facing
        );
      }
      out.bothWallLandingsBoundedAndBehind = walls.every(Boolean);
      const wallForms = [];
      for (const form of ['dummy', 'car', 'robot', 'teddy', 'tiny']) {
        for (const edge of ['left', 'right']) {
          setup(form === 'dummy' ? 1 : ['car', 'robot'].includes(form) ? 3 : 4);
          if (form === 'robot') a.completeR8Transform();
          if (form === 'tiny') {
            a.dummy.tiny = true;
            a.dummy.teddyScale = 0.34;
          }
          const margin = a.fighterMargin(a.dummy),
            hp = a.dummy.hp;
          a.dummy.x = edge === 'left' ? margin : a.world.width - margin;
          a.dummy.facing = edge === 'left' ? 1 : -1;
          a.startTeleport(a.player);
          a.stepTeleport(a.player, a.dummy, 0.2);
          wallForms.push(
            a.player.x >= 26 &&
              a.player.x <= a.world.width - 26 &&
              a.dummy.x >= margin &&
              a.dummy.x <= a.world.width - margin &&
              a.dummy.hp === hp &&
              Math.sign(a.player.x - a.dummy.x) === -a.dummy.facing &&
              Math.abs(a.player.x - a.dummy.x) >= (a.hurtbox(a.player).w + a.hurtbox(a.dummy).w) / 2
          );
        }
      }
      out.allFiveOpponentFormsAllowCornerSideSwitch = wallForms.every(Boolean);
      for (const round of [1, 3, 4]) {
        setup(round);
        if (round === 3) a.completeR8Transform();
        a.player.x = 140;
        a.dummy.x = 240;
        a.dummy.facing = -1;
        a.startTeleport(a.player);
        a.stepTeleport(a.player, a.dummy, 0.3);
        a.controlDummy(a.dummy, a.player, 0.02);
        out['invisibleArrivalNotTracked' + round] = a.dummy.facing === -1 && !a.dummy.atk;
      }
      setup();
      a.player.hitstun = 0.2;
      out.noTeleportOutOfHitstun = !a.startTeleport(a.player);
      a.player.hitstun = 0;
      a.startAttack(a.player, 'jab');
      out.noAttackCancelExploit = !a.startTeleport(a.player);
      setup();
      a.startTeleport(a.player);
      a.restartGame();
      out.restartClearsAllNewState =
        a.game.round === 1 &&
        !a.player.teleport &&
        a.player.teleportCooldown === 0 &&
        !a.dummy.tiny &&
        !a.dummy.shrinkUsed;
      setup();
      a.dummy.tiny = true;
      a.dummy.teddyScale = 0.34;
      a.dummy.hp = 1;
      a.applyHit(a.dummy, a.player, a.MOVES.sweep, 240, 190);
      out.tinyKOIsRealVictory =
        a.game.state === 'ko' && !a.game.lost && a.game.victory.opponent === 'BLUE VELVET';
      a.game.hitStop = 0;
      a.updateFlow(1.2);
      out.teddyVictoryPlayerPaced =
        a.game.state === 'victory' &&
        !document.querySelector('#victoryPanel').hidden &&
        a.game.round === 4;
      a.game.paused = false;
      a.finishVictory();
      out.nextTeddyStartsFullSize =
        a.game.round === 5 &&
        a.dummy.kind === 'teddy' &&
        !a.dummy.shrinkUsed &&
        a.dummy.teddyScale === 1 &&
        a.dummy.hp === 140;
      setup();
      const motion = a.reducedMotion;
      const rotate = ctx.rotate,
        stroke = ctx.stroke,
        drawImage = ctx.drawImage;
      let rotations = 0,
        strokes = 0,
        entranceScale = 0;
      try {
        a.ctx = ctx;
        a.reducedMotion = true;
        ctx.rotate = (...args) => {
          rotations++;
          rotate.apply(ctx, args);
        };
        ctx.stroke = (...args) => {
          strokes++;
          stroke.apply(ctx, args);
        };
        a.startAttack(a.dummy, 'dramaBomb');
        a.dummy.atk.t = 0.5;
        a.drawTeddy(a.dummy);
        out.reducedMotionNoTeddySpin = rotations === 0;
        a.startTeleport(a.player);
        a.player.teleport.t = 0.1;
        a.drawTeleportEffect(a.player);
        out.reducedMotionNoTeleportFragments = strokes === 0;
        a.player.teleport.t = 0.19;
        ctx.clearRect(0, 0, scratch.width, scratch.height);
        a.drawFighter({ ...a.player, reflection: true });
        const hiddenPixels = ctx.getImageData(0, 0, scratch.width, scratch.height).data;
        out.spriteFullyDisappears = hiddenPixels.every((value, i) => i % 4 !== 3 || value === 0);
        a.game.state = 'shrink';
        a.game.t = 0.1;
        ctx.drawImage = (...args) => {
          entranceScale = Math.abs(ctx.getTransform().a);
          drawImage.apply(ctx, args);
        };
        a.drawTeddyCameo();
        out.reducedMotionCameoImmediate = entranceScale === 1;
      } finally {
        a.ctx = live;
        a.reducedMotion = motion;
        ctx.rotate = rotate;
        ctx.stroke = stroke;
        ctx.drawImage = drawImage;
      }
    } finally {
      a.Sfx.play = sound;
      a.rnd = random;
      setup(1);
    }
    return out;
  });
  for (const [name, passed] of Object.entries(results)) check(passed, `Teddy / Blink: ${name}`);
  const benchmark = await page.evaluate(() => {
    const a = INJ,
      sound = a.Sfx.play,
      random = a.rnd;
    const result = {
      trials: 40,
      playerWins: 0,
      teddyWins: 0,
      shrinkEvents: 0,
      tinyAttacks: 0,
      teleports: 0,
      nitroKicks: 0,
      policies: []
    };
    a.Sfx.play = () => {};
    try {
      for (let trial = 0; trial < 40; trial++) {
        a.rnd = a.mulberry32(12000 + trial);
        a.game.round = 3;
        a.resetRound();
        a.game.state = 'fight';
        a.game.paused = false;
        a.game.msg = null;
        a.dummy.aiT = 0;
        const policy = trial % 4;
        const tally = (result.policies[policy] ||= {
          name: ['idle', 'low pressure', 'Shadow kiting + Blink', 'mixed + Nitro + Blink'][policy],
          trials: 0,
          playerWins: 0,
          teddyWins: 0
        });
        let shrunk = false,
          lastMove = null,
          lastBlink = null;
        for (let frame = 0; frame < 18000 && ['fight', 'shrink'].includes(a.game.state); frame++) {
          const p = a.player,
            op = a.dummy,
            gap = Math.abs(p.x - op.x),
            dir = Math.sign(op.x - p.x);
          a.input.left = a.input.right = a.input.down = a.input.up = a.input.block = 0;
          if (policy && a.game.state === 'fight') {
            const move = policy === 2 ? -dir : gap > (op.tiny ? 34 : 55) ? dir : 0;
            a.input.left = +(move < 0);
            a.input.right = +(move > 0);
            a.input.down = +(policy === 1 || (policy === 3 && op.tiny));
            a.input.up = +(policy === 3 && !op.tiny && frame % 240 < 45);
            if (!p.atk && !p.teleport && p.hitstun <= 0) {
              const action =
                policy >= 2 && gap < 80 && op.atk && !p.teleportCooldown
                  ? 'teleport'
                  : policy === 3 && p.meter >= 100
                    ? 'nitro'
                    : policy === 2
                      ? 'special'
                      : policy === 1
                        ? frame % 180 < 100
                          ? 'punch'
                          : 'kick'
                        : !p.grounded
                          ? 'kick'
                          : ['punch', 'kick', 'special'][Math.floor(frame / 36) % 3];
              a.pressBuf[action] = performance.now() + 220;
            }
          }
          a.update(1 / 60);
          if (a.game.state === 'shrink' && !shrunk) {
            shrunk = true;
            result.shrinkEvents++;
          }
          if (op.tiny && op.atk && op.atk !== lastMove) {
            lastMove = op.atk;
            result.tinyAttacks++;
          }
          if (p.teleport && p.teleport !== lastBlink) {
            lastBlink = p.teleport;
            result.teleports++;
          }
          if (p.atk?.key === 'nitrokick' && p.atk.t === 0) result.nitroKicks++;
        }
        if (['fight', 'shrink'].includes(a.game.state))
          throw Error('Teddy simulation exceeded five minutes');
        tally.trials++;
        if (a.game.lost) {
          result.teddyWins++;
          tally.teddyWins++;
        } else {
          result.playerWins++;
          tally.playerWins++;
        }
      }
    } finally {
      a.Sfx.play = sound;
      a.rnd = random;
      a.game.round = 0;
      a.resetRound();
      a.game.state = 'fight';
      a.game.paused = true;
      a.game.msg = null;
    }
    return result;
  });
  check(
    benchmark.playerWins > 0 && benchmark.teddyWins > 0,
    `Blue Velvet: ${benchmark.playerWins}/${benchmark.trials} scripted INJ wins across four policies`
  );
  check(
    benchmark.shrinkEvents >= 10 &&
      benchmark.tinyAttacks > 0 &&
      benchmark.teleports > 0 &&
      benchmark.nitroKicks > 0,
    'Full Teddy fights exercise shrink, tiny attacks, Blink and Nitro through the real engine'
  );
  benchmark.lowKickPressure = await page.evaluate(() => {
    const a = INJ,
      random = a.rnd,
      sound = a.Sfx.play;
    const result = {
      trials: 20,
      playerWins: 0,
      teddyWins: 0,
      dodges: 0,
      blocks: 0,
      policies: [
        { name: 'crouched Kick', playerWins: 0, trials: 10 },
        { name: 'forward + crouched Kick', playerWins: 0, trials: 10 }
      ]
    };
    a.Sfx.play = () => {};
    try {
      for (let trial = 0; trial < result.trials; trial++) {
        a.rnd = a.mulberry32(7200 + trial);
        a.game.round = 3;
        a.resetRound();
        a.game.state = 'fight';
        a.game.paused = false;
        a.game.msg = null;
        // Isolate the tiny phase with at most the HP it retains after the ray.
        Object.assign(a.dummy, {
          tiny: true,
          teddyScale: 0.34,
          shrinkUsed: true,
          shrinkDelay: -1,
          hp: 93,
          aiT: 0
        });
        a.player.x = 180;
        a.dummy.x = 235;
        const policy = trial % 2;
        let lastState = '';
        for (let frame = 0; frame < 12000 && a.game.state === 'fight'; frame++) {
          const p = a.player,
            op = a.dummy,
            gap = Math.abs(p.x - op.x),
            dir = Math.sign(op.x - p.x);
          a.input.left = +(policy && dir < 0 && gap > 34);
          a.input.right = +(policy && dir > 0 && gap > 34);
          a.input.up = a.input.block = 0;
          a.input.down = 1;
          if (!p.atk && p.hitstun <= 0) a.pressBuf.kick = performance.now() + 220;
          a.update(1 / 60);
          if (op.state !== lastState) {
            if (op.state === 'dodge') result.dodges++;
            if (op.state === 'block') result.blocks++;
          }
          lastState = op.state;
        }
        if (a.game.state === 'fight') throw Error('Low-kick trial did not finish');
        if (a.game.lost) result.teddyWins++;
        else {
          result.playerWins++;
          result.policies[policy].playerWins++;
        }
      }
    } finally {
      a.rnd = random;
      a.Sfx.play = sound;
      a.game.round = 0;
      a.resetRound();
      a.game.paused = true;
    }
    return result;
  });
  check(
    benchmark.lowKickPressure.playerWins <= 8 &&
      benchmark.lowKickPressure.dodges > 20 &&
      benchmark.lowKickPressure.blocks > 0,
    `Tiny Teddy: repeated crouched Kick wins ${benchmark.lowKickPressure.playerWins}/20 trials; physical dodges and guards counter the loop`
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => INJ.world.width === 450);
  await page.evaluate(() => {
    INJ.game.round = 3;
    INJ.resetRound();
    INJ.game.state = 'fight';
    INJ.game.paused = false;
    INJ.dummy.aiT = 999;
    INJ.player.x = 120;
    INJ.dummy.x = 280;
  });
  const cdp = await page.context().newCDPSession(page);
  const ring = await page.locator('.stick-directions').boundingBox();
  const button = await page.locator('[data-act="teleport"]').boundingBox();
  const point = (id, x, y) => ({ id, x, y, radiusX: 5, radiusY: 5, force: 1 });
  const move = point(71, ring.x + ring.width - 9, ring.y + ring.height / 2);
  const blink = point(72, button.x + button.width / 2, button.y + button.height / 2);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [move] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [move, blink] });
  check(
    await page.evaluate(() => !!INJ.player.teleport && INJ.input.right === 1),
    'Blink touch starts immediately while the other thumb keeps moving'
  );
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  check(
    (await page.locator('[data-act="teleport"]').getAttribute('aria-disabled')) === 'true' &&
      (await page.locator('[data-act="teleport"] .button-label').textContent()).includes('10s'),
    'Blink cooldown is visibly numbered and announced'
  );
  await page.evaluate(() => {
    INJ.game.paused = true;
    INJ.player.teleport = null;
    INJ.player.state = 'idle';
  });
  await page.keyboard.press('e');
  check(await page.evaluate(() => !INJ.player.teleport), 'Blink key ignored while paused');
  await page.evaluate(() => {
    INJ.player.teleportCooldown = 0;
    INJ.game.paused = false;
  });
  await page.keyboard.press('e');
  check(
    await page.evaluate(() => !!INJ.player.teleport),
    'E starts Blink through keyboard controls'
  );
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [844, 390]
  ]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(80);
    await page.evaluate(() => {
      INJ.game.round = 3;
      INJ.resetRound();
      INJ.game.state = 'fight';
      INJ.game.paused = true;
      INJ.game.msg = null;
      INJ.player.meter = 100;
      INJ.updateChargeUI();
      INJ.player.x = INJ.world.width * 0.3;
      INJ.dummy.x = INJ.world.width * 0.7;
      INJ.render(0);
    });
    const geometry = await page.evaluate(() => {
      const boxes = [
        ...document.querySelectorAll('.abtn:not([hidden]),#btnArenaMenu,#stickZone')
      ].map((el) => el.getBoundingClientRect());
      return (
        boxes.length === 9 &&
        boxes.every(
          (b, i) =>
            b.width >= 44 &&
            b.height >= 44 &&
            boxes
              .slice(i + 1)
              .every(
                (c) =>
                  !(
                    b.left < c.right - 0.1 &&
                    b.right > c.left + 0.1 &&
                    b.top < c.bottom - 0.1 &&
                    b.bottom > c.top + 0.1
                  )
              )
        )
      );
    });
    check(
      geometry,
      `Seven actions / menu / joystick separate at ${width}×${height}, including ready Nitro`
    );
    await page.screenshot({ path: path.join(root, `artifacts/teddy-normal-${width}.png`) });
  }
  for (const [i, t] of [0, 0.12, 0.2, 0.3, 0.46].entries()) {
    await page.evaluate((t) => {
      INJ.player.teleport = null;
      INJ.player.teleportCooldown = 0;
      INJ.startTeleport(INJ.player);
      INJ.stepTeleport(INJ.player, INJ.dummy, t);
      INJ.render(0);
    }, t);
    await page.screenshot({ path: path.join(root, `artifacts/teleport-phase-${i}.png`) });
  }
  await page.evaluate(() => {
    INJ.player.teleport = null;
    INJ.player.x = INJ.world.width * 0.28;
    INJ.dummy.hp = 93;
    INJ.stepTeddyShrink(0);
    INJ.stepTeddyShrink(2);
  });
  for (const [i, t] of [0, 0.5, 1.1, 1.6, 2].entries()) {
    await page.evaluate((t) => {
      INJ.game.t = 0;
      INJ.dummy.teddyScale = 1;
      INJ.stepTeddyShrink(t);
      INJ.render(0);
    }, t);
    await page.screenshot({ path: path.join(root, `artifacts/teddy-shrink-${i}.png`) });
  }
  // Replay both staged animations at one tenth their normal simulation speed.
  await page.evaluate(() => {
    INJ.game.round = 3;
    INJ.resetRound();
    INJ.game.state = 'fight';
    INJ.game.paused = true;
    INJ.game.msg = null;
    INJ.player.x = INJ.world.width * 0.3;
    INJ.dummy.x = INJ.world.width * 0.56;
    INJ.startTeleport(INJ.player);
  });
  for (let i = 0; i < 46; i++) {
    await page.evaluate(() => {
      INJ.stepTeleport(INJ.player, INJ.dummy, 0.01);
      INJ.render(0);
    });
    await page.waitForTimeout(100);
  }
  await page.evaluate(() => {
    INJ.dummy.hp = 93;
    INJ.stepTeddyShrink(0);
    INJ.stepTeddyShrink(2);
  });
  for (let i = 0; i < 48; i++) {
    await page.evaluate(() => {
      INJ.stepTeddyShrink(0.05);
      INJ.render(0);
    });
    await page.waitForTimeout(500);
  }
  check(
    await page.evaluate(
      () =>
        INJ.game.state === 'fight' &&
        INJ.dummy.tiny &&
        !INJ.player.teleport &&
        INJ.dummy.y === INJ.GROUND
    ),
    '10% speed replay completes both animations with grounded roots'
  );
  await page.evaluate(() => {
    INJ.game.round = 0;
    INJ.resetRound();
    INJ.game.state = 'fight';
    INJ.game.paused = true;
    INJ.game.msg = null;
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => INJ.world.width === 450);
  return benchmark;
};
