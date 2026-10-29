/* controls.js — see docs/architecture.md for ownership and startup order.
 * Cross-module dependencies: core.js, menus.js, movement.js, renderer.js, state.js, teleport.js.
 * App is the shared INJ namespace; the exported API is listed at the end. */
(function (App) {
  'use strict';
  const input = { left: 0, right: 0, up: 0, down: 0, block: 0 };

  const pressBuf = { punch: 0, kick: 0, upper: 0, special: 0, nitro: 0, teleport: 0, jump: 0 };
  const commandDirections = {};
  const INPUT_BUFFER_MS = 220;

  const heldKeys = new Set(),
    guardPointers = new Set(),
    stickInput = { left: 0, right: 0, up: 0, down: 0 };

  const resetSticks = [];

  function syncInput() {
    const left = stickInput.left || heldKeys.has('a') || heldKeys.has('arrowleft');
    const right = stickInput.right || heldKeys.has('d') || heldKeys.has('arrowright');
    const down = stickInput.down || heldKeys.has('s') || heldKeys.has('arrowdown');
    const up = stickInput.up || heldKeys.has('w') || heldKeys.has('arrowup') || heldKeys.has(' ');
    input.left = +(left && !right);
    input.right = +(right && !left);
    input.down = +(down && !up);
    input.up = +(up && !down);
    if (up && down) {
      pressBuf.jump = 0;
      delete commandDirections.jump;
    }
    input.block = +(guardPointers.size > 0 || heldKeys.has('shift') || heldKeys.has('i'));
  }

  function queueAction(act) {
    if (App.game.paused || App.game.state !== 'fight') return;
    if (!Object.hasOwn(pressBuf, act)) return;
    if (act === 'nitro' && App.player.meter < 100) return;
    if (act === 'teleport' && (App.player.teleportCooldown > 0 || App.player.teleport)) return;
    // One next action plus an independent jump request. New attacks replace
    // older queued attacks instead of surfacing later in an arbitrary order.
    if (act !== 'jump') {
      for (const key in pressBuf) {
        if (key !== 'jump') {
          pressBuf[key] = 0;
          delete commandDirections[key];
        }
      }
    }
    pressBuf[act] = App.game.inputTime + INPUT_BUFFER_MS;
    commandDirections[act] = {
      down: input.down,
      horizontal: input.right - input.left,
      forward: App.player.facing > 0 ? input.right : input.left
    };
    if (
      !App.player.atk &&
      App.player.hitstun <= 0 &&
      App.game.hitStop <= 0 &&
      !['ko', 'knockdown'].includes(App.player.state)
    ) {
      // Start and paint in the pointer/key handler itself; recovery inputs remain buffered.
      App.controlPlayer(App.player, App.dummy, 0);
      App.render(App.game.elapsed * 1000);
    }
  }

  function consume(act) {
    const live = pressBuf[act] > App.game.inputTime;
    const direction = commandDirections[act] || {
      down: input.down,
      horizontal: input.right - input.left,
      forward: App.player.facing > 0 ? input.right : input.left
    };
    pressBuf[act] = 0;
    delete commandDirections[act];
    return live ? direction : null;
  }

  function resetInput() {
    heldKeys.clear();
    guardPointers.clear();
    App.game.inputTime = 0;
    for (const key in commandDirections) delete commandDirections[key];
    for (const k in pressBuf) pressBuf[k] = 0;
    for (const k in stickInput) stickInput[k] = 0;
    for (const reset of resetSticks) reset();
    document.querySelectorAll('.abtn.down').forEach((btn) => btn.classList.remove('down'));
    syncInput();
  }

  function updateChargeUI() {
    App.updateTeleportUI();
    const nitroReady = App.player.meter >= 100;
    document.querySelectorAll('[data-act="nitro"]').forEach((btn) => {
      btn.hidden = !nitroReady;
      btn.classList.toggle('ready', nitroReady);
      btn.setAttribute('aria-disabled', String(!nitroReady));
      btn.setAttribute('aria-label', 'Nitro kick ready');
    });
    const ready = App.player.charge >= 3;
    document.querySelectorAll('[data-act="special"]').forEach((btn) => {
      btn.classList.toggle('ready', ready);
      btn.querySelector('.button-label').textContent = ready ? 'SHADOW +' : 'SHADOW';
      btn.setAttribute('aria-label', ready ? 'Charged shadow toss ready' : 'Shadow toss');
    });
  }

  const stickZone = document.getElementById('stickZone');

  const stickBase = document.getElementById('stickBase');

  const stickKnob = document.getElementById('stickKnob');

  function setupStick(zone, knob, isFixed) {
    if (!zone || !knob) return;
    let id = null,
      cx = 0,
      cy = 0,
      wasUp = false,
      radius = 48;
    function reset() {
      id = null;
      wasUp = false;
      zone.classList.remove('active');
      for (const k in stickInput) stickInput[k] = 0;
      if (isFixed) {
        stickBase.style.display = 'none';
        knob.style.display = 'none';
      } else knob.style.transform = 'translate(0px,0px)';
      syncInput();
    }
    resetSticks.push(reset);
    function down(e) {
      if (id !== null || App.game.paused) return;
      id = e.pointerId;
      wasUp = false;
      zone.classList.add('active');
      App.Sfx.init();
      if (isFixed) {
        const bounds = zone.getBoundingClientRect();
        radius = Math.min(
          parseFloat(getComputedStyle(stickBase).width) / 2,
          bounds.width / 2,
          bounds.height / 2
        );
        const hint = getComputedStyle(zone, '::before');
        const hx = bounds.left + parseFloat(hint.left) + parseFloat(hint.width) / 2;
        const hy = bounds.bottom - parseFloat(hint.bottom) - parseFloat(hint.height) / 2;
        // Pressing an arrow on the visible ring samples that direction immediately.
        // Touches elsewhere retain the floating joystick behaviour.
        if (Math.hypot(e.clientX - hx, e.clientY - hy) <= radius + 12) {
          cx = hx;
          cy = hy;
        } else {
          cx = App.clamp(e.clientX, bounds.left + radius, bounds.right - radius);
          cy = App.clamp(e.clientY, bounds.top + radius, bounds.bottom - radius);
        }
        stickBase.style.display = 'block';
        knob.style.display = 'block';
        stickBase.style.left = cx + 'px';
        stickBase.style.top = cy + 'px';
        knob.style.left = cx + 'px';
        knob.style.top = cy + 'px';
      } else {
        const rect = zone.getBoundingClientRect();
        cx = rect.left + rect.width / 2;
        cy = rect.top + rect.height / 2;
      }
      try {
        zone.setPointerCapture(e.pointerId);
      } catch (_) {}
      move(e);
      e.preventDefault();
      e.stopPropagation();
    }
    function move(e) {
      if (e.pointerId !== id) return;
      e.preventDefault();
      const dx = e.clientX - cx,
        dy = e.clientY - cy,
        d = Math.hypot(dx, dy) || 1;
      const k = Math.min(d, isFixed ? radius : 38) / d;
      if (isFixed) {
        knob.style.left = cx + dx * k + 'px';
        knob.style.top = cy + dy * k + 'px';
      } else knob.style.transform = 'translate(' + dx * k + 'px,' + dy * k + 'px)';
      const dead = Math.min(14, radius * 0.28),
        jumpAt = Math.min(18, radius * 0.38);
      stickInput.left = +(dx < -dead);
      stickInput.right = +(dx > dead);
      // 10:30–1:30: only the upward 90° wedge jumps; shallow tilts stay grounded.
      const inJumpCone = dy < 0 && Math.abs(dx) <= -dy + 0.01;
      stickInput.down = +(dy > dead);
      stickInput.up = +(dy < -jumpAt && inJumpCone);
      syncInput();
      if (stickInput.up && !wasUp && input.up) {
        queueAction('jump');
        wasUp = true;
      }
      if (!inJumpCone || dy > -jumpAt * 0.5) wasUp = false;
    }
    function up(e) {
      if (e.pointerId === id) reset();
    }
    zone.addEventListener('pointerdown', down, { passive: false });
    zone.addEventListener('pointermove', move, { passive: false });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
      zone.addEventListener(event, up);
  }

  const CONTROL_SETTINGS_KEY = 'inj-controls';
  let controlScale = 100;
  let settingsWritable = true;

  function layoutControls() {
    const arena = document.getElementById('screen');
    const width = arena.clientWidth,
      height = arena.clientHeight;
    const style = getComputedStyle(arena);
    // Resolve safe-area values through CSS, including Home Screen / fullscreen mode.
    const right = parseFloat(style.getPropertyValue('--safe-right')) || 0;
    const bottom = parseFloat(style.getPropertyValue('--safe-bottom')) || 0;
    const left = parseFloat(style.getPropertyValue('--safe-left')) || 0;
    const edge = Math.max(width < 500 ? 6 : 14, right);
    const floor = Math.max(width < 500 ? 7 : 12, bottom);
    const stickRoom = Math.max(74, left + 74);
    const dimensions = (unit) => {
      const aux = Math.max(44, 52 * unit),
        main = Math.max(56, 80 * unit);
      const kick = Math.max(52, 68 * unit),
        gap = Math.max(4, 8 * unit);
      const rise = (width < 500 ? 16 : 44) * unit;
      const deck = Math.max(aux * 4 + gap * 3, main + kick + aux + 44 + gap * 3);
      return { aux, main, kick, gap, rise, deck, tall: main + gap + rise + aux };
    };
    let low = 0,
      high = ((width < 500 ? 0.9 : 1) * controlScale) / 100;
    // The requested size is a ceiling; cramped screens keep every target ≥44px.
    for (let i = 0; i < 16; i++) {
      const mid = (low + high) / 2,
        d = dimensions(mid);
      if (d.deck + edge + stickRoom + 4 <= width && d.tall + floor + 32 <= height) low = mid;
      else high = mid;
    }
    const d = dimensions(low),
      padLeft = width - edge - d.deck;
    const stickZoneWidth = Math.max(44, Math.min(width * 0.33, padLeft - 4));
    const stickBottom = Math.max(22, bottom + 15);
    const stickSize = Math.min(
      Math.max(68, 110 * low),
      stickZoneWidth - left - 8,
      height * 0.72 - stickBottom - 4
    );
    const values = {
      'aux-size': d.aux,
      'main-size': d.main,
      'kick-size': d.kick,
      'deck-gap': d.gap,
      'deck-width': d.deck,
      'deck-right': edge,
      'deck-bottom': floor,
      'arc-rise': d.rise,
      'guard-lift': Math.max(d.aux + d.gap, d.main + d.gap - 24 * low),
      'stick-zone': stickZoneWidth,
      'stick-size': stickSize,
      'stick-bottom': stickBottom,
      'stick-label-bottom': Math.max(7, bottom),
      'stick-left': Math.max(left + 4, (stickZoneWidth - stickSize) / 2),
      'menu-left': padLeft + d.aux + d.gap
    };
    for (const [key, value] of Object.entries(values))
      arena.style.setProperty('--' + key, value + 'px');
  }

  function setControlScale(value, save = true) {
    controlScale = Number.isFinite(value) ? Math.round(App.clamp(value, 85, 125) / 5) * 5 : 100;
    const field = document.getElementById('controlScale');
    field.value = controlScale;
    field.setAttribute('aria-valuetext', controlScale + ' percent');
    document.getElementById('controlScaleValue').textContent = controlScale + '%';
    layoutControls();
    if (save && settingsWritable) {
      try {
        localStorage.setItem(
          CONTROL_SETTINGS_KEY,
          JSON.stringify({ version: 1, scale: controlScale })
        );
      } catch (_) {}
    }
  }

  function loadControlSettings() {
    let value = 100;
    try {
      const saved = JSON.parse(localStorage.getItem(CONTROL_SETTINGS_KEY) || 'null');
      if (saved?.version > 1) settingsWritable = false;
      else if (saved?.version === 1 && typeof saved.scale === 'number') value = saved.scale;
    } catch (_) {}
    setControlScale(value, false);
  }

  function initControls() {
    loadControlSettings();
    document.getElementById('controlScale').addEventListener('input', (event) =>
      setControlScale(Number(event.target.value))
    );
    setupStick(stickZone, stickKnob, true);
    document.querySelectorAll('.abtn').forEach((btn) => {
      const act = btn.dataset.act;
      let id = null;
      function reset() {
        if (id !== null) guardPointers.delete(id);
        id = null;
        btn.classList.remove('down');
        syncInput();
      }
      resetSticks.push(reset);
      btn.addEventListener(
        'pointerdown',
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (App.game.paused || id !== null) return;
          id = e.pointerId;
          App.Sfx.init();
          try {
            btn.setPointerCapture(id);
          } catch (_) {}
          btn.classList.add('down');
          if (navigator.vibrate)
            try {
              navigator.vibrate(8);
            } catch (_) {}
          if (act === 'block') {
            guardPointers.add(id);
            syncInput();
          } else queueAction(act);
        },
        { passive: false }
      );
      for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
        btn.addEventListener(event, (e) => {
          if (e.pointerId === id) reset();
        });
      }
    });
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (
        k === 'tab' &&
        (!App.introModal.classList.contains('hidden') ||
          App.game.state === 'roast' ||
          !App.pauseOverlay.hidden)
      ) {
        const dialog =
          App.game.state === 'roast'
            ? App.roastModal
            : !App.introModal.classList.contains('hidden')
              ? App.introModal
              : App.pauseOverlay;
        const focusable = [
          ...dialog.querySelectorAll('button, input, select, textarea, [tabindex="0"]')
        ].filter((el) => !el.disabled && el.getClientRects().length);
        const first = focusable[0],
          end = focusable[focusable.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first || !dialog.contains(document.activeElement))
        ) {
          e.preventDefault();
          end.focus();
        } else if (!e.shiftKey && document.activeElement === end) {
          e.preventDefault();
          first.focus();
        }
        return;
      }
      // Native text/select editing must not trigger mute, combat or navigation.
      if (e.target.closest('input, select, textarea, [contenteditable="true"]') && k !== 'escape')
        return;
      if (k === 'm' && !e.repeat) {
        App.Sfx.toggleMute();
        App.syncAudioUI();
        return;
      }
      if (App.game.state === 'roast') {
        if (e.repeat) {
          e.preventDefault();
          return;
        }
        if (k === 'escape') {
          e.preventDefault();
          App.finishRoast();
        } else if ((k === 'enter' || k === ' ') && e.target.tagName !== 'BUTTON') {
          e.preventDefault();
          App.advanceRoast();
        }
        return;
      }
      if (!App.introModal.classList.contains('hidden')) {
        if (k === 'escape' || ((k === 'enter' || k === ' ') && e.target.tagName !== 'BUTTON')) {
          e.preventDefault();
          App.closeIntro();
        }
        return;
      }
      if (k === 'escape' && !e.repeat) {
        e.preventDefault();
        App.game.paused ? App.resumeGame() : App.pauseGame();
        return;
      }
      if (App.game.paused) return;
      if (App.game.state === 'victory') {
        if (!e.repeat && (k === 'enter' || k === ' ') && e.target.tagName !== 'BUTTON') {
          e.preventDefault();
          App.finishVictory();
        }
        return;
      }
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(k)) e.preventDefault();
      heldKeys.add(k);
      syncInput();
      const action = {
        w: 'jump',
        arrowup: 'jump',
        ' ': 'jump',
        j: 'punch',
        k: 'kick',
        u: 'upper',
        l: 'special',
        q: 'nitro',
        e: 'teleport'
      }[k];
      if (action && !e.repeat && (action !== 'jump' || input.up)) {
        e.preventDefault();
        App.Sfx.init();
        queueAction(action);
      }
    });
    window.addEventListener('keyup', (e) => {
      heldKeys.delete(e.key.toLowerCase());
      syncInput();
    });
    document.getElementById('screen').addEventListener('pointerdown', (e) => {
      if (App.game.paused || e.target.closest('button,#stickZone,#pad')) return;
      if (App.game.state === 'ko' && App.game.koTimer > 0.6) App.game.koTimer = 0.6;
      if (App.game.state === 'intro' && App.game.t > 0.4) App.game.t = 1.8;
    });
  }

  Object.assign(App, {
    input,
    pressBuf,
    heldKeys,
    guardPointers,
    stickInput,
    resetSticks,
    syncInput,
    queueAction,
    consume,
    resetInput,
    updateChargeUI,
    stickZone,
    stickBase,
    stickKnob,
    setupStick,
    CONTROL_SETTINGS_KEY,
    layoutControls,
    setControlScale,
    initControls
  });
})(window.INJ);
