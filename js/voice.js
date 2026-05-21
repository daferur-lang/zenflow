/* ============================================
   ZENFLOW — Voz narrada
   ElevenLabs TTS (si hay API key) con fallback a Web Speech API
   ============================================ */

const ZenVoice = (() => {
  // ── Estado ──────────────────────────────────────────────
  let voice = null;
  let enabled = true;
  let currentUtter = null;
  let currentAudio = null;
  let voicesReady = false;

  const STORAGE_KEY      = 'zenflow_voice_enabled';
  const EL_KEY_STORAGE   = 'zenflow_el_api_key';
  const EL_VOICE_STORAGE = 'zenflow_el_voice_id';
  // Sarah — voz cálida y clara, excelente en español con eleven_multilingual_v2
  const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';
  const EL_MODEL         = 'eleven_turbo_v2_5';

  // Caché texto → ArrayBuffer para no repetir llamadas a la API
  const audioCache = new Map();

  // Cargar preferencia de voz activada/desactivada
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) enabled = saved === 'true';
  } catch {}

  // ── Web Speech API (fallback) ────────────────────────────
  function pickBestSpanishVoice() {
    if (!('speechSynthesis' in window)) return null;
    const all = speechSynthesis.getVoices();
    const spanish = all.filter(v => v.lang && v.lang.toLowerCase().startsWith('es'));
    if (!spanish.length) return all[0] || null;

    const preferences = [
      /Mónica/i, /Monica/i, /Paulina/i, /Marisol/i, /Reed/i,
      /Microsoft.*Elvira/i, /Microsoft.*Helena/i, /Microsoft.*Sabina/i,
      /Microsoft.*Laura/i, /Microsoft.*Dalia/i, /Microsoft.*Ximena/i,
      /Google.*español.*España/i, /Google.*es-ES/i, /Google.*es-419/i, /Google.*Spanish/i,
      /Spanish.*Spain/i,
    ];
    for (const re of preferences) {
      const found = spanish.find(v => re.test(v.name));
      if (found) return found;
    }
    return spanish.find(v => v.lang === 'es-ES')
        || spanish.find(v => v.lang.startsWith('es'))
        || spanish[0];
  }

  function init() {
    if (!('speechSynthesis' in window)) {
      console.warn('Web Speech API no disponible');
      return false;
    }
    function loadVoices() {
      const v = pickBestSpanishVoice();
      if (v) { voice = v; voicesReady = true; }
    }
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
    currentUtter = utter;
    speechSynthesis.speak(utter);
  }

  // ── ElevenLabs ───────────────────────────────────────────
  function getApiKey() {
    try { return localStorage.getItem(EL_KEY_STORAGE) || ''; } catch { return ''; }
  }

  function setApiKey(key) {
    try { localStorage.setItem(EL_KEY_STORAGE, key.trim()); } catch {}
    audioCache.clear();
  }

  function getVoiceId() {
    try { return localStorage.getItem(EL_VOICE_STORAGE) || DEFAULT_VOICE_ID; } catch { return DEFAULT_VOICE_ID; }
  }

  function setVoiceId(id) {
    try { localStorage.setItem(EL_VOICE_STORAGE, id.trim() || DEFAULT_VOICE_ID); } catch {}
    audioCache.clear();
  }

  async function fetchElevenLabsAudio(text, apiKey, voiceId) {
    const cached = audioCache.get(text);
    if (cached) return cached;

    const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: EL_MODEL,
        voice_settings: {
          stability: 0.92,
          similarity_boost: 0.75,
          style: 0.04,
          use_speaker_boost: false,
        },
      }),
    });

    if (!resp.ok) {
      const msg = await resp.text().catch(() => String(resp.status));
      throw new Error(`ElevenLabs ${resp.status}: ${msg}`);
    }

    const buf = await resp.arrayBuffer();
    audioCache.set(text, buf);
    return buf;
  }

  async function speakElevenLabs(text) {
    const apiKey = getApiKey();
    const voiceId = getVoiceId();
    const arrayBuffer = await fetchElevenLabsAudio(text, apiKey, voiceId);
    const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
    const url  = URL.createObjectURL(blob);

    if (currentAudio) { currentAudio.pause(); currentAudio = null; }

    const audio = new Audio(url);
    audio.onended = () => URL.revokeObjectURL(url);
    currentAudio = audio;
    await audio.play();
  }

  // ── API pública ──────────────────────────────────────────
  async function speak(text, opts = {}) {
    if (!enabled || !text) return;
    stop();

    const apiKey = getApiKey();
    if (apiKey) {
      try {
        await speakElevenLabs(text);
        return;
      } catch (e) {
        console.warn('[ZenVoice] ElevenLabs falló, usando Web Speech:', e.message);
      }
    }
    speakWebSpeech(text, opts);
  }

  function stop() {
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    if (hasSupport()) speechSynthesis.cancel();
    currentUtter = null;
  }

  function setEnabled(on) {
    enabled = !!on;
    try { localStorage.setItem(STORAGE_KEY, String(enabled)); } catch {}
    if (!enabled) stop();
  }

  function isEnabled()      { return enabled; }
  function hasSupport()     { return 'speechSynthesis' in window; }
  function getCurrentVoice(){ return voice; }
  function listSpanishVoices() {
    if (!hasSupport()) return [];
    return speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith('es'));
  }

  return {
    init, speak, stop,
    setEnabled, isEnabled, hasSupport,
    getCurrentVoice, listSpanishVoices,
    getApiKey, setApiKey,
    getVoiceId, setVoiceId,
  };
})();
