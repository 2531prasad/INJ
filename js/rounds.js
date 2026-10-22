/* rounds.js — see docs/architecture.md for ownership and startup order.
 * Cross-module dependencies: arena.js, controls.js, core.js, menus.js, state.js, teddy.js.
 * App is the shared INJ namespace; the exported API is listed at the end. */
(function (App) {
  'use strict';
  function endRound(winner) {
    if (['ko', 'victory'].includes(App.game.state)) return;
    App.game.lost = winner === App.dummy;
    App.game.state = 'ko';
    App.game.koTimer = App.game.lost ? 3 : 1.1;
    App.game.victory = App.game.lost
      ? null
      : {
          round: App.game.round,
          opponent: App.isR8(App.dummy) ? 'GOLDLINE' : App.dummy.name,
          health: Math.ceil(App.player.hp),
          maxHealth: App.player.maxHp,
          bestCombo: App.game.bestCombo
        };
    App.resetInput();
    App.player.atk = null;
    App.player.teleport = null;
    App.dummy.atk = null;
    App.projectiles.length = 0;
    App.game.msg = { text: winner.name + ' WINS', sub: '', big: 16 };
    App.Sfx.play('finish');
  }
  function beginVictory() {
    if (App.game.state !== 'ko' || App.game.lost || !App.game.victory) return;
    App.game.state = 'victory';
    App.game.t = 0;
    App.game.msg = null;
    App.game.hitStop = App.game.shake = App.game.shakeX = App.game.shakeY = 0;
    Object.assign(App.player, {
      state: 'victory',
      atk: null,
      grounded: true,
      y: App.GROUND,
      vx: 0,
      vy: 0,
      hitstun: 0,
      flash: 0,
      invuln: 0,
      crouching: false
    });
    App.projectiles.length = App.particles.length = App.afterimages.length = 0;
    App.resetInput();
    App.showVictory();
    App.Sfx.play('victory');
  }
  function finishVictory() {
    if (App.game.state !== 'victory' || App.game.paused) return;
    resetRound();
    App.Sfx.play('ui');
  }
  function resetRound() {
    document.getElementById('roastModal').hidden = true;
    App.hideVictory();
    App.game.victory = null;
    App.game.bestCombo = 0;
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
    App.configureOpponent(App.game.round);
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
          sub: App.encounterSubtitle(),
          big: 15
        };
      } else if (App.game.t < 1.8) App.game.msg = { text: 'FIGHT!', sub: '', big: 22 };
      else {
        App.game.msg = null;
        App.game.state = 'fight';
      }
    } else if (App.game.state === 'transform') {
      App.game.t += dt;
      if (App.game.t >= 2.1) App.completeR8Transform();
    } else if (App.game.state === 'shrink') {
      App.stepTeddyShrink(dt);
    } else if (App.game.state === 'fight') {
      App.stepTeddyShrink(dt);
      if (App.game.state === 'shrink') return;
      App.game.roundTime -= dt;
      if (App.game.roundTime <= 0) {
        App.game.roundTime = 0;
        // Both boss forms must be cleared before the active phase clock expires.
        endRound(
          App.isR8(App.dummy) ? App.dummy : App.player.hp >= App.dummy.hp ? App.player : App.dummy
        );
      }
    } else if (App.game.state === 'ko') {
      App.game.koTimer -= dt;
      if (App.game.koTimer <= 0) {
        if (App.game.lost) App.startRoast();
        else beginVictory();
      }
    } else if (App.game.state === 'victory') {
      App.game.t += dt;
    }
    if (App.game.hitTimer > 0) {
      App.game.hitTimer -= dt;
      if (App.game.hitTimer <= 0) App.game.hits = 0;
    }
  }

  Object.assign(App, { endRound, beginVictory, finishVictory, resetRound, updateFlow });
})(window.INJ);
