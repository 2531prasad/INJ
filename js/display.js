/* display.js — see docs/architecture.md for ownership and startup order.
 * Cross-module dependencies: arena.js, controls.js, core.js, menus.js, renderer.js, state.js.
 * App is the shared INJ namespace; the exported API is listed at the end. */
(function (App) {
  'use strict';
  const fullscreenStatus = document.getElementById('fullscreenStatus');

  const appDisplay = matchMedia('(display-mode: standalone), (display-mode: fullscreen)');

  function isStandalone() {
    return navigator.standalone === true || appDisplay.matches;
  }

  function isImmersive() {
    return (
      !!(document.fullscreenElement || document.webkitFullscreenElement) ||
      isStandalone() ||
      document.body.classList.contains('expanded-view')
    );
  }

  function syncFullscreenUI() {
    const native = !!(document.fullscreenElement || document.webkitFullscreenElement);
    document.body.classList.toggle('native-fullscreen', native);
    const standalone = isStandalone();
    document.body.classList.toggle('standalone-view', standalone);
    for (const el of [document.documentElement, document.body])
      el.classList.toggle('immersive-view', isImmersive());
    const expanded = document.body.classList.contains('expanded-view');
    for (const btn of document.querySelectorAll('[data-fullscreen]')) {
      const label = native
        ? 'Exit fullscreen'
        : standalone
          ? 'Running as a Home Screen app'
          : expanded
            ? 'Exit expanded view'
            : 'Enter fullscreen';
      btn.textContent = native
        ? 'Exit full screen'
        : standalone
          ? 'App mode'
          : expanded
            ? 'Exit view'
            : 'Full screen';
      btn.disabled = standalone && !native;
      btn.setAttribute('aria-label', label);
      btn.title = label;
      btn.setAttribute('aria-pressed', String(native || expanded || standalone));
    }
  }

  async function toggleFullscreen() {
    const active = document.fullscreenElement || document.webkitFullscreenElement;
    if (active) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit) await exit.call(document);
    } else if (isStandalone()) {
      return;
    } else if (document.body.classList.contains('expanded-view')) {
      document.body.classList.remove('expanded-view');
      fullscreenStatus.textContent = '';
    } else {
      // Include the profile and defeat dialogs in the native fullscreen top layer too.
      const target = document.documentElement;
      const request = target.requestFullscreen || target.webkitRequestFullscreen;
      try {
        if (!request) throw new Error('Fullscreen unavailable');
        await request.call(target, { navigationUI: 'hide' });
        fullscreenStatus.textContent = '';
      } catch (_) {
        document.body.classList.add('expanded-view');
        fullscreenStatus.textContent = /iPhone|iPod|iPad/.test(navigator.userAgent)
          ? 'Safari bars stay visible in this tab. Share → Add to Home Screen → enable Open as Web App (if shown), then launch INJ from its icon.'
          : 'Expanded view. For an app window without browser bars, use your browser’s Add to Home Screen or Install app action.';
      }
    }
    App.resetInput();
    syncFullscreenUI();
    fitArena();
  }

  function displayModeChanged() {
    App.resetInput();
    syncFullscreenUI();
    fitArena();
  }

  function preventImmersiveGesture(e) {
    if (isImmersive() && e.cancelable) e.preventDefault();
  }

  function fitArena() {
    const wrap = document.querySelector('.wrap'),
      arena = document.getElementById('screen');
    const style = getComputedStyle(wrap),
      box = getComputedStyle(arena);
    const number = (value) => parseFloat(value) || 0;
    const availableWidth =
      wrap.clientWidth - number(style.paddingLeft) - number(style.paddingRight);
    const visible = [...wrap.children].filter(
      (el) => el !== arena && getComputedStyle(el).display !== 'none'
    );
    const otherHeight = visible.reduce((sum, el) => sum + el.getBoundingClientRect().height, 0);
    const viewportHeight = window.visualViewport?.height || innerHeight;
    const availableHeight = Math.max(
      100,
      viewportHeight -
        number(style.paddingTop) -
        number(style.paddingBottom) -
        otherHeight -
        number(style.rowGap) * visible.length
    );
    const borderX = number(box.borderLeftWidth) + number(box.borderRightWidth),
      borderY = number(box.borderTopWidth) + number(box.borderBottomWidth);
    const contentWidth = Math.max(1, availableWidth - borderX);
    const landscape = matchMedia(
      '(pointer:coarse) and (orientation:landscape), (max-height:550px) and (orientation:landscape)'
    ).matches;
    const aspect = Math.max(
      landscape ? 1.5 : App.DEFAULT_ASPECT,
      contentWidth / Math.max(1, availableHeight - borderY)
    );
    const nextWidth = Math.round(App.H * aspect * App.RENDER_SCALE) / App.RENDER_SCALE;
    arena.style.width = availableWidth + 'px';
    arena.style.height = contentWidth / (nextWidth / App.H) + borderY + 'px';
    if (nextWidth === App.world.width) return;
    const previousWidth = App.world.width,
      shift = (nextWidth - App.world.width) / 2;
    const marks = document.createElement('canvas');
    marks.width = App.bloodCv.width;
    marks.height = App.bloodCv.height;
    marks.getContext('2d').drawImage(App.bloodCv, 0, 0);
    App.world.width = nextWidth;
    for (const canvas of [App.cv, App.bg, App.bloodCv]) {
      canvas.width = App.world.width * App.RENDER_SCALE;
      canvas.height = App.H * App.RENDER_SCALE;
    }
    for (const context of [App.ctx, App.bgx, App.bctx])
      context.setTransform(App.RENDER_SCALE, 0, 0, App.RENDER_SCALE, 0, 0);
    App.ctx.imageSmoothingEnabled = true;
    App.bctx.drawImage(marks, shift, 0, previousWidth, App.H);
    for (const fighter of [App.player, App.dummy]) {
      const margin = App.fighterMargin(fighter);
      fighter.x = App.clamp(fighter.x + shift, margin, App.world.width - margin);
      fighter.dodgeFrom = App.clamp(fighter.dodgeFrom + shift, margin, App.world.width - margin);
      fighter.dodgeTo = App.clamp(fighter.dodgeTo + shift, margin, App.world.width - margin);
    }
    for (const object of [...App.projectiles, ...App.particles]) object.x += shift;
    for (const ghost of App.afterimages) ghost.f.x += shift;
    App.paintArena();
    App.render(App.game.elapsed * 1000);
  }

  let fitPending = false;

  const arenaObserver = new ResizeObserver(() => {
    if (fitPending) return;
    fitPending = true;
    requestAnimationFrame(() => {
      fitPending = false;
      fitArena();
    });
  });

  function initDisplay() {
    for (const btn of document.querySelectorAll('[data-fullscreen]'))
      btn.addEventListener('click', () =>
        toggleFullscreen().catch(() => {
          fullscreenStatus.textContent =
            'Fullscreen could not change. Try your browser’s fullscreen control.';
        })
      );
    for (const event of ['fullscreenchange', 'webkitfullscreenchange'])
      document.addEventListener(event, () => {
        App.resetInput();
        syncFullscreenUI();
        fitArena();
      });
    if (appDisplay.addEventListener) appDisplay.addEventListener('change', displayModeChanged);
    else appDisplay.addListener(displayModeChanged);
    syncFullscreenUI();
    for (const event of ['gesturestart', 'gesturechange', 'gestureend', 'dblclick', 'contextmenu'])
      document.addEventListener(event, preventImmersiveGesture, { passive: false });
    document.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length > 1) preventImmersiveGesture(e);
      },
      { passive: false }
    );
    document.addEventListener(
      'touchmove',
      (e) => {
        if (!isImmersive()) return;
        // Keep the profile, cat exchange and long fullscreen instructions readable.
        const scroller = e.target.closest?.('.modal-overlay,.roast-overlay,.pause-panel');
        if (e.touches.length === 1 && scroller && scroller.scrollHeight > scroller.clientHeight)
          return;
        preventImmersiveGesture(e);
      },
      { passive: false }
    );
    document.addEventListener(
      'wheel',
      (e) => {
        if (e.ctrlKey) preventImmersiveGesture(e);
      },
      { passive: false }
    );
    for (const el of document.querySelectorAll('.wrap,.plaque')) arenaObserver.observe(el);
    fitArena();
    App.btnStartFight.focus({ preventScroll: true });
  }

  Object.assign(App, {
    fullscreenStatus,
    appDisplay,
    isStandalone,
    isImmersive,
    syncFullscreenUI,
    toggleFullscreen,
    displayModeChanged,
    preventImmersiveGesture,
    fitArena,
    arenaObserver,
    initDisplay
  });
})(window.INJ);
