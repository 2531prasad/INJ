/* Untouched HTTP and direct-file startup, local art and all five level resets. */
module.exports = async function verifySmoke(page, check, root, { harness }) {
  for (const [mode, url] of [['HTTP', harness.url], ['file', harness.fileUrl]]) {
    const session = await harness.page({ url });
    try {
      const p = session.page;
      check(await p.evaluate(() => !window.__test && INJ.game.paused && InjAudio.ctx === null), mode + ': production startup without hooks/autoplay');
      await p.locator('#btnStartFight').tap();
      await p.locator('#btnArenaMenu').tap();
      check(await p.locator('#cheatCode').isVisible(), mode + ': production menu exposes cheat input');
      await p.locator('#cheatCode').fill('INJ0');
      check(await p.locator('#cheatLevel').isVisible(), mode + ': production cheat unlock');
      for (let level = 1; level <= 5; level++) {
        await p.locator('#cheatLevel').selectOption(String(level));
        await p.locator('#btnCheatLevel').tap();
        check(await p.evaluate((level) => INJ.game.round === level && INJ.player.hp === INJ.player.maxHp &&
          INJ.dummy.hp === INJ.dummy.maxHp && !INJ.game.paused &&
          INJ.arenaStage().id === ['training', 'awakened', 'goldline', 'velvet', 'giants'][level - 1], level),
          mode + ': starts level ' + level + ' with fresh health and correct stage');
        await p.locator('#btnArenaMenu').tap();
      }
      check(session.errors.length === 0, mode + ': no production runtime/asset errors: ' + session.errors.join('; '));
    } finally { await session.close(); }
  }
};
