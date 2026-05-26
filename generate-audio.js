#!/usr/bin/env node
/* ============================================
   ZENFLOW — Pre-generador de audio (run once)
   Extrae textos de sessions.js y llama a ElevenLabs.
   Guarda: audio/{hash}.mp3  + audio/{hash}.json
   Idempotente: salta archivos ya existentes.
   ============================================ */

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';
const API_KEY  = 'sk_239d0120a0a2b8d5d2aefad29e9b1aede6b6b41c7b416aac';
const MODEL    = 'eleven_multilingual_v2';
const SETTINGS = { stability: 0.88, similarity_boost: 0.82, style: 0.12, use_speaker_boost: true };

const AUDIO_DIR = path.join(__dirname, 'audio');

// ── Hash idéntico al que usa voice.js en el navegador ────────────────────────
function textHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return Math.abs(h).toString(36);
}

// ── Cargar sessions.js en VM con stubs para APIs del navegador ───────────────
function loadSessions() {
  let code = fs.readFileSync(path.join(__dirname, 'js/sessions.js'), 'utf8');
  // `const` in VM context doesn't leak into sandbox — use `var` instead
  code = code.replace(/^const ZenSessions\s*=/m, 'var ZenSessions =');
  const sandbox = {
    ZenAudio: { startSessionAudio: () => {} },
    ZenAnim:  { setBreathPhase: () => {}, updateTimer: () => {} },
    clearTimeout:  () => {},
    clearInterval: () => {},
    setTimeout:    () => {},
    setInterval:   () => {},
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.ZenSessions.getAll();
}

// ── Recopilar todos los textos únicos a narrar ────────────────────────────────
function collectTexts(sessions) {
  const set = new Set(['Inala', 'Aguanta', 'Suelta']); // cues de respiración

  // Texto de cierre (onSessionComplete en app.js)
  set.add('Sesión completada. Has cultivado un momento de paz. ¿Cómo te sientes ahora?');

  for (const session of sessions) {
    // Intro por sesión (openSession en app.js)
    set.add(`${session.name}. ${session.desc}. ¿Cómo llegas ahora? Cuando estés listo, pulsa comenzar.`);

    // Pasos narrados (phase: null)
    for (const step of session.steps) {
      if (!step.phase) set.add(step.text);
    }
  }
  return [...set];
}

// ── Llamar a ElevenLabs y guardar archivos ────────────────────────────────────
async function generateOne(text) {
  const hash     = textHash(text);
  const mp3Path  = path.join(AUDIO_DIR, `${hash}.mp3`);
  const jsonPath = path.join(AUDIO_DIR, `${hash}.json`);

  if (fs.existsSync(mp3Path) && fs.existsSync(jsonPath)) {
    console.log(`[skip] ${hash}  "${text.slice(0, 55)}"`);
    return;
  }

  console.log(`[gen]  ${hash}  "${text.slice(0, 55)}"`);

  const resp = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps`,
    {
      method:  'POST',
      headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text, model_id: MODEL, voice_settings: SETTINGS }),
    }
  );

  if (!resp.ok) {
    const msg = await resp.text().catch(() => String(resp.status));
    throw new Error(`ElevenLabs ${resp.status}: ${msg}`);
  }

  const json = await resp.json();

  fs.writeFileSync(mp3Path,  Buffer.from(json.audio_base64, 'base64'));
  fs.writeFileSync(jsonPath, JSON.stringify(json.alignment));

  const kb = Math.round(Buffer.from(json.audio_base64, 'base64').length / 1024);
  console.log(`[ok]   ${hash}  ${kb} KB`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });

  const sessions = loadSessions();
  const texts    = collectTexts(sessions);

  console.log(`\nZenFlow Audio Generator`);
  console.log(`Voice: ${VOICE_ID}  Model: ${MODEL}`);
  console.log(`Texts to process: ${texts.length}\n`);

  let done = 0, skipped = 0, errors = 0;

  for (const text of texts) {
    try {
      const hash = textHash(text);
      const existed = fs.existsSync(path.join(AUDIO_DIR, `${hash}.mp3`));
      await generateOne(text);
      if (existed) skipped++; else done++;
    } catch (err) {
      console.error(`[err]  "${text.slice(0, 55)}" — ${err.message}`);
      errors++;
    }
    if (done > 0) await new Promise(r => setTimeout(r, 300)); // rate-limit
  }

  console.log(`\n── Resumen ──────────────────────────`);
  console.log(`  Generados:  ${done}`);
  console.log(`  Saltados:   ${skipped}`);
  console.log(`  Errores:    ${errors}`);
  console.log(`  Directorio: ${AUDIO_DIR}`);
}

main().catch(err => { console.error(err); process.exit(1); });
