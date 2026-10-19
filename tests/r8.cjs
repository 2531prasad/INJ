/* Boss-specific integration checks, called by browser.cjs with its owned page. */
const path = require('node:path');
module.exports = async function verifyR8(page, check, root) {
  await page.waitForFunction(() => INJ.r8Sheet.ready);
  const mechanics = await page.evaluate(() => {
    const a = INJ,
      out = {};
    function car() {
      a.game.round = 2;
      a.resetRound();
      a.game.state = 'fight';
      a.game.paused = true;
      a.game.msg = null;
      a.player.x = 140;
      a.dummy.x = 230;
      a.dummy.facing = -1;
    }
    function hud() {
      const bars = [],
        labels = [],
        draw = a.drawBar,
        text = a.text;
      a.drawBar = (...args) => bars.push(args);
      a.text = (label) => labels.push(label);
      try {
        a.drawR8Health();
      } finally {
        a.drawBar = draw;
        a.text = text;
      }
      return { bars, labels };
    }
    const sheet = a.r8Sheet;
    out.atlas =
      sheet.meta.frames.length === 16 &&
      sheet.meta.frames.every(
        (f) =>
          f.w > 0 &&
          f.h > 0 &&
          f.x >= 0 &&
          f.y >= 0 &&
          f.x + f.w <= sheet.image.naturalWidth &&
          f.y + f.h <= sheet.image.naturalHeight
      );
    car();
    out.ladder =
      a.game.round === 3 &&
      a.dummy.kind === 'r8' &&
      a.dummy.form === 'car' &&
      a.dummy.hp === a.R8_TUNING.car.health &&
      a.dummy.robotMaxHp === a.R8_TUNING.robot.health;
    const initialHud = hud();
    out.initialLifeOnly =
      initialHud.bars.length === 1 && initialHud.bars[0][4] === 1 && initialHud.labels.length === 0;
    out.shortCar =
      a.hurtbox(a.dummy).h < a.hurtbox(a.player).h * 0.5 &&
      a.hurtbox(a.dummy).w > a.hurtbox(a.player).w * 2;
    a.dummy.x = a.player.x + 40;
    const hp = a.dummy.hp;
    a.startAttack(a.player, 'jab');
    a.tryHit(a.player, a.dummy);
    out.highJabMisses = a.dummy.hp === hp;
    a.player.atk = null;
    a.startAttack(a.player, 'cpunch');
    a.tryHit(a.player, a.dummy);
    out.lowPunchHits = a.dummy.hp < hp;
    car();
    a.dummy.x = a.player.x + 100;
    a.startAttack(a.player, 'toss');
    a.stepAttack(a.player, 0.11, a.dummy);
    out.shadowAimsLow = a.projectiles[0].vy > 0;
    const before = a.dummy.hp;
    for (let i = 0; i < 100 && a.dummy.hp === before; i++) a.updateProjectiles(1 / 120);
    out.shadowHitsCar = a.dummy.hp < before;
    car();
    const x = a.dummy.x,
      health = a.player.hp;
    a.startAttack(a.dummy, 'r8Dash');
    a.stepAttack(a.dummy, 0.1, a.player);
    out.dashTelegraph = a.dummy.x === x && a.player.hp === health;
    a.stepAttack(a.dummy, 0.15, a.player);
    const hit = a.player.hp;
    a.stepAttack(a.dummy, 0.02, a.player);
    out.dashSingleHit = a.dummy.x < x && hit < health && a.player.hp === hit;
    car();
    a.startAttack(a.dummy, 'r8Jump');
    a.stepAttack(a.dummy, 0.27, a.player);
    a.physics(a.dummy, 0.016);
    out.thrusterJump = !a.dummy.grounded && a.dummy.vy < 0 && a.dummy.y < a.GROUND;
    car();
    a.startAttack(a.dummy, 'r8Dash');
    a.dummy.atk.t = 0.1;
    const committed = a.dummy.atk,
      carHp = a.dummy.hp;
    a.applyHit(a.dummy, a.player, a.MOVES.cpunch, 230, 180);
    out.engineCommitment = a.dummy.atk === committed && a.dummy.hp < carHp && a.dummy.hitstun === 0;
    a.applyHit(a.dummy, a.player, a.MOVES.sweep, 230, 180);
    out.sweepBreaksCommitment = a.dummy.atk === null && a.dummy.state === 'knockdown';
    car();
    a.startAttack(a.dummy, 'r8Wheel');
    a.stepAttack(a.dummy, 0.3, a.player);
    out.rimProjectile =
      a.projectiles.length === 1 &&
      a.projectiles[0].style === 'rim' &&
      a.projectiles[0].move.key === 'r8Wheel' &&
      a.projectiles[0].owner === a.dummy;
    car();
    a.startAttack(a.dummy, 'r8Rear');
    const preparing = a.sampleR8Animation(a.dummy).frame;
    a.dummy.atk.t = 0.34;
    out.temporaryStand =
      preparing === 6 &&
      a.sampleR8Animation(a.dummy).frame === 10 &&
      a.hurtbox(a.dummy).h > 100 &&
      a.dummy.form === 'car';
    car();
    a.game.roundTime = 12.3;
    a.player.hp = 77;
    a.player.charge = 2;
    a.dummy.hp = 1;
    a.applyHit(a.dummy, a.player, a.MOVES.jab, 230, 180);
    out.firstHealthTransforms =
      a.game.state === 'transform' &&
      a.dummy.hp === 0 &&
      a.dummy.form === 'car' &&
      a.game.round === 3 &&
      !a.game.lost;
    const emptyHud = hud();
    out.reserveStaysHidden =
      emptyHud.bars.length === 1 && emptyHud.bars[0][4] === 0 && emptyHud.labels.length === 0;
    a.game.paused = false;
    const clock = a.game.roundTime;
    a.update(0.5);
    out.transitionSafe =
      a.game.state === 'transform' &&
      clock === 12.3 &&
      a.game.roundTime === clock &&
      a.player.hp === 77 &&
      !a.player.atk &&
      !a.dummy.atk;
    a.game.paused = true;
    const t = a.game.t;
    a.update(1);
    out.transitionPauses = a.game.t === t;
    a.updateFlow(1.7);
    out.secondHealth =
      a.game.state === 'fight' &&
      a.dummy.form === 'robot' &&
      a.dummy.hp === a.R8_TUNING.robot.health &&
      a.player.hp === 77 &&
      a.player.charge === 3 &&
      a.game.round === 3 &&
      a.game.roundTime === 99;
    const revealedHud = hud();
    out.surpriseLife =
      revealedHud.bars.length === 1 &&
      revealedHud.bars[0][4] === 1 &&
      revealedHud.bars[0][6] !== initialHud.bars[0][6] &&
      revealedHud.labels.length === 0;
    a.dummy.invuln = 0;
    a.dummy.hp = 1;
    a.applyHit(a.dummy, a.player, a.MOVES.jab, 230, 140);
    out.finalHealthWins = a.game.state === 'ko' && !a.game.lost && a.game.msg.text === 'INJ WINS';
    car();
    a.dummy.hp = 1;
    a.dummy.state = 'block';
    a.applyHit(a.dummy, a.player, a.MOVES.jab, 230, 180);
    out.chipTransforms = a.game.state === 'transform';
    car();
    a.game.roundTime = 0.001;
    a.updateFlow(0.01);
    out.timeoutCannotSkipRobot = a.game.state === 'ko' && a.game.lost;
    car();
    a.completeR8Transform();
    const frames = [];
    for (const key of ['r8Piston', 'r8Axle', 'r8Upper', 'r8Dive', 'r8Lunge']) {
      a.dummy.atk = null;
      a.startAttack(a.dummy, key);
      a.dummy.atk.t = a.dummy.atk.def.startup + 0.01;
      frames.push(a.sampleR8Animation(a.dummy).frame);
    }
    out.robotMoves = frames.join(',') === '10,11,12,13,10' && a.dummy.form === 'robot';
    car();
    a.completeR8Transform();
    a.dummy.invuln = 0;
    a.dummy.restT = 0;
    a.dummy.openingT = 0;
    a.dummy.aiT = 0;
    a.projectiles.push({ x: a.dummy.x - 60, y: 150, vx: 235, life: 1, owner: a.player });
    const random = a.rnd;
    a.rnd = () => 0;
    try {
      a.controlR8(a.dummy, a.player, 0.01);
      out.wheelShield = a.dummy.state === 'block' && a.dummy.counterMove === 'r8Dive';
      a.projectiles.length = 0;
      a.controlR8(a.dummy, a.player, 0.3);
      out.shieldCounter = a.dummy.atk?.key === 'r8Dive';
    } finally {
      a.rnd = random;
    }
    car();
    a.completeR8Transform();
    a.dummy.restT = 0;
    a.dummy.aiT = 0;
    a.player.grounded = false;
    a.player.y = a.GROUND - 50;
    const airRandom = a.rnd;
    a.rnd = () => 0;
    try {
      a.controlR8(a.dummy, a.player, 0.01);
      const first = a.dummy.counterMove === 'r8Upper';
      a.dummy.blockT = 0;
      a.dummy.counterMove = null;
      a.dummy.dodgeCooldown = 0;
      a.player.y = a.GROUND - 10;
      a.controlR8(a.dummy, a.player, 0.01);
      a.dummy.atk = null;
      a.dummy.aiT = 0;
      a.dummy.restT = 0;
      a.dummy.openingT = 0;
      a.player.y = a.GROUND - 50;
      a.controlR8(a.dummy, a.player, 0.01);
      out.repeatedAirThreat = first && a.dummy.counterMove === 'r8Upper';
    } finally {
      a.rnd = airRandom;
    }
    for (const form of ['car', 'robot']) {
      car();
      if (form === 'robot') a.completeR8Transform();
      a.player.invuln = 0;
      a.player.hp = 1;
      a.applyHit(a.player, a.dummy, a.MOVES.r8Dash, 140, 180);
      out[form + 'CanDefeatINJ'] = a.game.state === 'ko' && a.game.lost;
    }
    a.game.round = 3;
    a.resetRound();
    out.laterBossResets =
      a.game.round === 4 && a.dummy.form === 'car' && a.dummy.hp === a.R8_TUNING.car.health;
    a.restartGame();
    out.restartClearsBoss =
      a.game.round === 1 &&
      a.dummy.kind === 'dummy' &&
      a.dummy.hp === 130 &&
      a.dummy.form === null &&
      a.dummy.robotMaxHp === 0 &&
      a.dummy.counterMove === null;
    a.game.paused = true;
    return out;
  });
  for (const [name, passed] of Object.entries(mechanics)) check(passed, `R8 encounter: ${name}`);
  const benchmarks = await page.evaluate(() => {
    const a = INJ,
      results = {},
      play = a.Sfx.play;
    a.Sfx.play = () => {};
    try {
      for (const form of ['car', 'robot']) {
        let bossWins = 0,
          playerWins = 0;
        const policies = [
          'idle',
          'punch spam',
          'mixed attacks',
          'Shadow kiting',
          'jumping kicks',
          'guard/counter',
          'crouch/sweep'
        ].map((policy) => ({ policy, trials: 0, bossWins: 0, playerWins: 0 }));
        for (let trial = 0; trial < 100; trial++) {
          a.game.round = 2;
          a.resetRound();
          if (form === 'robot') a.completeR8Transform();
          a.game.state = 'fight';
          a.game.paused = false;
          a.game.msg = null;
          a.dummy.aiT = 0;
          const policy = trial % 7;
          for (let frame = 0; frame < 18000 && a.game.state === 'fight'; frame++) {
            const p = a.player,
              op = a.dummy,
              dir = Math.sign(op.x - p.x),
              gap = Math.abs(op.x - p.x),
              low = form === 'car';
            a.input.left = a.input.right = 0;
            a.input.down = +(policy === 6 || (low && (policy === 1 || policy === 2)));
            a.input.up = +(policy === 4);
            a.input.block = +(policy === 5);
            if (policy && policy !== 5 && policy !== 6) {
              const move = policy === 3 ? -dir : gap > (low ? 65 : 56) ? dir : 0;
              a.input.left = +(move < 0);
              a.input.right = +(move > 0);
            }
            if (policy && !p.atk && p.hitstun <= 0) {
              const act =
                policy === 1
                  ? 'punch'
                  : policy === 2
                    ? (low ? ['punch', 'kick', 'special'] : ['punch', 'kick', 'upper'])[
                        Math.floor(frame / 24) % 3
                      ]
                    : policy === 3
                      ? 'special'
                      : policy === 4
                        ? p.grounded
                          ? null
                          : 'kick'
                        : policy === 5
                          ? frame % 80 < 8
                            ? 'punch'
                            : null
                          : 'kick';
              if (act) a.pressBuf[act] = performance.now() + 220;
            }
            a.update(1 / 60);
          }
          if (a.game.state === 'fight') throw Error('R8 benchmark exceeded five-minute cap');
          const won = a.game.state === 'transform' || !a.game.lost;
          policies[policy].trials++;
          if (won) {
            playerWins++;
            policies[policy].playerWins++;
          } else {
            bossWins++;
            policies[policy].bossWins++;
          }
        }
        results[form] = {
          trials: 100,
          targetLossPercent: form === 'car' ? 65 : 85,
          bossWins,
          playerWins,
          policies,
          limit:
            'Isolated form with fresh INJ health; car-aware policies use low strikes. Not a human loss-rate estimate.'
        };
      }
    } finally {
      a.Sfx.play = play;
      a.game.paused = true;
      a.game.round = 0;
      a.resetRound();
      a.game.paused = true;
    }
    return results;
  });
  for (const [form, result] of Object.entries(benchmarks))
    check(
      result.bossWins > 0 && result.playerWins > 0,
      `R8 ${form}: ${result.bossWins}/100 scripted boss wins, with real player wins`
    );
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForFunction(
    () => Math.abs(INJ.world.width / 225 - innerWidth / innerHeight) < 0.01
  );
  await page.evaluate(() => {
    const a = INJ;
    a.game.round = 2;
    a.resetRound();
    a.game.state = 'fight';
    a.game.msg = null;
    a.game.paused = true;
    a.game.elapsed = 6;
    a.player.x = a.world.width / 2 - 90;
    a.dummy.x = a.world.width / 2 + 70;
    a.render(6000);
  });
  await page.screenshot({ path: path.join(root, 'artifacts/r8-car-phone.png') });
  async function portrait(form) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => INJ.world.width === 450);
    check(
      await page.evaluate((form) => {
        const a = INJ,
          f = a.dummy,
          m = a.fighterMargin(f);
        return (
          f.form === form &&
          f.hp === a.R8_TUNING[form].health &&
          f.carMaxHp === a.R8_TUNING.car.health &&
          f.robotMaxHp === a.R8_TUNING.robot.health &&
          f.x >= m &&
          f.x <= a.world.width - m &&
          a.game.round === 3
        );
      }, form),
      `R8 ${form}: portrait resize preserves both health pools, form and bounds`
    );
    await page.screenshot({ path: path.join(root, `artifacts/r8-${form}-portrait.png`) });
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForFunction(
      () => Math.abs(INJ.world.width / 225 - innerWidth / innerHeight) < 0.01
    );
  }
  await portrait('car');
  await page.evaluate(() => {
    INJ.startAttack(INJ.dummy, 'r8Rear');
    INJ.dummy.atk.t = 0.35;
    INJ.render(6000);
  });
  await page.screenshot({ path: path.join(root, 'artifacts/r8-rear-up.png') });
  await page.evaluate(() => {
    INJ.beginR8Transform(INJ.dummy);
    INJ.game.t = 1.3;
    INJ.render(6000);
  });
  await page.screenshot({ path: path.join(root, 'artifacts/r8-transform.png') });
  await page.evaluate(() => {
    INJ.completeR8Transform();
    INJ.game.paused = true;
    INJ.render(6000);
  });
  await page.screenshot({ path: path.join(root, 'artifacts/r8-robot-phone.png') });
  await portrait('robot');
  await page.evaluate(() => {
    INJ.startAttack(INJ.dummy, 'r8Axle');
    INJ.dummy.atk.t = 0.28;
    INJ.render(6000);
  });
  await page.screenshot({ path: path.join(root, 'artifacts/r8-axle-kick.png') });
  await page.evaluate(() => {
    INJ.game.round = 0;
    INJ.resetRound();
    INJ.game.state = 'fight';
    INJ.game.paused = true;
    INJ.game.msg = null;
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => INJ.world.width === 450);
  return benchmarks;
};
