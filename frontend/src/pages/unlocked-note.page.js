"use strict";

import { getNoteStatus } from "../js/api.js";
import { chime, confetti, saveToHistory, toast, typewrite } from "../js/fx.js";

export function renderUnlockedNotePage(params = {}) {
  window.addEventListener("morpheus:page-mounted", () => bindUnlockedNotePage(params), { once: true });

  return `
    <section class="mn-state-page mn-animate-in">
      <div class="mn-unlocked-card">
        <div class="mn-state-card__icon">
          <i data-lucide="mail-open"></i>
        </div>

        <span class="mn-eyebrow">Nota despierta</span>

        <h1 id="unlockedNoteTitle">La nota despertó.</h1>

        <div id="unlockedImageBox" class="mn-unlocked-image" hidden></div>

        <div class="mn-message-pager">
          <div class="fx-reader-bar"><span id="readerProgress"></span></div>

          <div class="mn-message-box" id="unlockedNoteMessage">
            Cargando mensaje...
          </div>

          <div class="mn-pager-controls" id="pagerControls" hidden>
            <button type="button" class="mn-small-btn" id="prevPageButton">
              <i data-lucide="arrow-left"></i>
              Anterior
            </button>

            <span id="pageIndicator">1 / 1</span>

            <button type="button" class="mn-small-btn" id="nextPageButton">
              Siguiente
              <i data-lucide="arrow-right"></i>
            </button>
          </div>
        </div>

        <div class="fx-reader-tools" id="readerTools">
          <button type="button" class="fx-icon-btn" data-reader="smaller" aria-label="Letra más chica"><i data-lucide="a-arrow-down"></i></button>
          <button type="button" class="fx-icon-btn" data-reader="bigger" aria-label="Letra más grande"><i data-lucide="a-arrow-up"></i></button>
          <button type="button" class="fx-icon-btn" data-reader="speak"><i data-lucide="volume-2"></i>Escuchar</button>
          <button type="button" class="fx-icon-btn" data-reader="copy"><i data-lucide="copy"></i>Copiar</button>
          <button type="button" class="fx-icon-btn" data-reader="focus"><i data-lucide="maximize"></i>Modo lectura</button>
        </div>

        <div id="unlockedNoteMeta" class="mn-state-meta"></div>

        <div class="mn-state-actions">
          <a href="#/create" class="mn-btn mn-btn--primary">
            <i data-lucide="plus"></i>
            Crear otra nota
          </a>

          <a href="#/" class="mn-btn mn-btn--secondary">
            Volver al inicio
          </a>
        </div>
      </div>
    </section>
  `;
}

async function bindUnlockedNotePage(params) {
  const title = document.querySelector("#unlockedNoteTitle");
  const message = document.querySelector("#unlockedNoteMessage");
  const meta = document.querySelector("#unlockedNoteMeta");

  if (!params.code || !title || !message || !meta) return;

  const cached = sessionStorage.getItem(`morpheus-note-${params.code}`);

  if (cached) {
    const note = JSON.parse(cached);
    renderUnlockedNote(note, params.code);
    return;
  }

  try {
    const response = await getNoteStatus(params.code);
    const note = response.data || response;

    if (note.status === "SLEEPING") {
      window.location.hash = `#/sleeping/${params.code}`;
      return;
    }

    if (note.status === "EXPIRED" || note.status === "READ") {
      window.location.hash = `#/expired/${params.code}`;
      return;
    }

    renderUnlockedNote(note, params.code);
  } catch {
    title.textContent = "No se pudo cargar la nota";
    message.textContent = "El mensaje no está disponible o el código no es válido.";
  } finally {
    window.lucide?.createIcons();
  }
}

function renderUnlockedNote(note, code) {
  const title = document.querySelector("#unlockedNoteTitle");
  const imageBox = document.querySelector("#unlockedImageBox");
  const meta = document.querySelector("#unlockedNoteMeta");

  title.textContent = note.title || "La nota despertó.";

  if (note.imageDataUrl) {
    imageBox.hidden = false;
    imageBox.innerHTML = `<img src="${note.imageDataUrl}" alt="Imagen de la nota" />`;
  }

  const pages = Array.isArray(note.messagePages) && note.messagePages.length
    ? note.messagePages
    : [note.message || "La nota no contiene mensaje visible."];

  setupPager(pages);
  setupReader(pages);

  saveToHistory({ code, title: note.title || "", openAt: note.openAt, kind: "opened" });

  if (!sessionStorage.getItem(`morpheus-celebrated-${code}`)) {
    sessionStorage.setItem(`morpheus-celebrated-${code}`, "1");
    chime("wake");
    confetti(160);
  }

  meta.innerHTML = `
    <div>
      <strong>Código</strong>
      <span>${code}</span>
    </div>

    ${
      note.openAt
        ? `
          <div>
            <strong>Abierta desde</strong>
            <span>${formatDate(note.openAt)}</span>
          </div>
        `
        : ""
    }

    ${
      note.expiresAt
        ? `
          <div>
            <strong>Expira</strong>
            <span>${formatDate(note.expiresAt)}</span>
          </div>
        `
        : ""
    }

    <div>
      <strong>Páginas</strong>
      <span>${pages.length}</span>
    </div>
  `;
}

function setupPager(pages) {
  const message = document.querySelector("#unlockedNoteMessage");
  const controls = document.querySelector("#pagerControls");
  const prevButton = document.querySelector("#prevPageButton");
  const nextButton = document.querySelector("#nextPageButton");
  const indicator = document.querySelector("#pageIndicator");

  const progress = document.querySelector("#readerProgress");

  let currentPage = 0;

  function renderPage() {
    message.classList.remove("mn-page-flip");
    void message.offsetWidth;
    message.classList.add("mn-page-flip");

    typewrite(message, pages[currentPage]);
    progress.style.width = `${((currentPage + 1) / pages.length) * 100}%`;
    indicator.textContent = `${currentPage + 1} / ${pages.length}`;

    prevButton.disabled = currentPage === 0;
    nextButton.disabled = currentPage === pages.length - 1;
  }

  if (pages.length > 1) {
    controls.hidden = false;
  }

  prevButton?.addEventListener("click", () => {
    if (currentPage > 0) {
      currentPage -= 1;
      renderPage();
    }
  });

  nextButton?.addEventListener("click", () => {
    if (currentPage < pages.length - 1) {
      currentPage += 1;
      renderPage();
    }
  });

  const go = (delta) => {
    const next = currentPage + delta;
    if (next < 0 || next >= pages.length) return;
    currentPage = next;
    renderPage();
  };

  const onKey = (event) => {
    if (!message.isConnected) {
      document.removeEventListener("keydown", onKey);
      return;
    }

    if (event.key === "ArrowRight" || (event.key === " " && event.target === document.body)) go(1);
    if (event.key === "ArrowLeft") go(-1);
  };

  document.addEventListener("keydown", onKey);

  let startX = 0;
  message.addEventListener("touchstart", (event) => {
    startX = event.touches[0].clientX;
  }, { passive: true });
  message.addEventListener("touchend", (event) => {
    const delta = event.changedTouches[0].clientX - startX;
    if (Math.abs(delta) > 50) go(delta < 0 ? 1 : -1);
  });

  renderPage();
}

function setupReader(pages) {
  const tools = document.querySelector("#readerTools");
  const message = document.querySelector("#unlockedNoteMessage");
  let scale = 1;

  tools?.addEventListener("click", async (event) => {
    const action = event.target.closest("[data-reader]")?.dataset.reader;
    if (!action) return;

    if (action === "bigger" || action === "smaller") {
      scale = Math.min(Math.max(scale + (action === "bigger" ? 0.1 : -0.1), 0.8), 1.6);
      message.style.fontSize = `${scale}em`;
    }

    if (action === "copy") {
      try {
        await navigator.clipboard.writeText(pages.join("\n\n"));
        toast("Mensaje copiado", "copy");
      } catch {
        toast("No se pudo copiar", "x-circle");
      }
    }

    if (action === "focus") {
      const on = document.body.classList.toggle("fx-focus");
      toast(on ? "Modo lectura" : "Modo normal", "maximize");
    }

    if (action === "speak") {
      if (!("speechSynthesis" in window)) return toast("Tu navegador no puede leer en voz alta", "volume-x");

      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
        return;
      }

      const voice = new SpeechSynthesisUtterance(pages.join(". "));
      voice.lang = "es-AR";
      speechSynthesis.speak(voice);
    }
  });
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}