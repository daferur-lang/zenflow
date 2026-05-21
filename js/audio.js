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

  // ---- Tambor chamánico (frame drum sintetizado) ----
  function createDrum(bpm = 210) {
    if (!ctx) return null;
    let running = true;
    let nextTime = 0;
    let timer = null;

    // Un golpe completo: cuerpo resonante + ataque de piel + armónico
    function hit(t, velocity = 1) {
      // 1) Cuerpo del tambor — sine grave con pitch-down (la piel "se asienta")
      const body = ctx.createOscillator();
      body.type = 'sine';
      body.frequency.setValueAtTime(140 + (Math.random() - 0.5) * 12, t);
      body.frequency.exponentialRampToValueAtTime(58, t + 0.18);

      const bodyGain = ctx.createGain();
      bodyGain.gain.setValueAtTime(0, t);
      bodyGain.gain.linearRampToValueAtTime(0.95 * velocity, t + 0.005);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);

      body.connect(bodyGain);
      bodyGain.connect(masterGain);
      body.start(t);
      body.stop(t + 1.05);

      // 2) Armónico medio — segundo tono que da "cuerpo de madera"
      const harm = ctx.createOscillator();
      harm.type = 'triangle';
      harm.frequency.setValueAtTime(220 + (Math.random() - 0.5) * 20, t);
      harm.frequency.exponentialRampToValueAtTime(110, t + 0.12);

      const harmGain = ctx.createGain();
      harmGain.gain.setValueAtTime(0, t);
      harmGain.gain.linearRampToValueAtTime(0.25 * velocity, t + 0.004);
      harmGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      harm.connect(harmGain);
      harmGain.connect(masterGain);
      harm.start(t);
      harm.stop(t + 0.5);

      // 3) Ataque — ruido corto filtrado (el "tac" inicial de la piel)
      const noiseLen = Math.floor(ctx.sampleRate * 0.08);
      const nb = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
      const nd = nb.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) {
        nd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / noiseLen, 3);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = nb;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 320;
      bp.Q.value = 1.4;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.55 * velocity, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      noise.connect(bp);
      bp.connect(noiseGain);
      noiseGain.connect(masterGain);
      noise.start(t);

      // 4) Resonancia subgrave — el "boom" de la caja
      const sub = ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.value = 48;
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0, t);
      subGain.gain.linearRampToValueAtTime(0.4 * velocity, t + 0.01);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

      sub.connect(subGain);
      subGain.connect(masterGain);
      sub.start(t);
      sub.stop(t + 0.75);
    }

    // Scheduler look-ahead: programa los siguientes golpes con humanización
    const interval = 60 / bpm;
    nextTime = ctx.currentTime + 0.1;

    function scheduler() {
      if (!running) return;
      while (nextTime < ctx.currentTime + 0.25) {
        // Humanización: timing ±15 ms, velocidad ligeramente variable
        const jitter = (Math.random() - 0.5) * 0.03;
        const vel = 0.85 + Math.random() * 0.25;
        hit(Math.max(ctx.currentTime, nextTime + jitter), vel);
        nextTime += interval;
      }
    }

    scheduler();
    timer = setInterval(scheduler, 50);
    return { stop: () => { running = false; if (timer) clearInterval(timer); } };
  }

  // ---- Lluvia (3 capas: lluvia distante + medianas + gotas cercanas) ----
  function createRain(intensity = 0.6) {
    if (!ctx) return null;
    const nodes = [];
    let running = true;

    // CAPA 1: lluvia distante (constante, ruido filtrado alto)
    function makeNoiseBuffer(seconds = 6, stereo = true) {
      const sz = ctx.sampleRate * seconds;
      const b = ctx.createBuffer(stereo ? 2 : 1, sz, ctx.sampleRate);
      for (let ch = 0; ch < b.numberOfChannels; ch++) {
        const d = b.getChannelData(ch);
        for (let i = 0; i < sz; i++) d[i] = Math.random() * 2 - 1;
      }
      return b;
    }

    const distant = ctx.createBufferSource();
    distant.buffer = makeNoiseBuffer(6, true);
    distant.loop = true;
    const distHp = ctx.createBiquadFilter();
    distHp.type = 'highpass'; distHp.frequency.value = 1200;
    const distLp = ctx.createBiquadFilter();
    distLp.type = 'lowpass'; distLp.frequency.value = 9000;
    const distG = ctx.createGain();
    distG.gain.value = intensity * 0.25;

    // LFO suave de intensidad (la lluvia "respira")
    const distLfo = ctx.createOscillator();
    const distLfoG = ctx.createGain();
    distLfo.frequency.value = 0.05;
    distLfoG.gain.value = 0.06;
    distLfo.connect(distLfoG);
    distLfoG.connect(distG.gain);

    distant.connect(distHp);
    distHp.connect(distLp);
    distLp.connect(distG);
    distG.connect(masterGain);
    distant.start();
    distLfo.start();
    nodes.push({ stop: () => { distant.stop(); distLfo.stop(); } });

    // CAPA 2: lluvia media (más cuerpo, hiss continuo de gotas)
    const mid = ctx.createBufferSource();
    mid.buffer = makeNoiseBuffer(5, true);
    mid.loop = true;
    const midBp = ctx.createBiquadFilter();
    midBp.type = 'bandpass'; midBp.frequency.value = 3500; midBp.Q.value = 0.4;
    const midG = ctx.createGain();
    midG.gain.value = intensity * 0.18;

    mid.connect(midBp);
    midBp.connect(midG);
    midG.connect(masterGain);
    mid.start();
    nodes.push({ stop: () => mid.stop() });

    // CAPA 3: gotas individuales (eventos puntuales sobre superficies)
    function dropletEvent() {
      if (!running || !ctx) return;
      const t = ctx.currentTime;
      // Mini ráfaga de ruido muy corta y filtrada en banda alta
      const dur = 0.04 + Math.random() * 0.06;
      const sz = Math.floor(ctx.sampleRate * dur);
      const b = ctx.createBuffer(1, sz, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < sz; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / sz, 2);
      }
      const s = ctx.createBufferSource();
      s.buffer = b;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 2500 + Math.random() * 4000;
      bp.Q.value = 2 + Math.random() * 3;

      // Pan estéreo aleatorio para sensación de espacio
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (pan) pan.pan.value = (Math.random() - 0.5) * 1.6;

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.18 * (0.4 + Math.random() * 0.6), t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);

      s.connect(bp);
      if (pan) { bp.connect(pan); pan.connect(g); }
      else bp.connect(g);
      g.connect(masterGain);
      s.start(t);
    }

    function dropletScheduler() {
      if (!running) return;
      // ~12-20 gotas por segundo en momentos densos
      const burst = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < burst; i++) dropletEvent();
      setTimeout(dropletScheduler, 40 + Math.random() * 110);
    }
    dropletScheduler();

    return {
      stop: () => {
        running = false;
        nodes.forEach(n => n.stop());
      }
    };
  }

  // ---- Océano (olas reales con envolvente + espuma) ----
  function createOcean() {
    if (!ctx) return null;
    let running = true;
    const nodes = [];

    // Ruido estéreo base (la fuente sonora del agua)
    const bufSize = ctx.sampleRate * 6;
    const buf = ctx.createBuffer(2, bufSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
    }

    // CAPA 1: rumor de fondo (océano lejano constante, muy grave)
    const farSrc = ctx.createBufferSource();
    farSrc.buffer = buf; farSrc.loop = true;
    const farLp = ctx.createBiquadFilter();
    farLp.type = 'lowpass'; farLp.frequency.value = 350; farLp.Q.value = 0.6;
    const farG = ctx.createGain();
    farG.gain.value = 0.22;
    farSrc.connect(farLp); farLp.connect(farG); farG.connect(masterGain);
    farSrc.start();
    nodes.push({ stop: () => farSrc.stop() });

    // CAPA 2: olas individuales programadas (cada ~7-11s)
    function scheduleWave() {
      if (!running) return;
      const t = ctx.currentTime;
      const dur = 6 + Math.random() * 3; // duración de la ola

      // Cada ola es un buffer de ruido con su propio filtro y envolvente
      const ws = ctx.createBufferSource();
      ws.buffer = buf;
      ws.loop = true;

      // Filtro paso-bajo que sube en frecuencia al romper, luego cae
      const wlp = ctx.createBiquadFilter();
      wlp.type = 'lowpass';
      wlp.frequency.setValueAtTime(400, t);
      wlp.frequency.exponentialRampToValueAtTime(2200, t + dur * 0.45);  // crescendo
      wlp.frequency.exponentialRampToValueAtTime(800, t + dur);          // decae

      // Envolvente de amplitud: suave subida, pico, decay (la espuma)
      const wg = ctx.createGain();
      wg.gain.setValueAtTime(0.0001, t);
      wg.gain.exponentialRampToValueAtTime(0.45, t + dur * 0.5);
      wg.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      // Pan estéreo lento (la ola atraviesa de un lado al otro)
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (pan) {
        const start = (Math.random() - 0.5) * 1.4;
        pan.pan.setValueAtTime(start, t);
        pan.pan.linearRampToValueAtTime(-start * 0.5, t + dur);
      }

      ws.connect(wlp);
      if (pan) { wlp.connect(pan); pan.connect(wg); }
      else wlp.connect(wg);
      wg.connect(masterGain);
      ws.start(t);
      ws.stop(t + dur + 0.1);

      // Programar la siguiente ola
      const nextIn = (3 + Math.random() * 3) * 1000;
      setTimeout(scheduleWave, nextIn);
    }
    scheduleWave();

    return {
      stop: () => {
        running = false;
        nodes.forEach(n => n.stop());
      }
    };
  }

  // ---- Bosque (viento + hojas + pájaros con FM) ----
  function createForest() {
    if (!ctx) return null;
    const nodes = [];
    let running = true;

    // CAPA 1: viento entre las copas — ruido bandpass con LFO lento
    const bSize = ctx.sampleRate * 6;
    const bBuf = ctx.createBuffer(2, bSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = bBuf.getChannelData(ch);
      for (let i = 0; i < bSize; i++) d[i] = Math.random() * 2 - 1;
    }
    const wind = ctx.createBufferSource();
    wind.buffer = bBuf; wind.loop = true;
    const windBp = ctx.createBiquadFilter();
    windBp.type = 'bandpass'; windBp.frequency.value = 400; windBp.Q.value = 0.5;
    const windG = ctx.createGain();
    windG.gain.value = 0.10;

    // LFO modula frecuencia del filtro (ráfagas)
    const windLfo = ctx.createOscillator();
    const windLfoG = ctx.createGain();
    windLfo.frequency.value = 0.07;
    windLfoG.gain.value = 250;
    windLfo.connect(windLfoG);
    windLfoG.connect(windBp.frequency);

    wind.connect(windBp); windBp.connect(windG); windG.connect(masterGain);
    wind.start(); windLfo.start();
    nodes.push({ stop: () => { wind.stop(); windLfo.stop(); } });

    // CAPA 2: rumor de hojas suaves (más agudo)
    const leaves = ctx.createBufferSource();
    leaves.buffer = bBuf; leaves.loop = true;
    const leavesHp = ctx.createBiquadFilter();
    leavesHp.type = 'highpass'; leavesHp.frequency.value = 3000;
    const leavesG = ctx.createGain();
    leavesG.gain.value = 0.04;
    leaves.connect(leavesHp); leavesHp.connect(leavesG); leavesG.connect(masterGain);
    leaves.start();
    nodes.push({ stop: () => leaves.stop() });

    // CAPA 3: pájaros con síntesis FM (más realistas que sine puro)
    function chirp(species = null) {
      if (!ctx || !running) return;
      const t = ctx.currentTime;

      // Distintas "especies" con patrones calmados
      const types = species || [
        { base: 2400, mod: 200, vib: 12, dur: 0.18, notes: 1, pattern: 'sweep' },
        { base: 3200, mod: 300, vib: 14, dur: 0.13, notes: 2, pattern: 'trill' },
        { base: 1800, mod: 150, vib: 8,  dur: 0.28, notes: 2, pattern: 'two-tone' },
      ];
      const cfg = types[Math.floor(Math.random() * types.length)];

      // Pan aleatorio (cada pájaro en una rama distinta)
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (pan) pan.pan.value = (Math.random() - 0.5) * 1.6;

      const outGain = ctx.createGain();
      outGain.gain.value = 0.08 + Math.random() * 0.06;
      if (pan) { pan.connect(outGain); }
      outGain.connect(masterGain);

      for (let n = 0; n < cfg.notes; n++) {
        const startT = t + n * (cfg.dur + 0.04);
        // Portadora
        const carrier = ctx.createOscillator();
        carrier.type = 'sine';
        const f0 = cfg.base * (1 + (Math.random() - 0.5) * 0.05);
        carrier.frequency.setValueAtTime(f0, startT);
        if (cfg.pattern === 'sweep')
          carrier.frequency.linearRampToValueAtTime(f0 * 1.4, startT + cfg.dur);
        else if (cfg.pattern === 'two-tone')
          carrier.frequency.linearRampToValueAtTime(f0 * 0.75, startT + cfg.dur);

        // Modulador FM para timbre rugoso/natural
        const mod = ctx.createOscillator();
        mod.type = 'sine';
        mod.frequency.value = cfg.vib;
        const modGain = ctx.createGain();
        modGain.gain.value = cfg.mod;
        mod.connect(modGain);
        modGain.connect(carrier.frequency);

        // Envolvente nota
        const env = ctx.createGain();
        env.gain.setValueAtTime(0, startT);
        env.gain.linearRampToValueAtTime(1, startT + 0.02);
        env.gain.exponentialRampToValueAtTime(0.001, startT + cfg.dur);

        carrier.connect(env);
        env.connect(pan || outGain);
        carrier.start(startT);
        carrier.stop(startT + cfg.dur + 0.05);
        mod.start(startT);
        mod.stop(startT + cfg.dur + 0.05);
      }
    }

    function scheduleChirps() {
      if (!running) return;
      chirp();
      // "Conversación" ocasional — más espaciada
      if (Math.random() > 0.78) setTimeout(chirp, 400 + Math.random() * 600);
      if (Math.random() > 0.93) setTimeout(chirp, 1000 + Math.random() * 800);
      setTimeout(scheduleChirps, 5000 + Math.random() * 10000);
    }
    scheduleChirps();

    return {
      stop: () => { running = false; nodes.forEach(n => n.stop()); }
    };
  }

  // ---- Hoguera (rumor de llamas + chasquidos puntuales + sub) ----
  function createFire() {
    if (!ctx) return null;
    const nodes = [];
    let running = true;

    const bufSize = ctx.sampleRate * 6;
    const buf = ctx.createBuffer(2, bufSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
    }

    // CAPA 1: cuerpo de la llama (whoosh continuo grave-medio)
    const body = ctx.createBufferSource();
    body.buffer = buf; body.loop = true;
    const bodyLp = ctx.createBiquadFilter();
    bodyLp.type = 'lowpass'; bodyLp.frequency.value = 900; bodyLp.Q.value = 0.4;
    const bodyHp = ctx.createBiquadFilter();
    bodyHp.type = 'highpass'; bodyHp.frequency.value = 90;
    const bodyG = ctx.createGain();
    bodyG.gain.value = 0.22;

    // LFO de respiración del fuego
    const bodyLfo = ctx.createOscillator();
    const bodyLfoG = ctx.createGain();
    bodyLfo.frequency.value = 0.11;
    bodyLfoG.gain.value = 0.06;
    bodyLfo.connect(bodyLfoG); bodyLfoG.connect(bodyG.gain);

    body.connect(bodyHp); bodyHp.connect(bodyLp); bodyLp.connect(bodyG); bodyG.connect(masterGain);
    body.start(); bodyLfo.start();
    nodes.push({ stop: () => { body.stop(); bodyLfo.stop(); } });

    // CAPA 2: sub-rumor (la base grave del fuego)
    const sub = ctx.createBufferSource();
    sub.buffer = buf; sub.loop = true;
    const subLp = ctx.createBiquadFilter();
    subLp.type = 'lowpass'; subLp.frequency.value = 200;
    const subG = ctx.createGain();
    subG.gain.value = 0.08;
    sub.connect(subLp); subLp.connect(subG); subG.connect(masterGain);
    sub.start();
    nodes.push({ stop: () => sub.stop() });

    // CAPA 3: chasquidos individuales (los "pops" de la madera ardiendo)
    function crackle(intensity = 1) {
      if (!ctx || !running) return;
      const t = ctx.currentTime;
      const dur = 0.02 + Math.random() * 0.05;
      const sz = Math.floor(ctx.sampleRate * dur);
      const cb = ctx.createBuffer(1, sz, ctx.sampleRate);
      const d = cb.getChannelData(0);
      // Pop seco con caída brusca
      for (let i = 0; i < sz; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / sz, 4);
      }
      const s = ctx.createBufferSource();
      s.buffer = cb;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1500 + Math.random() * 3000;
      bp.Q.value = 1.5 + Math.random() * 2;

      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (pan) pan.pan.value = (Math.random() - 0.5) * 1.4;

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.4 * intensity * (0.5 + Math.random() * 0.7), t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);

      s.connect(bp);
      if (pan) { bp.connect(pan); pan.connect(g); } else bp.connect(g);
      g.connect(masterGain);
      s.start(t);
    }

    function scheduleCrackles() {
      if (!running) return;
      // Ráfagas variables: esporádicas para un fuego tranquilo
      const burst = Math.random() < 0.10 ? 1 + Math.floor(Math.random() * 2) : 1;
      for (let i = 0; i < burst; i++) {
        setTimeout(() => crackle(0.5 + Math.random() * 0.5), i * (40 + Math.random() * 80));
      }
      // POP grande muy ocasional
      if (Math.random() < 0.02) setTimeout(() => crackle(1.8), 200);
      setTimeout(scheduleCrackles, 900 + Math.random() * 2000);
    }
    scheduleCrackles();

    return {
      stop: () => { running = false; nodes.forEach(n => n.stop()); }
    };
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

  // ---- Ruido marrón (ideal para dormir — más grave, como lluvia distante) ----
  function createBrownNoise() {
    if (!ctx) return null;
    const bufSize = ctx.sampleRate * 6;
    const buf = ctx.createBuffer(2, bufSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      let last = 0;
      for (let i = 0; i < bufSize; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      }
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 800;
    lp.Q.value = 0.7;

    const g = ctx.createGain();
    g.gain.value = 0.55;

    // LFO muy lento para variación natural
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.12;
    lfo.connect(lfoGain);
    lfoGain.connect(g.gain);

    src.connect(lp);
    lp.connect(g);
    g.connect(masterGain);
    src.start();
    lfo.start();
    return { stop: () => { src.stop(); lfo.stop(); }, gain: g };
  }

  // ---- API pública de sonidos ----
  const SOUNDS = {
    rain:   { label: 'Lluvia',     icon: '🌧',  create: () => createRain() },
    ocean:  { label: 'Océano',     icon: '🌊',  create: () => createOcean() },
    forest: { label: 'Bosque',     icon: '🌿',  create: () => createForest() },
    fire:   { label: 'Hoguera',    icon: '🔥',  create: () => createFire() },
    brown:  { label: 'Ruido marrón', icon: '🌫', create: () => createBrownNoise() },
    bowl1:  { label: 'Cuenco 432', icon: '🔔',  create: () => createBowlLoop(432, 10) },
    bowl2:  { label: 'Cuenco 528', icon: '🪘',  create: () => createBowlLoop(528, 8) },
    drum:   { label: 'Tambor chamánico', icon: '🥁', create: () => createDrum(210) },
    pad:    { label: 'Ambiente',   icon: '🎹',  create: () => createAmbientPad() },
  };

  // ---- Mezclas pre-diseñadas para dormir ----
  const SLEEP_MIXES = [
    { id: 'rain-night', label: 'Lluvia nocturna', icon: '🌧',
      desc: 'Lluvia suave + ambiente cálido', sounds: ['rain', 'pad'], binaural: 'delta' },
    { id: 'ocean-deep', label: 'Olas profundas', icon: '🌊',
      desc: 'Mar lento + ruido marrón grave', sounds: ['ocean', 'brown'], binaural: 'delta' },
    { id: 'forest-night', label: 'Bosque de noche', icon: '🌲',
      desc: 'Brisa entre árboles + cuenco', sounds: ['forest', 'bowl1'], binaural: null },
    { id: 'fireplace', label: 'Chimenea', icon: '🔥',
      desc: 'Hoguera lenta + ambiente cálido', sounds: ['fire', 'pad'], binaural: null },
    { id: 'pure-brown', label: 'Solo marrón', icon: '🌫',
      desc: 'Ruido marrón puro — silencio enmascarado', sounds: ['brown'], binaural: 'delta' },
    { id: 'cosmic', label: 'Sueño cósmico', icon: '🌌',
      desc: 'Ambiente flotante + delta profundo', sounds: ['pad', 'brown'], binaural: 'delta' },
  ];

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

  // ---- Fade out global suave (para temporizador de sueño) ----
  function fadeOutAll(seconds = 60, onDone) {
    if (!ctx || !masterGain) { if (onDone) onDone(); return; }
    const startVol = masterGain.gain.value;
    const t = ctx.currentTime;
    masterGain.gain.cancelScheduledValues(t);
    masterGain.gain.setValueAtTime(startVol, t);
    masterGain.gain.linearRampToValueAtTime(0.0001, t + seconds);
    setTimeout(() => {
      stopAllSounds();
      // Restaurar volumen para uso posterior (silencio efectivo hasta que se vuelva a tocar)
      if (masterGain) masterGain.gain.setValueAtTime(startVol, ctx.currentTime);
      if (onDone) onDone();
    }, seconds * 1000 + 100);
  }

  // ---- Arrancar mezcla de sueño ----
  function startSleepMix(mixId) {
    const mix = SLEEP_MIXES.find(m => m.id === mixId);
    if (!mix) return null;
    if (!ctx) init();
    resume();
    stopAllSounds();
    mix.sounds.forEach(s => { activeSounds[s] = SOUNDS[s]?.create(); });
    if (mix.binaural) {
      const def = BINAURALS.find(b => b.id === mix.binaural);
      if (def) binauralActive = { id: mix.binaural, node: createBinaural(def.hz, def.base) };
    }
    return mix;
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
    SOUNDS, BINAURALS, SLEEP_MIXES,
    toggleSound, toggleBinaural, stopAllSounds,
    isSoundOn, isBinauralOn,
    startSessionAudio, stopSessionAudio,
    startSleepMix, fadeOutAll,
    getFrequencyData, getWaveformData,
    bowlTap, playBowl,
  };
})();
