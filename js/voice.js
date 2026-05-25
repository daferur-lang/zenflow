/* ============================================
   ZENFLOW — Voz narrada v2
   ElevenLabs TTS con sincronización palabra a palabra
   Fallback: Web Speech API
   ============================================ */

const ZenVoice = (() => {
  let voice          = null;
  let enabled        = true;
  let currentSource  = null;   // Web Audio BufferSourceNode
  let currentAudio   = null;   // Fallback HTMLAudioElement
  let currentAudioUrl = null;  // URL.createObjectURL handle para revocar
  let voicesReady    = false;
  let highlightTimers = [];

  const STORAGE_KEY      = 'zenflow_voice_enabled';
  const EL_VOICE_STORAGE = 'zenflow_el_voice_id';
  const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah — cálida, clara

  // URL del Cloudflare Worker proxy — rellenar tras el deploy
  // Formato: 'https://zenflow-voice.TU-SUBDOMINIO.workers.dev'
  const WORKER_URL = 'https://zenflow-voice.daferur.workers.dev';

  // Caché: `${voiceId}:${text}` → { audioBytes: ArrayBuffer, wordTimings: [] }
  const audioCache = new Map();

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) enabled = saved === 'true';
  } catch {}

  // ── Web Speech API (fallback) ──────────────────────────────
  function pickBestSpanishVoice() {
    if (!('speechSynthesis' in window)) return null;
    const all = speechSynthesis.getVoices();
    const spanish = all.filter(v => v.lang && v.lang.toLowerCase().startsWith('es'));
    if (!spanish.length) return all[0] || null;
    const prefs = [
      /Mónica/i, /Monica/i, /Paulina/i, /Marisol/i,
      /Microsoft.*Elvira/i, /Microsoft.*Helena/i, /Microsoft.*Sabina/i,
      /Microsoft.*Laura/i, /Microsoft.*Dalia/i,
      /Google.*español.*España/i, /Google.*es-ES/i, /Google.*es-419/i,
    ];
    for (const re of prefs) {
      const found = spanish.find(v => re.test(v.name));
      if (found) return found;
    }
    return spanish.find(v => v.lang === 'es-ES') || spanish[0];
  }

  function init() {
    if (!('speechSynthesis' in window)) { console.warn('Web Speech API no disponible'); return false; }
    function loadVoices() { const v = pickBestSpanishVoice(); if (v) { voice = v; voicesReady = true; } }
    loadVoices();
    if (!voicesReady) speechSynthesis.onvoiceschanged = loadVoices;
    return true;
  }

  function speakWebSpeech(text, opts = {}) {
    if (!voice) voice = pickBestSpanishVoice();
    if (!hasSupport()) return;
    stop();
    const processed = text.replace(/\.{3,}/g, ',,,').replace(/—/g, ',');
    const utter = new SpeechSynthesisUtterance(processed);
    utter.lang   = (voice && voice.lang) || 'es-ES';
    if (voice) utter.voice = voice;
    utter.rate   = opts.rate   ?? 0.78;
    utter.pitch  = opts.pitch  ?? 0.90;
    utter.volume = opts.volume ?? 1.0;
    speechSynthesis.speak(utter);
  }

  // ── ElevenLabs vía Cloudflare Worker proxy ────────────────
  function getVoiceId()   { try { return localStorage.getItem(EL_VOICE_STORAGE) || DEFAULT_VOICE_ID; } catch { return DEFAULT_VOICE_ID; } }
  function setVoiceId(id) { try { localStorage.setItem(EL_VOICE_STORAGE, id.trim() || DEFAULT_VOICE_ID); } catch {} audioCache.clear(); }

  // Llama al Worker proxy (la API key vive en Cloudflare como secret)
  async function fetchWithTimestamps(text, voiceId) {
    const cacheKey = `${voiceId}:${text}`;
    if (audioCache.has(cacheKey)) return audioCache.get(cacheKey);

    const resp = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice_id: voiceId }),
    });

    if (!resp.ok) {
      const msg = await resp.text().catch(() => String(resp.status));
      throw new Error(`Proxy ${resp.status}: ${msg}`);
    }

    const json = await resp.json();
    const audioBytes = base64ToArrayBuffer(json.audio_base64);
    const wordTimings = buildWordTimings(text, json.alignment);
    const result = { audioBytes, wordTimings };
    audioCache.set(cacheKey, result);
    return result;
  }

  function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  // Mapea alignment carácter a carácter → timing por índice de palabra
  // Robusto ante normalización de ElevenLabs (ignora espacios al alinear)
  function buildWordTimings(text, alignment) {
    if (!alignment?.characters?.length) return [];
    const { characters, character_start_times_seconds } = alignment;

    // Asignar tiempo a cada posición de carácter no-espacio en el texto original
    const timeByTextPos = {};
    let alignIdx = 0;
    let textIdx  = 0;

    while (alignIdx < characters.length && textIdx < text.length) {
      if (/\s/.test(characters[alignIdx])) { alignIdx++; continue; }
      while (textIdx < text.length && /\s/.test(text[textIdx])) textIdx++;
      if (textIdx < text.length) {
        timeByTextPos[textIdx] = character_start_times_seconds[alignIdx] ?? 0;
        textIdx++;
        alignIdx++;
      }
    }

    // Extraer palabras y su tiempo de inicio (primer carácter de cada palabra)
    const wordTimings = [];
    const wordRegex = /\S+/g;
    let match;
    let wordIdx = 0;
    while ((match = wordRegex.exec(text)) !== null) {
      const t = timeByTextPos[match.index];
      if (t !== undefined) wordTimings.push({ idx: wordIdx, startTime: t });
      wordIdx++;
    }
    return wordTimings;
  }

  // Reproducir vía Web Audio API (mismo contexto que ZenAudio — sin reverb en la voz)
  async function playViaWebAudio(arrayBuffer, onEnded) {
    const ctx = (typeof ZenAudio !== 'undefined') ? ZenAudio.getCtx() : null;
    if (!ctx) return false;
    try {
      const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0)); // slice evita detach
      const source = ctx.createBufferSource();
      source.buffer = decoded;

      // Voz directa a destination: sin reverb ni EQ — máxima claridad
      const voiceGain = ctx.createGain();
      voiceGain.gain.value = 1.0;
      source.connect(voiceGain);
      voiceGain.connect(ctx.destination);

      currentSource = source;
      source.onended = () => { currentSource = null; onEnded(); };
      source.start(0);
      return true;
    } catch (err) {
      console.warn('[ZenVoice] Web Audio falló, usando HTML Audio:', err.message);
      return false;
    }
  }

  // Fallback: HTML Audio element
  async function playViaHTMLAudio(arrayBuffer, onEnded) {
    const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
    currentAudioUrl = URL.createObjectURL(blob);
    const audio = new Audio(currentAudioUrl);
    audio.onended = () => {
      URL.revokeObjectURL(currentAudioUrl);
      currentAudioUrl = null;
      currentAudio = null;
      onEnded();
    };
    currentAudio = audio;
    await audio.play();
  }

  // Programar callbacks de highlight según timing de ElevenLabs
  function scheduleHighlights(wordTimings, onWordIndex) {
    clearHighlights();
    wordTimings.forEach(({ idx, startTime }) => {
      const t = setTimeout(() => onWordIndex(idx), startTime * 1000);
      highlightTimers.push(t);
    });
  }

  function clearHighlights() {
    highlightTimers.forEach(clearTimeout);
    highlightTimers = [];
  }

  // ── Core ElevenLabs speak ─────────────────────────────────
  async function speakElevenLabs(text, opts = {}) {
    const voiceId = getVoiceId();
    const { audioBytes, wordTimings } = await fetchWithTimestamps(text, voiceId);

    return new Promise(async (resolve) => {
      const onEnded = () => { clearHighlights(); resolve(); };

      const usedWebAudio = await playViaWebAudio(audioBytes, onEnded);
      if (!usedWebAudio) await playViaHTMLAudio(audioBytes, onEnded);

      // Programar highlights justo después de que arranque la reproducción
      if (opts.onWordIndex && wordTimings.length) {
        scheduleHighlights(wordTimings, opts.onWordIndex);
      }
    });
  }

  // ── API pública ───────────────────────────────────────────
  async function speak(text, opts = {}) {
    if (!enabled || !text) return;
    stop();
    if (WORKER_URL) {
      try { await speakElevenLabs(text, opts); return; }
      catch (e) { console.warn('[ZenVoice] Worker falló, usando Web Speech:', e.message); }
    }
    speakWebSpeech(text, opts);
  }

  // Pre-cargar el siguiente paso en caché mientras el actual suena
  async function preload(text) {
    if (!text || !WORKER_URL) return;
    const voiceId  = getVoiceId();
    const cacheKey = `${voiceId}:${text}`;
    if (audioCache.has(cacheKey)) return;
    try { await fetchWithTimestamps(text, voiceId); }
    catch {} // fallo silencioso — se reintentará al reproducir
  }

  function stop() {
    clearHighlights();
    if (currentSource) { try { currentSource.stop(); } catch {} currentSource = null; }
    if (currentAudio)  { currentAudio.pause(); currentAudio = null; }
    if (currentAudioUrl) { URL.revokeObjectURL(currentAudioUrl); currentAudioUrl = null; }
    if (hasSupport())  speechSynthesis.cancel();
  }

  function setEnabled(on) {
    enabled = !!on;
    try { localStorage.setItem(STORAGE_KEY, String(enabled)); } catch {}
    if (!enabled) stop();
  }

  function isEnabled()         { return enabled; }
  function hasSupport()        { return 'speechSynthesis' in window; }
  function getCurrentVoice()   { return voice; }
  function listSpanishVoices() {
    return hasSupport() ? speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith('es')) : [];
  }

  return {
    init, speak, stop, preload,
    setEnabled, isEnabled, hasSupport,
    getCurrentVoice, listSpanishVoices,
    getVoiceId, setVoiceId,
  };
})();
