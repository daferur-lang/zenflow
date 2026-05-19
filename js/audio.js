/* ============================================
   ZENFLOW — Motor de Audio (Web Audio API)
   ============================================ */

const ZenAudio = (() => {
  let ctx = null;
  let masterGain = null;
  let analyser = null;
  const activeSounds = {};
  let binauralActive = null;

  // ---- Inicialización (requiere gesto del usuario) ----
  function init() {
    if (ctx) return ctx;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.7;
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.85;
    masterGain.connect(analyser);
    analyser.connect(ctx.destination);
    return ctx;
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function setMasterVolume(v) {
    if (!masterGain) return;
    masterGain.gain.setTargetAtTime(v / 100, ctx.currentTime, 0.05);
    updateVolumeSliderStyle(v);
  }

  function updateVolumeSliderStyle(v) {
    const slider = document.getElementById('master-vol');
    if (slider) slider.style.background =
      `linear-gradient(90deg, var(--purple) ${v}%, rgba(255,255,255,0.1) ${v}%)`;
  }

  // ---- Cuenco Tibetano ----
  function playBowl(freq = 432, duration = 8) {
    if (!ctx) return;
    const t = ctx.currentTime;

    // Sonido fundamental + armónicos
    const harmonics = [1, 2.756, 5.404];
    const gains_db = [1, 0.4, 0.15];
    const nodes = [];

    harmonics.forEach((mult, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq * mult;

      // Ligero vibrato
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 5 + i;
      lfoGain.gain.value = 2;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(t);
      lfo.stop(t + duration);

      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gains_db[i] * 0.8, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(g);
      g.connect(masterGain);
      osc.start(t);
      osc.stop(t + duration);
      nodes.push(osc, g, lfo, lfoGain);
    });

    return nodes;
  }

  // ---- Tambor chamánico ----
  function createDrum(bpm = 60) {
    if (!ctx) return null;
    const intervalMs = 60000 / bpm;
    let running = true;

    function hit() {
      if (!running || !ctx) return;
      const t = ctx.currentTime;
      const bufSize = Math.floor(ctx.sampleRate * 0.6);
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);

      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 5);
      }

      const src = ctx.createBufferSource();
      src.buffer = buf;

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 180;
      lp.Q.value = 0.8;

      const g = ctx.createGain();
      g.gain.setValueAtTime(1, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      src.connect(lp);
      lp.connect(g);
      g.connect(masterGain);
      src.start(t);
    }

    hit();
    const timer = setInterval(() => { if (running) hit(); }, intervalMs);
    return { stop: () => { running = false; clearInterval(timer); } };
  }

  // ---- Lluvia ----
  function createRain(intensity = 0.6) {
    if (!ctx) return null;
    const bufSize = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(2, bufSize, ctx.sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 600;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 14000;

    const g = ctx.createGain();
    g.gain.value = intensity * 0.4;

    // LFO para variación de intensidad
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.frequency.value = 0.08;
    lfoG.gain.value = 0.1;
    lfo.connect(lfoG);
    lfoG.connect(g.gain);
    lfo.start();

    src.connect(hp);
    hp.connect(lp);
    lp.connect(g);
    g.connect(masterGain);
    src.start();

    return { stop: () => { src.stop(); lfo.stop(); } };
  }

  // ---- Océano ----
  function createOcean() {
    if (!ctx) return null;
    const bufSize = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(2, bufSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 800;

    const g = ctx.createGain();
    g.gain.value = 0.5;

    // Olas — LFO lento sobre el filtro
    const lfo1 = ctx.createOscillator();
    const lfoG1 = ctx.createGain();
    lfo1.frequency.value = 0.12;
    lfoG1.gain.value = 400;
    lfo1.connect(lfoG1);
    lfoG1.connect(lp.frequency);
    lfo1.start();

    // LFO de volumen para simular olas
    const lfo2 = ctx.createOscillator();
    const lfoG2 = ctx.createGain();
    lfo2.frequency.value = 0.08;
    lfoG2.gain.value = 0.2;
    lfo2.connect(lfoG2);
    lfoG2.connect(g.gain);
    lfo2.start();

    src.connect(lp);
    lp.connect(g);
    g.connect(masterGain);
    src.start();

    return { stop: () => { src.stop(); lfo1.stop(); lfo2.stop(); } };
  }

  // ---- Bosque (pájaros + viento) ----
  function createForest() {
    if (!ctx) return null;
    const nodes = [];

    // Viento de fondo
    const bSize = ctx.sampleRate * 4;
    const bBuf = ctx.createBuffer(1, bSize, ctx.sampleRate);
    const bData = bBuf.getChannelData(0);
    for (let i = 0; i < bSize; i++) bData[i] = Math.random() * 2 - 1;
    const wind = ctx.createBufferSource();
    wind.buffer = bBuf;
    wind.loop = true;
    const windLp = ctx.createBiquadFilter();
    windLp.type = 'bandpass';
    windLp.frequency.value = 300;
    windLp.Q.value = 0.3;
    const windG = ctx.createGain();
    windG.gain.value = 0.08;
    wind.connect(windLp);
    windLp.connect(windG);
    windG.connect(masterGain);
    wind.start();
    nodes.push({ stop: () => wind.stop() });

    // Pájaros — osciladores aleatorios
    function chirp() {
      if (!ctx) return;
      const t = ctx.currentTime;
      const baseFreq = 1200 + Math.random() * 2000;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.linearRampToValueAtTime(baseFreq * 1.5, t + 0.1);
      osc.frequency.linearRampToValueAtTime(baseFreq * 1.2, t + 0.2);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.15, t + 0.05);
      g.gain.linearRampToValueAtTime(0, t + 0.3);

      osc.connect(g);
      g.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.35);
    }

    let chirping = true;
    function scheduleChirps() {
      if (!chirping) return;
      chirp();
      if (Math.random() > 0.4) setTimeout(chirp, 150 + Math.random() * 200);
      setTimeout(scheduleChirps, 800 + Math.random() * 3000);
    }
    scheduleChirps();

    return {
      stop: () => {
        chirping = false;
        nodes.forEach(n => n.stop());
      }
    };
  }

  // ---- Fuego ----
  function createFire() {
    if (!ctx) return null;
    const bufSize = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1200;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 80;

    const g = ctx.createGain();
    g.gain.value = 0.25;

    // Crackles — LFO irregular
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.frequency.value = 7 + Math.random() * 3;
    lfoG.gain.value = 0.1;
    lfo.connect(lfoG);
    lfoG.connect(g.gain);
    lfo.start();

    src.connect(hp);
    hp.connect(lp);
    lp.connect(g);
    g.connect(masterGain);
    src.start();

    return { stop: () => { src.stop(); lfo.stop(); } };
  }

  // ---- Cuencos continuos (bucle) ----
  function createBowlLoop(freq = 432, bpm = 12) {
    if (!ctx) return null;
    let running = true;
    const interval = 60000 / bpm;

    function ring() {
      if (!running) return;
      playBowl(freq, 6);
    }

    ring();
    const timer = setInterval(() => { if (running) ring(); }, interval);
    return { stop: () => { running = false; clearInterval(timer); } };
  }

  // ---- Pad Ambient ----
  function createAmbientPad(chord = [130.8, 164.8, 196, 261.6]) {
    if (!ctx) return null;
    const oscs = chord.map((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      // Ligero detune para riqueza
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = freq * 1.002;

      const g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.06 / (i + 1), ctx.currentTime + 3);

      osc.connect(g);
      osc2.connect(g);
      g.connect(masterGain);
      osc.start();
      osc2.start();
      return { osc, osc2, g };
    });

    return {
      stop: () => {
        oscs.forEach(({ osc, osc2, g }) => {
          g.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
          setTimeout(() => { osc.stop(); osc2.stop(); }, 1500);
        });
      }
    };
  }

  // ---- Beats Binaurales ----
  function createBinaural(beatFreq = 6, baseFreq = 200) {
    if (!ctx) return null;

    // Necesitamos canal izq + canal der separados
    const splitter = ctx.createChannelSplitter(2);
    const merger = ctx.createChannelMerger(2);

    const leftOsc = ctx.createOscillator();
    const rightOsc = ctx.createOscillator();
    leftOsc.type = 'sine';
    rightOsc.type = 'sine';
    leftOsc.frequency.value = baseFreq;
    rightOsc.frequency.value = baseFreq + beatFreq;

    const leftG = ctx.createGain();
    const rightG = ctx.createGain();
    leftG.gain.value = 0;
    rightG.gain.value = 0;

    // Fade in
    const t = ctx.currentTime;
    leftG.gain.linearRampToValueAtTime(0.3, t + 2);
    rightG.gain.linearRampToValueAtTime(0.3, t + 2);

    // Enrutamiento stereo: izq → canal 0, der → canal 1
    const panLeft = ctx.createStereoPanner();
    const panRight = ctx.createStereoPanner();
    panLeft.pan.value = -1;
    panRight.pan.value = 1;

    leftOsc.connect(leftG);
    leftG.connect(panLeft);
    panLeft.connect(masterGain);

    rightOsc.connect(rightG);
    rightG.connect(panRight);
    panRight.connect(masterGain);

    leftOsc.start();
    rightOsc.start();

    return {
      stop: () => {
        const t = ctx.currentTime;
        leftG.gain.linearRampToValueAtTime(0, t + 1.5);
        rightG.gain.linearRampToValueAtTime(0, t + 1.5);
        setTimeout(() => { leftOsc.stop(); rightOsc.stop(); }, 1600);
      }
    };
  }

  // ---- API pública de sonidos ----
  const SOUNDS = {
    rain:   { label: 'Lluvia',     icon: '🌧',  create: () => createRain() },
    ocean:  { label: 'Océano',     icon: '🌊',  create: () => createOcean() },
    forest: { label: 'Bosque',     icon: '🌿',  create: () => createForest() },
    fire:   { label: 'Hoguera',    icon: '🔥',  create: () => createFire() },
    bowl1:  { label: 'Cuenco 432', icon: '🔔',  create: () => createBowlLoop(432, 10) },
    bowl2:  { label: 'Cuenco 528', icon: '🪘',  create: () => createBowlLoop(528, 8) },
    drum:   { label: 'Tambores',   icon: '🥁',  create: () => createDrum(72) },
    pad:    { label: 'Ambiente',   icon: '🎹',  create: () => createAmbientPad() },
  };

  const BINAURALS = [
    { id: 'delta', hz: 2,  label: 'Delta',  desc: 'Sueño profundo · 0–4 Hz',   base: 180 },
    { id: 'theta', hz: 6,  label: 'Theta',  desc: 'Meditación profunda · 4–8 Hz', base: 200 },
    { id: 'alpha', hz: 10, label: 'Alpha',  desc: 'Relajación · 8–13 Hz',      base: 210 },
    { id: 'gamma', hz: 40, label: 'Gamma',  desc: 'Claridad mental · 30–50 Hz', base: 220 },
  ];

  function toggleSound(id) {
    if (!ctx) init();
    resume();
    if (activeSounds[id]) {
      activeSounds[id].stop();
      delete activeSounds[id];
      return false;
    } else {
      const def = SOUNDS[id];
      if (def) activeSounds[id] = def.create();
      return true;
    }
  }

  function toggleBinaural(id) {
    if (!ctx) init();
    resume();
    if (binauralActive && binauralActive.id === id) {
      binauralActive.node.stop();
      binauralActive = null;
      return false;
    }
    if (binauralActive) {
      binauralActive.node.stop();
    }
    const def = BINAURALS.find(b => b.id === id);
    if (def) {
      binauralActive = { id, node: createBinaural(def.hz, def.base) };
    }
    return true;
  }

  function stopAllSounds() {
    Object.keys(activeSounds).forEach(id => {
      activeSounds[id].stop();
      delete activeSounds[id];
    });
    if (binauralActive) {
      binauralActive.node.stop();
      binauralActive = null;
    }
  }

  function isSoundOn(id) { return !!activeSounds[id]; }
  function isBinauralOn(id) { return binauralActive && binauralActive.id === id; }

  // ---- Sonidos de sesión ----
  function startSessionAudio(profile) {
    if (!ctx) init();
    resume();
    stopAllSounds();
    if (!profile) return;
    profile.forEach(id => { activeSounds[id] = SOUNDS[id]?.create(); });
  }

  function stopSessionAudio() { stopAllSounds(); }

  // ---- Analyser data ----
  function getFrequencyData() {
    if (!analyser) return new Uint8Array(128).fill(0);
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    return data;
  }

  function getWaveformData() {
    if (!analyser) return new Uint8Array(128).fill(128);
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(data);
    return data;
  }

  // ---- Click de cuenco en el mandala ----
  function bowlTap() {
    if (!ctx) init();
    resume();
    const freqs = [432, 528, 396, 639, 741, 852];
    const f = freqs[Math.floor(Math.random() * freqs.length)];
    playBowl(f, 5);
    if (navigator.vibrate) navigator.vibrate([20, 10, 30]);
  }

  return {
    init, resume, setMasterVolume,
    SOUNDS, BINAURALS,
    toggleSound, toggleBinaural, stopAllSounds,
    isSoundOn, isBinauralOn,
    startSessionAudio, stopSessionAudio,
    getFrequencyData, getWaveformData,
    bowlTap, playBowl,
  };
})();
