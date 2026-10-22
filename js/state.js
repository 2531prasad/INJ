/* state.js — see docs/architecture.md for ownership and startup order.
 * Cross-module dependencies: content.js, core.js.
 * App is the shared INJ namespace; the exported API is listed at the end. */
(function (App) {
  'use strict';
  /* ============================== fighters ============================== */
  function makeFighter(o) {
    return {
      name: o.name,
      kind: o.kind,
      pal: o.pal,
      x: o.x,
      y: App.GROUND,
      facing: o.facing,
      hp: o.hp,
      maxHp: o.hp,
      state: 'idle',
      anim: 0,
      walkPhase: 0,
      grounded: true,
      vx: 0,
      vy: 0,
      atk: null,
      hitstun: 0,
      flash: 0,
      knockT: 0,
      invuln: 0,
      comboStep: 0,
      comboTimer: 0,
      fallT: 0,
      crouching: false,
      aiT: 0.4,
      blockT: 0,
      counterMove: null,
      pose: null,
      charge: 0,
      meter: 0,
      teleport: null,
      teleportCooldown: 0,
      teddyScale: 1,
      tiny: false,
      giant: false,
      summoned: false,
      summonRetreatT: 0,
      shrinkUsed: false,
      shrinkDelay: -1,
      dodgeT: 0,
      dodgeCooldown: 0,
      dodgeFrom: 0,
      dodgeTo: 0,
      rushStep: 0,
      restT: 0,
      openingT: 0,
      burstLeft: 0,
      lastThreat: null,
      observedMove: null,
      repeatedMove: null,
      repeatCount: 0,
      lowMemoryT: 0,
      reactionT: 0,
      lastMissile: null,
      evadeTextT: 0
    };
  }

  const player = makeFighter({
    name: 'INJ',
    kind: 'inj',
    pal: App.INJ_PAL,
    x: App.world.width / 2 - 56,
    facing: 1,
    hp: 120
  });
  const dummy = makeFighter({
    name: 'DUMMY',
    kind: 'dummy',
    pal: App.DUM_PAL,
    x: App.world.width / 2 + 56,
    facing: -1,
    hp: 130
  });

  /* ============================== fx pools ============================== */
  const particles = [];
  const projectiles = [];
  const afterimages = [];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const game = {
    state: 'intro',
    t: 0,
    roundTime: 99,
    msg: null,
    hitStop: 0,
    shake: 0,
    shakeX: 0,
    shakeY: 0,
    koTimer: 0,
    victory: null,
    bestCombo: 0,
    hits: 0,
    hitTimer: 0,
    round: 1,
    paused: true,
    started: false,
    elapsed: 0,
    lost: false,
    roastCount: 0,
    roastStep: 0,
    roastSet: 0
  };
  const giantEncounter = {
    minion: null,
    hazards: [],
    impact: null,
    hpTrail: 0,
    revealPlayed: false
  };
  const isAwakened = (f) => f.kind === 'dummy' && ((f === dummy && game.round >= 2) || f.summoned);

  Object.assign(App, {
    makeFighter,
    player,
    dummy,
    particles,
    projectiles,
    afterimages,
    reducedMotion,
    game,
    giantEncounter,
    isAwakened
  });
})(window.INJ);
