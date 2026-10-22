/* Cheat unlock, native text/select keys, clean stage switches and phone dialog geometry. */
const path = require('node:path');
module.exports = async function verifyMenus(page, check, root, { artifacts }) {
  await page.locator('#btnStartFight').tap();
  await page.locator('#btnArenaMenu').tap();
  check(await page.locator('#cheatLevels').isHidden(), 'Level selector starts locked');
  const before = await page.evaluate(() => ({ round: INJ.game.round, muted: InjAudio.muted }));
  await page.locator('#cheatCode').pressSequentially('MJK');
  await page.keyboard.press('Enter');
  check(await page.evaluate(before => INJ.game.paused && INJ.game.round === before.round &&
    InjAudio.muted === before.muted && !INJ.player.atk && document.querySelector('#cheatLevels').hidden &&
    document.querySelector('#cheatStatus').textContent === 'Code not recognised', before), 'Typing cheat text cannot mute, attack, resume or change level');
  await page.keyboard.press('Tab');
  check(await page.evaluate(() => document.activeElement.id === 'btnResume'), 'Locked menu traps Tab after text input');
  await page.keyboard.press('Shift+Tab');
  check(await page.evaluate(() => document.activeElement.id === 'cheatCode'), 'Reverse Tab reaches text input');
  await page.locator('#cheatCode').fill('');
  await page.locator('#cheatCode').pressSequentially('INJ0');
  check(await page.locator('#cheatLevel').isVisible() && await page.locator('#cheatStatus').innerText() === 'Level select unlocked', 'Typing INJ0 reveals selector immediately');
  await page.locator('#btnCheatLevel').focus();
  await page.keyboard.press('Tab');
  check(await page.evaluate(() => document.activeElement.id === 'btnResume'), 'Unlocked menu traps Tab after Start level');
  await page.keyboard.press('Shift+Tab');
  check(await page.evaluate(() => document.activeElement.id === 'btnCheatLevel'), 'Reverse Tab reaches Start level');
  await page.locator('#cheatLevel').focus();
  await page.keyboard.press('ArrowDown');
  check(await page.evaluate(() => document.activeElement.id === 'cheatLevel' && INJ.game.paused &&
    !Object.values(INJ.input).some(Boolean)), 'Native select arrows never feed movement');
  for (const [width, height] of [[320, 568], [390, 844], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await page.waitForFunction(() => Math.abs(document.querySelector('#screen').getBoundingClientRect().width -
      document.querySelector('.wrap').clientWidth) < 30);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    check(await page.locator('.pause-panel').evaluate(panel => {
      const r = panel.getBoundingClientRect();
      return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight &&
        panel.scrollWidth <= panel.clientWidth;
    }), `${width}px: menu fits viewport without horizontal overflow`);
    check(await page.locator('.cheat-controls').evaluate(form => [...form.querySelectorAll('input,select,button')].every(el =>
      el.getBoundingClientRect().height >= 44)), `${width}px: cheat controls have 44px touch targets`);
    if (artifacts) await page.screenshot({ path: path.join(root, `artifacts/cheat-menu-${width}.png`) });
  }
  await page.locator('#cheatCode').focus();
  await page.keyboard.press('Escape');
  check(await page.locator('#pauseOverlay').isHidden(), 'Escape from text input resumes');
  await page.locator('#btnArenaMenu').tap();
  check(await page.locator('#cheatLevel').isVisible(), 'Unlock survives closing/reopening menu');
  await page.locator('#cheatLevel').selectOption('5');
  await page.locator('#btnCheatLevel').tap();
  check(await page.evaluate(() => INJ.game.state === 'enlarge' && INJ.game.round === 5 && INJ.dummy.hp === 1200 &&
    INJ.player.teleportCooldown === 0 && INJ.player.meter === 0 && document.querySelector('#pauseOverlay').hidden),
    'Boss selection starts protected reveal with fresh 1200 HP and reset resources');
  await page.evaluate(() => {
    INJ.stepGiantIntro(4.8);
    INJ.summonGiantMinion(INJ.dummy);
    INJ.giantEncounter.hazards.push({ type: 'wave', x: 300, y: INJ.GROUND, vx: 0, life: 5, t: 0, move: INJ.MOVES.colossusStomp });
    INJ.player.hp = 9;
    INJ.player.teleportCooldown = 8;
    INJ.pauseGame();
  });
  await page.locator('#cheatLevel').selectOption('1');
  await page.locator('#btnCheatLevel').tap();
  check(await page.evaluate(() => INJ.game.round === 1 && INJ.game.state === 'intro' && INJ.player.hp === 120 &&
    INJ.player.teleportCooldown === 0 && !INJ.giantEncounter.minion && !INJ.giantEncounter.hazards.length &&
    !INJ.game.victory && INJ.projectiles.length === 0), 'Switching away clears boss/summon/hazards and restores health');
  await page.locator('#btnArenaMenu').tap();
  await page.locator('#btnRestart').tap();
  check(await page.evaluate(() => INJ.game.round === 1 && !INJ.game.paused), 'Normal restart still returns to round one');
  await page.reload();
  await page.locator('#btnStartFight').tap();
  await page.locator('#btnArenaMenu').tap();
  check(await page.locator('#cheatLevels').isHidden(), 'Cheat unlock resets on page reload');
};
