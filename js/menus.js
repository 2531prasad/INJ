/* menus.js — see docs/architecture.md for ownership and startup order.
 * Cross-module dependencies: content.js, controls.js, core.js, display.js, renderer.js, rounds.js, state.js.
 * App is the shared INJ namespace; the exported API is listed at the end. */
(function (App) {
  'use strict';
  const roastModal = document.getElementById('roastModal');

  const roastConversation = document.getElementById('roastConversation');

  const btnNextRoast = document.getElementById('btnNextRoast');

  function renderRoast() {
    const script = App.ROASTS[App.game.roastSet];
    roastConversation.replaceChildren();
    for (let i = Math.max(0, App.game.roastStep - 1); i <= App.game.roastStep; i++) {
      const [who, line] = script[i],
        bubble = document.createElement('div');
      bubble.className = 'speech ' + (who === 'INJ' ? 'inj' : 'cat');
      const speaker = document.createElement('div');
      speaker.className = 'speaker';
      if (who === 'INJ') {
        const avatar = document.createElement('img');
        avatar.src = 'inj_avatar.png';
        avatar.alt = '';
        speaker.append(avatar);
      }
      speaker.append(document.createTextNode(who === 'CAT' ? 'THE CAT' : 'INJ'));
      const words = document.createElement('p');
      words.textContent = line;
      bubble.append(speaker, words);
      roastConversation.append(bubble);
    }
    const progress = document.getElementById('roastProgress');
    progress.replaceChildren();
    for (let i = 0; i < script.length; i++) {
      const dot = document.createElement('span');
      if (i <= App.game.roastStep) dot.className = 'active';
      progress.append(dot);
    }
    progress.setAttribute(
      'aria-label',
      'Dialogue ' + (App.game.roastStep + 1) + ' of ' + script.length
    );
    btnNextRoast.textContent = App.game.roastStep === script.length - 1 ? 'FIGHT AGAIN' : 'NEXT';
    const catSpeaks = script[App.game.roastStep][0] === 'CAT';
    document.getElementById('catPortrait').classList.toggle('laughing', catSpeaks);
    App.Sfx.play(catSpeaks ? 'catlaugh' : 'ui');
  }

  function startRoast() {
    if (App.game.state === 'roast') return;
    App.game.state = 'roast';
    App.game.paused = true;
    App.game.msg = null;
    App.game.hitStop = 0;
    App.resetInput();
    App.game.roastSet = App.game.roastCount++ % App.ROASTS.length;
    App.game.roastStep = 0;
    document.getElementById('pauseOverlay').hidden = true;
    roastModal.hidden = false;
    App.Sfx.setMode('menu');
    renderRoast();
    btnNextRoast.focus({ preventScroll: true });
  }

  function advanceRoast() {
    if (App.game.state !== 'roast') return;
    App.Sfx.start();
    if (App.game.roastStep >= App.ROASTS[App.game.roastSet].length - 1) {
      finishRoast();
      return;
    }
    App.game.roastStep++;
    renderRoast();
  }

  function finishRoast() {
    if (App.game.state !== 'roast') return;
    App.resetRound({ advance: false });
    App.game.paused = false;
    App.clock.last = performance.now();
    App.Sfx.start();
    App.Sfx.setMode('menu');
    document.getElementById('btnPause').focus({ preventScroll: true });
  }

  const introModal = document.getElementById('introModal');

  const pauseOverlay = document.getElementById('pauseOverlay');

  const btnStartFight = document.getElementById('btnStartFight');

  const btnShowIntro = document.getElementById('btnShowIntro');

  const btnCloseIntro = document.getElementById('btnCloseIntro');

  const btnPause = document.getElementById('btnPause');

  const btnResume = document.getElementById('btnResume');

  const btnArenaMenu = document.getElementById('btnArenaMenu');

  let focusBeforeProfile = null;

  function syncAudioUI() {
    for (const btn of document.querySelectorAll('[data-audio]')) {
      const sound = btn.dataset.audio === 'sound',
        on = sound ? !App.Sfx.muted : App.Sfx.musicEnabled;
      btn.textContent = btn.closest('.pause-panel')
        ? (sound ? 'Sound ' : 'Music ') + (on ? 'on' : 'off')
        : (sound ? 'SOUND ' : 'MUSIC ') + (on ? 'ON' : 'OFF');
      btn.setAttribute('aria-pressed', String(on));
    }
  }

  function closeIntro() {
    App.Sfx.start();
    introModal.classList.add('hidden');
    if (!App.game.started) {
      App.game.started = true;
      App.game.t = 0;
      App.game.gongPlayed = false;
    }
    App.game.paused = false;
    pauseOverlay.hidden = true;
    btnArenaMenu.setAttribute('aria-expanded', 'false');
    App.resetInput();
    App.clock.last = performance.now();
    App.Sfx.setMode(App.game.state === 'fight' ? 'fight' : 'menu');
    btnPause.textContent = 'PAUSE';
    btnPause.setAttribute('aria-label', 'Pause game');
    if (focusBeforeProfile?.getClientRects().length)
      focusBeforeProfile.focus({ preventScroll: true });
    else btnArenaMenu.focus({ preventScroll: true });
  }

  function openIntro() {
    focusBeforeProfile = document.activeElement;
    App.game.paused = true;
    App.resetInput();
    App.Sfx.setMode('menu');
    pauseOverlay.hidden = true;
    btnArenaMenu.setAttribute('aria-expanded', 'false');
    introModal.classList.remove('hidden');
    btnStartFight.textContent = App.game.started ? 'RETURN TO FIGHT' : '▶ ENTER THE ARENA';
    btnStartFight.focus({ preventScroll: true });
  }

  function pauseGame() {
    if (!App.game.started || App.game.state === 'roast' || !introModal.classList.contains('hidden'))
      return;
    App.game.paused = true;
    App.resetInput();
    App.Sfx.setMode('menu');
    pauseOverlay.hidden = false;
    btnArenaMenu.setAttribute('aria-expanded', 'true');
    btnPause.textContent = 'RESUME';
    btnPause.setAttribute('aria-label', 'Resume game');
    if (!document.hidden) btnResume.focus({ preventScroll: true });
  }

  function resumeGame() {
    if (App.game.state === 'roast' || !introModal.classList.contains('hidden')) return;
    App.Sfx.start();
    App.game.paused = false;
    App.resetInput();
    App.clock.last = performance.now();
    pauseOverlay.hidden = true;
    btnArenaMenu.setAttribute('aria-expanded', 'false');
    App.Sfx.setMode(App.game.state === 'fight' ? 'fight' : 'menu');
    btnPause.textContent = 'PAUSE';
    btnPause.setAttribute('aria-label', 'Pause game');
    btnArenaMenu.focus({ preventScroll: true });
  }

  function restartGame() {
    App.game.round = 0;
    App.game.elapsed = 0;
    App.game.koTimer = 0;
    App.game.roastCount = 0;
    App.game.roastSet = 0;
    App.resetRound();
    resumeGame();
    App.render(0);
  }

  function showVictory() {
    const result = App.game.victory;
    document.getElementById('victoryRound').textContent = 'ROUND ' + result.round + ' CLEAR';
    document.getElementById('victoryOpponent').textContent = result.opponent + ' DEFEATED';
    document.getElementById('victoryHealth').textContent = result.health + ' / ' + result.maxHealth;
    document.getElementById('victoryCombo').textContent = result.bestCombo + ' HITS';
    document.getElementById('victoryPanel').hidden = false;
    document.getElementById('screen').classList.add('is-victory');
    App.Sfx.setMode('menu');
    document.getElementById('btnNextRound').focus({ preventScroll: true });
  }
  function hideVictory() {
    const panel = document.getElementById('victoryPanel'),
      returnFocus = panel.contains(document.activeElement);
    panel.hidden = true;
    document.getElementById('screen').classList.remove('is-victory');
    if (returnFocus) btnArenaMenu.focus({ preventScroll: true });
  }
  function initMenus() {
    btnNextRoast.addEventListener('click', advanceRoast);
    document.getElementById('btnNextRound').addEventListener('click', App.finishVictory);
    document.getElementById('btnSkipRoast').addEventListener('click', finishRoast);
    document.querySelectorAll('[data-audio]').forEach((btn) =>
      btn.addEventListener('click', () => {
        if (btn.dataset.audio === 'sound') App.Sfx.toggleMute();
        else App.Sfx.toggleMusic();
        if (App.game.started) App.Sfx.start();
        App.Sfx.play('ui');
        syncAudioUI();
      })
    );
    syncAudioUI();
    btnStartFight.addEventListener('click', closeIntro);
    btnShowIntro.addEventListener('click', openIntro);
    btnCloseIntro.addEventListener('click', closeIntro);
    btnPause.addEventListener('click', () => (App.game.paused ? resumeGame() : pauseGame()));
    btnArenaMenu.addEventListener('click', pauseGame);
    document.querySelector('[data-profile]').addEventListener('click', openIntro);
    btnResume.addEventListener('click', resumeGame);
    document.getElementById('btnRestart').addEventListener('click', restartGame);
    window.addEventListener('blur', () => {
      App.resetInput();
      if (App.game.started) pauseGame();
    });
    window.addEventListener('resize', () => {
      App.resetInput();
      App.fitArena();
    });
    window.visualViewport?.addEventListener('resize', App.fitArena);
    window.addEventListener('pagehide', () => {
      if (App.game.started) pauseGame();
      App.Sfx.suspend();
    });
    if (screen.orientation) screen.orientation.addEventListener('change', App.resetInput);
  }

  Object.assign(App, {
    roastModal,
    roastConversation,
    btnNextRoast,
    renderRoast,
    startRoast,
    advanceRoast,
    finishRoast,
    introModal,
    pauseOverlay,
    btnStartFight,
    btnShowIntro,
    btnCloseIntro,
    btnPause,
    btnResume,
    btnArenaMenu,
    syncAudioUI,
    closeIntro,
    openIntro,
    pauseGame,
    resumeGame,
    restartGame,
    showVictory,
    hideVictory,
    initMenus
  });
})(window.INJ);
