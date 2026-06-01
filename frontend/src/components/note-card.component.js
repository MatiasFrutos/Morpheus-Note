"use strict";

export function renderNoteCard({
  icon = "mail",
  eyebrow = "Nota",
  title = "Mensaje dormido",
  description = "",
  footer = ""
}) {
  return `
    <article class="mn-card">
      <div class="mn-card__icon">
        <i data-lucide="${icon}"></i>
      </div>

      <div class="mn-card__content">
        <span class="mn-eyebrow">${eyebrow}</span>
        <h3>${title}</h3>

        ${
          description
            ? `<p>${description}</p>`
            : ""
        }

        ${
          footer
            ? `<div class="mn-card__footer">${footer}</div>`
            : ""
        }
      </div>
    </article>
  `;
}