/* Real plates, encounter selection, resize/fallback and visual review captures. */
const path = require('node:path');
module.exports = async function verifyStages(page, check, root) {
  await page.waitForFunction(() => INJ.arenaStages.every((s) => s.image.naturalWidth > 0));
  const results = await page.evaluate(() => {
    const a = INJ,
      out = {},
      hashes = [];
    function pixels() {
      return Array.from(a.bgx.getImageData(0, 0, a.bg.width, a.bg.height).data)
        .filter((_, i) => i % 397 === 0)
        .join();
    }
    const random = a.rnd;
    let rolls = 0;
    a.rnd = () => {
      rolls++;
      return 0.5;
    };
    try {
      out.fiveHighQualityPlates =
        a.arenaStages.length === 5 &&
        a.arenaStages.every(
          (s) =>
            s.image.naturalWidth >= 1500 &&
            Math.abs(s.image.naturalWidth / s.image.naturalHeight - 16 / 9) < 0.01
        );
      for (const round of [1, 2, 3, 4]) {
        a.game.round = round - 1;
        a.resetRound();
        a.game.paused = true;
        hashes.push(pixels());
        out['stageMatchesEncounter' + round] =
          a.arenaStage().id === ['training', 'awakened', 'goldline', 'velvet'][round - 1];
        a.resetRound({ advance: false });
        out['retryKeepsStage' + round] = pixels() === hashes[round - 1];
        if (round === 3) {
          a.completeR8Transform();
          out.transformationKeepsFoundry =
            a.arenaStage().id === 'goldline' && pixels() === hashes[2];
        }
      }
      out.distinctStagePixels = new Set(hashes).size === 4;
      a.game.round = 8;
      a.paintArena();
      out.laterGiantKeepsKingdom = a.arenaStage().id === 'giants' && pixels() !== hashes[3];
      const giantPixels = pixels();
      a.arenaStages[0].image.onload();
      out.lateLoadCannotReplaceCurrentStage = pixels() === giantPixels;
      const stage = a.arenaStage(),
        image = stage.image;
      try {
        stage.image = new Image();
        a.paintArena();
        out.immediateLocalFallback =
          pixels() !== giantPixels && a.bgx.getImageData(0, 0, 1, 1).data[3] === 255;
      } finally {
        stage.image = image;
        a.paintArena();
      }
      out.cosmeticsUseNoCombatRandomness = rolls === 0;
      out.duelOnlyInSanctum =
        !a.arenaStages[0].duel &&
        a.arenaStages[1].duel &&
        !a.arenaStages[2].duel &&
        !a.arenaStages[3].duel &&
        !a.arenaStages[4].duel;
    } finally {
      a.rnd = random;
      a.game.round = 0;
      a.resetRound();
      a.game.paused = true;
    }
    return out;
  });
  for (const [name, passed] of Object.entries(results)) check(passed, `Stages: ${name}`);
  for (const viewport of [
    { width: 1100, height: 720 },
    { width: 390, height: 844 }
  ]) {
    await page.setViewportSize(viewport);
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );
    for (const round of [1, 2, 3, 4]) {
      await page.evaluate((round) => {
        const a = INJ;
        a.game.round = round - 1;
        a.resetRound();
        a.game.state = 'fight';
        a.game.paused = true;
        a.game.msg = null;
        a.player.x = a.world.width * 0.31;
        a.dummy.x = a.world.width * 0.69;
        a.render(6000);
      }, round);
      await page.screenshot({
        path: path.join(
          root,
          `artifacts/stage-${round}-${viewport.width === 390 ? 'phone' : 'desktop'}.png`
        )
      });
    }
  }
  await page.evaluate(() => {
    INJ.game.round = 0;
    INJ.resetRound();
    INJ.game.paused = true;
  });
};
