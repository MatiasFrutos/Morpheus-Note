"use strict";

import { createNote } from "../js/api.js";

function getLocalDateValue() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 10);

  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60000);

  return localDate.toISOString().slice(0, 10);
}

function getLocalTimeValue() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 10);

  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60000);

  return localDate.toISOString().slice(11, 16);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderCreateNotePage() {
  window.addEventListener("morpheus:page-mounted", bindCreateNotePage, { once: true });

  return `
    <section class="mn-page mn-page--wide mn-animate-in">
      <div class="mn-create-hero">
        <div class="mn-create-hero__main">
          <span class="mn-pill">
            <i data-lucide="wand-sparkles"></i>
            Crear nota
          </span>

          <h1>Prepará un mensaje para revelar después.</h1>

          <p>
            Creá una nota privada, elegí cuándo se puede abrir y compartila por link, código o QR.
            Ideal para sorpresas, juegos, recuerdos, invitaciones o mensajes al futuro.
          </p>
        </div>

        <aside class="mn-create-helper">
          <div class="mn-create-helper__icon">
            <i data-lucide="gift"></i>
          </div>

          <div class="mn-create-helper__content">
            <strong>Tu nota se entrega como experiencia</strong>
            <span>
              Primero queda dormida, después puede mostrar pistas y finalmente revela el mensaje.
            </span>
          </div>

          <div class="mn-create-helper__steps">
            <span>
              <i data-lucide="pen-line"></i>
              Escribí
            </span>

            <span>
              <i data-lucide="clock-3"></i>
              Programá
            </span>

            <span>
              <i data-lucide="qr-code"></i>
              Compartí
            </span>
          </div>
        </aside>
      </div>

      <form class="mn-form mn-form--modern" id="createNoteForm">
        <div class="mn-form__section mn-form__section--open">
          <div class="mn-form__section-title">
            <i data-lucide="file-pen-line"></i>
            <div>
              <strong>Contenido principal</strong>
              <span>Esto se revela cuando la nota despierta.</span>
            </div>
          </div>

          <div class="mn-form__grid mn-form__grid--title">
            <label class="mn-field">
              <span>
                <i data-lucide="type"></i>
                Título
              </span>
              <input
                type="text"
                name="title"
                maxlength="80"
                placeholder="Ej: Abrir cuando llegue el momento"
                required
              />
            </label>

            <div class="mn-date-time-grid">
              <label class="mn-field">
                <span>
                  <i data-lucide="calendar-days"></i>
                  Fecha
                </span>
                <input
                  type="date"
                  name="openDate"
                  value="${getLocalDateValue()}"
                  required
                />
              </label>

              <label class="mn-field">
                <span>
                  <i data-lucide="clock-3"></i>
                  Hora
                </span>
                <input
                  type="time"
                  name="openTime"
                  value="${getLocalTimeValue()}"
                  required
                />
              </label>
            </div>
          </div>

          <div class="mn-pages-builder">
            <div class="mn-builder-header">
              <div>
                <strong>Páginas del mensaje</strong>
                <span>El mensaje final se muestra como una presentación, página por página.</span>
              </div>

              <button type="button" class="mn-small-btn" id="addMessagePageButton">
                <i data-lucide="plus"></i>
                Agregar página
              </button>
            </div>

            <div id="messagePagesList" class="mn-dynamic-list">
              <label class="mn-field mn-dynamic-item">
                <span>
                  <i data-lucide="book-open-text"></i>
                  Página 1
                </span>
                <textarea
                  name="messagePage"
                  rows="4"
                  maxlength="1200"
                  placeholder="Escribí la primera parte del mensaje..."
                  required
                ></textarea>
              </label>
            </div>
          </div>

          <div class="mn-upload-row">
            <div class="mn-upload-card">
              <div class="mn-upload-card__header">
                <span class="mn-upload-card__icon">
                  <i data-lucide="image-plus"></i>
                </span>

                <div>
                  <strong>Imagen opcional</strong>
                  <small>Sumá una imagen para acompañar la nota cuando despierte.</small>
                </div>
              </div>

              <label class="mn-file-drop" for="noteImageInput">
                <input
                  type="file"
                  id="noteImageInput"
                  accept="image/png,image/jpeg,image/webp"
                />

                <span class="mn-file-drop__icon">
                  <i data-lucide="upload-cloud"></i>
                </span>

                <span class="mn-file-drop__text">
                  <strong>Elegir imagen</strong>
                  <small>PNG, JPG o WEBP · máximo 1.2 MB</small>
                </span>
              </label>

              <div id="selectedImageName" class="mn-selected-file" hidden></div>

              <small class="mn-help">
                Se guarda como Data URL en PostgreSQL. Para producción convendría usar storage, pero para el MVP va perfecto.
              </small>
            </div>

            <div id="imagePreview" class="mn-image-preview" hidden></div>
          </div>
        </div>

        <div class="mn-option-panel" data-toggle-panel="access">
          <button type="button" class="mn-option-toggle" data-toggle-button="access">
            <span class="mn-option-toggle__icon">
              <i data-lucide="clock-fading"></i>
            </span>

            <span class="mn-option-toggle__content">
              <strong>¿Querés configurar tiempo y acceso?</strong>
              <small>Definí vencimiento, palabra clave y lectura única. Si no tocás nada, usa 24 horas.</small>
            </span>

            <span class="mn-option-toggle__chevron">
              <i data-lucide="chevron-down"></i>
            </span>
          </button>

          <div class="mn-option-content" id="accessPanel" hidden>
            <div class="mn-form__grid">
              <label class="mn-field">
                <span>
                  <i data-lucide="timer"></i>
                  Vencimiento luego de abrirse
                </span>
                <select name="durationHours" required>
                  <option value="1">1 hora</option>
                  <option value="6">6 horas</option>
                  <option value="12">12 horas</option>
                  <option value="24" selected>24 horas</option>
                  <option value="72">3 días</option>
                  <option value="168">7 días</option>
                  <option value="720">30 días</option>
                </select>
              </label>

              <label class="mn-field">
                <span>
                  <i data-lucide="key-round"></i>
                  Palabra clave opcional
                </span>
                <input
                  type="text"
                  name="keyword"
                  maxlength="60"
                  placeholder="Ej: sueño"
                />
              </label>
            </div>

            <label class="mn-field">
              <span>
                <i data-lucide="lightbulb"></i>
                Pista pública general
              </span>
              <input
                type="text"
                name="hint"
                maxlength="180"
                placeholder="Ej: La clave es algo que dijimos esa noche"
              />
            </label>

            <label class="mn-check">
              <input type="checkbox" name="readOnce" />
              <span>
                <strong>Lectura única</strong>
                <small>Después de abrirse una vez, la nota no vuelve a mostrarse.</small>
              </span>
            </label>
          </div>
        </div>

        <div class="mn-option-panel" data-toggle-panel="hints">
          <button type="button" class="mn-option-toggle" data-toggle-button="hints">
            <span class="mn-option-toggle__icon">
              <i data-lucide="list-checks"></i>
            </span>

            <span class="mn-option-toggle__content">
              <strong>¿Querés dejar pistas progresivas?</strong>
              <small>
                Las pistas aparecen antes de que la nota despierte. Cada una tiene pregunta,
                opciones y solo 2 intentos.
              </small>
            </span>

            <span class="mn-option-toggle__chevron">
              <i data-lucide="chevron-down"></i>
            </span>
          </button>

          <div class="mn-option-content" id="hintsPanel" hidden>
            <div class="mn-info-flow">
              <div>
                <i data-lucide="moon"></i>
                <strong>1. La nota duerme</strong>
                <span>El mensaje principal sigue oculto hasta la fecha y hora elegidas.</span>
              </div>

              <div>
                <i data-lucide="help-circle"></i>
                <strong>2. Aparecen pistas</strong>
                <span>Primero la inicial, luego 24 h, 6 h y 1 h antes.</span>
              </div>

              <div>
                <i data-lucide="mouse-pointer-click"></i>
                <strong>3. Se responde</strong>
                <span>El usuario elige una opción. Tiene solo 2 intentos por pista.</span>
              </div>
            </div>

            <div class="mn-hints-grid">
              ${renderHintEditor({
                index: 0,
                label: "Pista inicial",
                unlock: "999999",
                icon: "sparkles",
                description: "Disponible desde el principio."
              })}

              ${renderHintEditor({
                index: 1,
                label: "Pista 24 horas antes",
                unlock: "1440",
                icon: "calendar-days",
                description: "Aparece cuando falta un día o menos."
              })}

              ${renderHintEditor({
                index: 2,
                label: "Pista 6 horas antes",
                unlock: "360",
                icon: "clock-6",
                description: "Aparece cuando falta medio tramo final."
              })}

              ${renderHintEditor({
                index: 3,
                label: "Pista 1 hora antes",
                unlock: "60",
                icon: "alarm-clock",
                description: "La última pista antes del despertar."
              })}
            </div>
          </div>
        </div>

        <div class="mn-form__actions mn-form__actions--sticky">
          <button type="submit" class="mn-btn mn-btn--primary">
            <i data-lucide="moon-star"></i>
            Dormir nota
          </button>

          <a href="#/" class="mn-btn mn-btn--secondary">
            Cancelar
          </a>
        </div>

        <div id="createNoteResult" class="mn-result" hidden></div>
      </form>
    </section>
  `;
}

function renderHintEditor({ index, label, unlock, icon, description }) {
  return `
    <article class="mn-hint-editor" data-hint-index="${index}">
      <div class="mn-hint-editor__top">
        <span>
          <i data-lucide="${icon}"></i>
          ${label}
        </span>

        <input type="hidden" name="hintUnlockMinutes" value="${unlock}" />
        <input type="hidden" name="hintLabel" value="${escapeHtml(label)}" />
      </div>

      <p class="mn-hint-editor__description">${description}</p>

      <label class="mn-field">
        <span>Pregunta</span>
        <input
          type="text"
          name="hintQuestion"
          maxlength="220"
          placeholder="Ej: ¿Dónde empezó todo?"
        />
      </label>

      <div class="mn-choice-list">
        <label>
          <input type="radio" name="correctHint${index}" value="0" checked />
          <input type="text" name="hintOptionA" placeholder="Opción A" />
        </label>

        <label>
          <input type="radio" name="correctHint${index}" value="1" />
          <input type="text" name="hintOptionB" placeholder="Opción B" />
        </label>

        <label>
          <input type="radio" name="correctHint${index}" value="2" />
          <input type="text" name="hintOptionC" placeholder="Opción C" />
        </label>
      </div>

      <small class="mn-help">Marcá con el círculo cuál opción es la correcta.</small>
    </article>
  `;
}

function bindCreateNotePage() {
  const form = document.querySelector("#createNoteForm");
  const result = document.querySelector("#createNoteResult");
  const addPageButton = document.querySelector("#addMessagePageButton");
  const pagesList = document.querySelector("#messagePagesList");
  const imageInput = document.querySelector("#noteImageInput");
  const imagePreview = document.querySelector("#imagePreview");
  const selectedImageName = document.querySelector("#selectedImageName");

  let imageDataUrl = "";

  if (!form || !result || !pagesList) return;

  bindOptionPanels();

  addPageButton?.addEventListener("click", () => {
    const currentPages = pagesList.querySelectorAll("[name='messagePage']").length;

    if (currentPages >= 8) {
      return;
    }

    const wrapper = document.createElement("label");
    wrapper.className = "mn-field mn-dynamic-item";
    wrapper.innerHTML = `
      <span>
        <i data-lucide="book-open-text"></i>
        Página ${currentPages + 1}
      </span>

      <textarea
        name="messagePage"
        rows="4"
        maxlength="1200"
        placeholder="Escribí otra parte del mensaje..."
      ></textarea>

      <button type="button" class="mn-remove-btn">
        <i data-lucide="trash-2"></i>
        Quitar página
      </button>
    `;

    pagesList.appendChild(wrapper);

    wrapper.querySelector(".mn-remove-btn")?.addEventListener("click", () => {
      wrapper.remove();
      refreshPageLabels();
    });

    window.lucide?.createIcons();
  });

  imageInput?.addEventListener("change", async () => {
    const file = imageInput.files?.[0];

    imageDataUrl = "";
    imagePreview.hidden = true;
    imagePreview.innerHTML = "";

    if (selectedImageName) {
      selectedImageName.hidden = true;
      selectedImageName.innerHTML = "";
    }

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Seleccioná una imagen válida.");
      imageInput.value = "";
      return;
    }

    if (file.size > 1_200_000) {
      alert("La imagen es muy pesada. Usá una imagen menor a 1.2 MB.");
      imageInput.value = "";
      return;
    }

    imageDataUrl = await fileToDataUrl(file);

    if (selectedImageName) {
      selectedImageName.hidden = false;
      selectedImageName.innerHTML = `
        <i data-lucide="file-check-2"></i>
        <span>${file.name}</span>
        <small>${formatFileSize(file.size)}</small>
      `;
    }

    imagePreview.hidden = false;
    imagePreview.innerHTML = `
      <img src="${imageDataUrl}" alt="Imagen de la nota" />

      <button type="button" class="mn-small-btn mn-small-btn--danger" id="removeImageButton">
        <i data-lucide="trash-2"></i>
        Quitar imagen
      </button>
    `;

    document.querySelector("#removeImageButton")?.addEventListener("click", () => {
      imageDataUrl = "";
      imageInput.value = "";

      imagePreview.hidden = true;
      imagePreview.innerHTML = "";

      if (selectedImageName) {
        selectedImageName.hidden = true;
        selectedImageName.innerHTML = "";
      }

      window.lucide?.createIcons();
    });

    window.lucide?.createIcons();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector("button[type='submit']");
    const formData = new FormData(form);

    const openDate = String(formData.get("openDate") || "").trim();
    const openTime = String(formData.get("openTime") || "").trim();
    const openAt = `${openDate}T${openTime}`;

    const messagePages = Array.from(form.querySelectorAll("[name='messagePage']"))
      .map((field) => String(field.value || "").trim())
      .filter(Boolean);

    const hintsPanelIsOpen = !document.querySelector("#hintsPanel")?.hidden;
    const hints = hintsPanelIsOpen ? collectHints(form) : [];

    const payload = {
      title: String(formData.get("title") || "").trim(),
      message: messagePages.join("\n\n"),
      messagePages,
      imageDataUrl,
      openAt,
      durationHours: Number(formData.get("durationHours") || 24),
      keyword: String(formData.get("keyword") || "").trim(),
      hint: String(formData.get("hint") || "").trim(),
      readOnce: Boolean(formData.get("readOnce")),
      hints
    };

    result.hidden = true;
    result.className = "mn-result";
    result.innerHTML = "";

    try {
      submitButton.disabled = true;
      submitButton.innerHTML = `<i data-lucide="loader-circle"></i> Creando...`;
      submitButton.classList.add("mn-btn--loading");
      window.lucide?.createIcons();

      const response = await createNote(payload);
      const note = response.data || response;

      const publicCode = note.publicCode || note.code;
      const openUrl = `${window.location.origin}${window.location.pathname}#/open/${publicCode}`;

      result.hidden = false;
      result.classList.add("mn-result--success", "mn-result--share");
      result.innerHTML = `
        <div class="mn-result__icon">
          <i data-lucide="check-circle-2"></i>
        </div>

        <div class="mn-share-panel">
          <div>
            <h3>Nota dormida correctamente</h3>
            <p>Compartí el link, el código o el QR. La experiencia ya está lista.</p>
          </div>

          <div class="mn-share-grid">
            <div class="mn-share-card">
              <span>Código</span>
              <strong>${publicCode}</strong>

              <button type="button" class="mn-copy-btn" data-copy="${publicCode}">
                <i data-lucide="copy"></i>
                Copiar código
              </button>
            </div>

            <div class="mn-share-card">
              <span>Link directo</span>
              <p>${openUrl}</p>

              <button type="button" class="mn-copy-btn" data-copy="${openUrl}">
                <i data-lucide="link"></i>
                Copiar link
              </button>
            </div>

            <div class="mn-share-card mn-share-card--qr">
              <span>QR</span>
              <div id="qrBox" class="mn-qr-box"></div>

              <button type="button" class="mn-copy-btn" id="downloadQrButton">
                <i data-lucide="download"></i>
                Descargar QR
              </button>
            </div>
          </div>

          <a href="#/open/${publicCode}" class="mn-btn mn-btn--primary mn-result__action">
            <i data-lucide="lock-open"></i>
            Probar apertura
          </a>
        </div>
      `;

      form.reset();
      resetDynamicForm();

      imageDataUrl = "";
      imagePreview.hidden = true;
      imagePreview.innerHTML = "";

      if (selectedImageName) {
        selectedImageName.hidden = true;
        selectedImageName.innerHTML = "";
      }

      renderQr(openUrl);
      bindCopyButtons();
      bindDownloadQr(publicCode);
    } catch (error) {
      result.hidden = false;
      result.classList.add("mn-result--error");
      result.innerHTML = `
        <div class="mn-result__icon">
          <i data-lucide="x-circle"></i>
        </div>

        <div>
          <h3>No se pudo crear la nota</h3>
          <p>${error.message}</p>
        </div>
      `;
    } finally {
      submitButton.disabled = false;
      submitButton.classList.remove("mn-btn--loading");
      submitButton.innerHTML = `<i data-lucide="moon-star"></i> Dormir nota`;
      window.lucide?.createIcons();
    }
  });
}

function bindOptionPanels() {
  const buttons = document.querySelectorAll("[data-toggle-button]");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const name = button.dataset.toggleButton;
      const panel = document.querySelector(`#${name}Panel`);
      const wrapper = document.querySelector(`[data-toggle-panel="${name}"]`);

      if (!panel || !wrapper) return;

      const isOpening = panel.hidden;

      panel.hidden = !isOpening;
      wrapper.classList.toggle("mn-option-panel--open", isOpening);

      window.lucide?.createIcons();
    });
  });
}

function resetDynamicForm() {
  const accessPanel = document.querySelector("#accessPanel");
  const hintsPanel = document.querySelector("#hintsPanel");
  const accessWrapper = document.querySelector('[data-toggle-panel="access"]');
  const hintsWrapper = document.querySelector('[data-toggle-panel="hints"]');

  if (accessPanel) accessPanel.hidden = true;
  if (hintsPanel) hintsPanel.hidden = true;

  accessWrapper?.classList.remove("mn-option-panel--open");
  hintsWrapper?.classList.remove("mn-option-panel--open");

  window.lucide?.createIcons();
}

function refreshPageLabels() {
  const items = document.querySelectorAll("#messagePagesList .mn-dynamic-item");

  items.forEach((item, index) => {
    const span = item.querySelector("span");

    if (span) {
      span.innerHTML = `<i data-lucide="book-open-text"></i> Página ${index + 1}`;
    }
  });

  window.lucide?.createIcons();
}

function collectHints(form) {
  const editors = Array.from(form.querySelectorAll(".mn-hint-editor"));

  return editors
    .map((editor, index) => {
      const label = editor.querySelector("[name='hintLabel']")?.value || `Pista ${index + 1}`;
      const unlockBeforeMinutes = Number(editor.querySelector("[name='hintUnlockMinutes']")?.value || 999999);
      const question = editor.querySelector("[name='hintQuestion']")?.value || "";

      const optionFields = [
        editor.querySelector("[name='hintOptionA']"),
        editor.querySelector("[name='hintOptionB']"),
        editor.querySelector("[name='hintOptionC']")
      ];

      const options = optionFields
        .map((field) => String(field?.value || "").trim())
        .filter(Boolean);

      const correctInput = editor.querySelector(`input[name='correctHint${index}']:checked`);
      const correctOptionIndex = Number(correctInput?.value || 0);

      return {
        label,
        question: String(question || "").trim(),
        options,
        correctOptionIndex,
        unlockBeforeMinutes,
        sortOrder: index
      };
    })
    .filter((hint) => hint.question && hint.options.length >= 2);
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) {
    return "";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });
}

function renderQr(text) {
  const qrBox = document.querySelector("#qrBox");

  if (!qrBox || !window.QRCode) return;

  qrBox.innerHTML = "";

  new window.QRCode(qrBox, {
    text,
    width: 160,
    height: 160,
    colorDark: "#111827",
    colorLight: "#ffffff",
    correctLevel: window.QRCode.CorrectLevel.H
  });
}

function bindDownloadQr(code) {
  const button = document.querySelector("#downloadQrButton");

  if (!button) return;

  button.addEventListener("click", () => {
    const canvas = document.querySelector("#qrBox canvas");
    const img = document.querySelector("#qrBox img");

    const link = document.createElement("a");
    link.download = `${code}-qr.png`;

    if (canvas) {
      link.href = canvas.toDataURL("image/png");
    } else if (img) {
      link.href = img.src;
    } else {
      return;
    }

    link.click();
  });
}

function bindCopyButtons() {
  const buttons = document.querySelectorAll("[data-copy]");

  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.dataset.copy;
      const original = button.innerHTML;

      try {
        await navigator.clipboard.writeText(value);
        button.innerHTML = `<i data-lucide="check"></i> Copiado`;
        window.lucide?.createIcons();

        setTimeout(() => {
          button.innerHTML = original;
          window.lucide?.createIcons();
        }, 1200);
      } catch {
        button.textContent = "No copiado";
      }
    });
  });
}