/* Thumb-cluster geometry, real scale editing/persistence and cooldown feedback. */
const path = require('node:path');
const controlsFit = require('./control-geometry.cjs');
module.exports = async function verifyControls(page, check, root, { artifacts, harness }) {
  for (const [width, height] of [[320, 568], [360, 740], [390, 844], [430, 932], [568, 320], [667, 375], [844, 390], [932, 430]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    let result = true;
    for (const scale of [85, 100, 125]) {
      const stable = await page.evaluate(scale => {
        INJ.setControlScale(scale, false);
        const positions = () => [...document.querySelectorAll('#pad button:not([data-act="nitro"])')]
          .map(el => el.getBoundingClientRect().toJSON());
        INJ.player.meter = 0; INJ.updateChargeUI();
        const before = JSON.stringify(positions());
        INJ.player.meter = 100; INJ.updateChargeUI();
        return before === JSON.stringify(positions()) && !document.querySelector('[data-act="nitro"]').hidden;
      }, scale);
      result = result && stable && await page.evaluate(controlsFit);
    }
    await page.evaluate(() => { INJ.player.meter = 0; INJ.updateChargeUI(); INJ.setControlScale(100, false); });
    check(result, `Controls: ${width}×${height}, all scales keep seven arc hit regions/menu/stick separated and reachable`);
  }
  check(await page.evaluate(() => !document.querySelector('.stick-directions') &&
    ['::before', '::after'].every(p => ['none', 'normal'].includes(getComputedStyle(INJ.stickZone, p).content)) &&
    getComputedStyle(INJ.stickBase).display === 'none' && getComputedStyle(INJ.stickKnob).display === 'none'),
    'Controls: idle movement area has no permanent pad, arrows or labels');
  check(await page.evaluate(() => {
    const arena = document.querySelector('#screen'), bounds = arena.getBoundingClientRect();
    const style = getComputedStyle(arena);
    const primary = [...document.querySelectorAll('#pad .primary')];
    const frames = primary.map(el => el.getBoundingClientRect());
    const right = bounds.right - parseFloat(style.borderRightWidth) - (parseFloat(style.getPropertyValue('--safe-right')) || 0);
    const bottom = bounds.bottom - parseFloat(style.borderBottomWidth) - (parseFloat(style.getPropertyValue('--safe-bottom')) || 0);
    const area = el => {
      const r = el.getBoundingClientRect();
      const points = el.style.getPropertyValue('--hit-shape').slice(8, -1).split(',').map(pair => {
        const [x, y] = pair.trim().split(/\s+/).map(parseFloat);
        return [x * r.width / 100, y * r.height / 100];
      });
      return Math.abs(points.reduce((sum, p, i) => {
        const q = points[(i + 1) % points.length];
        return sum + p[0] * q[1] - p[1] * q[0];
      }, 0)) / 2;
    };
    const [punch, kick, upper] = ['punch', 'kick', 'upper'].map(act =>
      document.querySelector('[data-act="' + act + '"]'));
    const sizes = [punch, kick, upper].map(area);
    return primary.length === 3 && primary.every(el => !el.hidden &&
      (el.querySelector('.action-face path').getAttribute('d').match(/ A/g) || []).length === 2) &&
      right - Math.max(...frames.map(r => r.right)) >= 7 &&
      bottom - Math.max(...frames.map(r => r.bottom)) >= 7 &&
      Math.abs(sizes[0] / sizes[1] - 1) < 0.05 && sizes[2] < Math.min(sizes[0], sizes[1]) * 0.9 &&
      sizes[2] > Math.min(sizes[0], sizes[1]) * 0.6;
  }), 'Controls: inset annular Punch/Kick/Upper arc has two equal main attacks and a smaller persistent Upper');
  check(await page.evaluate(() => [...document.querySelectorAll('#pad .ability')].length === 4 &&
    [...document.querySelectorAll('#pad .ability')].every(el => {
      const r = el.getBoundingClientRect();
      return (el.hidden || Math.abs(r.width - r.height) < 0.1) &&
        el.querySelector('.skill-icon path') && ['block','teleport','special','nitro'].includes(el.dataset.act);
    }) && [...document.querySelectorAll('#pad .action-face path')].every(path => {
      const channels = getComputedStyle(path).fill.match(/[\d.]+/g).slice(0, 3).map(Number);
      return Math.max(...channels) - Math.min(...channels) <= 18;
    })), 'Controls: four circular skill buttons have individual emblems and muted faces');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.evaluate(() => { INJ.resumeGame(); INJ.pauseGame(); });
  await page.locator('#controlScale').focus();
  const small = await page.locator('[data-act="punch"]').boundingBox();
  await page.keyboard.press('End');
  check(await page.evaluate(() => document.querySelector('#controlScaleValue').textContent === '125%' &&
    JSON.parse(localStorage.getItem('inj-controls')).scale === 125 && INJ.game.paused &&
    !Object.values(INJ.input).some(Boolean)), 'Controls: native slider keyboard editing saves size without feeding combat');
  const large = await page.locator('[data-act="punch"]').boundingBox();
  check(large.width > small.width, 'Controls: larger requested scale grows buttons when space permits');
  const slider = await page.locator('#controlScale').boundingBox();
  await page.locator('#controlScale').tap({ position: { x: slider.width - 2, y: slider.height / 2 } });
  check(await page.evaluate(() => document.querySelector('#controlScale').value === '125' && JSON.parse(localStorage.getItem('inj-controls')).scale === 125),
    'Controls: real touch can set and save scale from the pause menu');
  await page.evaluate(() => {
    document.body.classList.add('expanded-view'); INJ.syncFullscreenUI(); INJ.fitArena();
  });
  await page.locator('#controlScale').focus();
  await page.keyboard.press('Home');
  const range = await page.locator('#controlScale').boundingBox();
  const drag = await page.context().newCDPSession(page);
  const contact = { id: 31, x: range.x + 10, y: range.y + range.height / 2, radiusX: 5, radiusY: 5, force: 1 };
  await drag.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [contact] });
  for (const fraction of [0.3, 0.6, 1]) await drag.send('Input.dispatchTouchEvent', {
    type: 'touchMove', touchPoints: [{ ...contact, x: range.x + 10 + (range.width - 20) * fraction }]
  });
  await drag.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await drag.detach();
  check(await page.evaluate(() => document.querySelector('#controlScale').value === '125' &&
    JSON.parse(localStorage.getItem('inj-controls')).scale === 125 && INJ.game.paused),
    'Controls: actual range drag works inside immersive pause without resuming combat');
  await page.evaluate(() => {
    document.body.classList.remove('expanded-view'); INJ.syncFullscreenUI(); INJ.fitArena();
  });
  await page.reload();
  check(await page.evaluate(() => document.querySelector('#controlScale').value === '125' &&
    document.querySelector('#controlScaleValue').textContent === '125%' && INJ.game.paused), 'Controls: scale restores on real HTTP reload behind profile');
  await page.locator('#btnStartFight').tap();
  await page.locator('#btnArenaMenu').tap();
  await page.locator('#btnRestart').tap();
  check(await page.evaluate(() => document.querySelector('#controlScale').value === '125'), 'Controls: restart preserves scale preference');
  await page.evaluate(() => { INJ.pauseGame(); INJ.setControlScale(100); });
  if (artifacts) await page.screenshot({ path: path.join(root, 'artifacts/controls-settings.png') });
  await page.locator('#btnResume').tap();
  await page.evaluate(() => {
    INJ.game.state = 'fight'; INJ.game.paused = true; INJ.game.msg = null;
    INJ.player.teleportCooldown = 7.25; INJ.updateTeleportUI();
  });
  check(await page.evaluate(() => {
    const b = document.querySelector('[data-act="teleport"]');
    return b.getAttribute('aria-disabled') === 'true' && b.getAttribute('aria-label').includes('8 seconds') &&
      b.querySelector('.cooldown-value').textContent === '8' && b.querySelector('.button-label').textContent === 'BLINK' &&
      parseFloat(b.style.getPropertyValue('--cooldown-progress')) > 0.72 &&
      getComputedStyle(b.querySelector('.cooldown-track')).display !== 'none';
  }), 'Controls: Blink keeps a short label, accessible seconds and face-following cooldown outline');
  await page.waitForTimeout(100);
  check(await page.evaluate(() => INJ.player.teleportCooldown === 7.25), 'Controls: paused cooldown display cannot run ahead of combat');
  for (const [width, height] of [[320, 568], [390, 844], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.waitForTimeout(50);
    await page.evaluate(() => {
      INJ.fitArena(); INJ.player.meter = 100; INJ.player.charge = 3; INJ.updateChargeUI();
      INJ.game.msg = null; INJ.render(0);
    });
    if (artifacts) await page.screenshot({ path: path.join(root, `artifacts/controls-${width}.png`) });
  }
  await page.evaluate(() => {
    const arena = document.querySelector('#screen');
    arena.style.setProperty('--safe-left', '44px');
    arena.style.setProperty('--safe-right', '44px');
    arena.style.setProperty('--safe-bottom', '20px');
    document.body.classList.add('standalone-view'); INJ.fitArena();
  });
  check(await page.evaluate(() => {
    const arena = document.querySelector('#screen').getBoundingClientRect();
    const pad = document.querySelector('#pad').getBoundingClientRect();
    INJ.game.paused = false;
    const zone = INJ.stickZone.getBoundingClientRect();
    INJ.stickZone.dispatchEvent(new PointerEvent('pointerdown', {
      pointerId: 77, clientX: zone.left + 1, clientY: zone.bottom - 1
    }));
    const stick = INJ.stickBase.getBoundingClientRect();
    const fits = stick.left >= arena.left + 43.9 && stick.bottom <= arena.bottom - 19.9;
    INJ.resetInput(); INJ.game.paused = true;
    return arena.right - pad.right >= 44 && arena.bottom - pad.bottom >= 20 && fits;
  }), 'Controls: simulated Home Screen safe areas protect both thumb regions');
  await page.evaluate(() => {
    const arena = document.querySelector('#screen');
    for (const key of ['--safe-left', '--safe-right', '--safe-bottom']) arena.style.removeProperty(key);
    document.body.classList.remove('standalone-view'); INJ.fitArena();
  });
  // Independent real touches: releasing Guard must never release the left stick.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.evaluate(() => { INJ.resumeGame(); INJ.game.state = 'fight'; INJ.game.hitStop = 999; INJ.resetInput(); });
  const cdp = await page.context().newCDPSession(page);
  const zone = await page.locator('#stickZone').boundingBox(), guard = await page.locator('[data-act="block"]').boundingBox();
  const point = (id, x, y) => ({ id, x, y, radiusX: 5, radiusY: 5, force: 1 });
  let left = point(21, zone.x + zone.width / 2, zone.y + zone.height / 2);
  const right = point(22, guard.x + guard.width / 2, guard.y + guard.height / 2);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [left] });
  check(await page.evaluate(({ x, y }) => {
    const b = INJ.stickBase.getBoundingClientRect();
    return getComputedStyle(INJ.stickBase).display !== 'none' &&
      Math.abs(b.x + b.width / 2 - x) < 1 && Math.abs(b.y + b.height / 2 - y) < 1;
  }, left), 'Controls: floating joystick appears at the touch origin');
  if (artifacts) await page.screenshot({ path: path.join(root, 'artifacts/controls-stick-active.png') });
  left = { ...left, x: left.x - 28 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [left] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [left, right] });
  check(await page.evaluate(() => INJ.input.left && INJ.input.block && document.querySelector('[data-act="block"]').classList.contains('down')),
    'Controls: actual joystick plus held Guard use independent captured touches');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [right] });
  check(await page.evaluate(() => INJ.input.left && !INJ.input.block), 'Controls: releasing Guard preserves movement');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  check(await page.evaluate(() => !Object.values(INJ.input).some(Boolean) && !document.querySelector('.abtn.down')),
    'Controls: touch cancellation releases movement and pressed feedback');
  check(await page.evaluate(() => getComputedStyle(INJ.stickBase).display === 'none' &&
    getComputedStyle(INJ.stickKnob).display === 'none'), 'Controls: joystick disappears on touch cancellation');
  // A second gesture must establish a new origin, even near the old idle-ring location.
  const next = point(23, zone.x + zone.width / 2 + 4, zone.y + zone.height / 2);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [next] });
  check(await page.evaluate(({ x, y }) => {
    const b = INJ.stickBase.getBoundingClientRect();
    return Math.abs(b.x + b.width / 2 - x) < 1 && Math.abs(b.y + b.height / 2 - y) < 1 &&
      !Object.values(INJ.stickInput).some(Boolean);
  }, next), 'Controls: repeated gestures recenter without a ghost direction');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  check(await page.evaluate(() => getComputedStyle(INJ.stickBase).display === 'none' &&
    getComputedStyle(INJ.stickKnob).display === 'none'), 'Controls: joystick disappears on normal release');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [next] });
  await page.evaluate(() => INJ.pauseGame());
  check(await page.evaluate(() => getComputedStyle(INJ.stickBase).display === 'none' &&
    getComputedStyle(INJ.stickKnob).display === 'none' && !Object.values(INJ.input).some(Boolean)),
    'Controls: pause immediately hides the held joystick and clears movement');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
  await page.evaluate(() => { INJ.resumeGame(); INJ.game.paused = true; INJ.game.hitStop = 0; });
  // Press feedback is an interruptible CSS transition; replay at 10% speed.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.waitForTimeout(50);
  await page.evaluate(() => {
    const b = document.querySelector('[data-act="punch"]');
    b.classList.add('down');
    getComputedStyle(b).transform;
    b.getAnimations().forEach(a => { a.playbackRate = 0.1; });
  });
  await page.waitForTimeout(300);
  check(await page.locator('[data-act="punch"]').evaluate(b => {
    const scale = new DOMMatrix(getComputedStyle(b).transform).a;
    return scale > 0.96 && scale < 1;
  }), 'Controls: 10% replay exposes a smooth intermediate press state');
  if (artifacts) await page.screenshot({ path: path.join(root, 'artifacts/controls-press-mid.png') });
  await page.waitForTimeout(600);
  check(await page.locator('[data-act="punch"]').evaluate(b => Math.abs(new DOMMatrix(getComputedStyle(b).transform).a - 0.96) < 0.001),
    'Controls: 10% replay settles at restrained 0.96 press scale');
  if (artifacts) await page.screenshot({ path: path.join(root, 'artifacts/controls-pressed.png') });
  await page.evaluate(() => document.querySelector('[data-act="punch"]').classList.remove('down'));
  await page.waitForTimeout(20);
  await page.evaluate(() => document.querySelector('[data-act="punch"]').classList.add('down'));
  await page.waitForTimeout(100);
  check(await page.locator('[data-act="punch"]').evaluate(b => Math.abs(new DOMMatrix(getComputedStyle(b).transform).a - 0.96) < 0.001),
    'Controls: interrupted release/repress has no stuck or exaggerated feedback');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  check(await page.locator('[data-act="punch"]').evaluate(b => getComputedStyle(b).transitionDuration === '0s'),
    'Controls: reduced motion removes decorative transitions');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(() => { INJ.resetInput(); localStorage.setItem('inj-controls', '{broken'); });
  await page.reload();
  check(await page.locator('#controlScale').inputValue() === '100', 'Controls: corrupt settings recover default scale');
  await page.evaluate(() => localStorage.setItem('inj-controls', JSON.stringify({ version: 1, scale: 999 })));
  await page.reload();
  check(await page.locator('#controlScale').inputValue() === '125', 'Controls: out-of-range stored size is bounded');
  await page.evaluate(() => localStorage.setItem('inj-controls', JSON.stringify({ version: 2, scale: 110, extra: true })));
  await page.reload();
  await page.evaluate(() => INJ.setControlScale(85));
  check(await page.evaluate(() => JSON.parse(localStorage.getItem('inj-controls')).version === 2 &&
    document.querySelector('#controlScale').value === '85'), 'Controls: unknown future settings remain untouched while session adjustment works');
  const file = await harness.page({ url: harness.fileUrl });
  try {
    await file.page.evaluate(() => INJ.setControlScale(115));
    await file.page.reload();
    check(await file.page.locator('#controlScale').inputValue() === '115' && !file.errors.length,
      'Controls: direct file opening saves and restores size');
  } finally { await file.close(); }
  const blocked = await harness.page();
  try {
    await blocked.page.addInitScript(() => {
      Storage.prototype.getItem = Storage.prototype.setItem = () => { throw new Error('storage blocked'); };
    });
    await blocked.page.reload();
    await blocked.page.evaluate(() => INJ.setControlScale(120));
    check(await blocked.page.locator('#controlScale').inputValue() === '120' && !blocked.errors.length,
      'Controls: unavailable storage still allows session scale changes');
  } finally { await blocked.close(); }
};
