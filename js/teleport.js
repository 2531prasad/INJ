/* INJ's timed ability. Cooldown uses active fight seconds, never wall-clock timers. */
(function (App) {
  'use strict';
  const TELEPORT = { cooldown: 10, relocateAt: 0.19, duration: 0.46 };
  function startTeleport(f) {
    if (
      f !== App.player ||
      App.game.state !== 'fight' ||
      f.teleport ||
      f.atk ||
      f.teleportCooldown > 0 ||
      f.hitstun > 0 ||
      ['ko', 'knockdown'].includes(f.state)
    )
      return false;
    f.teleport = { t: 0, moved: false, fromX: f.x, fromY: f.y, target: App.playerTarget(f) };
    f.teleportCooldown = TELEPORT.cooldown;
    f.vx = f.vy = 0;
    f.state = 'teleport';
    f.crouching = false;
    App.updateTeleportUI();
    App.Sfx.play('teleport');
    return true;
  }
  function stepTeleport(f, op, dt) {
    const blink = f.teleport;
    blink.t += dt;
    if (!blink.moved && blink.t >= TELEPORT.relocateAt) {
      // Keep the combat target chosen on activation through disappearance.
      // If an echo expires before arrival, reacquire the remaining opponent.
      op = blink.target?.hp > 0 && blink.target.state !== 'ko' ? blink.target : App.playerTarget(f);
      const margin = App.fighterMargin(f);
      const opponentMargin = App.fighterMargin(op);
      const distance = (App.hurtbox(f).w + App.hurtbox(op).w) / 2 + 8;
      const previousX = op.x;
      // Resolve a corner side-switch as body separation. Even the tiny teddy
      // leaves enough rear space for INJ to appear fully inside the arena.
      op.x =
        op.facing > 0
          ? Math.max(op.x, margin + distance)
          : Math.min(op.x, App.fightWidth() - margin - distance);
      op.x = App.clamp(op.x, opponentMargin, App.fightWidth() - opponentMargin);
      const shift = op.x - previousX;
      if (shift) {
        op.dodgeFrom = App.clamp(
          op.dodgeFrom + shift,
          opponentMargin,
          App.fightWidth() - opponentMargin
        );
        op.dodgeTo = App.clamp(
          op.dodgeTo + shift,
          opponentMargin,
          App.fightWidth() - opponentMargin
        );
      }
      f.x = App.clamp(op.x - op.facing * distance, margin, App.fightWidth() - margin);
      f.y = App.GROUND;
      f.grounded = true;
      f.facing = op.x > f.x ? 1 : -1;
      blink.moved = true;
    }
    if (blink.t >= TELEPORT.duration) {
      f.teleport = null;
      f.state = 'idle';
    }
  }
  function updateTeleportUI() {
    const seconds = Math.ceil(App.player.teleportCooldown);
    const btn = document.querySelector('[data-act="teleport"]');
    if (!btn || btn.dataset.seconds === String(seconds)) return;
    btn.dataset.seconds = seconds;
    btn.classList.toggle('cooling', seconds > 0);
    btn.setAttribute('aria-disabled', String(seconds > 0));
    btn.setAttribute(
      'aria-label',
      seconds > 0
        ? `Teleport cooling down: ${seconds} seconds`
        : 'Teleport behind opponent, ready (E)'
    );
    btn.querySelector('.button-label').textContent = seconds > 0 ? `BLINK · ${seconds}s` : 'BLINK';
  }
  function tickTeleport(dt) {
    if (App.game.state !== 'fight') return;
    App.player.teleportCooldown = Math.max(0, App.player.teleportCooldown - dt);
    updateTeleportUI();
  }
  function teleportVisibility(f) {
    if (!f.teleport) return 1;
    const t = f.teleport.t;
    if (t < 0.15) return 1 - App.smooth(t / 0.15);
    if (t < 0.23) return 0;
    return App.smooth((t - 0.23) / 0.23);
  }
  function drawTeleportEffect(f) {
    if (!f.teleport || App.reducedMotion) return;
    const { ctx } = App,
      b = f.teleport;
    // Crisp staggered slices travel out of the silhouette; no sprite crossfade.
    const p = b.t < 0.19 ? App.clamp(b.t / 0.19, 0, 1) : 1 - App.clamp((b.t - 0.19) / 0.27, 0, 1);
    const x = b.moved ? f.x : b.fromX,
      y = b.moved ? f.y : b.fromY;
    ctx.save();
    ctx.strokeStyle = '#c4b0f3';
    ctx.lineWidth = 1;
    ctx.globalAlpha *= Math.sin(p * Math.PI);
    for (let i = 0; i < 9; i++) {
      const direction = i % 2 ? 1 : -1;
      const dx = direction * (8 + p * (20 + (i % 3) * 8));
      ctx.beginPath();
      ctx.moveTo(x + dx, y - 13 - i * 10);
      ctx.lineTo(x + dx + direction * 12, y - 13 - i * 10);
      ctx.stroke();
    }
    ctx.restore();
  }
  Object.assign(App, {
    TELEPORT,
    startTeleport,
    stepTeleport,
    tickTeleport,
    updateTeleportUI,
    teleportVisibility,
    drawTeleportEffect
  });
})(window.INJ);
