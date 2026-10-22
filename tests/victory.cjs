/* Win-scene lifecycle, safe progression and responsive presentation. */
module.exports = async function verifyVictory(page, check, root) {
  const results = await page.evaluate(() => {
    const a = INJ, out = {}, played = [], play = a.Sfx.play;
    function setup(round = 1) {
      a.game.round = round - 1; a.resetRound();
      a.game.state = 'fight'; a.game.paused = true; a.game.msg = null;
      a.dummy.aiT = 999;
    }
    a.Sfx.play = sound => played.push(sound);
    try {
      setup();
      a.player.hp = 83; a.game.bestCombo = 7; a.dummy.hp = 1;
      a.input.right = 1; a.pressBuf.kick = performance.now() + 220;
      a.applyHit(a.dummy, a.player, a.MOVES.jab, a.dummy.x, 140);
      out.knockoutBeat = a.game.state === 'ko' && a.game.koTimer === 1.1 &&
        !Object.values(a.input).some(Boolean) && !Object.values(a.pressBuf).some(Boolean);
      a.updateFlow(0.8);
      out.doesNotCutOffKnockout = a.game.state === 'ko';
      a.updateFlow(0.31);
      const panel = document.querySelector('#victoryPanel');
      out.victoryPoseAndResult = a.game.state === 'victory' && a.player.state === 'victory' &&
        a.sampleFighterAnimation(a.player).frame === 11 && a.game.victory.health === 83 &&
        a.game.victory.bestCombo === 7 && !panel.hidden &&
        document.querySelector('#victoryOpponent').textContent === 'DUMMY DEFEATED';
      out.fanfareOnce = played.filter(sound => sound === 'victory').length === 1;
      out.controlsGiveWayToScene = document.querySelector('#pad').getClientRects().length === 0 &&
        document.querySelector('#stickZone').getClientRects().length === 0 &&
        document.activeElement.id === 'btnNextRound';
      const time = a.game.roundTime, hp = a.player.hp;
      a.game.paused = false; a.update(0.5); a.queueAction('punch');
      out.combatFrozen = a.game.roundTime === time && a.player.hp === hp && !a.player.atk;
      a.updateFlow(20);
      out.waitsForPlayer = a.game.state === 'victory' && a.game.round === 1;
      a.pauseGame(); const t = a.game.t;
      a.update(0.5); a.finishVictory();
      out.pauseFreezesScene = a.game.t === t && a.game.state === 'victory' && a.game.paused;
      a.resumeGame(); a.finishVictory(); a.finishVictory();
      out.nextRoundExactlyOnce = a.game.round === 2 && a.game.state === 'intro' &&
        panel.hidden && a.game.victory === null && a.game.bestCombo === 0;
      setup(3); a.dummy.hp = 1;
      a.applyHit(a.dummy, a.player, a.MOVES.cpunch, a.dummy.x, 180);
      out.carDoesNotCelebrateEarly = a.game.state === 'transform' && panel.hidden;
      a.completeR8Transform(); a.dummy.invuln = 0; a.dummy.hp = 1;
      a.applyHit(a.dummy, a.player, a.MOVES.jab, a.dummy.x, 140);
      a.updateFlow(1.2);
      out.robotVictory = a.game.state === 'victory' &&
        document.querySelector('#victoryOpponent').textContent === 'GOLDLINE DEFEATED';
      a.restartGame();
      out.restartClearsScene = a.game.round === 1 && a.game.state === 'intro' && panel.hidden &&
        !document.querySelector('#screen').classList.contains('is-victory') && a.game.victory === null;
      setup(); a.endRound(a.dummy); a.updateFlow(3.1);
      out.lossKeepsMiMi = a.game.state === 'roast' && panel.hidden &&
        !document.querySelector('#roastModal').hidden;
      for (const round of [1, 2, 3, 4]) {
        setup(round);
        if (round === 3) a.completeR8Transform();
        if (round === 4) { a.dummy.tiny = true; a.dummy.teddyScale = 0.34; }
        a.player.hp = 0;
        a.player.teleportCooldown = 7;
        a.endRound(a.dummy); a.updateFlow(3.1);
        a.finishRoast(); a.finishRoast();
        out['lossRetriesSameLevel' + round] = a.game.round === round &&
          a.game.state === 'intro' && !a.game.paused && a.player.hp === a.player.maxHp &&
          a.dummy.hp === a.dummy.maxHp && !a.player.teleportCooldown &&
          (round !== 3 || (a.dummy.form === 'car' && a.dummy.robotMaxHp === 140)) &&
          (round !== 4 || (!a.dummy.tiny && !a.dummy.shrinkUsed));
        setup(round); a.player.hp = 1; a.game.roundTime = 0.01;
        a.updateFlow(0.02); a.updateFlow(3.1); a.finishRoast();
        out['timeoutRetriesSameLevel' + round] = a.game.round === round && a.game.state === 'intro';
      }
      setup();
    } finally { a.Sfx.play = play; }
    return out;
  });
  for (const [name, passed] of Object.entries(results)) check(passed, `Victory: ${name}`);
  await page.evaluate(() => {
    INJ.game.round = 0; INJ.resetRound(); INJ.game.state = 'fight'; INJ.game.paused = false;
    INJ.player.hp = 83; INJ.game.bestCombo = 7; INJ.endRound(INJ.player); INJ.updateFlow(1.2);
    INJ.game.paused = true; INJ.game.t = 1; INJ.render(0);
  });
  for (const [width, height] of [[320, 568], [390, 844], [667, 375], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const fits = await page.evaluate(() => {
      const arena = document.querySelector('#screen').getBoundingClientRect();
      const parts = [...document.querySelectorAll('.victory-copy, .victory-copy h2, .victory-stats, #btnNextRound')];
      const button = document.querySelector('#btnNextRound').getBoundingClientRect();
      const menu = document.querySelector('#btnArenaMenu').getBoundingClientRect();
      return parts.every(el => {
        const r = el.getBoundingClientRect();
        return r.top >= arena.top && r.bottom <= arena.bottom && r.left >= arena.left &&
          r.right <= arena.right && el.scrollWidth <= el.clientWidth + 1;
      }) && button.width >= 44 && button.height >= 44 &&
        !(button.left < menu.right && button.right > menu.left && button.top < menu.bottom && button.bottom > menu.top);
    });
    check(fits, `Victory: ${width}×${height} scene fits with separated accessible controls`);
    if ([320, 390, 844].includes(width))
      await page.screenshot({ path: require('node:path').join(root, `artifacts/victory-${width}.png`) });
  }
  await page.evaluate(() => { INJ.game.paused = false; });
  await page.locator('#btnNextRound').tap();
  check(await page.evaluate(() => INJ.game.round === 2 && INJ.game.state === 'intro' &&
    document.querySelector('#victoryPanel').hidden), 'Victory: Next Round touch resumes progression');
  await page.evaluate(() => {
    INJ.game.round = 0; INJ.resetRound(); INJ.game.state = 'fight';
    INJ.endRound(INJ.player); INJ.updateFlow(1.2);
  });
  await page.keyboard.press('Enter');
  check(await page.evaluate(() => INJ.game.round === 2 && INJ.game.state === 'intro'),
    'Victory: keyboard continues exactly one round');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { INJ.game.round = 0; INJ.resetRound(); INJ.game.state = 'fight';
    INJ.game.paused = true; INJ.game.msg = null; });
};
