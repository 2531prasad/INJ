/* Standalone Colossus flow, physical commitment, tells, echo targeting and balance. */
const fs = require('node:fs');
const path = require('node:path');
module.exports = async function verifyGiant(page, check, root) {
  await page.waitForFunction(
    () => INJ.teddySheets.giant.ready && INJ.arenaStages[4].image.naturalWidth
  );
  const results = await page.evaluate(() => {
    const a = INJ,
      out = {},
      play = a.Sfx.play,
      random = a.rnd;
    a.Sfx.play = () => {};
    a.rnd = a.mulberry32(4300);
    function setup() {
      a.game.round = 4;
      a.resetRound();
      a.stepGiantIntro(4.8);
      a.game.paused = true;
      a.game.msg = null;
      a.player.x = 170;
      a.dummy.x = 320;
      a.dummy.facing = -1;
      a.dummy.restT = 0;
    }
    try {
      a.game.round = 3;
      a.resetRound();
      a.game.state = 'fight';
      a.game.paused = false;
      a.dummy.tiny = true;
      a.dummy.teddyScale = 0.34;
      a.dummy.hp = 1;
      a.applyHit(a.dummy, a.player, a.MOVES.sweep, a.dummy.x, 190);
      a.updateFlow(1.2);
      out.tinyWinWaitsForNextRound = a.game.state === 'victory' && a.game.round === 4;
      a.finishVictory();
      out.standaloneStageAfterVictory =
        a.game.round === 5 &&
        a.game.state === 'enlarge' &&
        a.dummy.giant &&
        a.dummy.hp === 480 &&
        a.player.hp === 120 &&
        a.arenaStage().id === 'giants' &&
        a.game.roundTime === null;
      const playerHeight = a.hurtbox(a.player).h,
        camera = a.giantCamera();
      a.player.meter = 80;
      a.player.charge = 2;
      a.player.teleportCooldown = 7;
      a.queueAction('kick');
      const hp = a.dummy.hp;
      a.applyHit(a.dummy, a.player, a.MOVES.jab, 320, 120);
      out.protectedReveal = !a.player.atk && a.dummy.hp === hp;
      a.game.paused = true;
      a.update(1);
      out.pauseFreezesEnlargement = a.game.t === 0 && a.dummy.teddyScale === 1;
      a.game.paused = false;
      a.update(2.2);
      const midScale = a.dummy.teddyScale,
        midCamera = a.giantCamera();
      a.update(2.6);
      out.growsWhileCameraPullsBack =
        midScale > 1 &&
        midScale < 2 &&
        midCamera < camera &&
        midCamera > 0.6 &&
        a.dummy.teddyScale === 2 &&
        a.giantCamera() === 0.6;
      out.playerWorldSizePreserved =
        a.hurtbox(a.player).h === playerHeight &&
        a.teddyHeight(a.dummy) === a.TEDDY_TUNING.height * 2;
      out.revealDoesNotConsumeFightTimeOrResources =
        a.game.state === 'fight' &&
        a.game.roundTime === null &&
        a.player.meter === 80 &&
        a.player.charge === 2 &&
        a.player.teleportCooldown === 7 &&
        a.dummy.restT === 1.4;
      a.game.hits = 3;
      a.game.hitTimer = 0.1;
      a.updateFlow(500);
      out.noTimerButComboStillExpires =
        a.game.state === 'fight' && a.game.roundTime === null && !a.game.hits;
      setup();
      a.game.paused = false;
      a.dummy.restT = 999;
      a.player.teleportCooldown = 10;
      a.update(0.2);
      out.cooldownStillUsesActiveFightTime = Math.abs(a.player.teleportCooldown - 9.8) < 0.001;
      for (const key of ['jab', 'sweep', 'uppercut', 'nitrokick', 'toss']) {
        setup();
        a.startAttack(a.dummy, 'colossusSmash');
        a.dummy.atk.t = 0.3;
        const attack = a.dummy.atk,
          hp = a.dummy.hp;
        const move =
          key === 'toss'
            ? { ...a.MOVES.toss, key: 'shadow', dmg: 18, knockdown: true, heavy: true }
            : a.MOVES[key];
        a.applyHit(a.dummy, a.player, move, 300, 150);
        out['damageWithoutFlinch_' + key] =
          a.dummy.hp === hp - move.dmg &&
          a.dummy.atk === attack &&
          a.dummy.atk.t === 0.3 &&
          a.dummy.state === 'attack' &&
          !a.dummy.hitstun &&
          a.dummy.grounded &&
          !a.dummy.vx &&
          !a.game.hitStop;
      }
      setup();
      a.dummy.state = 'relax';
      a.dummy.restT = 3;
      a.applyHit(a.dummy, a.player, a.MOVES.sweep, 300, 190);
      out.restIsDamageableWithoutKnockdown =
        a.dummy.state === 'relax' && a.dummy.hp === 471 && a.dummy.grounded;
      setup();
      a.player.state = 'block';
      a.player.facing = 1;
      a.startAttack(a.dummy, 'colossusSmash');
      a.stepGiantAttack(a.dummy, 1.16, a.player);
      out.guardSurvivesSmash = a.player.hp === 116 && a.player.state === 'block';
      setup();
      a.player.y = a.GROUND - 60;
      a.player.grounded = false;
      a.startAttack(a.dummy, 'colossusSmash');
      a.stepGiantAttack(a.dummy, 1.16, a.player);
      out.jumpDoesNotBypassHands = a.player.hp === 100 && a.player.state === 'knockdown';
      setup();
      a.startAttack(a.dummy, 'colossusSmash');
      a.stepGiantAttack(a.dummy, 0.65, a.player);
      a.startTeleport(a.player);
      a.stepTeleport(a.player, a.dummy, 0.47);
      a.stepGiantAttack(a.dummy, 0.51, a.player);
      out.timedBlinkBeatsLockedSmash =
        a.player.x > a.dummy.x &&
        !a.player.teleport &&
        a.dummy.facing === -1 &&
        a.player.hp === 120;
      setup();
      a.startAttack(a.dummy, 'colossusSmash');
      a.stepGiantAttack(a.dummy, 0.05, a.player);
      a.startTeleport(a.player);
      a.stepTeleport(a.player, a.dummy, 0.47);
      a.stepGiantAttack(a.dummy, 0.47, a.player);
      a.stepGiantAttack(a.dummy, 0.64, a.player);
      out.earlyBlinkCanBeReacquired = a.dummy.facing === 1 && a.player.hp === 100;
      setup();
      a.startAttack(a.dummy, 'colossusSmash');
      a.stepGiantAttack(a.dummy, 1.34, a.player);
      const attack = a.dummy.atk;
      a.stepGiantAttack(a.dummy, 1, a.player);
      out.longCommittedRecovery =
        a.dummy.atk === attack && attack.t > attack.def.startup + attack.def.active;
      for (const jumping of [false, true]) {
        setup();
        if (jumping) {
          a.player.y -= 45;
          a.player.grounded = false;
        }
        a.startAttack(a.dummy, 'colossusStomp');
        a.stepGiantAttack(a.dummy, 0.96, a.player);
        for (let i = 0; i < 60; i++) a.stepGiantEncounter(1 / 60);
        out[jumping ? 'waveCanBeJumped' : 'waveHitsGround'] = a.player.hp === (jumping ? 120 : 108);
      }
      setup();
      a.startAttack(a.dummy, 'colossusStars');
      a.stepGiantAttack(a.dummy, 1.11, a.player);
      const positions = a.giantEncounter.hazards.map((h) => h.x).join();
      a.player.x = 400;
      for (let i = 0; i < 160; i++) a.stepGiantEncounter(1 / 60);
      out.starsStayOnTheirMarkers =
        positions === '60,170,280' && a.player.hp === 120 && !a.giantEncounter.hazards.length;
      setup();
      a.startAttack(a.dummy, 'colossusSummon');
      a.stepGiantAttack(a.dummy, 1.16, a.player);
      const echo = a.giantEncounter.minion;
      out.awakenedEchoAppears =
        echo?.hp === 40 && a.isAwakened(echo) && Math.abs(echo.x - a.player.x) >= 72;
      a.summonGiantMinion(a.dummy);
      out.onlyOneEchoAtATime = a.giantEncounter.minion === echo;
      out.echoHasFiniteMaterializationState = echo.spawnT === 0;
      a.stepGiantEncounter(0.1);
      out.echoMaterializationAdvances = Math.abs(echo.spawnT - 0.1) < 0.001;
      a.stepGiantAttack(a.dummy, 0.5, a.player);
      out.bossRelaxesWhileEchoFights = a.dummy.state === 'relax' && a.dummy.restT === 7;
      a.startTeleport(a.player);
      a.stepTeleport(a.player, a.dummy, 0.2);
      const seenFacing = echo.facing;
      a.controlDummy(a.dummy, a.player, 0.01);
      a.stepGiantEncounter(0.01);
      out.relaxAndEchoRespectInvisibleBlink =
        a.dummy.state === 'relax' && echo.facing === seenFacing;
      a.player.teleport = null;
      a.player.state = 'idle';
      const bossHP = a.dummy.hp;
      echo.invuln = 0;
      a.applyHit(echo, a.player, { ...a.MOVES.jab, dmg: 99 }, echo.x, 140);
      out.echoKOIsNotBossVictory =
        echo.state === 'ko' && a.game.state === 'fight' && a.dummy.hp === bossHP;
      a.stepGiantEncounter(0.6);
      a.controlGiant(a.dummy, a.player, 0.01);
      out.bossResumesAfterEcho = !a.giantEncounter.minion && a.dummy.restT <= 1;
      setup();
      a.summonGiantMinion(a.dummy);
      a.stepGiantEncounter(10.1);
      a.stepGiantEncounter(0.6);
      out.echoExpiresWithoutEndingBoss =
        !a.giantEncounter.minion && a.game.state === 'fight' && a.dummy.hp === 480;
      setup();
      const text = a.text,
        cues = [];
      try {
        a.text = (value) => cues.push(value);
        a.startAttack(a.dummy, 'colossusSmash');
        a.dummy.atk.t = 1.17;
        a.render(0);
        out.hudDoesNotCallActiveHandsAnOpening =
          cues.includes('IMPACT · HOLD GUARD') && !cues.includes('RECOVERING · YOUR OPENING');
        cues.length = 0;
        a.dummy.atk.t = 1.7;
        a.render(0);
        out.hudNamesRealRecovery = cues.includes('RECOVERING · YOUR OPENING');
      } finally {
        a.text = text;
      }
      setup();
      a.summonGiantMinion(a.dummy);
      a.giantEncounter.minion.invuln = 0;
      const m = a.giantEncounter.minion;
      m.x = a.player.x + 35;
      a.dummy.x = a.player.x + 100;
      a.player.facing = 1;
      a.startAttack(a.player, 'jab');
      a.stepAttack(a.player, 0.05, a.dummy);
      out.meleeCanTargetEcho = m.hp < 40 && a.dummy.hp === 480;
      setup();
      a.summonGiantMinion(a.dummy);
      a.giantEncounter.minion.invuln = 0;
      const projectileEcho = a.giantEncounter.minion;
      a.projectiles.push({ x: projectileEcho.x - 2, y: 140, vx: 120, life: 1, owner: a.player });
      a.updateProjectiles(1 / 60);
      out.projectileCanTargetEcho = projectileEcho.hp < 40 && a.dummy.hp === 480;
      setup();
      a.summonGiantMinion(a.dummy);
      a.player.hp = 1;
      a.applyHit(a.player, a.giantEncounter.minion, a.MOVES.jab, 170, 140);
      out.echoCanCauseRealLoss = a.game.state === 'ko' && a.game.lost && !a.game.victory;
      a.updateFlow(3.1);
      a.finishRoast();
      out.lossRetriesBossReveal =
        a.game.round === 5 &&
        a.game.state === 'enlarge' &&
        a.dummy.hp === 480 &&
        a.dummy.teddyScale === 1 &&
        !a.giantEncounter.minion &&
        !a.giantEncounter.hazards.length;
      setup();
      a.summonGiantMinion(a.dummy);
      a.dummy.hp = 1;
      a.applyHit(a.dummy, a.player, a.MOVES.jab, 300, 150);
      a.updateFlow(1.2);
      out.bossVictoryIsPlayerPaced =
        a.game.state === 'victory' &&
        a.game.victory.opponent === 'VELVET COLOSSUS' &&
        !a.giantEncounter.minion &&
        !a.giantEncounter.hazards.length &&
        a.game.round === 5;
      a.restartGame();
      out.restartRestoresNormalCameraAndBounds =
        a.game.round === 1 &&
        !a.dummy.giant &&
        a.fightWidth() === a.world.width &&
        a.game.roundTime === 99;
      for (const facing of [-1, 1]) {
        setup();
        a.dummy.facing = facing;
        a.dummy.x = facing < 0 ? a.fightWidth() - 88 : 88;
        a.startTeleport(a.player);
        a.stepTeleport(a.player, a.dummy, 0.47);
        out['giantCornerBlink' + facing] =
          (a.player.x - a.dummy.x) * facing < 0 &&
          a.player.x >= 26 &&
          a.player.x <= a.fightWidth() - 26 &&
          a.dummy.x >= 88 &&
          a.dummy.x <= a.fightWidth() - 88;
      }
      setup();
      const motion = a.reducedMotion;
      a.game.state = 'enlarge';
      a.game.t = 1.5;
      a.reducedMotion = true;
      out.reducedMotionUsesStableWideCamera = a.giantCamera() === 0.6;
      a.reducedMotion = motion;
    } finally {
      a.Sfx.play = play;
      a.rnd = random;
      a.game.round = 0;
      a.resetRound();
      a.game.paused = true;
    }
    return out;
  });
  for (const [name, passed] of Object.entries(results)) check(passed, `Colossus: ${name}`);
  const benchmark = await page.evaluate(() => {
    const a = INJ,
      random = a.rnd,
      sound = a.Sfx.play;
    const result = {
      trials: 30,
      policies: [],
      summons: 0,
      smashes: 0,
      blinks: 0,
      playerWins: 0,
      bossWins: 0
    };
    a.Sfx.play = () => {};
    try {
      for (let trial = 0; trial < 30; trial++) {
        a.rnd = a.mulberry32(17000 + trial);
        a.game.round = 4;
        a.resetRound();
        a.stepGiantIntro(4.8);
        a.game.state = 'fight';
        a.game.paused = false;
        a.game.msg = null;
        const policy = trial % 3,
          tally = (result.policies[policy] ||= {
            name: ['idle', 'reckless pressure', 'guard / Blink / punish'][policy],
            trials: 0,
            playerWins: 0
          });
        let lastAttack = null,
          echo = null,
          blink = null;
        for (let frame = 0; frame < 24000 && a.game.state === 'fight'; frame++) {
          const p = a.player,
            f = a.dummy,
            gap = Math.abs(f.x - p.x),
            dir = Math.sign(f.x - p.x),
            attack = f.atk;
          const minion = a.giantEncounter.minion;
          a.input.left = a.input.right = a.input.up = a.input.down = a.input.block = 0;
          if (policy) {
            const danger =
              policy === 2 && attack && attack.t < attack.def.startup + attack.def.active;
            const echoDanger = policy === 2 && minion?.atk && Math.abs(minion.x - p.x) < 105;
            if (
              danger &&
              attack.key === 'colossusSmash' &&
              attack.t > 0.62 &&
              !p.teleportCooldown &&
              !p.atk &&
              !p.hitstun
            )
              a.pressBuf.teleport = performance.now() + 220;
            const wave = a.giantEncounter.hazards.some(
              (h) => h.type === 'wave' && Math.abs(h.x - p.x) < 90
            );
            if (policy === 2 && wave && p.grounded) a.input.up = 1;
            const marked = a.giantEncounter.hazards.some(
              (h) => h.type === 'star' && Math.abs(h.x - p.x) < 65
            );
            if (policy === 2 && marked) {
              a.input.left = 1;
            } else if (danger || echoDanger) a.input.block = 1;
            else if (gap > 85) {
              a.input.left = +(dir < 0);
              a.input.right = +(dir > 0);
            }
            if (!danger && !echoDanger && !p.atk && !p.teleport && p.hitstun <= 0) {
              const action =
                p.meter >= 100
                  ? 'nitro'
                  : gap > 110
                    ? 'special'
                    : frame % 90 < 50
                      ? 'punch'
                      : 'kick';
              a.pressBuf[action] = performance.now() + 220;
            }
          }
          a.update(1 / 60);
          if (f.atk !== lastAttack && f.atk) {
            if (f.atk.key === 'colossusSmash') result.smashes++;
            lastAttack = f.atk;
          }
          if (minion && minion !== echo) {
            result.summons++;
            echo = minion;
          }
          if (p.teleport && p.teleport !== blink) {
            result.blinks++;
            blink = p.teleport;
          }
        }
        if (a.game.state === 'fight') throw Error('Colossus fight exceeded simulation safety cap');
        tally.trials++;
        if (a.game.lost) result.bossWins++;
        else {
          result.playerWins++;
          tally.playerWins++;
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
    benchmark.policies[0].playerWins === 0 && benchmark.playerWins > 0,
    `Colossus: ${benchmark.playerWins}/30 scripted INJ wins; idle players still lose`
  );
  check(
    benchmark.policies[2].playerWins >= 6,
    'Colossus: prepared guard/Blink strategy wins at least 6/10 fights'
  );
  check(
    benchmark.summons > 0 && benchmark.smashes > 0 && benchmark.blinks > 0,
    'Colossus: full fights exercise summons, committed smashes and timed Blink'
  );
  for (const [width, height] of [
    [1100, 720],
    [320, 568],
    [390, 844],
    [844, 390]
  ]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );
    await page.evaluate(() => {
      const a = INJ;
      a.game.round = 4;
      a.resetRound();
      a.stepGiantIntro(4.8);
      a.game.paused = true;
      a.player.x = a.fightWidth() * 0.36;
      a.dummy.x = a.fightWidth() * 0.68;
      a.startAttack(a.dummy, 'colossusSmash');
      a.dummy.atk.t = 0.8;
      a.dummy.atk.directionLocked = true;
      a.render(0);
    });
    check(
      await page.evaluate(() => {
        const r = document.querySelector('#screen').getBoundingClientRect();
        return (
          INJ.isGiant(INJ.dummy) &&
          INJ.fightWidth() > INJ.world.width &&
          document.documentElement.scrollWidth <= innerWidth &&
          [...document.querySelectorAll('#pad button')]
            .filter((el) => el.getClientRects().length)
            .every((el) => {
              const b = el.getBoundingClientRect();
              return (
                b.left >= r.left && b.right <= r.right && b.top >= r.top && b.bottom <= r.bottom
              );
            })
        );
      }),
      `Colossus: ${width}×${height} wide world and fixed controls fit`
    );
    await page.screenshot({ path: path.join(root, `artifacts/giant-smash-${width}.png`) });
    await page.evaluate(() => {
      const a = INJ;
      a.dummy.hp = 1;
      a.dummy.atk = null;
      a.dummy.invuln = 0;
      a.applyHit(a.dummy, a.player, a.MOVES.jab, a.dummy.x, 140);
      a.updateFlow(1.2);
      a.render(0);
    });
    check(
      await page.evaluate(() => {
        const r = document.querySelector('#screen').getBoundingClientRect();
        return (
          INJ.game.state === 'victory' &&
          [...document.querySelectorAll('.victory-copy, .victory-opponent, #btnNextRound')].every(
            (el) => {
              const b = el.getBoundingClientRect();
              return (
                b.left >= r.left &&
                b.right <= r.right &&
                b.top >= r.top &&
                b.bottom <= r.bottom &&
                el.scrollWidth <= el.clientWidth + 1
              );
            }
          )
        );
      }),
      `Colossus: ${width}×${height} boss victory text and controls fit`
    );
    if (width === 390)
      await page.screenshot({ path: path.join(root, 'artifacts/giant-victory.png') });
  }
  await page.evaluate(() => {
    INJ.game.round = 4;
    INJ.resetRound();
    INJ.game.paused = true;
    INJ.stepGiantIntro(2);
  });
  const revealBeforeResize = await page.evaluate(() => ({
    t: INJ.game.t,
    scale: INJ.dummy.teddyScale,
    hp: INJ.dummy.hp
  }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  );
  check(
    await page.evaluate(
      (before) =>
        INJ.game.state === 'enlarge' &&
        INJ.game.t === before.t &&
        INJ.dummy.teddyScale === before.scale &&
        INJ.dummy.hp === before.hp &&
        [INJ.player, INJ.dummy].every(
          (f) => f.x >= INJ.fighterMargin(f) && f.x <= INJ.fightWidth() - INJ.fighterMargin(f)
        ),
      revealBeforeResize
    ),
    'Colossus: resize preserves enlargement progress, HP and wider-world bounds'
  );
  // Replay the enlargement at 10% speed; inspect staged images and every scale.
  await page.setViewportSize({ width: 1100, height: 720 });
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  );
  await page.evaluate(() => {
    INJ.game.round = 4;
    INJ.resetRound();
    INJ.game.paused = true;
  });
  const captureAt = new Set([0, 8, 17, 26, 35, 47]);
  let finiteReplay = true;
  for (let i = 0; i < 49; i++) {
    finiteReplay &&= await page.evaluate(() => {
      if (INJ.game.state === 'enlarge') INJ.stepGiantIntro(0.1);
      INJ.render(0);
      return (
        Number.isFinite(INJ.giantCamera()) &&
        INJ.dummy.teddyScale >= 1 &&
        INJ.dummy.teddyScale <= 2 &&
        INJ.player.y === INJ.GROUND &&
        INJ.dummy.y === INJ.GROUND
      );
    });
    if (captureAt.has(i))
      await page.screenshot({ path: path.join(root, `artifacts/giant-reveal-${i}.png`) });
    await page.waitForTimeout(1000);
  }
  check(
    finiteReplay &&
      (await page.evaluate(() => INJ.game.state === 'fight' && INJ.dummy.teddyScale === 2)),
    'Colossus: 10% speed enlargement replay keeps grounded roots, finite camera and final 2x size'
  );
  // The impact and relaxed summon poses are real rendered states, not mockups.
  for (const [name, key, time] of [
    ['impact', 'colossusSmash', 1.17],
    ['recovery', 'colossusSmash', 1.7],
    ['summon', 'colossusSummon', 1.2]
  ]) {
    await page.evaluate(
      ({ key, time }) => {
        const a = INJ;
        a.dummy.atk = null;
        a.dummy.restT = 0;
        a.player.state = 'block';
        a.player.facing = 1;
        a.player.x = a.dummy.x - 175;
        a.startAttack(a.dummy, key);
        a.stepGiantAttack(a.dummy, time, a.player);
        if (a.giantEncounter.minion) a.stepGiantEncounter(0.5);
        a.render(0);
      },
      { key, time }
    );
    await page.screenshot({ path: path.join(root, `artifacts/giant-${name}.png`) });
  }
  const audioPage = await page.context().newPage();
  let bossAudio;
  try {
    await audioPage.goto(page.url());
    bossAudio = await audioPage.evaluate(async () => {
      const engine = InjAudio,
        offline = new OfflineAudioContext(1, 24 * 22050, 22050);
      const LiveAC = window.AudioContext;
      window.AudioContext = function () {
        return offline;
      };
      engine.ctx = null;
      engine.voices = new Set();
      engine.init();
      window.AudioContext = LiveAC;
      engine.mode = 'boss';
      engine.muted = false;
      engine.musicEnabled = true;
      engine.master.gain.value = 0.72;
      engine.music.gain.value = 0.58;
      for (let i = 0; i < 128; i++) engine.sequence(i, 0.1 + (i * 60) / 88 / 4);
      const buffer = await offline.startRendering(),
        samples = buffer.getChannelData(0);
      let peak = 0,
        sum = 0,
        invalid = 0,
        clipped = 0;
      const chunks = [];
      for (const v of samples) {
        peak = Math.max(peak, Math.abs(v));
        sum += v * v;
        if (!Number.isFinite(v)) invalid++;
        if (Math.abs(v) >= 0.999) clipped++;
      }
      for (let start = 0; start < samples.length; start += 22050) {
        let power = 0;
        for (let i = start; i < start + 22050; i++) power += samples[i] ** 2;
        chunks.push(Math.sqrt(power / 22050));
      }
      function signature(mode) {
        const notes = [],
          fake = {
            ...engine,
            mode,
            tone: (...args) => notes.push(args.slice(0, 6)),
            noise: () => {},
            kick: () => {}
          };
        for (let i = 0; i < 16; i++) fake.sequence(i, i * 0.1);
        return JSON.stringify(notes);
      }
      return {
        peak,
        rms: Math.sqrt(sum / samples.length),
        invalid,
        clipped,
        chunks,
        distinctArrangement: signature('boss') !== signature('fight'),
        samples: Array.from(samples)
      };
    });
  } finally {
    await audioPage.close();
  }
  check(
    bossAudio.invalid === 0 &&
      bossAudio.clipped === 0 &&
      bossAudio.peak > 0.05 &&
      bossAudio.peak < 0.99,
    'Colossus: original 88 BPM boss score renders finite audible samples without clipping'
  );
  check(
    bossAudio.distinctArrangement && bossAudio.chunks.slice(1, 21).every((v) => v > 0.005),
    'Colossus: boss arrangement differs from the arcade score and has no silent bars'
  );
  const pcm = Buffer.alloc(bossAudio.samples.length * 2),
    header = Buffer.alloc(44);
  bossAudio.samples.forEach((v, i) =>
    pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2)
  );
  header.write('RIFF');
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(22050, 24);
  header.writeUInt32LE(44100, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(
    path.join(root, 'artifacts/boss-score-preview.wav'),
    Buffer.concat([header, pcm])
  );
  const { samples, ...audioMetrics } = bossAudio;
  benchmark.bossAudio = audioMetrics;
  await page.bringToFront();
  await page.evaluate(() => {
    INJ.game.round = 0;
    INJ.resetRound();
    INJ.game.paused = true;
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => INJ.world.width === 450);
  return benchmark;
};
