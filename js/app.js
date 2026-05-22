/* ============================================
   ZENFLOW — Orquestador principal
   ============================================ */

(function () {

  // ---- Service Worker ----
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

  // ---- Estado ----
  let currentScreen = 'home';
  let moodBefore = null;
  let moodAfter = null;
  let pendingSession = null;

  // ---- Arranque ----
  document.addEventListener('DOMContentLoaded', () => {
    // Configuración automática via URL param (?elkey=...)
    const _p = new URLSearchParams(window.location.search);
    const _k = _p.get('elkey');
    if (_k) {
      try { localStorage.setItem('zenflow_el_api_key', _k); } catch {}
      history.replaceState({}, '', window.location.pathname);
    }
    ZenAnim.initSplash();
    document.getElementById('btn-despertar').addEventListener('click', onWake);
  });

  function onWake() {
    ZenAudio.init();
    ZenAudio.resume();
    ZenVoice.init();
    ZenAudio.playBowl(432, 5);
    if (navigator.vibrate) navigator.vibrate([30, 20, 60]);

    const splash = document.getElementById('splash');
    splash.classList.add('fade-out');
    setTimeout(() => {
      splash.style.display = 'none';
      ZenAnim.stopSplash();
      document.getElementById('app').classList.remove('hidden');
      initApp();
    }, 800);
  }

  function initApp() {
    updateDateLabel();
    updateGreeting();
    updateStreakBadge();
    buildHomeQuick();
    buildAmbientPills();
    buildSessionsGrid();
    buildSoundsGrid();
    buildBinauralGrid();
    setupMasterVolume();
    setupNav();
    setupSOS();
    setupSeeAll();
    setupSessionScreen();
    setupSleepMode();
    setupSettings();
    updateProgress();
    ZenAnim.initMandala();
    ZenAnim.initAudioViz();
  }

  // ---- Configuración (ElevenLabs) ----
  function setupSettings() {
    const modal    = document.getElementById('settings-modal');
    const backdrop = document.getElementById('settings-backdrop');
    const btnOpen  = document.getElementById('btn-settings');
    const btnClose = document.getElementById('btn-settings-close');
    const btnSave  = document.getElementById('btn-save-settings');
    const btnTest  = document.getElementById('btn-test-voice');
    const keyInput = document.getElementById('el-api-key-input');
    const vidInput = document.getElementById('el-voice-id-input');
    const status   = document.getElementById('settings-status');
    if (!modal || !btnOpen) return;

    function openModal() {
      keyInput.value = ZenVoice.getApiKey();
      vidInput.value = ZenVoice.getVoiceId() !== 'EXAVITQu4vr4xnSDxMaL' ? ZenVoice.getVoiceId() : '';
      modal.classList.remove('hidden');
      status.className = 'settings-status hidden';
    }

    function closeModal() {
      modal.classList.add('hidden');
    }

    function showStatus(msg, type) {
      status.textContent = msg;
      status.className = `settings-status ${type}`;
      setTimeout(() => { status.className = 'settings-status hidden'; }, 3500);
    }

    btnOpen.addEventListener('click', openModal);
    btnClose.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    btnSave.addEventListener('click', () => {
      ZenVoice.setApiKey(keyInput.value);
      if (vidInput.value.trim()) ZenVoice.setVoiceId(vidInput.value);
      showStatus('Configuración guardada', 'ok');
      setTimeout(closeModal, 1200);
    });

    btnTest.addEventListener('click', async () => {
      const key = keyInput.value.trim();
      if (!key) {
        showStatus('Introduce tu API key primero', 'err');
        return;
      }
      ZenVoice.setApiKey(key);
      if (vidInput.value.trim()) ZenVoice.setVoiceId(vidInput.value);
      btnTest.disabled = true;
      btnTest.textContent = 'Cargando...';
      try {
        await ZenVoice.speak('Hola. Soy tu guía de meditación. Respira profundo.');
        showStatus('Voz activa', 'ok');
      } catch (e) {
        showStatus('Error: revisa tu API key', 'err');
      } finally {
        btnTest.disabled = false;
        btnTest.textContent = 'Probar voz';
      }
    });
  }

  // ---- Fecha ----
  function updateDateLabel() {
    const el = document.getElementById('date-label');
    if (!el) return;
    const now = new Date();
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    el.textContent = `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]}`;
  }

  // ---- Saludo ----
  function updateGreeting() {
    const el = document.getElementById('greeting');
    if (!el) return;
    const h = new Date().getHours();
    let main, sub;
    if      (h < 6)  { main = 'Buenas noches';   sub = 'El silencio invita a meditar'; }
    else if (h < 12) { main = 'Buenos días';      sub = 'El mejor momento es ahora'; }
    else if (h < 17) { main = 'Buenas tardes';    sub = 'Un respiro en mitad del día'; }
    else if (h < 21) { main = 'Buenas tardes';    sub = 'Hora de soltar el día'; }
    else             { main = 'Buenas noches';    sub = 'Prepárate para descansar'; }
    el.innerHTML = `${main}<span>${sub}</span>`;
  }

  function updateStreakBadge() {
    const el = document.getElementById('streak-count');
    if (el) el.textContent = ZenTracker.getStats().streak;
  }

  // ---- Sesiones rápidas (HOME) ----
  function buildHomeQuick() {
    const container = document.getElementById('quick-grid');
    if (!container) return;
    const quickIds = ['urgente', 'despertar', 'respiracion478', 'cuencos'];
    container.innerHTML = ZenSessions.SESSIONS
      .filter(s => quickIds.includes(s.id))
      .map(s => `
        <div class="quick-card" data-session="${s.id}">
          <span class="quick-emoji">${s.emoji}</span>
          <span class="quick-name">${s.name}</span>
          <span class="quick-dur">${formatDur(s.duration)}</span>
        </div>`)
      .join('');
    container.querySelectorAll('.quick-card').forEach(card =>
      card.addEventListener('click', () => openSession(card.dataset.session))
    );
  }

  // ---- Ambient pills (HOME) ----
  function buildAmbientPills() {
    const container = document.getElementById('ambient-pills');
    if (!container) return;
    const pillSounds = ['rain', 'ocean', 'forest', 'fire', 'bowl1'];
    container.innerHTML = pillSounds.map(id => {
      const s = ZenAudio.SOUNDS[id];
      return `<button class="ambient-pill" data-sound="${id}">${s.icon} ${s.label}</button>`;
    }).join('');
    container.querySelectorAll('.ambient-pill').forEach(pill =>
      pill.addEventListener('click', () => {
        const on = ZenAudio.toggleSound(pill.dataset.sound);
        pill.classList.toggle('on', on);
      })
    );
  }

  // ---- Grid de sesiones ----
  function buildSessionsGrid(filter = 'all') {
    const container = document.getElementById('sessions-grid');
    if (!container) return;
    const sessions = filter === 'all'
      ? ZenSessions.SESSIONS
      : ZenSessions.SESSIONS.filter(s => s.tags.includes(filter));

    container.innerHTML = sessions.map(s => `
      <div class="session-card" data-session="${s.id}"
           style="background:linear-gradient(145deg,${s.color[0]}33,${s.color[1]}22);">
        <span class="session-card-emoji">${s.emoji}</span>
        <span class="session-card-name">${s.name}</span>
        <span class="session-card-meta">
          <span class="session-card-dur">${formatDur(s.duration)}</span>
          <span class="session-card-dot"></span>
          <span class="session-card-cat">${s.tags[0]}</span>
        </span>
      </div>`).join('');

    container.querySelectorAll('.session-card').forEach(card =>
      card.addEventListener('click', () => openSession(card.dataset.session))
    );
  }

  document.addEventListener('click', e => {
    const pill = e.target.closest('.filter-pill');
    if (!pill) return;
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    buildSessionsGrid(pill.dataset.filter);
  });

  // ---- Sonidos ----
  function buildSoundsGrid() {
    const container = document.getElementById('sounds-grid');
    if (!container) return;
    container.innerHTML = Object.entries(ZenAudio.SOUNDS).map(([id, s]) => `
      <button class="sound-btn" data-sound="${id}">
        <span class="sound-ico">${s.icon}</span>
        <span class="sound-name">${s.label}</span>
      </button>`).join('');

    container.querySelectorAll('.sound-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        const on = ZenAudio.toggleSound(btn.dataset.sound);
        btn.classList.toggle('on', on);
      })
    );
  }

  // ---- Binaural ----
  function buildBinauralGrid() {
    const container = document.getElementById('binaural-grid');
    if (!container) return;
    container.innerHTML = ZenAudio.BINAURALS.map(b => `
      <button class="bin-row" data-bin="${b.id}">
        <span class="bin-hz">${b.hz} Hz</span>
        <div class="bin-info">
          <span class="bin-name">${b.label}</span>
          <span class="bin-desc">${b.desc}</span>
        </div>
        <span class="bin-dot"></span>
      </button>`).join('');

    container.querySelectorAll('.bin-row').forEach(btn =>
      btn.addEventListener('click', () => {
        const on = ZenAudio.toggleBinaural(btn.dataset.bin);
        document.querySelectorAll('.bin-row').forEach(b => b.classList.remove('on'));
        if (on) btn.classList.add('on');
      })
    );
  }

  // ---- Volumen maestro ----
  function setupMasterVolume() {
    const slider = document.getElementById('master-vol');
    if (!slider) return;
    const fill  = document.getElementById('vol-fill');
    const thumb = document.getElementById('vol-thumb');
    const pct   = document.getElementById('vol-pct');

    function setVol(val) {
      ZenAudio.setMasterVolume(val);
      if (fill)  fill.style.width = val + '%';
      if (thumb) thumb.style.left = `calc(${val}% - 9px)`;
      if (pct)   pct.textContent  = val + '%';
    }

    slider.addEventListener('input', () => setVol(+slider.value));
    setVol(70);
  }

  // ---- SOS ----
  function setupSOS() {
    const btn = document.getElementById('btn-sos');
    if (btn) btn.addEventListener('click', () => openSession('urgente'));
  }

  // ---- "Ver todas" en home ----
  function setupSeeAll() {
    document.querySelectorAll('[data-nav]').forEach(el => {
      if (el.classList.contains('nav-item')) return;
      el.addEventListener('click', () => navigateTo(el.dataset.nav));
    });
  }

  // ---- Navegación ----
  function setupNav() {
    document.querySelectorAll('.nav-item').forEach(btn =>
      btn.addEventListener('click', () => navigateTo(btn.dataset.nav))
    );
  }

  function navigateTo(screenName) {
    if (currentScreen === screenName) return;
    const prev = document.getElementById(`screen-${currentScreen}`);
    const next = document.getElementById(`screen-${screenName}`);
    if (!next) return;

    if (prev) {
      prev.style.opacity = '0';
      prev.style.transform = 'translateY(8px)';
      setTimeout(() => prev.classList.remove('active'), 300);
    }
    setTimeout(() => {
      next.classList.add('active');
      requestAnimationFrame(() => {
        next.style.opacity = '1';
        next.style.transform = 'translateY(0)';
      });
    }, 50);

    document.querySelectorAll('.nav-item').forEach(b =>
      b.classList.toggle('active', b.dataset.nav === screenName)
    );

    currentScreen = screenName;
    if (screenName === 'progress') updateProgress();
    if (screenName === 'sounds')   ZenAnim.initAudioViz();
  }

  function updateVoiceConfigUI() {
    const btn = document.getElementById('btn-voice-config');
    if (!btn) return;
    const hasKey = !!ZenVoice.getApiKey();
    btn.classList.toggle('configured', hasKey);
    const label = document.getElementById('voice-config-label');
    if (label) label.textContent = hasKey ? 'Voz premium ✓' : 'Voz premium';
  }

  // ---- Modo Dormir ----
  let sleepTimerMins = 30;
  let sleepCountdownIv = null;
  let sleepFadeTimeout = null;
  let activeMixId = null;

  function setupSleepMode() {
    const btn = document.getElementById('btn-sleep-mode');
    if (btn) btn.addEventListener('click', openSleepMode);
    const close = document.getElementById('btn-sleep-close');
    if (close) close.addEventListener('click', closeSleepMode);

    buildSleepMixes();

    document.querySelectorAll('.sleep-timer-pill').forEach(p =>
      p.addEventListener('click', () => {
        document.querySelectorAll('.sleep-timer-pill').forEach(x => x.classList.remove('active'));
        p.classList.add('active');
        sleepTimerMins = +p.dataset.mins;
        if (activeMixId) restartSleepTimer();
      })
    );

    document.querySelectorAll('.sleep-session-card').forEach(c =>
      c.addEventListener('click', () => {
        closeSleepMode(true);
        openSession(c.dataset.session);
      })
    );
  }

  function buildSleepMixes() {
    const grid = document.getElementById('sleep-mix-grid');
    if (!grid) return;
    grid.innerHTML = ZenAudio.SLEEP_MIXES.map(m => `
      <button class="sleep-mix-card" data-mix="${m.id}">
        <span class="sleep-mix-ico">${m.icon}</span>
        <div class="sleep-mix-info">
          <span class="sleep-mix-name">${m.label}</span>
          <span class="sleep-mix-desc">${m.desc}</span>
        </div>
      </button>`).join('');

    grid.querySelectorAll('.sleep-mix-card').forEach(card =>
      card.addEventListener('click', () => {
        const id = card.dataset.mix;
        if (activeMixId === id) {
          ZenAudio.stopAllSounds();
          activeMixId = null;
          card.classList.remove('on');
          stopSleepTimer();
          return;
        }
        grid.querySelectorAll('.sleep-mix-card').forEach(c => c.classList.remove('on'));
        card.classList.add('on');
        ZenAudio.startSleepMix(id);
        activeMixId = id;
        restartSleepTimer();
      })
    );
  }

  function restartSleepTimer() {
    stopSleepTimer();
    if (sleepTimerMins === 0) {
      document.getElementById('sleep-countdown').classList.add('hidden');
      return;
    }
    const endAt = Date.now() + sleepTimerMins * 60000;
    const countdown = document.getElementById('sleep-countdown');
    const txt = document.getElementById('sleep-countdown-text');
    countdown.classList.remove('hidden');

    function tick() {
      const remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      txt.textContent = `${m}:${s.toString().padStart(2,'0')}`;
      if (remaining <= 0) {
        clearInterval(sleepCountdownIv);
        sleepCountdownIv = null;
      }
    }
    tick();
    sleepCountdownIv = setInterval(tick, 1000);

    // Fade-out durante los últimos 60 s
    const fadeAt = (sleepTimerMins * 60 - 60) * 1000;
    sleepFadeTimeout = setTimeout(() => {
      ZenAudio.fadeOutAll(60, () => {
        activeMixId = null;
        document.querySelectorAll('.sleep-mix-card.on').forEach(c => c.classList.remove('on'));
        countdown.classList.add('hidden');
      });
    }, Math.max(0, fadeAt));
  }

  function stopSleepTimer() {
    if (sleepCountdownIv) { clearInterval(sleepCountdownIv); sleepCountdownIv = null; }
    if (sleepFadeTimeout) { clearTimeout(sleepFadeTimeout); sleepFadeTimeout = null; }
    document.getElementById('sleep-countdown').classList.add('hidden');
  }

  function openSleepMode() {
    const screen = document.getElementById('screen-sleep');
    screen.classList.add('active');
    screen.style.opacity = '1';
    screen.style.transform = 'translateY(0)';
    document.getElementById('bottom-nav').style.display = 'none';
  }

  function closeSleepMode(keepAudio = false) {
    if (!keepAudio) {
      stopSleepTimer();
      if (activeMixId) {
        ZenAudio.stopAllSounds();
        activeMixId = null;
        document.querySelectorAll('.sleep-mix-card.on').forEach(c => c.classList.remove('on'));
      }
    }
    document.getElementById('screen-sleep').classList.remove('active');
    document.getElementById('bottom-nav').style.display = '';
  }

  // ---- Sesión ----
  function setupSessionScreen() {
    document.getElementById('btn-start').addEventListener('click', startSession);
    document.getElementById('btn-close').addEventListener('click', closeSession);
    document.getElementById('btn-pause-session').addEventListener('click', togglePause);
    document.getElementById('btn-skip-step').addEventListener('click', () => ZenSessions.skipStep());
    document.getElementById('btn-finish').addEventListener('click', finishSession);

    // Configurar voz premium (ElevenLabs)
    const configBtn = document.getElementById('btn-voice-config');
    if (configBtn) {
      updateVoiceConfigUI();
      configBtn.addEventListener('click', () => {
        const current = ZenVoice.getApiKey();
        const action = current
          ? 'Voz premium activa. Pulsa Cancelar para mantenerla, o pega una nueva clave para cambiarla. Deja vacío y acepta para borrar.'
          : 'Pega tu clave gratuita de ElevenLabs (regístrate en elevenlabs.io — 10 000 caracteres gratis al mes):';
        const newKey = prompt(action, current || '');
        if (newKey === null) return; // cancel
        ZenVoice.setApiKey(newKey);
        updateVoiceConfigUI();
        if (newKey.trim()) {
          ZenVoice.speak('Voz premium activada. Bienvenido.');
        }
      });
    }

    // Toggle de voz narrada
    const voiceBtn = document.getElementById('btn-voice');
    if (voiceBtn) {
      // Estado inicial
      if (!ZenVoice.hasSupport()) {
        voiceBtn.style.display = 'none';
      } else {
        voiceBtn.classList.toggle('muted', !ZenVoice.isEnabled());
        voiceBtn.addEventListener('click', () => {
          const newState = !ZenVoice.isEnabled();
          ZenVoice.setEnabled(newState);
          voiceBtn.classList.toggle('muted', !newState);
          if (!newState) ZenVoice.stop();
        });
      }
    }
  }

  function openSession(sessionId) {
    const session = ZenSessions.getById(sessionId);
    if (!session) return;
    pendingSession = session;
    moodBefore = null;
    moodAfter = null;

    document.getElementById('session-preview-icon').textContent = session.emoji;
    document.getElementById('session-preview-name').textContent = session.name;
    document.getElementById('session-preview-desc').textContent = session.desc;

    const screen = document.getElementById('screen-active');
    screen.classList.add('active');
    screen.style.opacity = '1';
    screen.style.transform = 'translateY(0)';
    document.getElementById('bottom-nav').style.display = 'none';

    ZenTracker.buildMoodBar('mood-pre', val => { moodBefore = val; });

    // Narrar la entrada — para meditar con ojos cerrados desde el principio
    setTimeout(() => {
      ZenVoice.speak(
        `${session.name}. ${session.desc}. ¿Cómo llegas ahora? Cuando estés listo, pulsa comenzar.`,
        { rate: 0.80 }
      );
    }, 600);

    document.getElementById('mood-gate').classList.remove('hidden');
    document.getElementById('session-ui').classList.add('hidden');
    document.getElementById('session-complete').classList.add('hidden');

    ZenAnim.initSessionBg(session.color[0], session.color[1]);
  }

  function startSession() {
    if (!pendingSession) return;
    document.getElementById('mood-gate').classList.add('hidden');
    document.getElementById('session-ui').classList.remove('hidden');
    document.getElementById('active-session-name').textContent = pendingSession.name;

    ZenAnim.initViz();

    ZenSessions.start(pendingSession.id, {
      onStep: (step, idx, total) => {
        const fill = document.getElementById('prog-fill');
        if (fill) fill.style.width = `${(idx / total) * 100}%`;

        const box = document.getElementById('instruction-text');
        if (box) {
          box.classList.add('fade');
          setTimeout(() => {
            box.textContent = step.text;
            box.classList.remove('fade');
            // Narrar el paso con voz natural (esperar al fade-in)
            ZenVoice.speak(step.text);
          }, 400);
        }

        const numEl = document.getElementById('breath-num');
        if (numEl && step.phase && step.dur <= 15) {
          startBreathCounter(numEl, step.dur);
        } else if (numEl) {
          numEl.textContent = '';
        }

        if (step.phase) ZenAnim.setBreathPhase(step.phase, step.dur);
      },
      onTick: (elapsed, total) => {
        ZenAnim.updateTimer(elapsed, total);
      },
      onComplete: (session, minutes) => {
        onSessionComplete(session, minutes);
      },
    });
  }

  function startBreathCounter(el, dur) {
    let count = dur;
    el.textContent = count;
    const iv = setInterval(() => {
      count--;
      if (count <= 0) { clearInterval(iv); el.textContent = ''; return; }
      el.textContent = count;
    }, 1000);
  }

  function togglePause() {
    const btn = document.getElementById('btn-pause-session');
    const paused = ZenSessions.togglePause();
    if (paused) ZenVoice.stop();
    btn.innerHTML = paused
      ? '<svg width="18" height="18" viewBox="0 0 18 18"><path d="M4 3l11 6-11 6V3z" fill="#fff"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 18 18"><rect x="2" y="2" width="4.5" height="14" rx="1" fill="#fff"/><rect x="11.5" y="2" width="4.5" height="14" rx="1" fill="#fff"/></svg>';
  }

  function closeSession() {
    ZenSessions.stop();
    ZenVoice.stop();
    ZenAnim.stopSessionBg();
    ZenAnim.stopViz();
    document.getElementById('screen-active').classList.remove('active');
    document.getElementById('bottom-nav').style.display = '';
    updateStreakBadge();
  }

  function onSessionComplete(session, minutes) {
    ZenAnim.stopViz();
    document.getElementById('session-ui').classList.add('hidden');
    document.getElementById('session-complete').classList.remove('hidden');

    document.getElementById('c-minutes').textContent = Math.max(1, minutes);
    document.getElementById('c-streak').textContent = ZenTracker.getStats().streak;

    moodAfter = null;
    ZenTracker.buildMoodBar('mood-post', val => {
      moodAfter = val;
      showMoodResult(val);
    });

    ZenAnim.launchConfetti();
    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
    ZenAudio.playBowl(528, 8);

    // Narrar el cierre con la voz meditativa
    setTimeout(() => {
      ZenVoice.speak(
        'Sesión completada. Has cultivado un momento de paz. ¿Cómo te sientes ahora?',
        { rate: 0.78 }
      );
    }, 1200);

    ZenTracker.recordSession(session, Math.max(1, minutes), moodBefore, moodAfter);
    updateStreakBadge();
  }

  function showMoodResult(after) {
    const el = document.getElementById('mood-result');
    if (!el) return;
    el.classList.remove('hidden');
    if (moodBefore !== null && after !== null) {
      const diff = after - moodBefore;
      if (diff > 0)      el.textContent = `✨ +${diff} puntos de bienestar`;
      else if (diff === 0) el.textContent = '🙏 Mantuviste tu equilibrio';
      else               el.textContent = '💙 A veces meditar es simplemente estar';
    }
  }

  function finishSession() {
    if (moodAfter !== null && pendingSession) {
      ZenTracker.recordSession(pendingSession, 0, moodBefore, moodAfter);
    }
    ZenAnim.stopSessionBg();
    document.getElementById('screen-active').classList.remove('active');
    document.getElementById('bottom-nav').style.display = '';
    updateStreakBadge();
    navigateTo('progress');
  }

  // ---- Progreso ----
  function updateProgress() {
    const stats = ZenTracker.getStats();
    const el = id => document.getElementById(id);

    if (el('p-streak'))   el('p-streak').textContent   = stats.streak;
    if (el('p-time'))     el('p-time').textContent     = stats.totalMinutes;
    if (el('p-sessions')) el('p-sessions').textContent = stats.sessions;
    if (el('p-mood'))     el('p-mood').textContent     = stats.moodAvg;

    const sub = el('progress-subtitle');
    if (sub) {
      if (stats.sessions === 0)   sub.textContent = '¡Empieza hoy tu práctica!';
      else if (stats.streak >= 7) sub.textContent = '¡Increíble constancia! 🔥';
      else sub.textContent = `${stats.sessions} sesiones completadas`;
    }

    ZenTracker.renderAchievements();
    ZenTracker.renderHistory();
  }

  // ---- Util ----
  function formatDur(seconds) {
    const m = Math.floor(seconds / 60);
    return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}min`;
  }

})();
