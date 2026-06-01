"use strict";

export function renderLayout({ content }) {
  return `
    <div class="mn-shell">
      <header class="mn-header">
        <a href="#/" class="mn-brand" aria-label="Ir al inicio">
          <span class="mn-brand__icon">
            <img src="./morpheus-note-icon.png" alt="Morpheus Note" />
          </span>

          <span class="mn-brand__text">
            <strong>Morpheus Note</strong>
            <small>Notas que despiertan</small>
          </span>
        </a>

        <button class="mn-menu-button" type="button" id="mnMenuButton" aria-label="Abrir menú">
          <i data-lucide="menu"></i>
        </button>

        <nav class="mn-nav" id="mnNav" aria-label="Navegación principal">
          <a href="#/" class="mn-nav__link">
            <i data-lucide="home"></i>
            Inicio
          </a>

          <a href="#/create" class="mn-nav__link mn-nav__link--primary">
            <i data-lucide="plus"></i>
            Crear nota
          </a>

          <a href="#/open" class="mn-nav__link">
            <i data-lucide="lock-open"></i>
            Abrir
          </a>
        </nav>
      </header>

      <main class="mn-main">
        ${content}
      </main>

      <footer class="mn-footer">
        <span>Morpheus Note · Sin login · QR · Pistas progresivas · Mensajes por páginas</span>
      </footer>
    </div>
  `;
}