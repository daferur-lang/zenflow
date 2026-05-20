/* ============================================
   ZENFLOW — Voz narrada (Web Speech API)
   100% gratis, sin API key, voces nativas del SO
   ============================================ */

const ZenVoice = (() => {
  let voice = null;
  let enabled = true;
  let currentUtter = null;
  let voicesReady = false;
  const STORAGE_KEY = 'zenflow_voice_enabled';

  // Cargar preferencia previa
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) enabled = saved === 'true';
  } catch {}

  // Selección inteligente de la mejor voz española disponible
  function pickBestSpanishVoice() {
    if (!('speechSynthesis' in window)) return null;
    const all = speechSynthesis.getVoices();
    const spanish = all.filter(v => v.lang && v.lang.toLowerCase().startsWith('es'));
    if (!spanish.length) return all[0] || null;

    // Orden de preferencia (las "neural" o "enhanced" suelen sonar mejor)
    const preferences = [
      // iOS / macOS premium
      /Mónica/i, /Monica/i, /Paulina/i, /Marisol/i, /Reed/i,
      // Microsoft (Windows) — voces neuronales modernas
      /Microsoft.*Elvira/i, /Microsoft.*Helena/i, /Microsoft.*Sabina/i,
      /Microsoft.*Laura/i, /Microsoft.*Dalia/i, /Microsoft.*Ximena/i,
      // Google (Android / Chrome)
      /Google.*español.*España/i, /Google.*es-ES/i, /Google.*es-419/i, /Google.*Spanish/i,
      // Genéricas españolas
      /Spanish.*Spain/i,
    ];

    for (const re of preferences) {
      const found = spanish.find(v => re.test(v.name));
      if (found) return found;
    }
    // Fallback: la primera en es-ES, luego cualquier es
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
      if (v) {
        voice = v;
        voicesReady = true;
      }
    }

    loadVoices();
    if (!voicesReady) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
    return true;
  }

  // Habla un texto con tono meditativo
  // Acepta "..." y los convierte en pausas más largas
  function speak(text, opts = {}) {
    if (!enabled || !text || !hasSupport()) return;
    if (!voice) voice = pickBestSpanishVoice();

    stop();

    // Procesar texto: añadir respiraciones después de comas y pausas tras puntos
    const processed = text
      .replace(/\.{3,}/g, ',,,')   // "..." → pausas más largas
      .replace(/—/g, ',');

    const utter = new SpeechSynthesisUtterance(processed);
    utter.lang = (voice && voice.lang) || 'es-ES';
    if (voice) utter.voice = voice;
    utter.rate   = opts.rate   ?? 0.82;   // lento, meditativo
    utter.pitch  = opts.pitch  ?? 0.95;   // ligeramente grave
    utter.volume = opts.volume ?? 1.0;

    currentUtter = utter;
    speechSynthesis.speak(utter);
  }

  function stop() {
    if (hasSupport()) speechSynthesis.cancel();
    currentUtter = null;
  }

  function setEnabled(on) {
    enabled = !!on;
    try { localStorage.setItem(STORAGE_KEY, String(enabled)); } catch {}
    if (!enabled) stop();
  }

  function isEnabled() { return enabled; }
  function hasSupport() { return 'speechSynthesis' in window; }
  function getCurrentVoice() { return voice; }

  function listSpanishVoices() {
    if (!hasSupport()) return [];
    return speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith('es'));
  }

  return {
    init, speak, stop,
    setEnabled, isEnabled, hasSupport,
    getCurrentVoice, listSpanishVoices,
  };
})();
