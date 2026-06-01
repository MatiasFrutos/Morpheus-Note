"use strict";

import { getNoteStatus, unlockNote } from "../js/api.js";

export function renderOpenNotePage(params = {}) {
  window.addEventListener("morpheus:page-mounted", () => bindOpenNotePage(params), { once: true });

  const code = params.code || "";

  return `
    <section class="mn-page mn-animate-in">
      <div class="mn-page__header">
        <span class="mn-pill">
          <i data-lucide="lock-open"></i>
          Abrir nota
        </span>

        <h1>Despertá una nota.</h1>

        <p>
          Ingresá el código público. Si llegó el momento, vas a pasar al ritual de apertura.
        </p>
      </div>

      <form class="mn-form mn-form--compact" id="openNoteForm">
        <label class="mn-field">
          <span>
            <i data-lucide="barcode"></i>
            Código de nota
          </span>
          <input
            type="text"
            name="code"
            value="${code}"
            placeholder="Ej: MN-7QX9A2"
            required
          />
        </label>

        <label class="mn-field">
          <span>
            <i data-lucide="key-round"></i>
            Palabra clave, si corresponde
          </span>
          <input
            type="text"
            name="keyword"
            placeholder="Ej: sueño"
          />
        </label>

        <div class="mn-form__actions">
          <button type="submit" class="mn-btn mn-btn--primary">
            <i data-lucide="eye"></i>
            Intentar abrir
          </button>

          <a href="#/create" class="mn-btn mn-btn--secondary">
            Crear una nota
          </a>
        </div>

        <div id="openNoteResult" class="mn-result" hidden></div>
      </form>
    </section>
  `;
}

function bindOpenNotePage(params) {
  const form = document.querySelector("#openNoteForm");
  const result = document.querySelector("#openNoteResult");

  if (!form || !result) return;

  if (params.code) {
    checkInitialStatus(params.code);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const code = String(formData.get("code") || "").trim();
    const keyword = String(formData.get("keyword") || "").trim();

    result.hidden = true;
    result.className = "mn-result";
    result.innerHTML = "";

    try {
      const response = await unlockNote(code, { keyword });
      const note = response.data || response;

      if (note.status === "SLEEPING") {
        window.location.hash = `#/sleeping/${code}`;
        return;
      }

      if (note.status === "EXPIRED" || note.status === "READ") {
        window.location.hash = `#/expired/${code}`;
        return;
      }

      if (note.status === "UNLOCKED" || note.messagePages || note.message) {
        sessionStorage.setItem(`morpheus-note-${code}`, JSON.stringify(note));
        window.location.hash = `#/unlocked/${code}`;
        return;
      }

      result.hidden = false;
      result.classList.add("mn-result--info");
      result.innerHTML = `
        <div class="mn-result__icon">
          <i data-lucide="info"></i>
        </div>

        <div>
          <h3>Estado desconocido</h3>
          <p>La API respondió, pero no se pudo interpretar el estado de la nota.</p>
        </div>
      `;
    } catch (error) {
      result.hidden = false;
      result.classList.add("mn-result--error");
      result.innerHTML = `
        <div class="mn-result__icon">
          <i data-lucide="x-circle"></i>
        </div>

        <div>
          <h3>No se pudo abrir</h3>
          <p>${error.message}</p>
        </div>
      `;
    } finally {
      window.lucide?.createIcons();
    }
  });
}

async function checkInitialStatus(code) {
  const result = document.querySelector("#openNoteResult");

  if (!result) return;

  try {
    const response = await getNoteStatus(code);
    const note = response.data || response;

    result.hidden = false;
    result.className = "mn-result mn-result--info";

    if (note.status === "SLEEPING") {
      result.innerHTML = `
        <div class="mn-result__icon">
          <i data-lucide="moon"></i>
        </div>

        <div>
          <h3>La nota todavía está dormida</h3>
          <p>${note.hint || "Todavía no llegó el momento indicado."}</p>

          <a href="#/sleeping/${code}" class="mn-btn mn-btn--secondary mn-result__action">
            <i data-lucide="list-checks"></i>
            Ver pistas disponibles
          </a>
        </div>
      `;
      return;
    }

    if (note.status === "EXPIRED" || note.status === "READ") {
      result.innerHTML = `
        <div class="mn-result__icon">
          <i data-lucide="timer-off"></i>
        </div>

        <div>
          <h3>La nota ya no está disponible</h3>
          <p>El momento pasó o era de lectura única.</p>
        </div>
      `;
      return;
    }

    result.innerHTML = `
      <div class="mn-result__icon">
        <i data-lucide="check-circle-2"></i>
      </div>

      <div>
        <h3>Nota lista</h3>
        <p>Ingresá la palabra clave si tiene una, o abrila directamente.</p>
      </div>
    `;
  } catch {
    result.hidden = false;
    result.className = "mn-result mn-result--error";
    result.innerHTML = `
      <div class="mn-result__icon">
        <i data-lucide="x-circle"></i>
      </div>

      <div>
        <h3>No se encontró la nota</h3>
        <p>Verificá el código y probá nuevamente.</p>
      </div>
    `;
  } finally {
    window.lucide?.createIcons();
  }
}