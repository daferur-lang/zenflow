/* ============================================
   ZENFLOW — Orquestador principal
   ============================================ */

(function () {

  // ---- Registro del Service Worker ----
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

  // ---- Estado de la app ----
  let currentScreen = 'home';
  let moodBefore = null;
  let moodAfter = null;
  let pendingSession = null;

  // ---- Inicialización ----
  document.addEventListener('DOMContentLoaded', () => {
    ZenAnim.initSplash();
    setupSplash();
  });

  function setupSplash() {
    document.getElementById('btn-despertar').addEventListener('click', onWake);
  }

  function onWake() {
    ZenAudio.init();
    ZenAudio.resume();
    // Cuenco de bienvenida
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
    buildHomeQuick();
    buildAmbientPills();
    buildSessionsGrid();
    buildSoundsGrid();
    buildBinauralGrid();
    setupMasterVolume();
    setupNav();
    setupSOS();
    setupSessionScreen();
    updateProgress();
    updateGreeting();
    updateStreakBadge();
    ZenAnim.initMandala();
    ZenAnim.initAudioViz();
  }

  // ---- Saludo dinámico ----
  function updateGreeting() {
    const el = document.getElementById('greeting');
    const hour = new Date().getHours();
    let main, sub;
    if (hour < 6)  { main = 'Buenas noches'; sub = 'El silencio invita a meditar'; }
    else if (hour < 12) { main = 'Buenos días'; sub = 'El mejor momento para meditar es ahora'; }
    else if (hour < 17) { main = 'Buenas tardes'; sub = 'Un respiro en mitad del día'; }
    else if (hour < 21) { main = 'Buenas tardes'; sub = 'Hora de soltar el día'; }
    else { main = 'Buenas noches'; sub = 'Prepárate para descansar'; }
    el.innerHTML = `${main}<span>${sub}</span>`;
  }

  function updateStreakBadge() {
    const stats = ZenTracker.getStats();
    document.getElementById('streak-count').textContent = stats.streak;
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
          <span class="quick-icon">${s.emoji}</span>
          <span class="quick-name">${s.name}</span>
          <span class="quick-dur">${formatDur(s.duration)}</span>
        </div>`)
      .join('');
    container.querySelectorAll('.quick-card').forEach(card => {
      card.addEventListener('click', () => openSession(card.dataset.session));
    });
  }

  // ---- Pills de ambiente (HOME) ----
  function buildAmbientPills() {
    const container = document.getElementById('ambient-pills');
    if (!container) return;
    const pillSounds = ['rain', 'ocean', 'forest', 'fire', 'bowl1'];
    container.innerHTML = pillSounds.map(id => {
      const s = ZenAudio.SOUNDS[id];
      return `<button class="ambient-pill" data-sound="${id}">${s.icon} ${s.label}</button>`;
    }).join('');
    container.querySelectorAll('.ambient-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const id = pill.dataset.sound;
        const on = ZenAudio.toggleSound(id);
        pill.classList.toggle('on', on);
        updateVizHint();
      });
    });
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
           style="background: linear-gradient(145deg, ${s.color[0]}33, ${s.color[1]}22);">
        <span class="session-card-emoji">${s.emoji}</span>
        <span class="session-card-name">${s.name}</span>
        <span class="session-card-meta">${formatDur(s.duration)}</span>
        <span class="session-card-tag">${s.tags[0]}</span>
      </div>`).join('');

    container.querySelectorAll('.session-card').forEach(card => {
      card.addEventListener('click', () => openSession(card.dataset.session));
    });
  }

  document.addEventListener('click', e => {
    const pill = e.target.closest('.filter-pill');
    if (!pill) return;
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    buildSessionsGrid(pill.dataset.filter);
  });

  // ---- Grid de sonidos ----
  function buildSoundsGrid() {
    const container = document.getElementById('sounds-grid');
    if (!container) return;
    container.innerHTML = Object.entries(ZenAudio.SOUNDS).map(([id, s]) => `
      <button class="sound-btn" data-sound="${id}">
        <span class="sound-icon">${s.icon}</span>
        <span class="sound-name">${s.label}</span>
        <input type="range" class="sound-vol" min="0" max="100" value="70"
               title="Volumen de ${s.label}">
      </button>`).join('');

    container.querySelectorAll('.sound-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        if (e.target.classList.contains('sound-vol')) return;
        const id = btn.dataset.sound;
        const on = ZenAudio.toggleSound(id);
        btn.classList.toggle('on', on);
        updateVizHint();
      });
    });
  }

  // ---- Grid binaural ----
  function buildBinauralGrid() {
    const container = document.getElementById('binaural-grid');
    if (!container) return;
    container.innerHTML = ZenAudio.BINAURALS.map(b => `
      <button class="binaural-btn" data-bin="${b.id}">
        <span class="bin-hz">${b.hz} Hz</span>
        <div class="bin-info">
          <span class="bin-name">${b.label}</span>
          <span class="bin-desc">${b.desc}</span>
        </div>
        <span class="bin-dot"></span>
      </button>`).join('');

    container.querySelectorAll('.binaural-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.bin;
        const on = ZenAudio.toggleBinaural(id);
        document.querySelectorAll('.binaural-btn').forEach(b => b.classList.remove('on'));
        if (on) btn.classList.add('on');
        updateVizHint();
      });
    });
  }

  function updateVizHint() {
    const hint = document.getElementById('viz-hint');
    if (hint) hint.classList.add('hidden');
  }

  // ---- Volumen maestro ----
  function setupMasterVolume() {
    const slider = document.getElementById('master-vol');
    if (!slider) return;
    slider.addEventListener('input', () => {
      ZenAudio.setMasterVolume(slider.value);
    });
    ZenAudio.setMasterVolume(70);
  }

  // ---- Botón SOS ----
  function setupSOS() {
    document.getElementById('btn-sos').addEventListener('click', () => openSession('urgente'));
  }

  // ---- Navegación ----
  function setupNav() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.nav;
        navigateTo(target);
      });
    });
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

    document.querySelectorAll('.nav-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.nav === screenName)
    );

    currentScreen = screenName;
    if (screenName === 'progress') updateProgress();
    if (screenName === 'sounds') ZenAnim.initAudioViz();
  }

  // ---- Sesión ----
  function setupSessionScreen() {
    document.getElementById('btn-start').addEventListener('click', startSession);
    document.getElementById('btn-close').addEventListener('click', closeSession);
    document.getElementById('btn-pause-session').addEventListener('click', togglePause);
    document.getElementById('btn-skip-step').addEventListener('click', () => ZenSessions.skipStep());
    document.getElementById('btn-finish').addEventListener('click', finishSession);
  }

  function openSession(sessionId) {
    const session = ZenSessions.getById(sessionId);
    if (!session) return;
    pendingSession = session;
    moodBefore = null;
    moodAfter = null;

    // Llenar UI de la pantalla de sesión
    document.getElementById('session-preview-icon').textContent = session.emoji;
    document.getElementById('session-preview-name').textContent = session.name;
    document.getElementById('session-preview-desc').textContent = session.desc;

    // Mostrar pantalla de sesión
    const screen = document.getElementById('screen-active');
    screen.classList.add('active');
    screen.style.opacity = '1';
    screen.style.transform = 'translateY(0)';
    document.querySelector('.bottom-nav').style.display = 'none';

    // Mood pre
    ZenTracker.buildMoodBar('mood-pre', val => { moodBefore = val; });

    // Reset UI
    document.getElementById('mood-gate').classList.remove('hidden');
    document.getElementById('session-ui').classList.add('hidden');
    document.getElementById('session-complete').classList.add('hidden');

    // Fondo animado
    ZenAnim.initSessionBg(session.color[0], session.color[1]);
  }

  function startSession() {
    if (!pendingSession) return;
    document.getElementById('mood-gate').classList.add('hidden');
    document.getElementById('session-ui').classList.remove('hidden');
    document.getElementById('active-session-name').textContent = pendingSession.name;

    ZenAnim.initViz();
    injectTimerGradient();

    ZenSessions.start(pendingSession.id, {
      onStep: (step, idx, total) => {
        const progFill = document.getElementById('prog-fill');
        if (progFill) progFill.style.width = `${(idx / total) * 100}%`;

        // Fade out → cambiar texto → fade in
        const box = document.getElementById('instruction-text');
        if (box) {
          box.classList.add('fade');
          setTimeout(() => {
            box.textContent = step.text;
            box.classList.remove('fade');
          }, 400);
        }

        const numEl = document.getElementById('breath-num');
        if (numEl && step.phase && step.dur <= 15) {
          startBreathCounter(numEl, step.dur);
        } else if (numEl) {
          numEl.textContent = '';
        }
      },
      onTick: (elapsed, total) => {
        // updateTimer ya se llama desde animations.js
      },
      onComplete: (session, minutes) => {
        onSessionComplete(session, minutes);
      },
    });
  }

  function injectTimerGradient() {
    let defs = document.querySelector('.timer-defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      defs.classList.add('timer-defs');
      defs.style.cssText = 'position:absolute;width:0;height:0;';
      defs.innerHTML = `<defs>
        <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#7c3aed"/>
          <stop offset="100%" stop-color="#06b6d4"/>
        </linearGradient>
      </defs>`;
      document.body.appendChild(defs);
    }
    const arc = document.getElementById('timer-arc');
    if (arc) arc.setAttribute('stroke', 'url(#timerGrad)');
  }

  function startBreathCounter(el, dur) {
    let count = dur;
    el.textContent = count;
    const interval = setInterval(() => {
      count--;
      if (count <= 0) { clearInterval(interval); el.textContent = ''; return; }
      el.textContent = count;
    }, 1000);
  }

  function togglePause() {
    const btn = document.getElementById('btn-pause-session');
    const paused = ZenSessions.togglePause();
    btn.textContent = paused ? '▶' : '⏸';
  }

  function closeSession() {
    ZenSessions.stop();
    ZenAnim.stopSessionBg();
    ZenAnim.stopViz();
    document.getElementById('screen-active').classList.remove('active');
    document.querySelector('.bottom-nav').style.display = '';
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
    ZenAudio.playBowl(528, 6);

    // Guardar
    ZenTracker.recordSession(session, Math.max(1, minutes), moodBefore, moodAfter);
    updateStreakBadge();
  }

  function showMoodResult(after) {
    const el = document.getElementById('mood-result');
    if (!el) return;
    if (moodBefore !== null && after !== null) {
      const diff = after - moodBefore;
      if (diff > 0) el.textContent = `✨ +${diff} puntos de bienestar`;
      else if (diff === 0) el.textContent = '🙏 Mantuviste tu equilibrio';
      else el.textContent = '💙 A veces meditar es simplemente estar';
    }
  }

  function finishSession() {
    // Guardar con mood final si se seleccionó después
    if (moodAfter !== null && pendingSession) {
      ZenTracker.recordSession(pendingSession, 0, moodBefore, moodAfter);
    }
    ZenAnim.stopSessionBg();
    document.getElementById('screen-active').classList.remove('active');
    document.querySelector('.bottom-nav').style.display = '';
    updateStreakBadge();
    navigateTo('progress');
  }

  // ---- Progreso ----
  function updateProgress() {
    const stats = ZenTracker.getStats();
    const el = id => document.getElementById(id);

    if (el('p-streak'))   el('p-streak').textContent = stats.streak;
    if (el('p-time'))     el('p-time').textContent = stats.totalMinutes;
    if (el('p-sessions')) el('p-sessions').textContent = stats.sessions;
    if (el('p-mood'))     el('p-mood').textContent = stats.moodAvg;

    const sub = document.getElementById('progress-subtitle');
    if (sub) {
      if (stats.sessions === 0) sub.textContent = '¡Empieza hoy tu práctica!';
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
