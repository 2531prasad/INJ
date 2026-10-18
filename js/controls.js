/* controls.js — see docs/architecture.md for ownership and startup order.
 * Cross-module dependencies: core.js, menus.js, movement.js, renderer.js, state.js.
 * App is the shared INJ namespace; the exported API is listed at the end. */
(function (App) {
  'use strict';
  const input = { left: 0, right: 0, up: 0, down: 0, block: 0 };

  const pressBuf = { punch: 0, kick: 0, upper: 0, special: 0, jump: 0 };

  const heldKeys = new Set(),
    guardPointers = new Set(),
    stickInput = { left: 0, right: 0, up: 0, down: 0 };

  const resetSticks = [];

  function syncInput() {
    input.left = +(stickInput.left || heldKeys.has('a') || heldKeys.has('arrowleft'));
    input.right = +(stickInput.right || heldKeys.has('d') || heldKeys.has('arrowright'));
    input.down = +(stickInput.down || heldKeys.has('s') || heldKeys.has('arrowdown'));
    input.up = +(stickInput.up || heldKeys.has('w') || heldKeys.has('arrowup'));
    input.block = +(guardPointers.size > 0 || heldKeys.has('shift') || heldKeys.has('i'));
  }

  function queueAction(act) {
    if (App.game.paused || App.game.state !== 'fight') return;
    pressBuf[act] = performance.now() + 220;
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
    const live = pressBuf[act] > performance.now();
    pressBuf[act] = 0;
    return live;
  }

  function resetInput() {
    heldKeys.clear();
    guardPointers.clear();
    for (const k in pressBuf) pressBuf[k] = 0;
    for (const k in stickInput) stickInput[k] = 0;
    for (const reset of resetSticks) reset();
    document.querySelectorAll('.abtn.down').forEach((btn) => btn.classList.remove('down'));
    syncInput();
  }

  function updateChargeUI() {
    const ready = App.player.charge >= 3;
    document.querySelectorAll('[data-act="special"]').forEach((btn) => {
      btn.classList.toggle('ready', ready);
      btn.textContent = ready ? 'SHADOW +' : 'SHADOW';
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
      const k = Math.min(d, isFixed ? 48 : 38) / d;
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
      if (stickInput.up && !wasUp) {
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

  function initControls() {
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
        const buttons = [...dialog.querySelectorAll('button')].filter(
          (btn) => btn.getClientRects().length
        );
        const first = buttons[0],
          end = buttons[buttons.length - 1];
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
        l: 'special'
      }[k];
      if (action && !e.repeat) {
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
    initControls
  });
})(window.INJ);
