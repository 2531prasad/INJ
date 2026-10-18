/* INJ audio: an original, clock-scheduled arcade score and a shared synth palette.
   No samples, downloads or autoplay. Audio is unlocked by the first player gesture. */
(function () {
  'use strict';
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);
  const STEP = 60 / 112 / 4;
  const ROOTS = [38, 38, 34, 36, 38, 41, 34, 33];
  const BASS = [0, null, 0, 12, null, 0, 7, null, 0, null, 12, null, 7, 0, null, 12];
  const MELODIES = [
    [74,null,null,77,null,null,81,null,79,null,77,null,76,null,null,null],
    [74,null,69,null,null,null,72,null,74,null,null,null,null,null,null,null],
    [77,null,null,81,null,null,84,null,81,null,79,null,77,null,null,null],
    [76,null,null,73,null,null,69,null,73,null,76,null,73,null,null,null]
  ];
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem('inj-audio') || '{}') || {}; } catch (_) {}

  const Audio = {
    ctx: null, started: false, muted: stored.muted === true,
    musicEnabled: stored.music !== false, mode: 'menu', intensity: false,
    timer: null, step: 0, nextTime: 0, voices: new Set(),
    init() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        try {
          const c = this.ctx = new AC({ latencyHint: 'interactive' });
          this.master = c.createGain();
          this.master.gain.value = this.muted ? 0 : .72;
          const limiter = c.createDynamicsCompressor();
          limiter.threshold.value = -12; limiter.knee.value = 8;
          limiter.ratio.value = 5; limiter.attack.value = .003; limiter.release.value = .12;
          const highpass = c.createBiquadFilter();
          highpass.type = 'highpass'; highpass.frequency.value = 35;
          this.master.connect(highpass); highpass.connect(limiter); limiter.connect(c.destination);
          this.music = c.createGain(); this.music.gain.value = 0;
          this.effects = c.createGain(); this.effects.gain.value = .82;
          this.music.connect(this.master); this.effects.connect(this.master);
          // A short musical echo adds space without smearing the combat transients.
          this.send = c.createGain(); this.send.gain.value = .17;
          const delay = c.createDelay(1); delay.delayTime.value = STEP * 3;
          const feedback = c.createGain(); feedback.gain.value = .24;
          const lowpass = c.createBiquadFilter(); lowpass.frequency.value = 2400;
          this.send.connect(delay); delay.connect(lowpass); lowpass.connect(this.music);
          lowpass.connect(feedback); feedback.connect(delay);
          this.noiseBuffer = c.createBuffer(1, c.sampleRate, c.sampleRate);
          const data = this.noiseBuffer.getChannelData(0);
          let seed = 1993;
          for (let i = 0; i < data.length; i++) {
            seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
            data[i] = (seed >>> 0) / 2147483648 - 1;
          }
        } catch (_) { this.ctx = null; return false; }
      }
      if (this.ctx.state === 'suspended' || this.ctx.state === 'interrupted') {
        this.ctx.resume().catch(() => {});
      }
      return true;
    },
    start() {
      if (!this.init()) return;
      this.started = true;
      this.mix();
      if (!this.timer) {
        this.nextTime = this.ctx.currentTime + .06;
        this.timer = setInterval(() => this.schedule(), 25);
        this.schedule();
      }
    },
    save() {
      try { localStorage.setItem('inj-audio', JSON.stringify({ muted: this.muted, music: this.musicEnabled })); } catch (_) {}
    },
    ramp(param, value, time = .045) {
      if (!this.ctx) return;
      param.cancelScheduledValues(this.ctx.currentTime);
      param.setTargetAtTime(value, this.ctx.currentTime, time);
    },
    mix() {
      if (!this.ctx) return;
      this.ramp(this.master.gain, this.muted ? 0 : .72);
      this.ramp(this.music.gain, !this.musicEnabled ? 0 : this.mode === 'fight' ? .58 : .24, .12);
    },
    setMode(mode) { if (this.mode !== mode) { this.mode = mode; this.mix(); } },
    toggleMute() { this.init(); this.muted = !this.muted; this.mix(); this.save(); },
    toggleMusic() { this.init(); this.musicEnabled = !this.musicEnabled; this.mix(); this.save(); },
    suspend() {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => {});
    },
    track(source, nodes, at, duration) {
      this.voices.add(source);
      source.onended = () => {
        source.disconnect(); nodes.forEach(node => node.disconnect()); this.voices.delete(source);
      };
      source.start(at); source.stop(at + duration + .025);
    },
    tone(at, frequency, endFrequency, duration, type, volume, bus, cutoff = 5000, echo = false) {
      const c = this.ctx, osc = c.createOscillator(), gain = c.createGain();
      const filter = c.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = cutoff;
      osc.type = type; osc.frequency.setValueAtTime(Math.max(20, frequency), at);
      if (endFrequency !== frequency) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), at + duration);
      gain.gain.setValueAtTime(.0001, at);
      gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), at + .003);
      gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
      osc.connect(filter); filter.connect(gain); gain.connect(bus);
      if (echo) gain.connect(this.send);
      this.track(osc, [filter, gain], at, duration);
    },
    noise(at, duration, frequency, volume, bus, type = 'highpass') {
      const c = this.ctx, source = c.createBufferSource(), gain = c.createGain(), filter = c.createBiquadFilter();
      source.buffer = this.noiseBuffer;
      filter.type = type; filter.frequency.value = frequency; filter.Q.value = .65;
      gain.gain.setValueAtTime(.0001, at);
      gain.gain.exponentialRampToValueAtTime(volume, at + .002);
      gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
      source.connect(filter); filter.connect(gain); gain.connect(bus);
      this.track(source, [filter, gain], at, duration);
    },
    kick(at, volume = .4, bus = this.music) {
      this.tone(at, 155, 46, .16, 'sine', volume, bus);
      this.tone(at, 85, 50, .095, 'triangle', volume * .35, bus, 1000);
      this.noise(at, .012, 2800, volume * .18, bus);
    },
    schedule() {
      if (!this.ctx || this.ctx.state !== 'running') return;
      // Recover gracefully from a throttled tab, without emitting a backlog of notes.
      if (this.nextTime < this.ctx.currentTime) this.nextTime = this.ctx.currentTime + .025;
      while (this.nextTime < this.ctx.currentTime + .12) {
        if (this.musicEnabled && !this.muted) this.sequence(this.step, this.nextTime);
        this.step = (this.step + 1) % 256;
        this.nextTime += STEP;
      }
    },
    sequence(step, at) {
      const s = step % 16, bar = Math.floor(step / 16), root = ROOTS[bar % 8];
      // Tight drum machine, syncopated triangle bass, restrained pulse arpeggio.
      if ([0, 6, 8].includes(s) || (bar % 4 === 3 && s === 14)) this.kick(at, .38);
      if (s === 4 || s === 12) {
        this.noise(at, .115, 1500, .16, this.music, 'bandpass');
        this.tone(at, 185, 125, .08, 'triangle', .09, this.music, 1800);
      }
      if (s % 2 === 0 || (bar % 4 === 3 && s > 12)) {
        this.noise(at, s === 14 ? .09 : .025, 6500, s % 4 === 0 ? .045 : .026, this.music);
      }
      if (BASS[s] !== null) {
        const f = midi(root + BASS[s]);
        this.tone(at, f, f, STEP * .86, 'triangle', .22, this.music, 1600);
        this.tone(at, f * 2, f * 2, STEP * .55, 'square', .025, this.music, 900);
      }
      if (s % 2 === 1) {
        const intervals = [0, 7, 12, 15, 19, 12, 7, 15];
        const f = midi(root + 24 + intervals[Math.floor(s / 2)]);
        this.tone(at, f, f, .095, 'square', .026, this.music, 2100, true);
      }
      // Call-and-response melody, with breathing room on alternating bars.
      const melody = MELODIES[Math.floor(bar / 2) % 4];
      const note = melody[s];
      if (note !== null && (bar % 2 === 0 || s < 8)) {
        const f = midi(note);
        this.tone(at, f, f, STEP * 1.65, 'triangle', .11, this.music, 3800, true);
        this.tone(at, f * 2, f * 2, .055, 'sine', .025, this.music, 5000);
      }
      if (this.intensity && s % 4 === 2) {
        const f = midi(root + 36 + (s === 6 ? 7 : 0));
        this.tone(at, f, f, .07, 'square', .02, this.music, 2500, true);
      }
    },
    play(type) {
      if (!this.ctx || this.ctx.state !== 'running' || this.muted) return;
      const at = this.ctx.currentTime + .004, bus = this.effects;
      const tone = (offset, f1, f2, d, wave, vol, cutoff) => this.tone(at + offset, f1, f2, d, wave, vol, bus, cutoff);
      const noise = (offset, d, f, vol, filter) => this.noise(at + offset, d, f, vol, bus, filter);
      switch (type) {
        case 'swing': noise(0, .045, 1900, .09, 'bandpass'); break;
        case 'jump': tone(0, 170, 420, .095, 'triangle', .11, 1600); break;
        case 'punch':
          noise(0, .032, 2400, .27); tone(0, 175, 64, .085, 'triangle', .42, 1800); break;
        case 'kick':
          noise(0, .045, 1700, .32); this.kick(at, .52, bus); break;
        case 'uppercut':
          noise(0, .065, 1800, .38); tone(0, 245, 52, .19, 'triangle', .53, 2500);
          tone(.014, 98, 42, .22, 'sine', .42); break;
        case 'jumpkick':
          noise(0, .05, 2200, .34); tone(0, 220, 65, .14, 'triangle', .5, 2300); break;
        case 'block':
          noise(0, .022, 3500, .18); tone(0, 1174.66, 1100, .07, 'square', .085, 3500);
          tone(0, 1760, 1700, .045, 'sine', .13); break;
        case 'toss':
          noise(0, .13, 1600, .13, 'bandpass'); tone(0, 587.33, 146.83, .21, 'triangle', .24, 3000);
          tone(.025, 880, 220, .16, 'sine', .08); break;
        case 'shadow':
          tone(0, 146.83, 73.42, .23, 'triangle', .4, 1600);
          noise(0, .09, 1200, .22, 'bandpass'); tone(.03, 880, 440, .2, 'sine', .12); break;
        case 'charge':
          [74,77,81].forEach((n,i) => tone(i*.045, midi(n), midi(n), .16, 'sine', .13)); break;
        case 'gong':
          [146.83,294.4,441.8].forEach((f,i) => tone(0, f, f*.998, .8-i*.16, 'sine', .22/(i+1))); break;
        case 'finish':
          [74,77,81,86].forEach((n,i) => tone(i*.075, midi(n), midi(n), .45, 'triangle', .15, 2600));
          this.kick(at, .4, bus); break;
        case 'fall':
          noise(0, .045, 850, .16, 'lowpass'); tone(0, 115, 48, .1, 'triangle', .28, 1500); break;
        case 'ui': tone(0, 880, 1174.66, .045, 'sine', .13); break;
        case 'catlaugh':
          // Four short arcade chuckles, keeping the same synth timbre as the score.
          [0,.13,.27,.43].forEach((offset,i)=>{
            tone(offset,310-i*18,180-i*10,.085,'triangle',.16,1800);
            tone(offset+.018,620-i*24,410-i*18,.055,'sine',.055,2600);
            noise(offset,.026,1100,.035,'bandpass');
          });break;
      }
      if (['uppercut', 'jumpkick', 'shadow', 'finish'].includes(type) && this.musicEnabled) {
        // Make room for a heavy hit, then let the score return smoothly.
        const level = this.mode === 'fight' ? .58 : .24;
        this.music.gain.cancelScheduledValues(at);
        this.music.gain.setValueAtTime(level * .52, at);
        this.music.gain.setTargetAtTime(level, at + .09, .09);
      }
    }
  };
  window.InjAudio = Audio;
})();
