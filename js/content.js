/* content.js — see docs/architecture.md for ownership and startup order.
 * Cross-module dependencies: none.
 * App is the shared INJ namespace; the exported API is listed at the end. */
(function (App) {
  'use strict';
  /* ============================== palettes ============================== */
  const INJ_PAL = {
    robe: '#302c40',
    robeHi: '#696176',
    robeDk: '#191921',
    legB: '#1e1e27',
    legF: '#2b2b36',
    armB: '#202029',
    skin: '#ecdfc7',
    hood: '#22222c',
    hoodDk: '#111118',
    lips: '#8f2f38',
    eye: '#171720',
    gold: '#e9bb56',
    boot: '#121218'
  };
  const DUM_PAL = {
    robe: '#9c7c4c',
    robeHi: '#c2a066',
    robeDk: '#6b5231',
    legB: '#7b5f37',
    legF: '#9c7c4c',
    armB: '#84663c',
    skin: '#cbb287',
    hood: '#c9b086',
    hoodDk: '#8a7350',
    lips: '#4c3a24',
    eye: '#3c2c18',
    gold: '#b08c58',
    boot: '#4a3620'
  };

  /* ============================== moves ============================== */
  const MOVES = {
    jab: {
      startup: 0.035,
      active: 0.06,
      recovery: 0.14,
      dmg: 5,
      box: [16, -54, 32, 12],
      kb: 65,
      type: 'high',
      name: 'JAB'
    },
    straight: {
      startup: 0.055,
      active: 0.07,
      recovery: 0.22,
      dmg: 9,
      box: [16, -52, 40, 12],
      kb: 125,
      type: 'high',
      name: 'STRAIGHT'
    },
    cpunch: {
      startup: 0.045,
      active: 0.06,
      recovery: 0.18,
      dmg: 5,
      box: [14, -28, 32, 12],
      kb: 60,
      type: 'low',
      name: 'CROUCH PUNCH'
    },
    uppercut: {
      startup: 0.075,
      active: 0.09,
      recovery: 0.34,
      dmg: 16,
      box: [12, -74, 32, 40],
      kb: 195,
      heavy: true,
      knockdown: true,
      type: 'high',
      name: 'UPPERCUT'
    },
    roundhouse: {
      startup: 0.08,
      active: 0.09,
      recovery: 0.26,
      dmg: 11,
      box: [16, -54, 42, 18],
      kb: 155,
      heavy: true,
      knockdown: true,
      type: 'high',
      name: 'ROUNDHOUSE'
    },
    sweep: {
      startup: 0.065,
      active: 0.09,
      recovery: 0.28,
      dmg: 9,
      box: [14, -14, 44, 14],
      kb: 130,
      heavy: true,
      knockdown: true,
      type: 'low',
      name: 'LOW SWEEP'
    },
    jkick: {
      startup: 0.04,
      active: 0.22,
      recovery: 0.14,
      dmg: 13,
      box: [14, -18, 46, 38],
      kb: 175,
      heavy: true,
      knockdown: true,
      type: 'high',
      name: 'FLYING JUMP KICK'
    },
    jpunch: {
      startup: 0.04,
      active: 0.18,
      recovery: 0.14,
      dmg: 8,
      box: [14, -22, 38, 34],
      kb: 110,
      heavy: false,
      type: 'high',
      name: 'AIR PUNCH'
    },
    toss: {
      startup: 0.1,
      active: 0.06,
      recovery: 0.34,
      dmg: 10,
      box: [0, 0, 0, 0],
      kb: 115,
      projectile: true,
      type: 'high',
      name: 'SHADOW TOSS'
    },
    slide: {
      startup: 0.09,
      active: 0.23,
      recovery: 0.32,
      dmg: 12,
      box: [12, -18, 48, 18],
      kb: 135,
      heavy: true,
      knockdown: true,
      type: 'low',
      drive: 245,
      name: 'SHADOW SLIDE'
    },
    nitrokick: {
      startup: 0.06,
      active: 0.16,
      recovery: 0.26,
      dmg: 24,
      box: [10, -70, 48, 64],
      kb: 190,
      heavy: true,
      knockdown: true,
      type: 'high',
      meter: 100,
      drive: 660,
      name: 'NITRO KICK'
    },
    haymaker: {
      startup: 0.28,
      active: 0.12,
      recovery: 0.42,
      dmg: 7,
      box: [12, -50, 40, 18],
      kb: 90,
      type: 'high',
      name: 'HAYMAKER'
    }
  };
  Object.entries(MOVES).forEach(([key, move]) => {
    move.key = key;
  });
  const ROASTS = [
    [
      ['CAT', 'HAHA. You brought a gold ring to a fight and still got pawned.'],
      ['INJ', 'That dummy is literally cheating.'],
      ['CAT', "And somehow YOU'RE still the least convincing fighter here."],
      ['INJ', 'I was testing its moves.'],
      ['CAT', 'Perfect. Every single one works on you.']
    ],
    [
      ['CAT', 'Warrior of the shadows? You spent that round fighting the floor.'],
      ['INJ', 'I was studying the matchup.'],
      ['CAT', "First lesson: the wooden one wasn't supposed to be you."],
      ['INJ', "One more round. I've got this."],
      ['CAT', "You've got a hood, a ring, and a very generous respawn policy."]
    ],
    [
      ['CAT', "I'm lying down and still showing better footwork."],
      ['INJ', "You didn't even see my combo."],
      ['CAT', 'I did. You, the floor, then the floor again.'],
      ['INJ', 'MiMi, please stop.'],
      ['CAT', "You feed me every day. Now you're feeding the dummy free wins."]
    ]
  ];

  Object.assign(App, { INJ_PAL, DUM_PAL, MOVES, ROASTS });
})(window.INJ);
