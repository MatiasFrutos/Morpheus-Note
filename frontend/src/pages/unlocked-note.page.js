"use strict";

import { getNoteStatus } from "../js/api.js";

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

  let currentPage = 0;

  function renderPage() {
    message.classList.remove("mn-page-flip");
    void message.offsetWidth;
    message.classList.add("mn-page-flip");

    message.textContent = pages[currentPage];
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

  renderPage();
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