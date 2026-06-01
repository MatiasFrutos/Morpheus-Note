"use strict";

import { renderNoteCard } from "../components/note-card.component.js";

export function renderHomePage() {
  return `
    <section class="mn-hero mn-animate-in">
      <div class="mn-hero__content">
        <span class="mn-pill">
          <i data-lucide="wand-sparkles"></i>
          Sin login · Simple · Público
        </span>

        <h1>Creá notas que despiertan en el momento justo.</h1>

        <p>
          Morpheus Note permite escribir mensajes que quedan dormidos y se desbloquean
          por fecha, hora y palabra clave. Ideal para sorpresas, juegos, recuerdos,
          eventos o mensajes al futuro.
        </p>

        <div class="mn-hero__actions">
          <a href="#/create" class="mn-btn mn-btn--primary">
            <i data-lucide="plus-circle"></i>
            Crear nota
          </a>

          <a href="#/open" class="mn-btn mn-btn--secondary">
            <i data-lucide="lock-open"></i>
            Abrir nota
          </a>
        </div>
      </div>

      <aside class="mn-preview">
        <div class="mn-preview__top">
          <span>
            <i data-lucide="clock-3"></i>
            Nota dormida
          </span>
          <strong>MN-8KQ2P9</strong>
        </div>

        <div class="mn-preview__body">
          <i data-lucide="mail-check"></i>
          <h2>“Abrir cuando llegue el momento.”</h2>
          <p>El mensaje existe, pero todavía no está disponible.</p>
        </div>

        <div class="mn-preview__steps">
          <span>Crear</span>
          <i data-lucide="arrow-right"></i>
          <span>Dormir</span>
          <i data-lucide="arrow-right"></i>
          <span>Despertar</span>
        </div>
      </aside>
    </section>

    <section class="mn-section mn-animate-in mn-delay-1">
      <div class="mn-section__header">
        <span class="mn-eyebrow">Cómo funciona</span>
        <h2>Un flujo simple, sin fricción.</h2>
      </div>

      <div class="mn-grid">
        ${renderNoteCard({
          icon: "edit-3",
          eyebrow: "Paso 1",
          title: "Escribí una nota",
          description: "Cargá un título, un mensaje oculto y una pista pública opcional."
        })}

        ${renderNoteCard({
          icon: "calendar-clock",
          eyebrow: "Paso 2",
          title: "Elegí cuándo despierta",
          description: "Definí la fecha, la hora y cuánto tiempo va a estar disponible."
        })}

        ${renderNoteCard({
          icon: "key-round",
          eyebrow: "Paso 3",
          title: "Compartí el código",
          description: "La otra persona intenta abrirla cuando llegue el momento correcto."
        })}
      </div>
    </section>

    <section class="mn-section mn-animate-in mn-delay-2">
      <div class="mn-feature-strip">
        <div>
          <i data-lucide="shield-check"></i>
          <strong>Sin cuenta</strong>
          <span>No hace falta registrarse.</span>
        </div>

        <div>
          <i data-lucide="timer"></i>
          <strong>Temporal</strong>
          <span>La nota puede expirar.</span>
        </div>

        <div>
          <i data-lucide="lock-keyhole"></i>
          <strong>Con clave</strong>
          <span>Podés sumar una palabra secreta.</span>
        </div>
      </div>
    </section>
  `;
}