"use strict";

/* ==========================================================
   Morpheus FX · motor visual y utilidades compartidas
   ========================================================== */

const HISTORY_KEY = "mn-history";
const THEME_KEY = "mn-theme";
const SOUND_KEY = "mn-sound";

const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* ---------- Almacenamiento seguro ---------- */

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* almacenamiento lleno o bloqueado */
  }
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

/* ---------- Historial local: "Mis notas" ---------- */

export function getHistory() {
  const list = readJson(HISTORY_KEY, []);
  return Array.isArray(list) ? list : [];
}

export function saveToHistory(entry) {
  if (!entry?.code) return;

  const list = getHistory().filter((item) => item.code !== entry.code);
  const previous = getHistory().find((item) => item.code === entry.code);

  list.unshift({ ...previous, ...entry, savedAt: Date.now() });
  writeJson(HISTORY_KEY, list.slice(0, 30));
}

export function removeFromHistory(code) {
  writeJson(HISTORY_KEY, getHistory().filter((item) => item.code !== code));
}

/* ---------- Toasts ---------- */

export function toast(message, icon = "sparkles") {
  let box = document.querySelector("#fxToasts");

  if (!box) {
    box = document.createElement("div");
    box.id = "fxToasts";
    box.setAttribute("role", "status");
    box.setAttribute("aria-live", "polite");
    document.body.appendChild(box);
  }

  const item = document.createElement("div");
  item.className = "fx-toast";
  item.innerHTML = `<i data-lucide="${icon}"></i><span>${escapeHtml(message)}</span>`;
  box.appendChild(item);
  window.lucide?.createIcons();

  setTimeout(() => {
    item.classList.add("fx-toast--out");
    setTimeout(() => item.remove(), 320);
  }, 2800);
}

/* ---------- Sonido (WebAudio, sin archivos) ---------- */

let audioCtx = null;

export function isSoundOn() {
  return localStorage.getItem(SOUND_KEY) !== "off";
}

export function chime(kind = "wake") {
  if (!isSoundOn()) return;

  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();

    const notes = kind === "wake" ? [523.25, 659.25, 783.99, 1046.5] : [440, 554.37];
    const start = audioCtx.currentTime;

    notes.forEach((freq, index) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const at = start + index * 0.13;

      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.14, at + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.9);

      osc.connect(gain).connect(audioCtx.destination);
      osc.start(at);
      osc.stop(at + 0.95);
    });
  } catch {
    /* sin audio disponible */
  }
}

/* ---------- Confeti ---------- */

export function confetti(amount = 140) {
  if (reducedMotion) return;

  let canvas = document.querySelector("#fxConfetti");

  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "fxConfetti";
    document.body.appendChild(canvas);
  }

  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ["#8b7bff", "#22e3ff", "#ff7bd5", "#34f0a1", "#ffc04d", "#ffffff"];

  const pieces = Array.from({ length: amount }, () => ({
    x: canvas.width / 2 + (Math.random() - 0.5) * 120,
    y: canvas.height * 0.45,
    vx: (Math.random() - 0.5) * 16,
    vy: -Math.random() * 15 - 4,
    size: Math.random() * 7 + 4,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.4,
    color: colors[Math.floor(Math.random() * colors.length)],
    life: 1
  }));

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    pieces.forEach((p) => {
      p.vy += 0.38;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= 0.006;

      if (p.life > 0 && p.y < canvas.height + 20) {
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
    });

    if (alive) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(frame);
}

/* ---------- Máquina de escribir ---------- */

let typingTimer = null;

export function typewrite(element, text, { onDone } = {}) {
  clearInterval(typingTimer);

  if (reducedMotion || !text) {
    element.textContent = text;
    element.classList.remove("fx-typing");
    onDone?.();
    return;
  }

  const chars = Array.from(text);
  const step = Math.max(1, Math.ceil(chars.length / 150));
  let index = 0;

  element.textContent = "";
  element.classList.add("fx-typing");

  const finish = () => {
    clearInterval(typingTimer);
    element.textContent = text;
    element.classList.remove("fx-typing");
    element.removeEventListener("click", finish);
    onDone?.();
  };

  element.addEventListener("click", finish, { once: true });

  typingTimer = setInterval(() => {
    index += step;
    element.textContent = chars.slice(0, index).join("");

    if (index >= chars.length) finish();
  }, 18);
}

/* ---------- Cuenta regresiva viva con anillo ---------- */

let countdownTimer = null;

export function startLiveCountdown({ container, openAt, createdAt, code, onWake }) {
  clearInterval(countdownTimer);

  const target = new Date(openAt).getTime();
  if (!container || Number.isNaN(target)) return;

  const total = Math.max(target - (new Date(createdAt).getTime() || target - 7 * 86400000), 1000);
  const circumference = 2 * Math.PI * 70;
  let lastValues = [];
  let woke = false;

  container.innerHTML = `
    <div class="fx-ring" aria-hidden="true">
      <svg viewBox="0 0 168 168">
        <defs>
          <linearGradient id="fxRingGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#8b7bff" />
            <stop offset="100%" stop-color="#22e3ff" />
          </linearGradient>
        </defs>
        <circle class="fx-ring__track" cx="84" cy="84" r="70" />
        <circle class="fx-ring__bar" cx="84" cy="84" r="70"
          stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}" />
      </svg>
      <div class="fx-ring__label"><strong data-fx-percent>0%</strong><span>del camino</span></div>
    </div>
  `;

  const units = document.createElement("div");
  units.className = "mn-countdown";
  container.classList.remove("mn-countdown");
  container.appendChild(units);

  const bar = container.querySelector(".fx-ring__bar");
  const percent = container.querySelector("[data-fx-percent]");

  function tick() {
    if (!container.isConnected) {
      clearInterval(countdownTimer);
      document.title = "Morpheus Note";
      return;
    }

    const remaining = Math.max(target - Date.now(), 0);
    const seconds = Math.floor(remaining / 1000);
    const values = [
      Math.floor(seconds / 86400),
      Math.floor((seconds % 86400) / 3600),
      Math.floor((seconds % 3600) / 60),
      seconds % 60
    ];
    const labels = ["Días", "Horas", "Min", "Seg"];

    units.innerHTML = values
      .map((value, i) => `
        <div>
          <strong class="${lastValues[i] !== undefined && lastValues[i] !== value ? "fx-tick" : ""}">${String(value).padStart(2, "0")}</strong>
          <span>${labels[i]}</span>
        </div>
      `)
      .join("");

    lastValues = values;

    const progress = Math.min(Math.max(1 - remaining / total, 0), 1);
    bar.style.strokeDashoffset = String(circumference * (1 - progress));
    percent.textContent = `${Math.floor(progress * 100)}%`;

    const clock = values.slice(1).map((n) => String(n).padStart(2, "0")).join(":");
    document.title = `⏳ ${values[0] ? `${values[0]}d ` : ""}${clock} · Morpheus Note`;

    if (remaining <= 0 && !woke) {
      woke = true;
      clearInterval(countdownTimer);
      document.title = "🌅 ¡Despertó! · Morpheus Note";
      chime("wake");
      confetti(90);
      toast("¡La nota despertó!", "sunrise");

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Morpheus Note", { body: `La nota ${code || ""} ya despertó.` });
      }

      onWake?.();
    }
  }

  tick();
  countdownTimer = setInterval(tick, 1000);
}

/* ---------- Fondo: campo de estrellas conectadas ---------- */

function initCanvas() {
  if (reducedMotion) return;

  const canvas = document.createElement("canvas");
  canvas.id = "fxCanvas";
  document.body.prepend(canvas);

  const ctx = canvas.getContext("2d");
  const mouse = { x: -999, y: -999 };
  let width = 0;
  let height = 0;
  let stars = [];

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const count = Math.min(Math.floor((width * height) / 15000), 110);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.6 + 0.4,
      hue: Math.random() > 0.5 ? 255 : 190
    }));
  }

  function draw() {
    if (document.hidden) {
      requestAnimationFrame(draw);
      return;
    }

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < stars.length; i += 1) {
      const a = stars[i];
      a.x += a.vx;
      a.y += a.vy;

      if (a.x < 0 || a.x > width) a.vx *= -1;
      if (a.y < 0 || a.y > height) a.vy *= -1;

      const dxm = a.x - mouse.x;
      const dym = a.y - mouse.y;
      const dm = Math.hypot(dxm, dym);

      if (dm < 140) {
        a.x += (dxm / dm) * 0.9;
        a.y += (dym / dm) * 0.9;
      }

      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${a.hue}, 100%, 78%, 0.85)`;
      ctx.shadowColor = `hsl(${a.hue}, 100%, 70%)`;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      for (let j = i + 1; j < stars.length; j += 1) {
        const b = stars[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);

        if (d < 120) {
          ctx.strokeStyle = `rgba(139, 123, 255, ${0.22 * (1 - d / 120)})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
  });
  window.addEventListener("mouseleave", () => {
    mouse.x = -999;
    mouse.y = -999;
  });

  resize();
  draw();
}

/* ---------- Tema ---------- */

function applyTheme(theme) {
  const light = theme === "light";
  const skin = document.querySelector("#mnDarkSkin");

  document.documentElement.dataset.theme = light ? "light" : "dark";
  if (skin) skin.disabled = light;

  const canvas = document.querySelector("#fxCanvas");
  if (canvas) canvas.style.opacity = light ? "0.25" : "0.9";
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
  toast(next === "light" ? "Tema claro" : "Tema oscuro", next === "light" ? "sun" : "moon-star");
}

function toggleSound() {
  const next = isSoundOn() ? "off" : "on";
  localStorage.setItem(SOUND_KEY, next);
  syncToolButtons();
  toast(next === "on" ? "Sonido activado" : "Sonido silenciado", next === "on" ? "volume-2" : "volume-x");
  if (next === "on") chime("tap");
}

function syncToolButtons() {
  document.querySelectorAll('[data-fx="sound"]').forEach((button) => {
    button.setAttribute("aria-pressed", String(isSoundOn()));
  });
}

/* ---------- Paleta de comandos (Ctrl/Cmd + K) ---------- */

let paletteIndex = 0;

function paletteItems() {
  const base = [
    { icon: "home", label: "Ir al inicio", hint: "G H", run: () => (location.hash = "#/") },
    { icon: "plus-circle", label: "Crear nota", hint: "G C", run: () => (location.hash = "#/create") },
    { icon: "lock-open", label: "Abrir nota", hint: "G O", run: () => (location.hash = "#/open") },
    { icon: "sun-moon", label: "Cambiar tema", run: toggleTheme },
    { icon: "volume-2", label: "Activar o silenciar sonido", run: toggleSound },
    {
      icon: "bell-ring",
      label: "Permitir avisos del navegador",
      run: async () => {
        if (!("Notification" in window)) return toast("Tu navegador no soporta avisos", "bell-off");
        const result = await Notification.requestPermission();
        toast(result === "granted" ? "Avisos activados" : "Avisos no permitidos", "bell-ring");
      }
    }
  ];

  const notes = getHistory().map((item) => ({
    icon: "moon-star",
    label: `Abrir ${item.code}${item.title ? ` · ${item.title}` : ""}`,
    hint: "Mis notas",
    run: () => (location.hash = `#/open/${item.code}`)
  }));

  return [...base, ...notes];
}

function openPalette() {
  let root = document.querySelector("#fxPalette");

  if (!root) {
    root = document.createElement("div");
    root.id = "fxPalette";
    root.className = "fx-palette";
    root.innerHTML = `
      <div class="fx-palette__box" role="dialog" aria-modal="true" aria-label="Paleta de comandos">
        <input class="fx-palette__input" type="text" placeholder="Escribí un comando o un código de nota…" autocomplete="off" />
        <ul class="fx-palette__list" role="listbox"></ul>
      </div>
    `;
    document.body.appendChild(root);

    root.addEventListener("click", (event) => {
      if (event.target === root) closePalette();
    });

    root.querySelector("input").addEventListener("input", renderPalette);
    root.querySelector("input").addEventListener("keydown", (event) => {
      const rows = root.querySelectorAll(".fx-palette__item");

      if (event.key === "ArrowDown") {
        event.preventDefault();
        paletteIndex = (paletteIndex + 1) % Math.max(rows.length, 1);
        renderPalette(null, true);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        paletteIndex = (paletteIndex - 1 + rows.length) % Math.max(rows.length, 1);
        renderPalette(null, true);
      } else if (event.key === "Enter") {
        event.preventDefault();
        rows[paletteIndex]?.click();
      } else if (event.key === "Escape") {
        closePalette();
      }
    });
  }

  root.hidden = false;
  const input = root.querySelector("input");
  input.value = "";
  paletteIndex = 0;
  renderPalette();
  input.focus();
}

function closePalette() {
  const root = document.querySelector("#fxPalette");
  if (root) root.hidden = true;
}

function renderPalette(_event, keepIndex) {
  const root = document.querySelector("#fxPalette");
  const input = root.querySelector("input");
  const list = root.querySelector("ul");
  const query = input.value.trim();
  const lower = query.toLowerCase();

  if (!keepIndex) paletteIndex = 0;

  let items = paletteItems().filter((item) => item.label.toLowerCase().includes(lower));

  if (/^mn-?[a-z0-9]{4,}$/i.test(query)) {
    const code = query.toUpperCase().replace(/^MN-?/, "MN-");
    items = [
      { icon: "key-round", label: `Abrir nota ${code}`, hint: "Enter", run: () => (location.hash = `#/open/${code}`) },
      ...items
    ];
  }

  paletteIndex = Math.min(paletteIndex, Math.max(items.length - 1, 0));

  list.innerHTML = items.length
    ? items
        .map((item, i) => `
          <li class="fx-palette__item" role="option" data-i="${i}" aria-selected="${i === paletteIndex}">
            <i data-lucide="${item.icon}"></i>${escapeHtml(item.label)}
            ${item.hint ? `<small>${escapeHtml(item.hint)}</small>` : ""}
          </li>
        `)
        .join("")
    : `<li class="fx-palette__empty">Sin resultados</li>`;

  list.querySelectorAll(".fx-palette__item").forEach((row) => {
    row.addEventListener("click", () => {
      closePalette();
      items[Number(row.dataset.i)].run();
    });
  });

  window.lucide?.createIcons();
}

/* ---------- Interacciones globales ---------- */

function initPointerEffects() {
  const spotlight = document.createElement("div");
  spotlight.className = "fx-spotlight";
  document.body.prepend(spotlight);

  const bar = document.createElement("div");
  bar.className = "fx-progress";
  document.body.appendChild(bar);

  window.addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
  }, { passive: true });

  document.addEventListener("pointermove", (event) => {
    spotlight.style.setProperty("--fx-x", `${event.clientX}px`);
    spotlight.style.setProperty("--fx-y", `${event.clientY}px`);

    if (reducedMotion || event.pointerType === "touch") return;

    const card = event.target.closest?.(".mn-card, .mn-preview, .mn-share-card, .fx-history__item");
    if (!card) return;

    card.setAttribute("data-tilt", "");
    const rect = card.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;

    card.style.setProperty("--tx", `${px * 100}%`);
    card.style.setProperty("--ty", `${py * 100}%`);
    card.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 9}deg) rotateY(${(px - 0.5) * 11}deg) translateZ(6px)`;
  });

  document.addEventListener("pointerout", (event) => {
    const card = event.target.closest?.("[data-tilt]");
    if (card && !card.contains(event.relatedTarget)) card.style.transform = "";
  });

  document.addEventListener("pointerdown", (event) => {
    const button = event.target.closest?.(".mn-btn, .mn-small-btn, .mn-copy-btn");
    if (!button || reducedMotion) return;

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const ripple = document.createElement("span");

    ripple.className = "fx-ripple";
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${event.clientX - rect.left - size / 2}px;top:${event.clientY - rect.top - size / 2}px`;
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  });

  document.addEventListener("click", (event) => {
    const tool = event.target.closest?.("[data-fx]");
    if (!tool) return;

    const action = tool.dataset.fx;
    if (action === "theme") toggleTheme();
    if (action === "sound") toggleSound();
    if (action === "palette") openPalette();
  });

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openPalette();
    }
  });
}

let revealObserver = null;

function revealOnScroll() {
  revealObserver?.disconnect();

  const targets = document.querySelectorAll(
    ".mn-section, .mn-card, .mn-feature-strip > div, .mn-form__section, .mn-option-panel, .fx-history__item, .fx-stat"
  );

  if (reducedMotion || !("IntersectionObserver" in window)) return;

  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("fx-in");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  targets.forEach((element, index) => {
    element.classList.add("fx-reveal");
    element.style.transitionDelay = `${Math.min(index % 6, 5) * 70}ms`;
    revealObserver.observe(element);
  });
}

export function onPageMounted() {
  const main = document.querySelector(".mn-main");

  if (main) {
    main.classList.remove("fx-page-enter");
    void main.offsetWidth;
    main.classList.add("fx-page-enter");
  }

  document.body.classList.remove("fx-focus");
  window.speechSynthesis?.cancel();
  document.querySelector("#fxConfetti")?.remove();
  document.title = "Morpheus Note";
  window.scrollTo({ top: 0 });
  revealOnScroll();
  syncToolButtons();
}

export function initFx() {
  initCanvas();
  initPointerEffects();
  applyTheme(localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark");
}
