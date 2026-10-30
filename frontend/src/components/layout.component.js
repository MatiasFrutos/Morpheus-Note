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

        <div class="fx-tools">
          <button type="button" class="fx-icon-btn fx-icon-btn--hide-sm" data-fx="palette" aria-label="Abrir paleta de comandos" title="Comandos (Ctrl + K)">
            <i data-lucide="command"></i>
          </button>
          <button type="button" class="fx-icon-btn" data-fx="sound" aria-pressed="true" aria-label="Activar o silenciar sonido" title="Sonido">
            <i data-lucide="volume-2"></i>
          </button>
          <button type="button" class="fx-icon-btn" data-fx="theme" aria-label="Cambiar tema" title="Tema claro / oscuro">
            <i data-lucide="sun-moon"></i>
          </button>
        </div>

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
        <span>Morpheus Note · Sin login · QR · Pistas progresivas · Mensajes por páginas · <span class="fx-kbd">Ctrl</span> <span class="fx-kbd">K</span> comandos</span>
      </footer>
    </div>
  `;
}