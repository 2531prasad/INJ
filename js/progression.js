/* Versioned local progression. Runtime dependencies: state.js, rounds.js, encounters.js.
 * Initialized by menus.js after registration; no actor snapshots or per-frame writes. */
(function (App) {
  'use strict';
  const SAVE_KEY = 'inj-progress';
  let loaded = false;
  let writable = true;
  const level = (value, fallback = 1) =>
    Number.isInteger(value) ? App.clamp(value, 1, 5) : fallback;
  const count = (value) => Number.isSafeInteger(value) && value >= 0 ? Math.min(value, 1e9) : 0;
  function loadProgress() {
    if (loaded) return;
    loaded = true;
    try {
      const record = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (record && record.version > 1) writable = false;
      else if (record && record.version === 1) {
        const cleared = Array.isArray(record.clearedLevels)
          ? [...new Set(record.clearedLevels.filter(n => Number.isInteger(n) && n >= 1 && n <= 5))].sort()
          : [];
        const checkpoint = level(record.checkpointLevel);
        Object.assign(App.progress, {
          checkpointLevel: checkpoint,
          highestLevel: Math.max(checkpoint, level(record.highestLevel), ...cleared),
          clearedLevels: cleared,
          wins: count(record.wins),
          losses: count(record.losses),
          bestCombo: count(record.bestCombo),
          unlocks: { colossusBurst: record.unlocks?.colossusBurst === true || cleared.includes(5) }
        });
      }
    } catch (_) {
      // Corrupt data or blocked browser storage must never prevent play.
    }
    App.game.round = App.progress.checkpointLevel - 1;
    App.resetRound();
    syncProgressUI();
  }
  function saveProgress() {
    if (!loaded || !writable) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(App.progress)); } catch (_) {}
  }
  function checkpointProgress() {
    if (!loaded) return;
    App.progress.checkpointLevel = level(App.game.round);
    App.progress.highestLevel = Math.max(App.progress.highestLevel, App.progress.checkpointLevel);
    saveProgress();
    syncProgressUI();
  }
  function recordRoundResult(won) {
    const p = App.progress;
    const completed = level(App.game.round);
    let newUnlock = false;
    if (won) {
      p.wins = count(p.wins + 1);
      if ((!App.isGiant(App.dummy) || App.dummy.hp <= 0) && !p.clearedLevels.includes(completed))
        p.clearedLevels.push(completed);
      p.clearedLevels.sort();
      // Entering a cheat stage or killing an echo cannot earn this reward.
      if (App.isGiant(App.dummy) && App.dummy.hp <= 0 && !p.unlocks.colossusBurst) {
        p.unlocks.colossusBurst = true;
        newUnlock = true;
      }
      p.checkpointLevel = Math.min(completed + 1, 5);
    } else {
      p.losses = count(p.losses + 1);
      p.checkpointLevel = completed;
    }
    p.highestLevel = Math.max(p.highestLevel, p.checkpointLevel);
    p.bestCombo = Math.max(p.bestCombo, count(App.game.bestCombo));
    saveProgress();
    syncProgressUI();
    return newUnlock;
  }
  function syncProgressUI() {
    const node = document.getElementById('passiveStatus');
    if (node) {
      node.hidden = !App.progress.unlocks.colossusBurst;
      node.textContent = 'COLOSSUS BURST · UNLOCKED';
    }
  }
  Object.assign(App, { SAVE_KEY, loadProgress, saveProgress, checkpointProgress, recordRoundResult, syncProgressUI });
})(window.INJ);
