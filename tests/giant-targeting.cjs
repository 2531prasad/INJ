/* Shared focused boss targeting checks; standalone command delegates to the runner. */
module.exports = async function verifyTargeting(page, check) {
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
    m.facing = 1;
    a.dummy.facing = -1;
    a.startTeleport(a.player);
    a.controlPlayer(a.player, a.dummy, 0.47);
    out.blinkGoesBehindCurrentEcho = a.player.x < m.x && a.player.teleport === null;
    m = setup();
    m.x = 160;
    m.facing = 1;
    a.startTeleport(a.player);
    a.controlPlayer(a.player, a.dummy, 0.1);
    a.dummy.x = 205;
    a.controlPlayer(a.player, a.dummy, 0.37);
    out.blinkKeepsChosenTargetThroughDisappearance = a.player.x < m.x;
    m = setup();
    m.x = 450;
    a.dummy.facing = -1;
    a.startTeleport(a.player);
    a.controlPlayer(a.player, a.dummy, 0.47);
    out.blinkTargetsBossWhenBossIsCloser = a.player.x > a.dummy.x;
    m = setup();
    m.x = 160;
    a.dummy.facing = -1;
    a.startTeleport(a.player);
    a.defeatGiantMinion(m);
    a.controlPlayer(a.player, a.dummy, 0.47);
    out.blinkReacquiresBossIfEchoExpires = a.player.x > a.dummy.x;
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
  for (const [name, passed] of Object.entries(checks)) check(passed, name);
};
if (require.main === module) {
  const { spawnSync } = require('node:child_process');
  const result = spawnSync(process.execPath, [require('node:path').join(__dirname, 'browser.cjs'), '--suite', 'targeting'], { stdio: 'inherit' });
  process.exitCode = result.status ?? 1;
}
