/**
 * ZenFlow Voice Proxy — Cloudflare Worker
 *
 * Actúa de intermediario entre el frontend y ElevenLabs.
 * La API key vive como secret en Cloudflare, nunca en el código cliente.
 *
 * Endpoint: POST /
 * Body: { text, voice_id?, model_id?, voice_settings? }
 * Response: JSON de ElevenLabs (audio_base64 + alignment)
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah
const DEFAULT_MODEL    = 'eleven_multilingual_v2';
const DEFAULT_SETTINGS = {
  stability: 0.88,
  similarity_boost: 0.82,
  style: 0.12,
  use_speaker_boost: true,
};

export default {
  async fetch(request, env) {
    // Preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method Not Allowed' }, 405);
    }

    // Parsear body
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400);
    }

    const { text, voice_id, model_id, voice_settings } = body;

    if (!text?.trim()) {
      return json({ error: 'Missing text' }, 400);
    }

    if (!env.ELEVENLABS_API_KEY) {
      return json({ error: 'Worker not configured: missing ELEVENLABS_API_KEY secret' }, 500);
    }

    // Llamada a ElevenLabs
    const voiceId = voice_id || DEFAULT_VOICE_ID;
    const elUrl   = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`;

    let elResp;
    try {
      elResp = await fetch(elUrl, {
        method: 'POST',
        headers: {
          'xi-api-key': env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: model_id || DEFAULT_MODEL,
          voice_settings: voice_settings || DEFAULT_SETTINGS,
        }),
      });
    } catch (err) {
      return json({ error: `ElevenLabs unreachable: ${err.message}` }, 502);
    }

    // Pasar respuesta al cliente (éxito o error de ElevenLabs)
    const data = await elResp.text();
    return new Response(data, {
      status: elResp.status,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
    });
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
