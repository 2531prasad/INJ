/* Original R8 moves. Boxes are world units; regular fighter boxes remain unchanged. */
(function (App) {
  'use strict';
  const R8_MOVES = {
    r8Dash: {
      startup: 0.24,
      active: 0.32,
      recovery: 0.48,
      dmg: 11,
      box: [30, -31, 42, 29],
      kb: 165,
      type: 'low',
      heavy: true,
      name: 'GOLDLINE DASH',
      drive: 480,
      frame: 1,
      prepare: 2
    },
    r8Jump: {
      startup: 0.26,
      active: 0.34,
      recovery: 0.48,
      dmg: 13,
      box: [-36, -74, 92, 82],
      kb: 145,
      type: 'high',
      heavy: true,
      knockdown: true,
      name: 'THRUSTER HOP',
      jump: -365,
      drive: 135,
      frame: 3,
      prepare: 2
    },
    r8Wheel: {
      startup: 0.28,
      active: 0.08,
      recovery: 0.5,
      dmg: 9,
      box: [0, 0, 0, 0],
      kb: 95,
      type: 'high',
      projectile: true,
      name: 'GOLD RIM DISC',
      frame: 5,
      prepare: 4
    },
    r8Rear: {
      startup: 0.32,
      active: 0.15,
      recovery: 0.6,
      dmg: 15,
      box: [15, -84, 65, 61],
      kb: 170,
      type: 'high',
      heavy: true,
      knockdown: true,
      name: 'REAR-UP STRIKE',
      drive: 90,
      frame: 10,
      prepare: 6
    },
    r8Piston: {
      startup: 0.16,
      active: 0.11,
      recovery: 0.3,
      dmg: 10,
      box: [18, -76, 55, 22],
      kb: 100,
      type: 'high',
      name: 'PISTON CROSS',
      drive: 65,
      frame: 10,
      prepare: 9
    },
    r8Axle: {
      startup: 0.25,
      active: 0.16,
      recovery: 0.43,
      dmg: 15,
      box: [18, -67, 68, 26],
      kb: 175,
      type: 'high',
      heavy: true,
      knockdown: true,
      name: 'AXLE BREAKER',
      frame: 11,
      prepare: 9
    },
    r8Upper: {
      startup: 0.18,
      active: 0.24,
      recovery: 0.48,
      dmg: 17,
      box: [5, -124, 70, 92],
      kb: 175,
      type: 'high',
      heavy: true,
      knockdown: true,
      name: 'JET UPPERCUT',
      drive: 240,
      jump: -270,
      frame: 12,
      prepare: 9
    },
    r8Dive: {
      startup: 0.34,
      active: 0.42,
      recovery: 0.6,
      dmg: 18,
      box: [-25, -60, 87, 66],
      kb: 185,
      type: 'high',
      heavy: true,
      knockdown: true,
      name: 'ORBITAL SLAM',
      jump: -405,
      drive: 150,
      frame: 13,
      prepare: 8
    },
    r8Lunge: {
      startup: 0.24,
      active: 0.27,
      recovery: 0.43,
      dmg: 12,
      box: [18, -78, 58, 32],
      kb: 145,
      type: 'high',
      heavy: true,
      name: 'BOOSTED CROSS',
      drive: 260,
      frame: 10,
      prepare: 9
    }
  };
  for (const [key, move] of Object.entries(R8_MOVES)) {
    App.MOVES[key] = { ...move, key, worldBox: true, mechanical: true };
  }
  // These are tuning parameters, not probabilities that select a winner.
  const LEVEL_TWO = {
    damage: 1.15,
    armor: 0.65,
    reaction: 0.9,
    speed: 170,
    rest: 0.75,
    restRange: 0.4,
    opening: 0.35,
    dodgeCooldown: 0.7,
    dodgeRest: 0.36
  };
  const R8_TUNING = {
    car: {
      health: 125,
      armor: 0.85,
      damage: 1.15,
      rest: 0.5,
      restRange: 0.4,
      dodge: 0.7
    },
    robot: {
      health: 140,
      armor: 0.75,
      damage: 1.35,
      speed: 250,
      rest: 0.42,
      restRange: 0.3,
      dodge: 0.92
    }
  };
  Object.assign(App, { R8_MOVES, R8_TUNING, LEVEL_TWO });
})(window.INJ);
