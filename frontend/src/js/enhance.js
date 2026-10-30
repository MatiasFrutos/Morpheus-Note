"use strict";

/* ==========================================================
   Mejoras por página: se montan sobre el DOM que renderiza el router
   ========================================================== */

import {
  chime,
  confetti,
  escapeHtml,
  getHistory,
  removeFromHistory,
  saveToHistory,
  toast
} from "./fx.js";

const DRAFT_KEY = "mn-draft";
const PHRASES = [
  "sorpresas de cumpleaños",
  "mensajes al futuro",
  "búsquedas del tesoro",
  "declaraciones inolvidables",
  "cápsulas del tiempo"
];

let homeTimers = [];

export function enhancePage(route) {
  homeTimers.forEach(clearInterval);
  homeTimers = [];

  switch (route.page) {
    case "home":
      enhanceHome();
      break;
    case "create":
      enhanceCreate();
      break;
    case "open":
      enhanceOpen(route.params);
      break;
    default:
      break;
  }

  window.lucide?.createIcons();
}

/* ---------- Utilidades ---------- */

function relativeTime(value) {
  const diff = new Date(value).getTime() - Date.now();
  if (Number.isNaN(diff)) return "";

  const abs = Math.abs(diff);
  const units = [
    [86400000, "día"],
    [3600000, "hora"],
    [60000, "min"]
  ];

  for (const [ms, label] of units) {
    if (abs >= ms) {
      const n = Math.floor(abs / ms);
      const text = `${n} ${label}${n > 1 && label !== "min" ? "s" : ""}`;
      return diff > 0 ? `despierta en ${text}` : `despertó hace ${text}`;
    }
  }

  return diff > 0 ? "despierta en instantes" : "despertó recién";
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function noteUrl(code) {
  return `${window.location.origin}${window.location.pathname}#/open/${code}`;
}

/* ---------- Inicio ---------- */

function enhanceHome() {
  const content = document.querySelector(".mn-hero__content");
  const h1 = content?.querySelector("h1");
  const actions = content?.querySelector(".mn-hero__actions");

  if (h1) {
    const typedLine = document.createElement("p");
    typedLine.className = "fx-live";
    typedLine.innerHTML = `Ideal para <strong class="fx-typed" id="fxTyped"></strong><span class="fx-caret"></span>`;
    h1.after(typedLine);
    startTyping(document.querySelector("#fxTyped"));
  }

  const history = getHistory();
  const upcoming = history
    .filter((item) => item.openAt && new Date(item.openAt) > new Date())
    .sort((a, b) => new Date(a.openAt) - new Date(b.openAt))[0];

  if (actions) {
    const stats = document.createElement("div");
    stats.className = "fx-stats";
    stats.innerHTML = `
      <div class="fx-stat"><strong>${history.length}</strong><span>Notas en este dispositivo</span></div>
      <div class="fx-stat"><strong id="fxNext">—</strong><span>${upcoming ? "Próxima en despertar" : "Sin notas pendientes"}</span></div>
      <div class="fx-stat"><strong id="fxClock">--:--:--</strong><span>Hora local</span></div>
    `;
    actions.after(stats);

    const next = stats.querySelector("#fxNext");
    const clock = stats.querySelector("#fxClock");

    const update = () => {
      if (!clock.isConnected) return;

      const now = new Date();
      clock.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      if (upcoming) {
        const left = Math.max(new Date(upcoming.openAt) - now, 0);
        const s = Math.floor(left / 1000);
        next.textContent = `${Math.floor(s / 86400)}d ${pad(Math.floor((s % 86400) / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
      }
    };

    update();
    homeTimers.push(setInterval(update, 1000));
  }

  const preview = document.querySelector(".mn-preview__body p");

  if (preview) {
    const target = Date.now() + 3 * 3600000 + 59 * 60000;
    preview.classList.add("fx-live");

    const update = () => {
      if (!preview.isConnected) return;

      const s = Math.max(Math.floor((target - Date.now()) / 1000), 0);
      preview.textContent = `Despierta en ${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
    };

    update();
    homeTimers.push(setInterval(update, 1000));
  }

  renderHistorySection();
}

function startTyping(element) {
  if (!element) return;

  let phrase = 0;
  let char = 0;
  let deleting = false;

  const step = () => {
    if (!element.isConnected) return;

    const text = PHRASES[phrase];
    char += deleting ? -1 : 1;
    element.textContent = text.slice(0, char);

    let delay = deleting ? 28 : 65;

    if (!deleting && char === text.length) {
      deleting = true;
      delay = 1600;
    } else if (deleting && char === 0) {
      deleting = false;
      phrase = (phrase + 1) % PHRASES.length;
      delay = 300;
    }

    setTimeout(step, delay);
  };

  step();
}

function renderHistorySection() {
  const history = getHistory();
  const main = document.querySelector(".mn-main");
  if (!main || !history.length) return;

  const section = document.createElement("section");
  section.className = "mn-section";
  section.innerHTML = `
    <div class="mn-section__header">
      <span class="mn-eyebrow">Mis notas</span>
      <h2>Guardadas en este dispositivo.</h2>
    </div>
    <div class="fx-history" id="fxHistory"></div>
  `;
  main.appendChild(section);

  const list = section.querySelector("#fxHistory");

  const render = () => {
    const items = getHistory();

    if (!items.length) {
      section.remove();
      return;
    }

    list.innerHTML = items
      .map((item) => `
        <article class="fx-history__item" data-code="${escapeHtml(item.code)}">
          <button type="button" class="fx-history__remove" data-remove="${escapeHtml(item.code)}" aria-label="Quitar de mis notas">
            <i data-lucide="x"></i>
          </button>
          <span class="fx-history__code">${escapeHtml(item.code)}</span>
          <h3>${escapeHtml(item.title || "Nota sin título")}</h3>
          <span class="fx-history__meta">
            ${item.openAt ? escapeHtml(relativeTime(item.openAt)) : item.kind === "opened" ? "Abierta por vos" : ""}
          </span>
          <div class="fx-history__actions">
            <a class="fx-chip" href="#/open/${encodeURIComponent(item.code)}"><i data-lucide="lock-open"></i>Abrir</a>
            <button type="button" class="fx-chip" data-copy-link="${escapeHtml(item.code)}"><i data-lucide="link"></i>Copiar link</button>
          </div>
        </article>
      `)
      .join("");

    window.lucide?.createIcons();
  };

  list.addEventListener("click", async (event) => {
    const remove = event.target.closest("[data-remove]");
    const copy = event.target.closest("[data-copy-link]");

    if (remove) {
      removeFromHistory(remove.dataset.remove);
      render();
      toast("Nota quitada de tu lista", "trash-2");
    }

    if (copy) {
      try {
        await navigator.clipboard.writeText(noteUrl(copy.dataset.copyLink));
        toast("Link copiado", "link");
      } catch {
        toast("No se pudo copiar", "x-circle");
      }
    }
  });

  render();
}

/* ---------- Crear ---------- */

function enhanceCreate() {
  const form = document.querySelector("#createNoteForm");
  if (!form) return;

  restoreDraft(form);
  addDateChips(form);
  addCounters(form);

  form.addEventListener("input", (event) => {
    if (event.target.matches("textarea")) updateCounter(event.target);
    saveDraft(form);
  });

  let pending = null;

  form.addEventListener("submit", () => {
    const data = new FormData(form);
    pending = {
      title: String(data.get("title") || "").trim(),
      openAt: `${data.get("openDate")}T${data.get("openTime")}`
    };
  }, true);

  const result = document.querySelector("#createNoteResult");

  const observer = new MutationObserver(() => {
    const code = result.querySelector("[data-copy]")?.dataset.copy;
    if (!code || result.dataset.fxDone === code) return;

    result.dataset.fxDone = code;
    saveToHistory({ code, kind: "created", ...pending });
    localStorage.removeItem(DRAFT_KEY);

    chime("wake");
    confetti(120);
    addShareButtons(result, code, pending?.title);
    window.lucide?.createIcons();
  });

  observer.observe(result, { childList: true });
}

function addDateChips(form) {
  const grid = form.querySelector(".mn-date-time-grid");
  if (!grid) return;

  const presets = [
    ["En 1 hora", () => new Date(Date.now() + 3600000)],
    ["Esta noche 21:00", () => at(0, 21)],
    ["Mañana 09:00", () => at(1, 9)],
    ["En 1 semana", () => at(7, 9)],
    ["En 1 mes", () => {
      const d = at(0, 9);
      d.setMonth(d.getMonth() + 1);
      return d;
    }]
  ];

  function at(days, hour) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    return d;
  }

  const chips = document.createElement("div");
  chips.className = "fx-chips";
  chips.innerHTML = presets
    .map(([label], i) => `<button type="button" class="fx-chip" data-preset="${i}"><i data-lucide="zap"></i>${label}</button>`)
    .join("");

  grid.after(chips);

  chips.addEventListener("click", (event) => {
    const button = event.target.closest("[data-preset]");
    if (!button) return;

    const date = presets[Number(button.dataset.preset)][1]();
    form.querySelector("[name='openDate']").value = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    form.querySelector("[name='openTime']").value = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    saveDraft(form);
    toast(`Despierta: ${date.toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" })}`, "calendar-clock");
  });
}

function addCounters(form) {
  form.querySelectorAll("textarea[name='messagePage']").forEach(updateCounter);

  const list = form.querySelector("#messagePagesList");

  new MutationObserver(() => {
    list.querySelectorAll("textarea").forEach(updateCounter);
    window.lucide?.createIcons();
  }).observe(list, { childList: true });
}

function updateCounter(textarea) {
  if (!textarea.matches("[name='messagePage']")) return;

  let counter = textarea.parentElement.querySelector(".fx-counter");

  if (!counter) {
    counter = document.createElement("small");
    counter.className = "fx-counter";
    textarea.after(counter);
  }

  const max = Number(textarea.maxLength) || 1200;
  counter.textContent = `${textarea.value.length} / ${max}`;
}

function saveDraft(form) {
  const values = {};

  form.querySelectorAll("input[name], textarea[name], select[name]").forEach((field) => {
    if (field.type === "file" || field.type === "radio") return;
    if (field.type === "checkbox") {
      values[field.name] = field.checked;
      return;
    }

    values[field.name] ??= [];
    values[field.name].push(field.value);
  });

  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
  } catch {
    /* sin espacio */
  }
}

function restoreDraft(form) {
  let draft = null;

  try {
    draft = JSON.parse(localStorage.getItem(DRAFT_KEY));
  } catch {
    return;
  }

  if (!draft?.title?.[0] && !draft?.messagePage?.some(Boolean)) return;

  form.querySelector("[name='title']").value = draft.title?.[0] || "";

  const pages = (draft.messagePage || []).filter((text, i) => i === 0 || text);
  const addButton = document.querySelector("#addMessagePageButton");

  for (let guard = 0; addButton && guard < 8 && form.querySelectorAll("[name='messagePage']").length < pages.length; guard += 1) {
    addButton.click();
  }

  form.querySelectorAll("[name='messagePage']").forEach((field, i) => {
    field.value = pages[i] || "";
  });

  toast("Recuperé tu borrador", "history");
}

function addShareButtons(result, code, title) {
  const panel = result.querySelector(".mn-share-panel");
  if (!panel || panel.querySelector(".fx-share-extra")) return;

  const url = noteUrl(code);
  const text = `${title ? `“${title}” — ` : ""}Tengo una nota dormida para vos. Cuando llegue el momento, abrila acá:`;

  const extra = document.createElement("div");
  extra.className = "fx-share-extra";
  extra.innerHTML = `
    <a class="mn-btn mn-btn--secondary" target="_blank" rel="noopener"
       href="https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}">
      <i data-lucide="message-circle"></i>WhatsApp
    </a>
    ${navigator.share ? `<button type="button" class="mn-btn mn-btn--secondary" data-native-share><i data-lucide="share-2"></i>Compartir…</button>` : ""}
  `;

  extra.querySelector("[data-native-share]")?.addEventListener("click", () => {
    navigator.share({ title: "Morpheus Note", text, url }).catch(() => {});
  });

  panel.querySelector(".mn-result__action")?.before(extra);
}

/* ---------- Abrir ---------- */

function enhanceOpen() {
  const form = document.querySelector("#openNoteForm");
  const input = form?.querySelector("[name='code']");
  if (!input) return;

  input.addEventListener("input", () => {
    const raw = input.value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    input.value = /^MN[A-Z0-9]/.test(raw) ? raw.replace(/^MN-?/, "MN-") : raw;
  });

  const tools = document.createElement("div");
  tools.className = "fx-field-tools";
  tools.innerHTML = `
    <button type="button" class="fx-chip" data-paste><i data-lucide="clipboard-paste"></i>Pegar código</button>
    <button type="button" class="fx-chip" data-notify><i data-lucide="bell-ring"></i>Avisarme al despertar</button>
  `;
  input.closest(".mn-field").after(tools);

  tools.addEventListener("click", async (event) => {
    if (event.target.closest("[data-paste]")) {
      try {
        const text = (await navigator.clipboard.readText()).trim();
        const match = text.match(/MN-?[A-Z0-9]{4,}/i);
        input.value = (match ? match[0] : text).toUpperCase();
        input.dispatchEvent(new Event("input"));
        toast("Código pegado", "clipboard-check");
      } catch {
        toast("Tu navegador no dejó leer el portapapeles", "x-circle");
      }
    }

    if (event.target.closest("[data-notify]")) {
      if (!("Notification" in window)) return toast("Tu navegador no soporta avisos", "bell-off");

      const permission = await Notification.requestPermission();
      toast(
        permission === "granted" ? "Te aviso mientras esta pestaña siga abierta" : "Avisos no permitidos",
        "bell-ring"
      );
    }
  });

  const recent = getHistory().slice(0, 5);

  if (recent.length) {
    const block = document.createElement("div");
    block.innerHTML = `
      <p class="fx-recent-title">Recientes</p>
      <div class="fx-chips">
        ${recent.map((item) => `<button type="button" class="fx-chip" data-fill="${escapeHtml(item.code)}"><i data-lucide="moon-star"></i>${escapeHtml(item.code)}</button>`).join("")}
      </div>
    `;
    tools.after(block);

    block.addEventListener("click", (event) => {
      const chip = event.target.closest("[data-fill]");
      if (!chip) return;
      input.value = chip.dataset.fill;
      input.focus();
    });
  }
}
