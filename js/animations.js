/* ============================================
   ZENFLOW — Animaciones (Canvas 2D + SVG)
   ============================================ */

const ZenAnim = (() => {

  // ============================================
  // SACRED GEOMETRY — SVG GENERATORS
  // ============================================
  function createMetatronCube(size = 200, opacity = 0.25, stroke = '#7c3aed', accent = '#f5a623', teal = '#06b6d4') {
    const cx = size / 2, cy = size / 2;
    const r1 = size * 0.22, r2 = size * 0.44;

    const pts = (n, r, ox = 0) => Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + ox;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    });

    const inner = pts(6, r1);
    const outer = pts(6, r2, Math.PI / 6);
    const all = [[cx, cy], ...inner, ...outer];

    let lines = '';
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        lines += `<line x1="${all[i][0].toFixed(1)}" y1="${all[i][1].toFixed(1)}" x2="${all[j][0].toFixed(1)}" y2="${all[j][1].toFixed(1)}" stroke="${stroke}" stroke-width="0.4" opacity="0.5"/>`;
      }
    }

    const dots = all.map(([x, y], i) =>
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(size * 0.012).toFixed(1)}" fill="${i === 0 ? accent : i <= 6 ? teal : stroke}"/>`
    ).join('');

    const tri0 = pts(3, r2 * 0.78, 0).map(p => p.map(v => v.toFixed(1)).join(',')).join(' ');
    const tri1 = pts(3, r2 * 0.78, Math.PI).map(p => p.map(v => v.toFixed(1)).join(',')).join(' ');
    const stars = `<polygon points="${tri0}" fill="none" stroke="${accent}" stroke-width="0.6" opacity="0.6"/>
      <polygon points="${tri1}" fill="none" stroke="${accent}" stroke-width="0.6" opacity="0.6"/>`;

    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="opacity:${opacity};display:block;width:100%;height:100%;">${lines}${dots}${stars}</svg>`;
  }

  function createFlowerOfLife(size = 300, opacity = 0.06, stroke = '#7c3aed') {
    const cx = size / 2, cy = size / 2;
    const r = size * 0.167;

    const centers = [
      [cx, cy],
      ...Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return [cx + Math.cos(a) * r * 2, cy + Math.sin(a) * r * 2];
      }),
      ...Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        return [cx + Math.cos(a) * r * 2 * Math.sqrt(3), cy + Math.sin(a) * r * 2 * Math.sqrt(3)];
      }),
      ...Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return [cx + Math.cos(a) * r * 4, cy + Math.sin(a) * r * 4];
      }),
    ];

    const circles = centers.map(([x, y]) =>
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="none" stroke="${stroke}" stroke-width="0.5"/>`
    ).join('');

    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="opacity:${opacity};display:block;width:100%;height:100%;" overflow="visible">${circles}</svg>`;
  }

  function injectAllSVGs() {
    const map = {
      'splash-metatron-svg': () => createMetatronCube(220, 0.30, '#7c3aed', '#f5a623', '#06b6d4'),
      'splash-mandala-svg':  () => createFlowerOfLife(220, 0.20, '#a855f7'),
      'fol-splash':          () => createFlowerOfLife(340, 0.06, '#7c3aed'),
      'home-metatron-svg':   () => createMetatronCube(230, 0.22, '#7c3aed', '#f5a623', '#06b6d4'),
      'home-mandala-svg':    () => createFlowerOfLife(230, 0.14, '#a855f7'),
      'breath-metatron':     () => createMetatronCube(180, 0.15, '#7c3aed', '#f5a623', '#06b6d4'),
      'fol-session':         () => createFlowerOfLife(320, 0.05, '#7c3aed'),
      'complete-metatron':   () => createMetatronCube(280, 0.13, '#7c3aed', '#f5a623', '#06b6d4'),
    };
    Object.entries(map).forEach(([id, fn]) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = fn();
    });
  }

  // ============================================
  // SPLASH (SVG injection + CSS animations)
  // ============================================
  function initSplash() {
    injectAllSVGs();
  }

  function stopSplash() {}

  // ============================================
  // MANDALA PRINCIPAL (HOME — Canvas)
  // ============================================
  let mandalaRaf = null;
  let mandalaT = 0;
  let ripples = [];

  function initMandala() {
    const canvas = document.getElementById('mandala-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let SIZE = 0;

    function resize() {
      SIZE = (canvas.offsetWidth || 230) * window.devicePixelRatio;
      canvas.width = SIZE;
      canvas.height = SIZE;
    }
    resize();
    window.addEventListener('resize', resize);

    const geo = document.getElementById('home-geo') || canvas;
    geo.addEventListener('click', onTap);
    geo.addEventListener('touchstart', e => { e.preventDefault(); onTap(e.touches[0]); }, { passive: false });

    function onTap() {
      ripples.push({ r: 0, alpha: 0.8 });
      ZenAudio.bowlTap();
    }

    function draw() {
      if (!SIZE) { mandalaRaf = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, SIZE, SIZE);
      const cx = SIZE / 2, cy = SIZE / 2;
      const freqData = ZenAudio.getFrequencyData();

      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
      bgGrad.addColorStop(0, 'rgba(124,58,237,0.10)');
      bgGrad.addColorStop(0.6, 'rgba(59,130,246,0.04)');
      bgGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, cx, 0, Math.PI * 2);
      ctx.fill();

      drawMandala(ctx, cx, cy, cx * 0.85, mandalaT * 0.003, freqData, false);

      ripples = ripples.filter(r => r.alpha > 0.01);
      ripples.forEach(rip => {
        rip.r += SIZE * 0.005;
        rip.alpha *= 0.96;
        ctx.beginPath();
        ctx.arc(cx, cy, rip.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(245,166,35,${rip.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      mandalaT++;
      mandalaRaf = requestAnimationFrame(draw);
    }
    draw();
  }

  function stopMandala() {
    if (mandalaRaf) cancelAnimationFrame(mandalaRaf);
    mandalaRaf = null;
  }

  // ============================================
  // CORE: Mandala drawing
  // ============================================
  function drawMandala(ctx, cx, cy, radius, rotation, freqData, isSplash) {
    const petals = 8, layers = 5;
    ctx.save();
    ctx.translate(cx, cy);

    for (let layer = 0; layer < layers; layer++) {
      const r = radius * (layer + 1) / layers;
      const audioBoost = freqData
        ? (freqData[Math.floor(layer * freqData.length / layers / 2)] / 255) * 0.25
        : (isSplash ? Math.sin(rotation * 10 + layer) * 0.05 + 0.05 : 0.02);
      const rot = rotation * (layer % 2 === 0 ? 1 : -1) * (1 + layer * 0.2);

      ctx.save();
      ctx.rotate(rot);

      for (let i = 0; i < petals; i++) {
        ctx.save();
        ctx.rotate((i / petals) * Math.PI * 2);
        const pr = r + audioBoost * r * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(pr * 0.45, -pr * 0.28, pr, -pr * 0.28, pr, 0);
        ctx.bezierCurveTo(pr, pr * 0.28, pr * 0.45, pr * 0.28, 0, 0);
        ctx.fillStyle = `hsla(${240 + layer * 25 + audioBoost * 80}, 75%, 65%, ${Math.min((0.25 - layer * 0.03) + audioBoost * 0.3, 0.5)})`;
        ctx.fill();
        ctx.restore();
      }

      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${200 + layer * 20}, 70%, 70%, ${0.15 + audioBoost * 0.5})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      if (layer === 2 || layer === 4) {
        const dots = petals * 2;
        for (let d = 0; d < dots; d++) {
          const a = (d / dots) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 1.5 + audioBoost * 3, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${300 + d * 5}, 80%, 75%, ${0.4 + audioBoost})`;
          ctx.fill();
        }
      }
      ctx.restore();
    }

    const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.1);
    cg.addColorStop(0, 'rgba(245,166,35,0.8)');
    cg.addColorStop(1, 'rgba(245,166,35,0)');
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = cg;
    ctx.fill();

    ctx.restore();
  }

  // ============================================
  // SESSION BG (particles)
  // ============================================
  let sessionRaf = null;
  let particles = [];

  function initSessionBg(colorA = '#7c3aed', colorB = '#3b82f6') {
    const canvas = document.getElementById('session-bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = Array.from({ length: 50 }, () => ({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        r: Math.random() * 3 + 1,
        vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.4 + 0.05,
        hue: 220 + Math.random() * 80,
      }));
    }
    resize();
    window.addEventListener('resize', resize);

    let t = 0;
    function draw() {
      ctx.fillStyle = 'rgba(5,5,16,0.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (t % 120 === 0) {
        ctx.fillStyle = 'rgba(5,5,16,0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const freqData = ZenAudio.getFrequencyData();
      const boost = freqData.reduce((a, b) => a + b, 0) / freqData.length / 255;
      const cx = canvas.width / 2, cy = canvas.height / 2;
      const baseR = Math.min(canvas.width, canvas.height) * 0.3;

      ctx.beginPath();
      ctx.arc(cx, cy, baseR + boost * 40, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(124,58,237,${0.05 + boost * 0.1})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      particles.forEach(p => {
        p.x = (p.x + p.vx + canvas.width) % canvas.width;
        p.y = (p.y + p.vy + canvas.height) % canvas.height;
        const prox = Math.max(0, 1 - Math.hypot(p.x - cx, p.y - cy) / (baseR * 2));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + boost * 4 * prox, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue + t * 0.1}, 80%, 70%, ${p.alpha + boost * 0.3})`;
        ctx.fill();
      });

      t++;
      sessionRaf = requestAnimationFrame(draw);
    }
    draw();
  }

  function stopSessionBg() {
    if (sessionRaf) cancelAnimationFrame(sessionRaf);
    sessionRaf = null;
  }

  // ============================================
  // VIZ (session audio bars)
  // ============================================
  let vizRaf = null;

  function initViz() {
    const canvas = document.getElementById('viz-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const data = ZenAudio.getFrequencyData();
      const bars = 32;
      const barW = W / bars - 1;
      for (let i = 0; i < bars; i++) {
        const val = data[i] / 255;
        const barH = val * H * 0.85;
        ctx.beginPath();
        ctx.roundRect(i * (barW + 1), H - barH, barW, barH, 2);
        ctx.fillStyle = `hsla(${240 + val * 80}, 80%, 65%, ${0.4 + val * 0.6})`;
        ctx.fill();
      }
      vizRaf = requestAnimationFrame(draw);
    }
    draw();
  }

  function stopViz() {
    if (vizRaf) cancelAnimationFrame(vizRaf);
    vizRaf = null;
  }

  // ============================================
  // AUDIO VIZ (sounds screen — circular)
  // ============================================
  let audioVizRaf = null;

  function initAudioViz() {
    const wrap = document.getElementById('freq-viz-svg');
    if (!wrap) return;

    let canvas = wrap.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.style.cssText = 'display:block;';
      wrap.appendChild(canvas);
    }
    const ctx = canvas.getContext('2d');
    let dpr = window.devicePixelRatio || 1;
    let W = 0, H = 0;

    function resize() {
      dpr = window.devicePixelRatio || 1;
      W = wrap.offsetWidth || 260;
      H = wrap.offsetHeight || 260;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const data = ZenAudio.getFrequencyData();
      const cx = W / 2, cy = H / 2;
      const baseR = Math.min(W, H) * 0.28;

      ctx.beginPath();
      ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 1;
      ctx.stroke();

      const bars = 64;
      for (let i = 0; i < bars; i++) {
        const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
        const val = data[i] / 255;
        const barLen = val * baseR * 0.85;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * baseR, cy + Math.sin(angle) * baseR);
        ctx.lineTo(cx + Math.cos(angle) * (baseR + barLen), cy + Math.sin(angle) * (baseR + barLen));
        ctx.strokeStyle = `hsla(${200 + val * 100}, 80%, 65%, ${0.5 + val * 0.5})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      audioVizRaf = requestAnimationFrame(draw);
    }
    draw();
  }

  function stopAudioViz() {
    if (audioVizRaf) cancelAnimationFrame(audioVizRaf);
    audioVizRaf = null;
  }

  // ============================================
  // CONFETTI
  // ============================================
  let confettiPieces = [];

  function launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ['#7c3aed', '#f5a623', '#06b6d4', '#10b981', '#f43f5e', '#a855f7'];

    confettiPieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width, y: -20,
      r: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4, vy: Math.random() * 3 + 2,
      spin: Math.random() * Math.PI, spinV: (Math.random() - 0.5) * 0.2,
      shape: Math.random() > 0.5 ? 'circle' : 'rect',
    }));

    let alive = true;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      confettiPieces.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.vx *= 0.99; p.spin += p.spinV;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spin);
        ctx.fillStyle = p.color;
        if (p.shape === 'circle') {
          ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        }
        ctx.restore();
      });
      confettiPieces = confettiPieces.filter(p => p.y < canvas.height + 20);
      if (confettiPieces.length > 0 && alive) requestAnimationFrame(draw);
    }
    draw();
    return () => { alive = false; };
  }

  // ============================================
  // BREATH PHASE
  // ============================================
  function setBreathPhase(phase, duration) {
    const circle = document.getElementById('breath-circle');
    const label = document.getElementById('breath-phase');
    if (!circle || !label) return;

    circle.classList.remove('inhale', 'hold', 'exhale');
    circle.style.setProperty('--breath-dur', duration + 's');

    const cfg = { inhale: 'Inhala', hold: 'Retén', exhale: 'Exhala', rest: 'Respira' };
    label.textContent = cfg[phase] || cfg.rest;
    if (phase && phase !== 'rest') {
      void circle.offsetWidth;
      circle.classList.add(phase);
    }

    if (navigator.vibrate) {
      if (phase === 'inhale') navigator.vibrate([100]);
      else if (phase === 'hold') navigator.vibrate([50]);
      else if (phase === 'exhale') navigator.vibrate([200]);
    }
  }

  // ============================================
  // TIMER SVG
  // ============================================
  function updateTimer(elapsed, total) {
    const arc = document.getElementById('timer-arc');
    const text = document.getElementById('timer-text');
    if (!arc || !text) return;

    const circumference = 2 * Math.PI * 44;
    arc.style.strokeDasharray = circumference;
    arc.style.strokeDashoffset = circumference * (1 - Math.min(elapsed / total, 1));

    const remaining = Math.max(0, total - elapsed);
    const m = Math.floor(remaining / 60).toString().padStart(2, '0');
    const s = Math.floor(remaining % 60).toString().padStart(2, '0');
    text.textContent = `${m}:${s}`;
  }

  return {
    initSplash, stopSplash,
    initMandala, stopMandala,
    initSessionBg, stopSessionBg,
    initViz, stopViz,
    initAudioViz, stopAudioViz,
    launchConfetti,
    setBreathPhase,
    updateTimer,
    injectAllSVGs,
    createMetatronCube,
    createFlowerOfLife,
  };
})();
