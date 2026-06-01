"use strict";

export function renderExpiredNotePage(params = {}) {
  return `
    <section class="mn-state-page mn-animate-in">
      <div class="mn-state-card mn-state-card--expired">
        <div class="mn-state-card__icon">
          <i data-lucide="timer-off"></i>
        </div>

        <span class="mn-eyebrow">Nota no disponible</span>

        <h1>El tiempo hizo lo suyo.</h1>

        <p>
          La nota existió, tuvo su ventana de lectura o era de lectura única.
          Ya no está disponible.
        </p>

        <div class="mn-state-meta">
          ${
            params.code
              ? `
                <div>
                  <strong>Código</strong>
                  <span>${params.code}</span>
                </div>
              `
              : ""
          }

          <div>
            <strong>Estado</strong>
            <span>No disponible</span>
          </div>
        </div>

        <div class="mn-state-actions">
          <a href="#/create" class="mn-btn mn-btn--primary">
            <i data-lucide="plus"></i>
            Crear nueva nota
          </a>

          <a href="#/" class="mn-btn mn-btn--secondary">
            Volver al inicio
          </a>
        </div>
      </div>
    </section>
  `;
}