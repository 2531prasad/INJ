/* engine.js — see docs/architecture.md for ownership and startup order.
 * Cross-module dependencies: passive.js, core.js, effects.js, giant.js, menus.js, movement.js, opponent.js, renderer.js, rounds.js, state.js, teleport.js.
 * App is the shared INJ namespace; the exported API is listed at the end. */
(function (App) {
  'use strict';
  function update(dt) {
    if (App.game.paused) return;
    App.game.elapsed += dt;
    App.Sfx.setMode(
      App.isGiant(App.dummy) && ['enlarge', 'fight'].includes(App.game.state)
        ? 'boss'
        : App.game.state === 'fight'
          ? 'fight'
          : 'menu'
    );
    App.Sfx.intensity =
      App.game.state === 'fight' &&
      (App.player.hp / App.player.maxHp < 0.3 || App.dummy.hp / App.dummy.maxHp < 0.3);
    if (App.game.hitStop > 0) {
      App.game.hitStop -= dt;
      App.game.shake = Math.max(0, App.game.shake - dt * 32);
      App.game.shakeX = (App.rnd() - 0.5) * App.game.shake;
      App.game.shakeY = (App.rnd() - 0.5) * App.game.shake;
      return;
    }
    const previousState = App.game.state;
    App.updateFlow(dt);
    if (App.game.paused) return;
    if (
      ['transform', 'shrink', 'enlarge', 'victory'].includes(previousState) ||
      ['transform', 'shrink', 'enlarge', 'victory'].includes(App.game.state)
    )
      return;
    App.tickTeleport(dt);
    App.stepPassive(dt);
    App.controlPlayer(App.player, App.dummy, dt);
    if (App.game.state === 'transform') return;
    App.controlDummy(App.dummy, App.player, dt);
    App.stepGiantEncounter(dt);
    if (App.game.state !== 'fight' && previousState === 'fight') return;
    App.updateProjectiles(dt);
    App.updateParticles(dt);
    for (let i = App.afterimages.length - 1; i >= 0; i--) {
      App.afterimages[i].life -= dt;
      if (App.afterimages[i].life <= 0) App.afterimages.splice(i, 1);
    }

    App.game.shake = Math.max(0, App.game.shake - dt * 30);
    App.game.shakeX = (App.rnd() - 0.5) * App.game.shake;
    App.game.shakeY = (App.rnd() - 0.5) * App.game.shake;
    if (App.reducedMotion) App.game.shakeX = App.game.shakeY = 0;
  }

  function frame(now) {
    const dt = App.clamp((now - App.clock.last) / 1000, 0, 0.05);
    App.clock.last = now;
    update(dt);
    App.render(App.game.elapsed * 1000);
    requestAnimationFrame(frame);
  }

  function startEngine() {
    App.clock.last = performance.now();
    requestAnimationFrame(frame);
    document.addEventListener('visibilitychange', () => {
      App.clock.last = performance.now();
      if (document.hidden) {
        if (App.game.started) App.pauseGame();
        App.Sfx.suspend();
      }
    });
  }

  Object.assign(App, { update, frame, startEngine });
})(window.INJ);
