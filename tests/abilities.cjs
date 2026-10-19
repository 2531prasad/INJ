/* Combo damage, meter abilities and aerial input integration. */
module.exports = async function verifyAbilities(page, check, root) {
  const results = await page.evaluate(() => {
    const a = INJ, out = {};
    function setup() {
      a.game.round = 0;
      a.resetRound();
      a.game.state = 'fight';
      a.game.paused = true;
      a.game.msg = null;
      a.player.x = 140;
      a.dummy.x = 205;
    }
    setup();
    const damage = [];
    for (let i = 0; i < 5; i++) {
      const before = a.dummy.hp;
      a.applyHit(a.dummy, a.player, { ...a.MOVES.jab, dmg: 10 }, 200, 140);
      damage.push(before - a.dummy.hp);
    }
    out.comboDamage = damage.join(',') === '10,11,12,13,14' && a.game.hits === 5;
    out.meterEarned = a.player.meter === 100;
    a.render(0);
    a.applyHit(a.player, a.dummy, a.MOVES.jab, 140, 140);
    out.hitBreaksCombo = a.game.hits === 0 && a.game.hitTimer === 0;
    setup();
    a.applyHit(a.dummy, a.player, a.MOVES.jab, 200, 140);
    a.dummy.state = 'block';
    a.applyHit(a.dummy, a.player, a.MOVES.jab, 200, 140);
    out.blockBreaksCombo = a.game.hits === 0;
    setup();
    a.applyHit(a.dummy, a.player, a.MOVES.jab, 200, 140);
    a.dummy.x = a.world.width - 40;
    a.startAttack(a.player, 'jab');
    a.stepAttack(a.player, 0.3, a.dummy);
    out.whiffBreaksCombo = a.game.hits === 0;
    setup();
    a.applyHit(a.dummy, a.player, a.MOVES.jab, 200, 140);
    a.updateFlow(1.41);
    a.applyHit(a.dummy, a.player, { ...a.MOVES.jab, dmg: 10 }, 200, 140);
    out.timeoutResetsMultiplier = a.game.hits === 1 && a.dummy.hp === 115;
    const hits = a.game.hits;
    a.dummy.invuln = 1;
    a.applyHit(a.dummy, a.player, a.MOVES.jab, 200, 140);
    out.invulnerableHitsDoNotCount = a.game.hits === hits;
    setup();
    a.input.down = a.input.right = 1;
    a.pressBuf.kick = performance.now() + 220;
    a.controlPlayer(a.player, a.dummy, 0);
    const start = a.player.x;
    a.controlPlayer(a.player, a.dummy, 0.1);
    out.slideInputAndTravel = a.player.atk?.key === 'slide' && a.player.x > start;
    for (const stance of ['standing', 'crouching', 'airborne']) {
      setup();
      a.player.meter = 100;
      a.input.down = +(stance === 'crouching');
      if (stance === 'airborne') {
        a.player.grounded = false;
        a.player.y -= 45;
        a.player.vy = -80;
      }
      const initialX = a.player.x;
      a.pressBuf.nitro = performance.now() + 220;
      a.controlPlayer(a.player, a.dummy, 0);
      const x = a.player.x, y = a.player.y;
      const initial = a.player.atk?.key === 'nitrokick' && a.player.meter === 0 && a.player.x === initialX;
      a.controlPlayer(a.player, a.dummy, 0.13);
      out[stance + 'Nitro'] = initial && a.player.x > x &&
        (stance !== 'crouching' || a.player.atk.low) &&
        (stance !== 'airborne' || a.player.y !== y);
      const hp = a.dummy.hp;
      a.tryHit(a.player, a.dummy);
      out[stance + 'NitroHitsOnce'] = a.dummy.hp === hp && hp < a.dummy.maxHp;
    }
    setup();
    a.player.meter = 99;
    a.game.paused = false;
    a.queueAction('nitro');
    a.game.paused = true;
    a.startAttack(a.player, 'nitrokick');
    out.insufficientMeter = !a.player.atk && a.player.meter === 99 && !a.pressBuf.nitro;
    setup();
    a.player.grounded = false;
    a.player.y -= 40;
    a.pressBuf.special = performance.now() + 220;
    a.controlPlayer(a.player, a.dummy, 0);
    a.controlPlayer(a.player, a.dummy, 0.11);
    out.airShadowInput = a.player.atk?.key === 'toss' && a.projectiles.length === 1 &&
      a.projectiles[0].vy > 0;
    for (let i = 0; i < 100 && a.dummy.hp === a.dummy.maxHp; i++) a.updateProjectiles(1 / 120);
    out.airShadowConnects = a.dummy.hp < a.dummy.maxHp;
    setup();
    a.player.meter = 100;
    a.player.charge = 3;
    a.startAttack(a.player, 'nitrokick');
    out.independentResources = a.player.meter === 0 && a.player.charge === 3;
    a.player.meter = 100;
    a.restartGame();
    out.restartClearsMeter = a.player.meter === 0 && a.game.hits === 0;
    a.game.paused = true;
    return out;
  });
  for (const [name, passed] of Object.entries(results)) check(passed, `Abilities: ${name}`);
  await page.evaluate(() => {
    INJ.game.round = 0; INJ.resetRound(); INJ.game.state = 'fight';
    INJ.game.paused = false; INJ.game.msg = null; INJ.dummy.aiT = 999;
    INJ.player.meter = 100; INJ.updateChargeUI();
  });
  await page.locator('[data-act="nitro"]').tap();
  check(await page.evaluate(() => INJ.player.atk?.key === 'nitrokick' && INJ.player.meter < 100),
    'Abilities: real touch starts Nitro and spends the bar');
  await page.evaluate(() => {
    INJ.player.atk = null; INJ.player.state = 'idle'; INJ.player.meter = 100;
    INJ.updateChargeUI();
  });
  await page.keyboard.press('q');
  check(await page.evaluate(() => INJ.player.atk?.key === 'nitrokick' && INJ.player.meter < 100),
    'Abilities: Q starts Nitro and spends the bar');
  await page.evaluate(() => {
    INJ.game.state = 'fight'; INJ.game.msg = null; INJ.game.paused = true;
    INJ.player.atk = null; INJ.player.state = 'idle';
    INJ.player.meter = 100; INJ.game.hits = 5; INJ.game.hitTimer = 1;
    INJ.updateChargeUI(); INJ.render(0);
  });
  await page.screenshot({ path: require('node:path').join(root, 'artifacts/combo-nitro-phone.png') });
  await page.evaluate(() => {
    INJ.startAttack(INJ.player, 'nitrokick'); INJ.player.atk.t = 0.16; INJ.render(0);
  });
  await page.screenshot({ path: require('node:path').join(root, 'artifacts/nitro-kick-phone.png') });
  await page.evaluate(() => { INJ.game.round = 0; INJ.resetRound(); INJ.game.paused = true; });
};
