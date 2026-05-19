/* ============================================
   ZENFLOW — Seguimiento y progreso
   ============================================ */

const ZenTracker = (() => {
  const KEY = 'zenflow_data';

  const ACHIEVEMENTS = [
    { id: 'first',    icon: '🌱', name: 'Primera vez',    desc: 'Completaste tu primera sesión',     check: d => d.sessions >= 1 },
    { id: 'week',     icon: '🔥', name: '7 días',         desc: 'Racha de 7 días consecutivos',      check: d => d.streak >= 7 },
    { id: 'month',    icon: '🌕', name: '30 días',        desc: 'Un mes de práctica constante',      check: d => d.streak >= 30 },
    { id: 'hour',     icon: '⏳', name: 'Primera hora',   desc: '60 minutos totales meditados',      check: d => d.totalMinutes >= 60 },
    { id: 'tenHours', icon: '💎', name: '10 horas',       desc: '600 minutos de meditación',         check: d => d.totalMinutes >= 600 },
    { id: 'sessions10',icon:'🧘', name: '10 sesiones',    desc: 'Diez sesiones completadas',         check: d => d.sessions >= 10 },
    { id: 'stress',   icon: '🌊', name: 'Rescatador',     desc: 'Completaste 3 sesiones de urgencia',check: d => (d.sessionCounts?.urgente || 0) >= 3 },
    { id: 'variety',  icon: '🌈', name: 'Explorador',     desc: 'Probaste 5 tipos de sesión distintos', check: d => Object.keys(d.sessionCounts || {}).length >= 5 },
    { id: 'mood',     icon: '😊', name: 'Transformador',  desc: 'Mejoraste tu ánimo 5 veces seguidas', check: d => d.moodImprovements >= 5 },
  ];

  const MOODS = ['😩','😟','😐','🙂','😌','😊','🤩'];

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || defaultData();
    } catch { return defaultData(); }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function defaultData() {
    return {
      sessions: 0,
      totalMinutes: 0,
      streak: 0,
      lastDate: null,
      history: [],
      achievements: [],
      sessionCounts: {},
      moodHistory: [],
      moodImprovements: 0,
    };
  }

  function recordSession(session, durationMin, moodBefore, moodAfter) {
    const data = load();
    const today = new Date().toISOString().split('T')[0];

    data.sessions++;
    data.totalMinutes += durationMin;
    data.sessionCounts[session.id] = (data.sessionCounts[session.id] || 0) + 1;

    // Racha
    if (data.lastDate) {
      const last = new Date(data.lastDate);
      const now = new Date(today);
      const diff = (now - last) / (1000 * 60 * 60 * 24);
      if (diff <= 1) data.streak++;
      else if (diff > 1) data.streak = 1;
    } else {
      data.streak = 1;
    }
    data.lastDate = today;

    // Mood
    if (moodBefore !== null && moodAfter !== null) {
      const improvement = moodAfter - moodBefore;
      data.moodHistory.push({ before: moodBefore, after: moodAfter, date: today });
      if (improvement > 0) data.moodImprovements++;
    }

    // Historial
    data.history.unshift({
      id: session.id,
      name: session.name,
      emoji: session.emoji,
      date: today,
      minutes: durationMin,
      moodBefore,
      moodAfter,
    });
    if (data.history.length > 50) data.history = data.history.slice(0, 50);

    // Logros
    const newAchievements = [];
    ACHIEVEMENTS.forEach(ach => {
      if (!data.achievements.includes(ach.id) && ach.check(data)) {
        data.achievements.push(ach.id);
        newAchievements.push(ach);
      }
    });

    save(data);
    return { data, newAchievements };
  }

  function getStats() {
    const data = load();
    const moodAvg = data.moodHistory.length > 0
      ? data.moodHistory.reduce((a, m) => a + (m.after - m.before), 0) / data.moodHistory.length
      : null;
    return {
      streak: data.streak,
      totalMinutes: data.totalMinutes,
      sessions: data.sessions,
      moodAvg: moodAvg !== null ? (moodAvg > 0 ? `+${moodAvg.toFixed(1)}` : moodAvg.toFixed(1)) : '—',
      history: data.history.slice(0, 10),
      achievements: data.achievements,
    };
  }

  function buildMoodBar(containerId, onSelect) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    let selected = null;
    MOODS.forEach((emoji, i) => {
      const btn = document.createElement('button');
      btn.className = 'mood-btn';
      btn.textContent = emoji;
      btn.title = `Nivel ${i + 1}`;
      btn.addEventListener('click', () => {
        container.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selected = i;
        if (onSelect) onSelect(i);
      });
      container.appendChild(btn);
    });
    return () => selected;
  }

  function renderAchievements() {
    const container = document.getElementById('achievements-grid');
    if (!container) return;
    const data = load();
    container.innerHTML = '';
    ACHIEVEMENTS.forEach(ach => {
      const el = document.createElement('div');
      const unlocked = data.achievements.includes(ach.id);
      el.className = `badge ${unlocked ? 'unlocked' : 'locked'}`;
      el.innerHTML = `<span class="badge-ico">${ach.icon}</span><span class="badge-name">${ach.name}</span>`;
      el.title = ach.desc;
      container.appendChild(el);
    });
  }

  function renderHistory() {
    const container = document.getElementById('history-list');
    if (!container) return;
    const data = load();
    if (!data.history.length) {
      container.innerHTML = '<p class="empty-state">Aún no hay sesiones. ¡Empieza hoy!</p>';
      return;
    }
    container.innerHTML = data.history.slice(0, 8).map(h => {
      const moodText = h.moodBefore !== null && h.moodAfter !== null
        ? `${MOODS[h.moodBefore]}→${MOODS[h.moodAfter]}`
        : '';
      return `
        <div class="hist-item">
          <div class="hist-ico-wrap">${h.emoji}</div>
          <div class="hist-info">
            <span class="hist-name">${h.name}</span>
            <span class="hist-meta">${formatDate(h.date)} · ${h.minutes} min</span>
          </div>
          ${moodText ? `<span class="hist-mood">${moodText}</span>` : ''}
        </div>`;
    }).join('');
  }

  function formatDate(iso) {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Hoy';
    if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  return {
    load, save,
    recordSession, getStats,
    buildMoodBar,
    renderAchievements, renderHistory,
    ACHIEVEMENTS, MOODS,
  };
})();
