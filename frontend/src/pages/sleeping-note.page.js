"use strict";

import { answerHint, getNoteStatus } from "../js/api.js";

export function renderSleepingNotePage(params = {}) {
  window.addEventListener("morpheus:page-mounted", () => bindSleepingNotePage(params), { once: true });

  return `
    <section class="mn-state-page mn-animate-in">
      <div class="mn-state-card mn-state-card--sleeping">
        <div class="mn-state-card__icon mn-pulse-icon">
          <i data-lucide="moon"></i>
        </div>

        <span class="mn-eyebrow">Nota dormida</span>

        <h1>Todavía no es momento.</h1>

        <p id="sleepingNoteMessage">
          La nota existe, pero sigue dormida. Mientras tanto, pueden aparecer pistas.
        </p>

        <div id="sleepingCountdown" class="mn-countdown"></div>

        <div id="sleepingNoteMeta" class="mn-state-meta"></div>

        <div id="progressiveHints" class="mn-progressive-hints"></div>

        <div class="mn-state-actions">
          <a href="#/open/${params.code || ""}" class="mn-btn mn-btn--primary">
            <i data-lucide="refresh-cw"></i>
            Intentar abrir
          </a>

          <a href="#/" class="mn-btn mn-btn--secondary">
            Volver al inicio
          </a>
        </div>
      </div>
    </section>
  `;
}

async function bindSleepingNotePage(params) {
  const message = document.querySelector("#sleepingNoteMessage");
  const meta = document.querySelector("#sleepingNoteMeta");
  const countdown = document.querySelector("#sleepingCountdown");
  const hintsContainer = document.querySelector("#progressiveHints");

  if (!params.code || !message || !meta || !countdown || !hintsContainer) return;

  try {
    const response = await getNoteStatus(params.code);
    const note = response.data || response;

    if (note.status === "EXPIRED" || note.status === "READ") {
      window.location.hash = `#/expired/${params.code}`;
      return;
    }

    if (note.status === "READY") {
      window.location.hash = `#/open/${params.code}`;
      return;
    }

    message.textContent = note.hint || "La nota todavía no llegó a su momento de apertura.";

    renderCountdown(countdown, note.countdown);

    meta.innerHTML = `
      <div>
        <strong>Código</strong>
        <span>${params.code}</span>
      </div>

      ${
        note.openAt
          ? `
            <div>
              <strong>Despierta</strong>
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
    `;

    renderHints(hintsContainer, params.code, note.hints || []);
  } catch {
    meta.innerHTML = `
      <div>
        <strong>Estado</strong>
        <span>No se pudo consultar la nota.</span>
      </div>
    `;
  } finally {
    window.lucide?.createIcons();
  }
}

function renderCountdown(container, countdown) {
  if (!countdown) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <div>
      <strong>${countdown.days}</strong>
      <span>Días</span>
    </div>

    <div>
      <strong>${countdown.hours}</strong>
      <span>Horas</span>
    </div>

    <div>
      <strong>${countdown.minutes}</strong>
      <span>Min</span>
    </div>

    <div>
      <strong>${countdown.seconds}</strong>
      <span>Seg</span>
    </div>
  `;
}

function renderHints(container, code, hints) {
  if (!hints.length) {
    container.innerHTML = `
      <div class="mn-empty-hints">
        <i data-lucide="list-x"></i>
        <strong>No hay pistas progresivas cargadas.</strong>
        <span>La nota está dormida sin pistas adicionales.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="mn-hints-header">
      <div>
        <span class="mn-eyebrow">Dream Hints</span>
        <h2>Pistas progresivas</h2>
      </div>

      <p>Respondé correctamente. Cada pista tiene 2 intentos.</p>
    </div>

    <div class="mn-hints-list">
      ${hints.map((hint) => renderHintCard(code, hint)).join("")}
    </div>
  `;

  bindHintButtons(code);
}

function renderHintCard(code, hint) {
  if (hint.locked) {
    return `
      <article class="mn-hint-card mn-hint-card--locked">
        <div class="mn-hint-card__top">
          <span>
            <i data-lucide="lock"></i>
            ${hint.label}
          </span>

          <small>Bloqueada</small>
        </div>

        <p>Esta pista todavía está dormida.</p>
      </article>
    `;
  }

  if (hint.solved) {
    return `
      <article class="mn-hint-card mn-hint-card--solved">
        <div class="mn-hint-card__top">
          <span>
            <i data-lucide="check-circle-2"></i>
            ${hint.label}
          </span>

          <small>Resuelta</small>
        </div>

        <p>${hint.question}</p>
        <strong class="mn-solved-label">Respuesta correcta desbloqueada.</strong>
      </article>
    `;
  }

  if (hint.exhausted) {
    return `
      <article class="mn-hint-card mn-hint-card--failed">
        <div class="mn-hint-card__top">
          <span>
            <i data-lucide="circle-x"></i>
            ${hint.label}
          </span>

          <small>Sin intentos</small>
        </div>

        <p>${hint.question}</p>
        <strong class="mn-failed-label">Agotaste los intentos de esta pista.</strong>
      </article>
    `;
  }

  return `
    <article class="mn-hint-card" data-hint-id="${hint.id}">
      <div class="mn-hint-card__top">
        <span>
          <i data-lucide="help-circle"></i>
          ${hint.label}
        </span>

        <small>${hint.remainingAttempts} intentos</small>
      </div>

      <p>${hint.question}</p>

      <div class="mn-hint-options">
        ${hint.options.map((option, index) => `
          <button type="button" data-hint-answer="${index}">
            ${option}
          </button>
        `).join("")}
      </div>

      <div class="mn-hint-feedback" hidden></div>
    </article>
  `;
}

function bindHintButtons(code) {
  const cards = document.querySelectorAll("[data-hint-id]");

  cards.forEach((card) => {
    const hintId = card.dataset.hintId;
    const buttons = card.querySelectorAll("[data-hint-answer]");
    const feedback = card.querySelector(".mn-hint-feedback");

    buttons.forEach((button) => {
      button.addEventListener("click", async () => {
        const selectedIndex = Number(button.dataset.hintAnswer);

        buttons.forEach((item) => {
          item.disabled = true;
        });

        try {
          const response = await answerHint(code, hintId, selectedIndex);
          const result = response.data || response;

          feedback.hidden = false;
          feedback.className = result.correct
            ? "mn-hint-feedback mn-hint-feedback--ok"
            : "mn-hint-feedback mn-hint-feedback--bad";

          feedback.textContent = result.message;

          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } catch (error) {
          feedback.hidden = false;
          feedback.className = "mn-hint-feedback mn-hint-feedback--bad";
          feedback.textContent = error.message;

          buttons.forEach((item) => {
            item.disabled = false;
          });
        }
      });
    });
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