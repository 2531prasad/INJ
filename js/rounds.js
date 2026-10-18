/* rounds.js — see docs/architecture.md for ownership and startup order.
 * Cross-module dependencies: arena.js, controls.js, core.js, menus.js, state.js.
 * App is the shared INJ namespace; the exported API is listed at the end. */
(function (App) {
  'use strict';
  function endRound(winner) {
    if (App.game.state === 'ko') return;
    App.game.lost = winner === App.dummy;
    App.game.state = 'ko';
    App.game.koTimer = 3;
    App.player.atk = null;
    App.dummy.atk = null;
    App.projectiles.length = 0;
    App.game.msg = { text: winner.name + ' WINS', sub: '', big: 16 };
    App.Sfx.play('finish');
  }
  function resetRound() {
    document.getElementById('roastModal').hidden = true;
    App.game.lost = false;
    App.game.roastStep = 0;
    App.game.gongPlayed = false;
    for (const [f, x, facing] of [
      [App.player, App.world.width / 2 - 56, 1],
      [App.dummy, App.world.width / 2 + 56, -1]
    ]) {
      Object.assign(
        f,
        App.makeFighter({ name: f.name, kind: f.kind, pal: f.pal, x, facing, hp: f.maxHp })
      );
    }
    App.resetInput();
    App.projectiles.length = 0;
    App.particles.length = 0;
    App.afterimages.length = 0;
    App.bctx.clearRect(0, 0, App.world.width, App.H);
    App.game.roundTime = 99;
    App.game.round++;
    App.game.state = 'intro';
    App.game.t = 0;
    App.game.msg = null;
    App.game.hits = 0;
    App.game.hitTimer = 0;
    App.game.hitStop = 0;
    App.game.shake = 0;
    App.game.shakeX = App.game.shakeY = 0;
    App.updateChargeUI();
  }

  function updateFlow(dt) {
    if (App.game.state === 'intro') {
      App.game.t += dt;
      if (App.game.t < 1.1) {
        if (!App.game.gongPlayed) {
          App.Sfx.play('gong');
          App.game.gongPlayed = true;
        }
        App.game.msg = {
          text: 'ROUND ' + App.game.round,
          sub: App.game.round >= 2 ? 'DUMMY AWAKENED' : '',
          big: 15
        };
      } else if (App.game.t < 1.8) App.game.msg = { text: 'FIGHT!', sub: '', big: 22 };
      else {
        App.game.msg = null;
        App.game.state = 'fight';
      }
    } else if (App.game.state === 'fight') {
      App.game.roundTime -= dt;
      if (App.game.roundTime <= 0) {
        App.game.roundTime = 0;
        endRound(App.player.hp >= App.dummy.hp ? App.player : App.dummy);
      }
    } else if (App.game.state === 'ko') {
      App.game.koTimer -= dt;
      if (App.game.koTimer <= 0) {
        if (App.game.lost) App.startRoast();
        else resetRound();
      }
    }
    if (App.game.hitTimer > 0) {
      App.game.hitTimer -= dt;
      if (App.game.hitTimer <= 0) App.game.hits = 0;
    }
  }

  Object.assign(App, { endRound, resetRound, updateFlow });
})(window.INJ);
