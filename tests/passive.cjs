/* Passive timing, hit-chain eligibility, all enemy forms and existing-art rendering. */
const path = require('node:path');
module.exports = async function verifyPassive(page, check, root, { artifacts = false } = {}) {
  const results = await page.evaluate(() => {
    const a = INJ, out = {}, play = a.Sfx.play;
    a.Sfx.play = () => {};
    function setup(round = 1) {
      a.game.round = round - 1; a.resetRound();
      if (round >= 5) a.stepGiantIntro(4.8);
      a.game.state = 'fight'; a.game.paused = true;
      a.player.x = 180; a.dummy.x = 230; a.dummy.facing = -1;
      a.dummy.invuln = 0;
    }
    function hit() { a.applyHit(a.player, a.dummy, a.MOVES.jab, a.player.x, 150); }
    function burst() { hit(); hit(); hit(); }
    try {
      setup();
      a.progress.unlocks.colossusBurst = false;
      burst();
      out.lockedPassiveCannotTrigger = !a.player.burst && !a.player.burstHits;
      setup(5); a.dummy.hp = 1;
      a.applyHit(a.dummy, a.player, a.MOVES.jab, 230, 150);
      out.bossKOActuallyUnlocks = a.progress.unlocks.colossusBurst;
      setup(); hit(); hit();
      out.twoHitsOnlyBuildTheCounter = a.player.burstHits === 2 && !a.player.burst;
      hit();
      out.thirdHitStartsWithoutHealing = !!a.player.burst && a.player.hp === 105 && !a.player.hitstun;
      const hp = a.dummy.hp;
      a.stepPassive(0.05);
      out.halfGrowthIsBetweenNormalAndPeak = a.passiveScale(a.player) > 1 && a.passiveScale(a.player) < 2.5;
      a.stepPassive(0.05);
      out.exactPeakAt100ms = Math.abs(a.passiveScale(a.player) - 2.5) < 1e-9 && a.dummy.burstStun === 1;
      out.pulseKnocksAwayWithoutDamage = a.dummy.vx > 0 && a.dummy.hp === hp && a.dummy.atk === null;
      a.applyHit(a.player, a.dummy, a.MOVES.jab, 180, 150);
      out.burstAnimationProtectsAgainstFurtherHits = a.player.hp === 105;
      a.startAttack(a.player, 'jab');
      out.burstCannotAttackOrBlink = !a.player.atk && !a.startTeleport(a.player);
      const x = a.dummy.x;
      a.controlDummy(a.dummy, a.player, 0.5);
      out.stunPreventsAIAndMovesEnemyAway = a.dummy.burstStun === 0.5 && a.dummy.x > x && !a.dummy.atk;
      a.controlDummy(a.dummy, a.player, 0.5);
      out.stunEndsAfterOneActiveSecond = !a.dummy.burstStun && a.dummy.state === 'idle';
      a.stepPassive(0.15);
      out.halfShrinkIsBetweenNormalAndPeak = a.passiveScale(a.player) > 1 && a.passiveScale(a.player) < 2.5;
      a.stepPassive(0.15);
      out.returnsToNormalAt400ms = !a.player.burst && a.passiveScale(a.player) === 1;
      setup(); hit(); hit();
      a.player.state = 'block'; a.player.facing = 1; hit();
      out.blockingBreaksTheChain = !a.player.burstHits && !a.player.burst;
      setup(); hit(); hit();
      a.applyHit(a.dummy, a.player, a.MOVES.jab, 230, 150); hit();
      out.counterHitBreaksTheChain = a.player.burstHits === 1 && !a.player.burst;
      setup(); hit(); hit(); a.stepPassive(2.01); hit();
      out.quietGapExpiresTheChain = a.player.burstHits === 1 && !a.player.burst;
      setup(); a.player.invuln = 1; burst();
      out.invalidHitsNeverCount = !a.player.burstHits && a.player.hp === 120;
      setup(); a.player.hp = 11; burst();
      out.lethalThirdHitStillLoses = a.player.hp === 0 && a.game.lost && !a.player.burst;
      for (const form of ['dummy', 'awakened', 'car', 'robot', 'teddy', 'tiny', 'giant']) {
        setup({ dummy: 1, awakened: 2, car: 3, robot: 3, teddy: 4, tiny: 4, giant: 5 }[form]);
        if (form === 'robot') { a.beginR8Transform(a.dummy); a.completeR8Transform(); a.dummy.invuln = a.player.invuln = 0; }
        if (form === 'tiny') { a.dummy.tiny = true; a.dummy.teddyScale = 0.34; }
        a.dummy.x = a.player.x + 50;
        const before = a.dummy.hp;
        burst(); a.stepPassive(0.1);
        a.controlDummy(a.dummy, a.player, 0.5);
        out['stuns_' + form] = a.dummy.burstStun === 0.5 && !a.dummy.atk && a.dummy.hp === before;
      }
      setup(5); a.summonGiantMinion(a.dummy);
      const echo = a.giantEncounter.minion;
      Object.assign(echo, { x: a.player.x - 40, invuln: 0, spawnT: 1 });
      burst(); a.stepPassive(0.1);
      out.bothNearbyEnemiesArePushedAway = a.dummy.vx > 0 && echo.vx < 0 && echo.burstStun === 1;
      setup(5); a.dummy.x = a.player.x + 400;
      burst(); a.stepPassive(0.1);
      out.distantEnemyIsUnaffected = !a.dummy.burstStun && !a.dummy.vx;
      setup(); burst();
      a.game.paused = true; a.update(0.2);
      out.pauseFreezesBurst = a.player.burst.t === 0;
      a.game.paused = false; a.game.hitStop = 1; a.update(0.1);
      out.hitStopFreezesBurst = a.player.burst.t === 0;
      a.resetRound({ advance: false });
      out.resetClearsTransientStateButKeepsUnlock = !a.player.burst && !a.player.burstHits && a.progress.unlocks.colossusBurst;
      setup(3); burst(); a.beginR8Transform(a.dummy);
      out.transformationClearsBurst = !a.player.burst;
    } finally { a.Sfx.play = play; a.game.paused = true; }
    return out;
  });
  for (const [name, passed] of Object.entries(results)) check(passed, 'Burst: ' + name);
  // Replay the 0.4s semantic animation at 10% speed, with anchored old sprite art.
  await page.evaluate(() => {
    INJ.game.round = 0; INJ.resetRound(); INJ.game.state = 'fight'; INJ.game.paused = true;
    INJ.player.x = 170; INJ.dummy.x = 220;
    for (let i = 0; i < 3; i++) INJ.applyHit(INJ.player, INJ.dummy, INJ.MOVES.jab, 170, 150);
  });
  const samples = [];
  for (let i = 0; i <= 40; i++) {
    samples.push(await page.evaluate(step => {
      if (step) INJ.stepPassive(0.01);
      INJ.render(0);
      return { scale: INJ.passiveScale(INJ.player), x: INJ.player.x, y: INJ.player.y,
        pose: INJ.sampleFighterAnimation(INJ.player).frame, height: INJ.hurtbox(INJ.player).h };
    }, i));
    if (artifacts && [0, 10, 25, 40].includes(i))
      await page.screenshot({ path: path.join(root, `artifacts/burst-replay-${i}.png`) });
    await page.waitForTimeout(100);
  }
  check(samples.every(s => s.x === 170 && s.y === INJ_GROUND && Number.isFinite(s.scale)), 'Burst: slow replay preserves the foot/root anchor');
  check(Math.abs(samples[10].scale - 2.5) < 1e-9 && samples[40].scale === 1 &&
    samples.slice(1, 10).every((s, i) => s.scale >= samples[i].scale) &&
    samples.slice(11).every((s, i) => s.scale <= samples[i + 10].scale), 'Burst: slow replay grows for 0.1s then shrinks over 0.3s');
  check(samples[10].pose === 10 && Math.abs(samples[10].height / samples[0].height - 2.5) < 1e-9,
    'Burst: authored knockout pose and hurtbox share the runtime scale');
};
const INJ_GROUND = 198;
