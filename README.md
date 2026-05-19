# 🔔 ZenFlow — Meditación Activa

> Una PWA de meditación activa con síntesis de audio en tiempo real, mandalas interactivos y guías paso a paso. Todo en español. Sin dependencias externas.

[![PWA](https://img.shields.io/badge/PWA-Instalable-7c3aed)](https://daferur-lang.github.io/zenflow)
[![Vanilla JS](https://img.shields.io/badge/Vanilla-JS-f5a623)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Web Audio API](https://img.shields.io/badge/Web%20Audio-API-06b6d4)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## ✨ Características

### 🎵 Audio sintetizado en tiempo real (Web Audio API)
- **Cuencos tibetanos** — 432 Hz, 528 Hz y 639 Hz con vibrato y armónicos
- **Tambores chamánicos** — Ruido filtrado con ritmo BPM configurable
- **Lluvia** — Ruido blanco con LFO para variación natural
- **Océano** — Filtro lowpass con LFO de olas
- **Bosque** — Síntesis de pájaros + viento generativo
- **Hoguera** — Ruido filtrado con crackles
- **Beats binaurales** — Delta (2Hz), Theta (6Hz), Alpha (10Hz), Gamma (40Hz)
- **Pad ambient** — Osciladores desintonizados con fade suave

### 🧘 8 Sesiones de meditación completas
| Sesión | Duración | Enfoque |
|--------|----------|---------|
| Rescate Urgente | 3 min | Estrés inmediato |
| Despertar Suave | 5 min | Mañana |
| Respiración 4-7-8 | 8 min | Sistema nervioso |
| Gratitud Profunda | 10 min | Bienestar emocional |
| Cuencos Tibetanos | 15 min | Sanación vibracional |
| Meditación Activa | 15 min | Liberación (estilo Osho) |
| Escáner Corporal | 20 min | Relajación profunda |
| Sueño Profundo | 20 min | Descanso |

### 🎨 Animaciones
- Mandala interactivo que reacciona al toque y al audio
- Partículas flotantes sincronizadas con las frecuencias
- Animación de respiración con fases (inhala / retén / exhala)
- Visualizador circular de frecuencias en tiempo real
- Confetti de celebración al completar sesión

### 📊 Seguimiento
- Racha de días consecutivos
- Minutos totales meditados
- Historial de sesiones
- Registro de ánimo pre/post sesión
- 9 logros desbloqueables

---

## 🚀 Instalación y uso

### Opción 1: Abrir directamente
```bash
# Clona el repositorio
git clone https://github.com/daferur-lang/zenflow.git
cd zenflow

# Sirve con cualquier servidor local
npx serve .
# o
python -m http.server 8080
```
Abre `http://localhost:8080` en el navegador.

### Opción 2: GitHub Pages
La app se despliega automáticamente en:
`https://daferur-lang.github.io/zenflow`

---

## 📱 Instalación como app (PWA)

### Android (Chrome)
1. Abre la app en Chrome
2. Toca el menú `⋮` → **"Instalar app"**
3. Confirma → aparece en tu pantalla de inicio

### iOS (Safari)
1. Abre la app en Safari
2. Toca el botón **compartir** `⬆`
3. Selecciona **"Añadir a pantalla de inicio"**
4. Toca **Agregar**

---

## 🔔 Generar iconos PNG

La primera vez necesitas generar los iconos PNG:

1. Abre `icons/generate-icons.html` en un navegador
2. Haz clic en **"Generar y descargar iconos"**
3. Guarda `icon-192.png` e `icon-512.png` en la carpeta `icons/`

---

## 🏗 Estructura del proyecto

```
zenflow/
├── index.html              # App shell (SPA)
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker (offline-first)
├── css/
│   └── style.css           # Diseño completo (glassmorphism, dark)
├── js/
│   ├── audio.js            # Motor de síntesis Web Audio API
│   ├── animations.js       # Canvas: mandala, partículas, visualizador
│   ├── sessions.js         # Datos y controlador de sesiones
│   ├── tracker.js          # Progreso, logros, historial
│   └── app.js              # Orquestador principal
└── icons/
    ├── icon.svg            # Icono vectorial
    ├── icon-192.png        # Icono PWA (generar)
    ├── icon-512.png        # Icono PWA (generar)
    └── generate-icons.html # Generador en el navegador
```

---

## 🛠 Stack técnico

| Tecnología | Uso |
|------------|-----|
| HTML5 / CSS3 / JS Vanilla | Sin frameworks, máximo rendimiento |
| Web Audio API | Síntesis de sonido en tiempo real |
| Canvas 2D API | Mandala, partículas, visualizador |
| Service Worker | Funcionamiento 100% offline |
| Web App Manifest | Instalación PWA |
| LocalStorage | Persistencia de progreso |
| Web Speech API | Feedback háptico (vibración) |

---

## 🎧 Nota sobre beats binaurales

Los beats binaurales requieren **auriculares** para funcionar correctamente. El efecto se produce porque cada oído recibe una frecuencia ligeramente diferente, y el cerebro genera la diferencia como una tercera frecuencia interna.

---

## 📄 Licencia

MIT © 2025 daferur-lang
