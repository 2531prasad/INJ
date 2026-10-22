/* Quick boss targeting regression: no full suite, screenshots or balance simulation. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
let pw;
try { pw = require(process.env.INJ_PLAYWRIGHT || 'playwright'); }
catch (_) { pw = require(path.join(process.env.HOME, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core')); }
const root = path.resolve(__dirname, '..');
let browser;
(async () => {
  // Direct-file startup keeps this focused runner independent of server ports.
  const chrome = process.env.INJ_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser = await pw.chromium.launch({ headless: true, ...(fs.existsSync(chrome) ? { executablePath: chrome } : {}) });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(require('node:url').pathToFileURL(path.join(root, 'index.html')).href);
  await page.waitForFunction(() => window.INJ?.teddySheets.giant.ready);
  const checks = await page.evaluate(() => {
    const a = INJ, out = {};
    a.Sfx.play = () => {};
    function setup() {
      a.game.round = 4;
      a.resetRound();
      a.stepGiantIntro(4.8);
      a.game.paused = false;
      a.player.x = 200;
      a.player.facing = 1;
      a.dummy.x = 285;
      a.summonGiantMinion(a.dummy);
      const m = a.giantEncounter.minion;
      Object.assign(m, { x: 235, invuln: 0, spawnT: 1 });
      return m;
    }
    function jab() {
      a.startAttack(a.player, 'jab');
      a.stepAttack(a.player, 0.05, a.dummy);
    }
    let m = setup();
    out.bossHP1200 = a.dummy.hp === 1200 && a.dummy.maxHp === 1200;
    jab();
    out.overlapHitsEchoOnly = m.hp < 40 && a.dummy.hp === 1200;
    const hp = m.hp;
    a.stepAttack(a.player, 0.01, a.dummy);
    out.sameSwingCannotHitTwice = m.hp === hp && a.dummy.hp === 1200;
    for (const state of ['invulnerable', 'knockdown', 'materializing']) {
      m = setup();
      if (state === 'knockdown') m.state = 'knockdown';
      else m.invuln = 0.3;
      if (state === 'materializing') m.spawnT = 0;
      jab();
      out[`${state}EchoDoesNotExposeBoss`] = m.hp === 40 && a.dummy.hp === 1200;
    }
    m = setup();
    m.x = 160;
    a.queueAction('punch');
    a.controlPlayer(a.player, a.dummy, 0.001);
    out.facesNearestEchoBeforeAttack = a.player.facing === -1 && !!a.player.atk;
    a.stepAttack(a.player, 0.05, a.dummy);
    out.hitsEchoOnOppositeSideOfBoss = m.hp < 40 && a.dummy.hp === 1200;
    m = setup();
    m.x = 450;
    a.controlPlayer(a.player, a.dummy, 0.001);
    out.nearerBossRemainsTarget = a.playerTarget() === a.dummy && a.player.facing === 1;
    m = setup();
    m.x = 160;
    a.queueAction('special');
    a.controlPlayer(a.player, a.dummy, 0.001);
    a.stepAttack(a.player, 0.2, a.playerTarget());
    out.shadowAimsAtCloserEcho = a.projectiles[0]?.vx < 0;
    for (const protectedEcho of [false, true]) {
      m = setup();
      if (protectedEcho) m.invuln = 0.3;
      a.projectiles.push({ x: 235, y: 140, vx: 0, life: 1, owner: a.player });
      a.updateProjectiles(0.01);
      out[protectedEcho ? 'protectedEchoInterceptsShadow' : 'shadowHitsEchoOnly'] =
        a.dummy.hp === 1200 && a.projectiles.length === 0 && (protectedEcho ? m.hp === 40 : m.hp < 40);
    }
    m = setup();
    a.applyHit(m, a.player, a.MOVES.jab, m.x, 140);
    a.applyHit(a.dummy, a.player, a.MOVES.jab, a.dummy.x, 140);
    out.switchingTargetResetsCombo = a.game.hits === 1 && a.dummy.hp === 1200 - a.MOVES.jab.dmg;
    a.applyHit(a.dummy, a.player, a.MOVES.jab, a.dummy.x, 140);
    out.sameTargetStillScalesCombo = a.game.hits === 2 &&
      a.dummy.hp === 1200 - a.MOVES.jab.dmg - Math.round(a.MOVES.jab.dmg * 1.1);
    m = setup();
    m.x = 160;
    a.dummy.facing = -1;
    a.startTeleport(a.player);
    a.controlPlayer(a.player, a.dummy, 0.47);
    out.blinkStillGoesBehindBoss = a.player.x > a.dummy.x && a.player.teleport === null;
    a.resetRound({ advance: false });
    out.retryResetsHPAndComboTarget = a.dummy.hp === 1200 && a.game.comboTarget === null;
    a.stepGiantIntro(4.8);
    a.dummy.x = a.player.x + 80;
    a.startAttack(a.dummy, 'colossusSmash');
    const attack = a.dummy.atk;
    a.applyHit(a.dummy, a.player, a.MOVES.sweep, a.dummy.x, 180);
    out.bossRetainsPoise = a.dummy.atk === attack && a.dummy.hitstun === 0 && a.game.roundTime === null;
    a.render(0);
    a.game.paused = true;
    return out;
  });
  for (const [name, passed] of Object.entries(checks)) {
    assert.ok(passed, name);
    console.log('PASS', name);
  }
  assert.deepEqual(errors, [], 'No production runtime errors');
  console.log(`Passed ${Object.keys(checks).length + 1} focused Chromium checks.`);
})().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
});
