/* Actual HP loss charges a permanent passive; test real damage and active-time stun. */
const path = require('node:path');
module.exports = async function verifyPassive(page, check, root, { artifacts = false } = {}) {
  const results = await page.evaluate(() => {
    const a = INJ, out = {}, play = a.Sfx.play;
    a.Sfx.play = () => {};
    function setup(round = 1) {
      a.player.maxHp = 120;
      a.game.round = round - 1; a.resetRound();
      if (round >= 5) a.stepGiantIntro(4.8);
      a.game.state = 'fight'; a.game.paused = true; a.game.msg = null;
      a.player.x = 180; a.dummy.x = 230; a.dummy.facing = -1;
      a.dummy.invuln = a.player.invuln = 0;
      a.updatePassiveUI();
    }
    function hit(dmg = 5, source = a.dummy) {
      a.applyHit(a.player, source, { ...a.MOVES.jab, dmg }, a.player.x, 150);
    }
    function burst() { hit(30); }
    try {
      setup(); a.progress.unlocks.colossusBurst = false; burst();
      out.lockedPassiveCannotCharge = !a.player.burst && !a.player.burstDamage;
      setup(5); a.dummy.hp = 1;
      a.applyHit(a.dummy, a.player, a.MOVES.jab, 230, 150);
      out.realBossKOUnlocksPermanentAbility = a.progress.unlocks.colossusBurst;
      setup(); hit(); hit(); hit();
      out.threeLightHitsOnlyChargeHalf = a.player.burstDamage === 15 && !a.player.burst;
      a.applyHit(a.dummy, a.player, a.MOVES.jab, 230, 150);
      a.stepPassive(10);
      out.counterHitsAndLongGapsNeverEraseDamage = a.player.burstDamage === 15 && !a.player.burst;
      a.player.state = 'block'; a.player.facing = 1; hit(5);
      out.actualGuardChipAddsOneHP = a.player.burstDamage === 16 && a.player.hp === 104;
      a.player.state = 'idle'; hit(13);
      out.belowQuarterHPDoesNotTrigger = a.player.burstDamage === 29 && !a.player.burst;
      hit(1);
      out.exactThirtyDamageTriggersWithoutHealing = !!a.player.burst && a.player.hp === 90 && !a.player.hitstun;
      const node = document.querySelector('#passiveHud');
      out.fullShieldIsVisiblyReady = !node.hidden && node.dataset.state === 'ready' &&
        node.getAttribute('aria-valuenow') === '100' && node.textContent.includes('READY');
      a.startAttack(a.dummy, 'haymaker');
      const enemyHP = a.dummy.hp;
      a.stepPassive(0.05);
      out.halfGrowthBetweenNormalAndPeak = a.passiveScale(a.player) > 1 && a.passiveScale(a.player) < 2.5;
      a.stepPassive(0.05);
      out.peakAt100msStunsAndCancelsEnemyAttack = Math.abs(a.passiveScale(a.player) - 2.5) < 1e-9 &&
        a.dummy.burstStun === 1 && !a.dummy.atk && a.dummy.state === 'hurt';
      out.knockbackAddsNoDamage = a.dummy.vx > 0 && a.dummy.hp === enemyHP;
      out.chargeIsConsumedAndFiredFeedbackLingers = a.player.burstDamage === 0 &&
        node.dataset.state === 'active' && node.textContent.includes('FIRED');
      hit(50);
      out.activeBurstProtectsAgainstDamage = a.player.hp === 90 && !a.player.burstDamage;
      a.startAttack(a.player, 'jab');
      out.burstCannotAttackOrBlink = !a.player.atk && !a.startTeleport(a.player);
      const x = a.dummy.x;
      a.controlDummy(a.dummy, a.player, 0.5);
      out.stunStopsAIAndMovesEnemyAway = a.dummy.burstStun === 0.5 && a.dummy.x > x && !a.dummy.atk;
      a.applyHit(a.dummy, a.player, a.MOVES.jab, a.dummy.x, 150);
      out.followupDoesNotRefreshStun = a.dummy.burstStun === 0.5 && a.dummy.state === 'hurt';
      a.controlDummy(a.dummy, a.player, 0.5);
      out.stunEndsAfterOneActiveSecond = !a.dummy.burstStun && a.dummy.state === 'idle';
      a.stepPassive(0.15);
      out.halfShrinkBetweenNormalAndPeak = a.passiveScale(a.player) > 1 && a.passiveScale(a.player) < 2.5;
      a.stepPassive(0.15);
      out.normalSizeAt400ms = !a.player.burst && a.passiveScale(a.player) === 1;
      a.stepPassive(1);
      out.feedbackReturnsToEmptyRechargeMeter = node.dataset.state === 'charging' && node.getAttribute('aria-valuenow') === '0';
      // Repeat procs consume a full threshold per damage event, never heal INJ.
      hit(30); out.canTriggerAgainAfterAnotherQuarterHP = !!a.player.burst && a.player.hp === 60;
      setup(); a.player.maxHp = a.player.hp = 200; hit(49);
      out.thresholdUsesMaximumHPNotRemainingHP = !a.player.burst && a.burstThreshold() === 50;
      hit(1); out.customMaximumTriggersAtExactlyQuarter = !!a.player.burst && a.player.hp === 150;
      setup(); a.player.invuln = 1; burst();
      out.invulnerableHitsNeverCharge = !a.player.burstDamage && a.player.hp === 120;
      a.player.invuln = 0; a.player.teleport = { t: 0 }; burst();
      out.teleportProtectionNeverCharges = !a.player.burstDamage && a.player.hp === 120;
      setup(); a.player.hp = 10; hit(30);
      out.lethalHitStillLoses = a.player.hp === 0 && a.game.lost && !a.player.burst;
      for (const form of ['dummy', 'awakened', 'car', 'robot', 'teddy', 'tiny', 'giant']) {
        setup({ dummy: 1, awakened: 2, car: 3, robot: 3, teddy: 4, tiny: 4, giant: 5 }[form]);
        if (form === 'robot') { a.beginR8Transform(a.dummy); a.completeR8Transform(); a.dummy.invuln = a.player.invuln = 0; }
        if (form === 'tiny') { a.dummy.tiny = true; a.dummy.teddyScale = 0.34; }
        const hp = a.dummy.hp;
        burst();
        a.dummy.invuln = 0.5; a.dummy.state = 'block';
        a.stepPassive(0.1); a.controlDummy(a.dummy, a.player, 0.5);
        out['stuns_' + form] = a.dummy.burstStun === 0.5 && !a.dummy.atk &&
          a.dummy.state === 'hurt' && a.dummy.hp === hp && a.dummy.invuln === 0;
      }
      setup(); a.player.x = 50; a.dummy.x = 380;
      hit(30); a.stepPassive(0.1);
      out.distantRangedAttackerStillStunned = a.dummy.burstStun === 1;
      setup(5); a.summonGiantMinion(a.dummy);
      const echo = a.giantEncounter.minion;
      Object.assign(echo, { x: a.player.x - 40, invuln: 0.4, spawnT: 1 });
      burst(); a.stepPassive(0.1);
      out.nearbyBossAndEchoBothStunned = a.dummy.vx > 0 && echo.vx < 0 && echo.burstStun === 1;
      setup(5); a.summonGiantMinion(a.dummy);
      a.giantEncounter.minion.x = a.player.x + 400;
      burst(); a.stepPassive(0.1);
      out.distantUnrelatedEnemyIsUnaffected = !a.giantEncounter.minion.burstStun;
      setup(5); a.dummy.x = a.player.x + 400;
      a.giantEncounter.hazards.push({ type: 'wave', x: a.player.x, y: a.GROUND, vx: 1, t: 0, life: 2,
        hit: false, move: { ...a.MOVES.jab, dmg: 30 } });
      a.stepGiantEncounter(0);
      out.hazardKeepsRealSourceActor = a.player.burst?.source === a.dummy;
      a.stepPassive(0.1);
      out.rangedBossHazardStunsItsCaster = a.dummy.burstStun === 1;
      setup(); burst(); a.stepPassive(0.1); a.game.hitStop = 0; a.game.paused = false;
      for (let i = 0; i < 9; i++) a.update(0.1);
      out.realEngineBlocksEnemyForFullStun = a.dummy.burstStun > 0.09 && !a.dummy.atk && a.dummy.state === 'hurt';
      a.update(0.1);
      out.realEngineReleasesAfterOneSecond = a.dummy.burstStun === 0;
      setup(); hit(10); a.pauseGame(); a.update(10);
      out.pauseKeepsPartialDamageAndHUD = a.player.burstDamage === 10 && node.getAttribute('aria-valuenow') === '33';
      setup(); burst(); a.game.paused = true; a.update(0.2);
      out.pauseFreezesBurst = a.player.burst.t === 0;
      a.game.paused = false; a.game.hitStop = 1; a.update(0.1);
      out.hitStopFreezesBurst = a.player.burst.t === 0;
      setup(3); hit(20); a.beginR8Transform(a.dummy); a.completeR8Transform();
      out.robotRevealKeepsPartialShieldAndUnlock = a.player.burstDamage === 20 && a.progress.unlocks.colossusBurst;
      setup(4); hit(20); a.dummy.hp = 90; a.queueTeddyShrink(a.dummy);
      a.dummy.shrinkDelay = 0; a.stepTeddyShrink(0); a.stepTeddyShrink(2.35);
      out.shrinkKeepsPartialShieldAndUnlock = a.player.burstDamage === 20 && a.progress.unlocks.colossusBurst;
      a.resetRound({ advance: false });
      out.roundResetClearsChargeButNeverUnlock = !a.player.burst && !a.player.burstDamage && a.progress.unlocks.colossusBurst;
      // Same earned passive really activates after returning to every encounter.
      for (const round of [1, 2, 3, 4, 5]) {
        setup(round); burst(); a.stepPassive(0.1);
        out['permanent_on_level_' + round] = a.progress.unlocks.colossusBurst && a.dummy.burstStun === 1;
      }
    } finally { a.Sfx.play = play; a.game.paused = true; }
    return out;
  });
  for (const [name, passed] of Object.entries(results)) check(passed, 'Shield: ' + name);
  await page.evaluate(() => {
    INJ.resumeGame();
    INJ.game.round = 0; INJ.resetRound(); INJ.game.state = 'fight'; INJ.game.paused = true;
    INJ.player.x = 170; INJ.dummy.x = 220; INJ.game.msg = null;
    INJ.applyHit(INJ.player, INJ.dummy, { ...INJ.MOVES.jab, dmg: 30 }, 170, 150);
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
  check(samples.every(s => s.x === 170 && s.y === 198 && Number.isFinite(s.scale)), 'Shield: slow replay preserves foot/root anchor');
  check(Math.abs(samples[10].scale - 2.5) < 1e-9 && samples[40].scale === 1 &&
    samples.slice(1, 10).every((s, i) => s.scale >= samples[i].scale) &&
    samples.slice(11).every((s, i) => s.scale <= samples[i + 10].scale), 'Shield: growth 0.1s and return 0.3s at exact 2.5x');
  check(samples[10].pose === 10 && Math.abs(samples[10].height / samples[0].height - 2.5) < 1e-9,
    'Shield: existing pose and hurtbox share scale');
  for (const [width, height] of [[320, 568], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.evaluate(() => {
      INJ.game.round = 0; INJ.resetRound(); INJ.game.state = 'fight'; INJ.game.paused = true;
      INJ.game.msg = null; INJ.player.x = 170; INJ.dummy.x = 230;
      INJ.applyHit(INJ.player, INJ.dummy, { ...INJ.MOVES.jab, dmg: 30 }, 170, 150);
      INJ.render(0);
    });
    check(await page.locator('#passiveHud').evaluate(el => {
      const r = el.getBoundingClientRect(), arena = document.querySelector('#screen').getBoundingClientRect();
      return el.dataset.state === 'ready' && r.left >= arena.left && r.right <= arena.right &&
        r.top >= arena.top && r.bottom <= arena.bottom && getComputedStyle(el).pointerEvents === 'none' &&
        document.querySelector('#pauseOverlay').hidden &&
        [0.1, 0.5, 0.9].every(p => {
          const hit = document.elementFromPoint(r.x + r.width * p, r.y + r.height / 2);
          return !el.contains(hit) && !hit.closest('.abtn');
        });
    }), `Shield: ${width}px READY marker fits without intercepting touches`);
    if (artifacts) await page.screenshot({ path: path.join(root, `artifacts/shield-ready-${width}.png`) });
    await page.evaluate(() => { INJ.stepPassive(0.1); INJ.stepPassive(0.3); INJ.render(0); });
    check(await page.evaluate(() => INJ.dummy.burstStun > 0 && document.querySelector('#passiveHud').dataset.state === 'active'),
      `Shield: ${width}px FIRED feedback and visible stun state`);
    if (artifacts) await page.screenshot({ path: path.join(root, `artifacts/shield-stun-${width}.png`) });
  }
};
