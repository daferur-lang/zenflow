/* ============================================
   ZENFLOW — Animaciones (Canvas 2D)
   ============================================ */

const ZenAnim = (() => {

  // ============================================
  // SPLASH MANDALA
  // ============================================
  let splashRaf = null;

  function initSplash() {
    const canvas = document.getElementById('splash-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let t = 0;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const maxR = Math.min(cx, cy) * 0.85;

      // Partículas de fondo flotantes
      for (let i = 0; i < 60; i++) {
        const seed = i * 137.508;
        const px = cx + Math.cos(seed + t * 0.0003) * (maxR * 0.8 + i * 2);
        const py = cy + Math.sin(seed * 0.7 + t * 0.0002) * (maxR * 0.6 + i * 1.5);
        const a = (Math.sin(t * 0.001 + i) + 1) / 2 * 0.4 + 0.05;
        const size = 1 + Math.sin(t * 0.002 + i * 0.5) * 1;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${240 + i * 3}, 80%, 70%, ${a})`;
        ctx.fill();
      }

      // Mandala de bienvenida
      drawMandala(ctx, cx, cy, maxR * 0.45, t * 0.0004, null, true);

      t++;
      splashRaf = requestAnimationFrame(draw);
    }
    draw();
  }

  function stopSplash() {
    if (splashRaf) cancelAnimationFrame(splashRaf);
    splashRaf = null;
  }

  // ============================================
  // MANDALA PRINCIPAL (HOME)
  // ============================================
  let mandalaRaf = null;
  let mandalaT = 0;
  let ripples = [];

  function initMandala() {
    const canvas = document.getElementById('mandala-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const SIZE = canvas.offsetWidth * window.devicePixelRatio;
    canvas.width = SIZE;
    canvas.height = SIZE;
    canvas.style.width = canvas.offsetWidth + 'px';
    canvas.style.height = canvas.offsetHeight + 'px';

    canvas.addEventListener('click', onMandalaClick);
    canvas.addEventListener('touchstart', e => { e.preventDefault(); onMandalaClick(e.touches[0]); }, { passive: false });

    function onMandalaClick(e) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width * SIZE;
      const y = (e.clientY - rect.top) / rect.height * SIZE;
      ripples.push({ x, y, r: 0, maxR: SIZE * 0.6, alpha: 0.8, born: mandalaT });
      ZenAudio.bowlTap();
    }

    function draw() {
      ctx.clearRect(0, 0, SIZE, SIZE);
      const cx = SIZE / 2;
      const cy = SIZE / 2;
      const freqData = ZenAudio.getFrequencyData();

      // Fondo circular suave
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
      bgGrad.addColorStop(0, 'rgba(124,58,237,0.08)');
      bgGrad.addColorStop(0.5, 'rgba(59,130,246,0.04)');
      bgGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, cx, 0, Math.PI * 2);
      ctx.fill();

      // Mandala
      drawMandala(ctx, cx, cy, cx * 0.85, mandalaT * 0.003, freqData, false);

      // Ripples de toque
      ripples = ripples.filter(rip => rip.alpha > 0.01);
      ripples.forEach(rip => {
        rip.r += 3;
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
  // CORE: Dibujado del mandala
  // ============================================
  function drawMandala(ctx, cx, cy, radius, rotation, freqData, isSplash) {
    const petals = 8;
    const layers = 5;
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
        const angle = (i / petals) * Math.PI * 2;
        ctx.save();
        ctx.rotate(angle);

        const pr = r + audioBoost * r * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(
          pr * 0.45, -pr * 0.28,
          pr, -pr * 0.28,
          pr, 0
        );
        ctx.bezierCurveTo(
          pr, pr * 0.28,
          pr * 0.45, pr * 0.28,
          0, 0
        );

        const hue = 240 + layer * 25 + (freqData ? audioBoost * 80 : 0);
        const alpha = (0.25 - layer * 0.03) + audioBoost * 0.3;
        ctx.fillStyle = `hsla(${hue}, 75%, 65%, ${Math.min(alpha, 0.5)})`;
        ctx.fill();
        ctx.restore();
      }

      // Anillo geométrico
      const ringAlpha = 0.15 + audioBoost * 0.5;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${200 + layer * 20}, 70%, 70%, ${ringAlpha})`;
      ctx.lineWidth = isSplash ? 1 : 0.8;
      ctx.stroke();

      // Puntos en el anillo
      if (layer === 2 || layer === 4) {
        const dots = petals * 2;
        for (let d = 0; d < dots; d++) {
          const a = (d / dots) * Math.PI * 2;
          const dx = Math.cos(a) * r;
          const dy = Math.sin(a) * r;
          ctx.beginPath();
          ctx.arc(dx, dy, 1.5 + audioBoost * 3, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${300 + d * 5}, 80%, 75%, ${0.4 + audioBoost})`;
          ctx.fill();
        }
      }

      ctx.restore();
    }

    // Centro
    const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.1);
    centerGrad.addColorStop(0, 'rgba(245,166,35,0.8)');
    centerGrad.addColorStop(1, 'rgba(245,166,35,0)');
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = centerGrad;
    ctx.fill();

    ctx.restore();
  }

  // ============================================
  // SESIÓN — Fondo con partículas
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
      // Crear partículas
      particles = Array.from({ length: 50 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 3 + 1,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
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

      // Gradiente de fondo suave
      if (t % 120 === 0) {
        ctx.fillStyle = 'rgba(5,5,16,0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const freqData = ZenAudio.getFrequencyData();
      const avgFreq = freqData.reduce((a, b) => a + b, 0) / freqData.length;
      const boost = avgFreq / 255;

      // Círculo central de audio
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const baseR = Math.min(canvas.width, canvas.height) * 0.3;

      ctx.beginPath();
      ctx.arc(cx, cy, baseR + boost * 40, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(124,58,237,${0.05 + boost * 0.1})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Partículas
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const dist = Math.hypot(p.x - cx, p.y - cy);
        const proximity = Math.max(0, 1 - dist / (baseR * 2));
        const r = p.r + boost * 4 * proximity;

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
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
  // VISUALIZADOR DE AUDIO (barra de sesión y pantalla sonidos)
  // ============================================
  let vizRaf = null;
  let audioVizRaf = null;

  function initViz() {
    const canvas = document.getElementById('viz-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const data = ZenAudio.getFrequencyData();
      const bars = 32;
      const barW = (W / bars) - 1;

      for (let i = 0; i < bars; i++) {
        const val = data[i] / 255;
        const barH = val * H * 0.85;
        const hue = 240 + val * 80;
        const alpha = 0.4 + val * 0.6;

        ctx.beginPath();
        ctx.roundRect(i * (barW + 1), H - barH, barW, barH, 2);
        ctx.fillStyle = `hsla(${hue}, 80%, 65%, ${alpha})`;
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

  function initAudioViz() {
    const canvas = document.getElementById('audio-viz-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    resize();

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    function draw() {
      ctx.clearRect(0, 0, W(), H());
      const data = ZenAudio.getFrequencyData();
      const cx = W() / 2;
      const cy = H() / 2;
      const baseR = Math.min(W(), H()) * 0.3;
      const bars = 64;

      // Círculo de fondo
      ctx.beginPath();
      ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Barras circulares
      for (let i = 0; i < bars; i++) {
        const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
        const val = data[i] / 255;
        const barH = val * baseR * 0.8;
        const x1 = cx + Math.cos(angle) * baseR;
        const y1 = cy + Math.sin(angle) * baseR;
        const x2 = cx + Math.cos(angle) * (baseR + barH);
        const y2 = cy + Math.sin(angle) * (baseR + barH);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `hsla(${200 + val * 100}, 80%, 65%, ${0.5 + val * 0.5})`;
        ctx.lineWidth = 2;
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
  // CONFETTI de celebración
  // ============================================
  let confettiPieces = [];
  let confettiRaf = null;

  function launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#7c3aed', '#f5a623', '#06b6d4', '#10b981', '#f43f5e', '#a855f7'];
    confettiPieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -20,
      r: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 2,
      spin: Math.random() * Math.PI,
      spinV: (Math.random() - 0.5) * 0.2,
      shape: Math.random() > 0.5 ? 'circle' : 'rect',
    }));

    let alive = true;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      confettiPieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.vx *= 0.99;
        p.spin += p.spinV;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spin);
        ctx.fillStyle = p.color;
        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        }
        ctx.restore();
      });

      confettiPieces = confettiPieces.filter(p => p.y < canvas.height + 20);
      if (confettiPieces.length > 0 && alive) {
        confettiRaf = requestAnimationFrame(draw);
      }
    }
    draw();

    return () => { alive = false; };
  }

  // ============================================
  // ANIMACIÓN DE RESPIRACIÓN
  // ============================================
  function setBreathPhase(phase, duration) {
    const circle = document.getElementById('breath-circle');
    const label = document.getElementById('breath-phase');
    if (!circle || !label) return;

    circle.classList.remove('inhale', 'hold', 'exhale');
    circle.style.setProperty('--breath-dur', duration + 's');

    const phases = {
      inhale: { cls: 'inhale', label: 'Inhala', color: 'rgba(124,58,237,' },
      hold:   { cls: 'hold',   label: 'Retén',  color: 'rgba(245,166,35,' },
      exhale: { cls: 'exhale', label: 'Exhala', color: 'rgba(6,182,212,' },
      rest:   { cls: '',       label: 'Respira', color: 'rgba(124,58,237,' },
    };

    const cfg = phases[phase] || phases.rest;
    label.textContent = cfg.label;
    if (cfg.cls) {
      void circle.offsetWidth; // force reflow
      circle.classList.add(cfg.cls);
    }

    if (navigator.vibrate) {
      if (phase === 'inhale') navigator.vibrate([100]);
      if (phase === 'hold')   navigator.vibrate([50]);
      if (phase === 'exhale') navigator.vibrate([200]);
    }
  }

  // ============================================
  // TIMER SVG
  // ============================================
  function updateTimer(elapsed, total) {
    const arc = document.getElementById('timer-arc');
    const text = document.getElementById('timer-text');
    if (!arc || !text) return;

    const circumference = 2 * Math.PI * 62;
    const progress = Math.min(elapsed / total, 1);
    arc.style.strokeDashoffset = circumference * (1 - progress);

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
  };
})();
