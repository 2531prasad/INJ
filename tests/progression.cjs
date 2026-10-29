/* Real reloads exercise the versioned save, checkpoints and earned unlock. */
const path = require('node:path');
const { pathToFileURL } = require('node:url');
module.exports = async function verifyProgression(page, check, root, { artifacts = false } = {}) {
  const original = page.url();
  await page.evaluate(() => localStorage.removeItem(INJ.SAVE_KEY));
  await page.reload();
  check(await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem(INJ.SAVE_KEY));
    return p.version === 1 && p.checkpointLevel === 1 && !p.unlocks.colossusBurst && !p.wins && !p.losses;
  }), 'Save: fresh profile uses versioned defaults');
  await page.evaluate(() => {
    INJ.game.state = 'fight'; INJ.game.paused = true;
    INJ.game.bestCombo = 7; INJ.dummy.hp = 1;
    INJ.applyHit(INJ.dummy, INJ.player, INJ.MOVES.jab, 300, 150);
    INJ.endRound(INJ.player);
  });
  check(await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem(INJ.SAVE_KEY));
    return p.wins === 1 && p.checkpointLevel === 2 && p.bestCombo === 7 && p.clearedLevels.join() === '1';
  }), 'Save: KO saves results once and checkpoints the next stage');
  await page.reload();
  check(await page.evaluate(() => INJ.game.round === 2 && INJ.game.paused && !INJ.game.started &&
    INJ.player.hp === 120 && INJ.player.meter === 0 && INJ.game.state === 'intro' && InjAudio.ctx === null),
    'Save: reload resumes fresh stage behind profile, without autoplay');
  await page.evaluate(() => {
    INJ.game.round = 2; INJ.resetRound(); INJ.game.state = 'fight';
    INJ.player.hp = 1;
    INJ.applyHit(INJ.player, INJ.dummy, INJ.MOVES.jab, 160, 150);
  });
  await page.reload();
  check(await page.evaluate(() => INJ.game.round === 3 && INJ.dummy.form === 'car' &&
    INJ.progress.losses === 1 && INJ.progress.wins === 1 && INJ.player.hp === 120),
    'Save: loss retries its encounter after reload, retaining totals');
  await page.locator('#btnStartFight').tap();
  await page.locator('#btnArenaMenu').tap();
  await page.locator('#cheatCode').fill('INJ0');
  await page.locator('#cheatLevel').selectOption('5');
  await page.locator('#btnCheatLevel').tap();
  check(await page.evaluate(() => INJ.game.round === 5 && !INJ.progress.unlocks.colossusBurst),
    'Save: selecting the boss through cheats never awards the passive');
  await page.evaluate(() => {
    INJ.stepGiantIntro(4.8); INJ.game.paused = true;
    INJ.summonGiantMinion(INJ.dummy);
    const m = INJ.giantEncounter.minion;
    m.invuln = 0; m.hp = 1;
    INJ.applyHit(m, INJ.player, INJ.MOVES.jab, m.x, 150);
  });
  check(await page.evaluate(() => INJ.game.state === 'fight' && !INJ.progress.unlocks.colossusBurst &&
    !INJ.progress.clearedLevels.includes(5)), 'Save: echo KO never earns the boss reward');
  await page.evaluate(() => {
    INJ.dummy.hp = 1;
    INJ.applyHit(INJ.dummy, INJ.player, INJ.MOVES.jab, INJ.dummy.x, 150);
  });
  check(await page.evaluate(() => INJ.game.victory.newUnlock && INJ.progress.unlocks.colossusBurst &&
    JSON.parse(localStorage.getItem(INJ.SAVE_KEY)).unlocks.colossusBurst),
    'Save: genuine Colossus KO persists unlock before the victory scene');
  await page.evaluate(() => INJ.updateFlow(1.2));
  check(await page.locator('#victoryUnlock').isVisible(), 'Save: first unlock is announced in victory');
  for (const [width, height] of [[320, 568], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    check(await page.locator('.victory-copy').evaluate(el => {
      const b = el.getBoundingClientRect(), n = document.querySelector('#btnNextRound').getBoundingClientRect();
      const arena = document.querySelector('#screen').getBoundingClientRect();
      return b.left >= 0 && b.right <= innerWidth && b.top >= 0 && b.bottom <= innerHeight &&
        b.top >= arena.top && b.bottom <= arena.bottom && n.height >= 44 && n.bottom <= arena.bottom - 3;
    }), `Save: ${width}px first-unlock victory fits with reachable Next round`);
    if (artifacts) await page.screenshot({ path: path.join(root, `artifacts/burst-unlock-${width}.png`) });
  }
  await page.evaluate(() => { INJ.game.paused = false; INJ.clock.last = performance.now(); });
  await page.locator('#btnNextRound').tap();
  check(await page.evaluate(() => INJ.game.round === 6 && INJ.game.state === 'enlarge' &&
    INJ.progress.unlocks.colossusBurst), 'Save: first-unlock Next round remains tappable and preserves the reward');
  await page.reload();
  check(await page.evaluate(() => INJ.progress.unlocks.colossusBurst && INJ.game.round === 5 &&
    INJ.game.state === 'enlarge' && INJ.game.paused && INJ.dummy.hp === 1200),
    'Save: unlock survives reload and boss replay keeps its enlargement');
  await page.locator('#btnStartFight').tap();
  await page.locator('#btnArenaMenu').tap();
  check(await page.locator('#passiveStatus').isVisible(), 'Save: pause menu reflects the persisted passive');
  if (artifacts) await page.screenshot({ path: path.join(root, 'artifacts/burst-pause-unlocked.png') });
  await page.locator('#btnRestart').tap();
  await page.reload();
  check(await page.evaluate(() => INJ.game.round === 1 && INJ.progress.unlocks.colossusBurst),
    'Save: restart returns to level one without deleting earned unlocks');
  // The earned character passive must really activate on old stages, not only retain a save bit.
  await page.locator('#btnStartFight').tap();
  for (const level of [1, 2, 3, 4]) {
    await page.locator('#btnArenaMenu').tap();
    await page.locator('#cheatCode').fill('INJ0');
    await page.locator('#cheatLevel').selectOption(String(level));
    await page.locator('#btnCheatLevel').tap();
    check(await page.evaluate(() => {
      INJ.game.state = 'fight'; INJ.game.paused = true; INJ.game.msg = null;
      INJ.player.x = 120; INJ.dummy.x = 190; INJ.player.invuln = 0;
      INJ.applyHit(INJ.player, INJ.dummy, { ...INJ.MOVES.jab, dmg: 30 }, 120, 150);
      const ready = document.querySelector('#passiveHud').dataset.state === 'ready';
      INJ.stepPassive(0.1);
      return INJ.progress.unlocks.colossusBurst && ready && INJ.dummy.burstStun === 1;
    }), `Save: earned shield actually charges and stuns after real menu travel to level ${level}`);
  }
  await page.reload();
  check(await page.evaluate(() => INJ.game.round === 4 && INJ.progress.unlocks.colossusBurst &&
    !document.querySelector('#passiveHud').hidden && INJ.player.burstDamage === 0),
    'Save: reloading an earlier saved level restores the permanent shield with fresh charge');
  await page.evaluate(() => localStorage.setItem(INJ.SAVE_KEY, '{broken'));
  await page.reload();
  check(await page.evaluate(() => INJ.game.round === 1 && !INJ.progress.unlocks.colossusBurst &&
    JSON.parse(localStorage.getItem(INJ.SAVE_KEY)).version === 1), 'Save: corrupt JSON recovers without startup failure');
  await page.evaluate(() => localStorage.setItem(INJ.SAVE_KEY, JSON.stringify({
    version: 1, checkpointLevel: 90, highestLevel: -2, wins: -1, losses: '8', bestCombo: null,
    clearedLevels: [1, 1, 3, '2', -1, 8], unlocks: { colossusBurst: 'true' }
  })));
  await page.reload();
  check(await page.evaluate(() => INJ.game.round === 5 && INJ.progress.highestLevel === 5 &&
    INJ.progress.clearedLevels.join() === '1,3' && !INJ.progress.wins && !INJ.progress.losses &&
    !INJ.progress.unlocks.colossusBurst), 'Save: malformed fields are bounded and typed, not trusted');
  const future = JSON.stringify({ version: 99, checkpointLevel: 4, extra: 'keep me' });
  await page.evaluate(value => localStorage.setItem(INJ.SAVE_KEY, value), future);
  await page.reload();
  check(await page.evaluate(value => localStorage.getItem(INJ.SAVE_KEY) === value && INJ.game.round === 1, future),
    'Save: unknown future schema is preserved without being overwritten');
  // Chromium direct-file storage is verified separately from the HTTP origin.
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
  await page.waitForFunction(() => window.INJ?.progress);
  await page.evaluate(() => {
    localStorage.removeItem(INJ.SAVE_KEY);
  });
  await page.reload();
  await page.waitForFunction(() => window.INJ?.resetRound);
  await page.evaluate(() => {
    INJ.game.round = 4; INJ.resetRound(); INJ.stepGiantIntro(4.8);
    INJ.dummy.hp = 1; INJ.applyHit(INJ.dummy, INJ.player, INJ.MOVES.jab, 300, 150);
  });
  await page.reload();
  check(await page.evaluate(() => INJ.progress.unlocks.colossusBurst && INJ.game.round === 5),
    'Save: direct-file Colossus reward survives an actual reload in Chromium');
  await page.goto(original);
  await page.addInitScript(() => {
    for (const name of ['getItem', 'setItem']) Object.defineProperty(Storage.prototype, name, {
      value() { throw new Error('Storage unavailable for regression test'); }
    });
  });
  await page.reload();
  await page.waitForFunction(() => window.INJ?.resetRound);
  check(await page.evaluate(() => {
    INJ.game.round = 4; INJ.resetRound(); INJ.stepGiantIntro(4.8);
    INJ.dummy.hp = 1; INJ.applyHit(INJ.dummy, INJ.player, INJ.MOVES.jab, 300, 150);
    return INJ.progress.unlocks.colossusBurst && INJ.game.state === 'ko';
  }), 'Save: unavailable storage falls back to working session progression');
};
