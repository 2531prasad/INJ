/* Encounter ladder and the R8's two independent health pools. */
(function (App) {
  'use strict';
  const isR8 = (f) => f.kind === 'r8';
  const isTeddy = (f) => f.kind === 'teddy';
  const fighterMargin = (f) =>
    isTeddy(f) ? Math.max(16, 44 * f.teddyScale) : isR8(f) ? (f.form === 'car' ? 54 : 38) : 26;
  function configureOpponent(round) {
    const r8 = round === 3,
      teddy = round >= 4,
      form = r8 ? 'car' : null;
    Object.assign(
      App.dummy,
      App.makeFighter({
        name: teddy ? 'BLUE VELVET' : r8 ? 'R8 · GOLDLINE' : 'DUMMY',
        kind: teddy ? 'teddy' : r8 ? 'r8' : 'dummy',
        pal: App.DUM_PAL,
        x: App.world.width / 2 + 65,
        facing: -1,
        hp: teddy ? App.TEDDY_TUNING.health : r8 ? App.R8_TUNING.car.health : 130
      })
    );
    App.dummy.form = form;
    App.dummy.robotMaxHp = r8 ? App.R8_TUNING.robot.health : 0;
    App.dummy.carMaxHp = r8 ? App.R8_TUNING.car.health : 0;
  }
  function beginR8Transform(f) {
    if (f !== App.dummy || !isR8(f) || f.form !== 'car') return false;
    f.hp = 0;
    f.atk = null;
    f.vx = f.vy = 0;
    f.y = App.GROUND;
    f.grounded = true;
    f.state = 'transform';
    f.flash = 0;
    f.invuln = 0;
    App.player.atk = null;
    App.player.teleport = null;
    App.player.vx = App.player.vy = 0;
    App.player.y = App.GROUND;
    App.player.grounded = true;
    App.player.state = 'idle';
    App.player.hitstun = 0;
    App.player.crouching = false;
    App.player.flash = 0;
    App.resetCombo();
    App.game.state = 'transform';
    App.game.t = 0;
    App.game.hitStop = 0;
    App.game.shake = 0;
    App.game.shakeX = App.game.shakeY = 0;
    App.projectiles.length = 0;
    App.afterimages.length = 0;
    App.resetInput();
    App.game.msg = { text: 'SECOND IGNITION', sub: 'THE CAR WAS THE WARM-UP', big: 11 };
    App.Sfx.play('transform');
    return true;
  }
  function completeR8Transform() {
    const x = App.dummy.x,
      facing = App.player.x > x ? 1 : -1;
    Object.assign(
      App.dummy,
      App.makeFighter({
        name: 'R8 · ASCENDANT',
        kind: 'r8',
        pal: App.DUM_PAL,
        x,
        facing,
        hp: App.R8_TUNING.robot.health
      })
    );
    Object.assign(App.dummy, {
      form: 'robot',
      carMaxHp: App.R8_TUNING.car.health,
      robotMaxHp: App.R8_TUNING.robot.health,
      restT: 0.7,
      invuln: 0.35
    });
    const p = App.player;
    p.hp = p.maxHp;
    p.atk = null;
    p.hitstun = 0;
    p.state = 'idle';
    p.crouching = false;
    p.vx = p.vy = 0;
    p.y = App.GROUND;
    p.grounded = true;
    p.invuln = 0.5;
    p.x = App.clamp(p.x, 30, App.world.width - 30);
    if (Math.abs(p.x - x) < 90)
      App.dummy.x = App.clamp(
        p.x + (p.x < App.world.width / 2 ? 100 : -100),
        45,
        App.world.width - 45
      );
    App.resetCombo();
    App.updateChargeUI();
    App.game.state = 'fight';
    // The surprise form reveals a fresh health bar and earns a fresh phase clock.
    App.game.roundTime = 99;
    App.game.msg = null;
    App.game.t = 0;
    App.game.gongPlayed = false;
    App.resetInput();
  }
  function encounterSubtitle() {
    return App.game.round >= 4
      ? 'BLUE VELVET · BIG EGO. SMALL FUSE.'
      : App.game.round === 3
        ? 'R8 GOLDLINE · STAY LOW. JUMP THE DASH.'
        : App.game.round === 2
          ? 'DUMMY AWAKENED'
          : '';
  }
  Object.assign(App, {
    isR8,
    isTeddy,
    fighterMargin,
    configureOpponent,
    beginR8Transform,
    completeR8Transform,
    encounterSubtitle
  });
})(window.INJ);
