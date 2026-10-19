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
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = a.cv.width; spriteCanvas.height = a.cv.height;
    const capture = spriteCanvas.getContext('2d', { willReadFrequently: true });
    capture.setTransform(a.RENDER_SCALE, 0, 0, a.RENDER_SCALE, 0, 0);
    const spritePixels = (fighter) => {
      const liveContext = a.ctx;
      try {
        a.ctx = capture;
        capture.clearRect(0, 0, a.world.width, a.H);
        capture.save();
        capture.translate(a.world.width / 2, a.GROUND);
        a.drawSpriteFrame(fighter, 8);
        capture.restore();
        return capture.getImageData(0, 0, spriteCanvas.width, spriteCanvas.height).data;
      } finally { a.ctx = liveContext; }
    };
    const originalPixels = spritePixels({ ...a.player, atk: null });
    a.player.meter = 100; a.startAttack(a.player, 'nitrokick');
    a.player.atk.t = 0.1;
    const greenPixels = spritePixels(a.player);
    let red = 0, green = 0, blue = 0, count = 0;
    for (let i = 0; i < greenPixels.length; i += 4) {
      if (greenPixels[i + 3] > 200) {
        red += greenPixels[i]; green += greenPixels[i + 1]; blue += greenPixels[i + 2]; count++;
      }
    }
    out.nitroSpriteTurnsGreen = count > 100 && green > red * 1.5 && green > blue * 1.5;
    // Compare native alpha: Canvas and PNG sources can use different scaled edge filters.
    const sheet = a.spriteSheets.inj, frame = sheet.meta.frames[8];
    const native = document.createElement('canvas');
    native.width = frame.w; native.height = frame.h;
    const mask = native.getContext('2d', { willReadFrequently: true });
    const nativePixels = image => {
      mask.clearRect(0, 0, frame.w, frame.h);
      mask.drawImage(image, frame.x, frame.y, frame.w, frame.h, 0, 0, frame.w, frame.h);
      return mask.getImageData(0, 0, frame.w, frame.h).data;
    };
    const sourceMask = nativePixels(sheet.image), greenMask = nativePixels(sheet.nitroImage);
    out.greenTintPreservesSilhouette = greenMask.every((value, i) => i % 4 !== 3 || value === sourceMask[i]);
    a.player.atk = null;
    const restored = spritePixels(a.player);
    let difference = 0, samples = 0;
    for (let i = 0; i < restored.length; i += 4) {
      if (originalPixels[i + 3] > 200 && restored[i + 3] > 200) {
        for (let channel = 0; channel < 3; channel++) difference += Math.abs(restored[i + channel] - originalPixels[i + channel]);
        samples += 3;
      }
    }
    out.nitroTintDoesNotLeak = samples > 0 && difference / samples < 2;
    const reduced = a.reducedMotion;
    try {
      a.reducedMotion = true;
      a.player.meter = 100; a.startAttack(a.player, 'nitrokick');
      out.reducedMotionKeepsGreen = spritePixels(a.player).some((value, i) => value !== originalPixels[i]);
    } finally { a.reducedMotion = reduced; }
    setup();
    a.player.meter = 99;
    a.updateChargeUI();
    const nitroButton = document.querySelector('[data-act="nitro"]');
    out.nitroHiddenUntilFull = nitroButton.hidden && nitroButton.getClientRects().length === 0;
    a.player.meter = 100;
    a.player.charge = 3;
    a.updateChargeUI();
    out.readyKeepsIcons = !nitroButton.hidden &&
      document.querySelector('[data-act="special"] svg') &&
      document.querySelector('[data-act="special"] .button-label').textContent === 'SHADOW +';
    setup();
    a.player.meter = 100;
    a.startAttack(a.player, 'nitrokick');
    const frames = [0.01, 0.04, 0.1, 0.29, 0.42].map((time) => {
      a.player.atk.t = time;
      return a.sampleFighterAnimation(a.player).frame;
    });
    out.phasePoseSequence = frames.join(',') === '2,8,8,2,0';
    out.fastPhaseTiming = a.player.atk.def.startup <= 0.06 &&
      a.player.atk.def.startup + a.player.atk.def.active + a.player.atk.def.recovery < 0.5;
    function travel(step) {
      setup(); a.player.meter = 100; a.startAttack(a.player, 'nitrokick');
      for (let i = 0; i < Math.round(0.3 / step); i++) a.stepAttack(a.player, step, a.dummy);
      return a.player.x - 140;
    }
    const fineTravel = travel(0.005), coarseTravel = travel(0.3);
    out.burstTravelIndependentOfStep = Math.abs(fineTravel - coarseTravel) < 0.001 &&
      Math.abs(coarseTravel - 105.6) < 0.001;
    setup(); a.player.meter = 100; a.startAttack(a.player, 'nitrokick');
    const motion = a.reducedMotion;
    try {
      a.reducedMotion = true;
      a.stepAttack(a.player, 0.1, a.dummy);
      out.reducedMotionNoEcho = a.afterimages.length === 0;
    } finally {
      a.reducedMotion = motion;
    }
    setup();
    const sample = () => Array.from(a.ctx.getImageData(
      (a.world.width / 2 - 54) * a.RENDER_SCALE, 35 * a.RENDER_SCALE, 4, 4
    ).data);
    a.render(0); const arenaPixels = sample();
    a.game.hits = 5; a.game.hitTimer = 1; a.render(0);
    out.comboHasNoPanel = sample().every((pixel, index) => pixel === arenaPixels[index]);
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
  for (const [width, height] of [[320, 568], [390, 844], [667, 375], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const layout = await page.evaluate(() => {
      const a = INJ, nitro = document.querySelector('[data-act="nitro"]');
      const positions = () => [...document.querySelectorAll('#pad .abtn:not([data-act="nitro"])')]
        .map(el => { const r = el.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; });
      a.player.meter = 0; a.updateChargeUI();
      const before = positions();
      a.player.meter = 100; a.updateChargeUI();
      const buttons = [...document.querySelectorAll('#pad .abtn'),
        document.querySelector('#stickZone'), document.querySelector('#btnArenaMenu')];
      const rects = buttons.filter(el => el.getClientRects().length).map(el => el.getBoundingClientRect());
      const collides = rects.some((r, i) => rects.slice(i + 1).some(s =>
        r.left < s.right && r.right > s.left && r.top < s.bottom && r.bottom > s.top));
      const arena = document.querySelector('#screen').getBoundingClientRect();
      const fits = rects.every(r => r.width >= 44 && r.height >= 44 &&
        r.left >= arena.left && r.right <= arena.right && r.top >= arena.top && r.bottom <= arena.bottom);
      const stable = JSON.stringify(before) === JSON.stringify(positions());
      const ready = !nitro.hidden && nitro.getClientRects().length > 0;
      a.player.meter = 0; a.updateChargeUI();
      return stable && ready && nitro.hidden && !collides && fits;
    });
    check(layout, `Abilities: ${width}×${height} ready/hidden controls stay fixed, separated and ≥44px`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.evaluate(() => {
    INJ.game.round = 0; INJ.resetRound(); INJ.game.state = 'fight';
    INJ.game.paused = false; INJ.game.msg = null; INJ.dummy.aiT = 999;
    INJ.player.meter = 100; INJ.updateChargeUI();
  });
  await page.locator('[data-act="nitro"]').tap();
  check(await page.evaluate(() => INJ.player.atk?.key === 'nitrokick' && INJ.player.meter < 100),
    'Abilities: real touch starts Nitro and spends the bar');
  check(await page.locator('[data-act="nitro"]').isHidden(),
    'Abilities: spending the bar hides the touch ability immediately');
  await page.evaluate(() => {
    INJ.resetInput(); INJ.player.atk = null; INJ.player.state = 'idle';
    INJ.player.hitstun = INJ.game.hitStop = 0; INJ.player.meter = 100;
    INJ.updateChargeUI();
  });
  const touch = await page.context().newCDPSession(page);
  const zone = await page.locator('#stickZone').boundingBox();
  const ability = await page.locator('[data-act="nitro"]').boundingBox();
  const contact = (id, x, y) => ({ id, x, y, radiusX: 5, radiusY: 5, force: 1 });
  let left = contact(41, zone.x + zone.width / 2, zone.y + zone.height / 2);
  const right = contact(42, ability.x + ability.width / 2, ability.y + ability.height / 2);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [left] });
  left = { ...left, x: left.x + 35 };
  await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [left] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [left, right] });
  check(await page.evaluate(() => INJ.input.right === 1 &&
    INJ.player.atk?.key === 'nitrokick' && document.querySelector('[data-act="nitro"]').hidden),
    'Abilities: hiding Nitro after activation preserves the movement thumb');
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [left] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  check(await page.evaluate(() => !Object.values(INJ.input).some(Boolean) &&
    !document.querySelector('#pad .abtn.down')),
    'Abilities: hidden ability releases its captured touch without stuck inputs');
  await touch.detach();
  await page.evaluate(() => {
    INJ.player.atk = null; INJ.player.state = 'idle'; INJ.player.meter = 100;
    INJ.player.hitstun = INJ.game.hitStop = 0; INJ.updateChargeUI();
  });
  await page.locator('[data-act="nitro"]').tap();
  check(await page.evaluate(() => INJ.player.atk?.key === 'nitrokick' && INJ.player.meter < 100),
    'Abilities: refilled Nitro can be revealed and tapped again');
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
