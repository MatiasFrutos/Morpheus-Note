"use strict";

import { getDatabase } from "../config/database.js";
import { generatePublicCode, hashKeyword, compareKeyword } from "../utils/codeGenerator.js";
import {
  addHours,
  formatNote,
  getCountdown,
  getMinutesUntilOpen,
  getNoteStatus,
  toIsoDate
} from "../utils/dateUtils.js";

async function generateUniqueCode() {
  const db = getDatabase();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generatePublicCode();

    const existing = await db.query(
      "SELECT id FROM notes WHERE public_code = $1",
      [code]
    );

    if (existing.rows.length === 0) {
      return code;
    }
  }

  throw new Error("No se pudo generar un código único. Probá nuevamente.");
}

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeMessagePages(payload) {
  const pages = Array.isArray(payload.messagePages)
    ? payload.messagePages
    : [];

  const cleanPages = pages
    .map((page) => String(page || "").trim())
    .filter(Boolean)
    .slice(0, 8);

  const fallbackMessage = String(payload.message || "").trim();

  if (cleanPages.length > 0) {
    return cleanPages;
  }

  if (fallbackMessage) {
    return [fallbackMessage];
  }

  return [];
}

function normalizeHints(payload) {
  const hints = Array.isArray(payload.hints) ? payload.hints : [];

  return hints
    .map((hint, index) => {
      const question = String(hint.question || "").trim();
      const options = Array.isArray(hint.options)
        ? hint.options.map((option) => String(option || "").trim()).filter(Boolean)
        : [];

      return {
        label: String(hint.label || `Pista ${index + 1}`).trim(),
        question,
        options: options.slice(0, 4),
        correctOptionIndex: Number(hint.correctOptionIndex || 0),
        unlockBeforeMinutes: Number(hint.unlockBeforeMinutes ?? 999999),
        sortOrder: Number(hint.sortOrder ?? index),
        maxAttempts: 2
      };
    })
    .filter((hint) => hint.question && hint.options.length >= 2)
    .slice(0, 4);
}

function validateCreatePayload(payload) {
  const title = String(payload.title || "").trim();
  const messagePages = normalizeMessagePages(payload);
  const message = messagePages.join("\n\n---\n\n");
  const hint = String(payload.hint || "").trim();
  const keyword = String(payload.keyword || "").trim();
  const durationHours = Number(payload.durationHours || 24);
  const openAt = toIsoDate(payload.openAt);
  const imageDataUrl = String(payload.imageDataUrl || "").trim();
  const readOnce = Boolean(payload.readOnce);
  const hints = normalizeHints(payload);

  if (!title) {
    throw createHttpError("El título es obligatorio.", 400);
  }

  if (title.length > 80) {
    throw createHttpError("El título no puede superar los 80 caracteres.", 400);
  }

  if (messagePages.length === 0) {
    throw createHttpError("El mensaje es obligatorio.", 400);
  }

  if (message.length > 6000) {
    throw createHttpError("El mensaje completo no puede superar los 6000 caracteres.", 400);
  }

  if (!openAt) {
    throw createHttpError("La fecha de apertura no es válida.", 400);
  }

  if (!Number.isFinite(durationHours) || durationHours <= 0 || durationHours > 720) {
    throw createHttpError("La duración debe estar entre 1 y 720 horas.", 400);
  }

  if (imageDataUrl && !imageDataUrl.startsWith("data:image/")) {
    throw createHttpError("La imagen debe enviarse como Data URL válida.", 400);
  }

  if (imageDataUrl.length > 1_500_000) {
    throw createHttpError("La imagen es demasiado grande. Usá una imagen más liviana.", 400);
  }

  return {
    title,
    message,
    messagePages,
    hint,
    keyword,
    openAt,
    durationHours,
    imageDataUrl,
    readOnce,
    hints
  };
}

async function insertHints(client, noteId, hints) {
  if (!hints.length) return;

  for (const hint of hints) {
    await client.query(
      `
        INSERT INTO note_hints (
          note_id,
          label,
          question,
          options,
          correct_option_index,
          unlock_before_minutes,
          max_attempts,
          sort_order
        )
        VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8)
      `,
      [
        noteId,
        hint.label,
        hint.question,
        JSON.stringify(hint.options),
        hint.correctOptionIndex,
        hint.unlockBeforeMinutes,
        hint.maxAttempts,
        hint.sortOrder
      ]
    );
  }
}

async function getHintsForNote(noteId, note, clientKey = "") {
  const db = getDatabase();
  const minutesUntilOpen = getMinutesUntilOpen(note);

  const hintsResult = await db.query(
    `
      SELECT
        id,
        label,
        question,
        options,
        correct_option_index,
        unlock_before_minutes,
        max_attempts,
        sort_order
      FROM note_hints
      WHERE note_id = $1
      ORDER BY sort_order ASC, id ASC
    `,
    [noteId]
  );

  const hints = [];

  for (const hint of hintsResult.rows) {
    const isUnlocked = minutesUntilOpen !== null
      ? minutesUntilOpen <= hint.unlock_before_minutes
      : false;

    let attempt = null;

    if (clientKey) {
      const attemptResult = await db.query(
        `
          SELECT attempts_count, solved, last_selected_index
          FROM note_hint_attempts
          WHERE hint_id = $1 AND client_key = $2
        `,
        [hint.id, clientKey]
      );

      attempt = attemptResult.rows[0] || null;
    }

    const attemptsCount = attempt?.attempts_count || 0;
    const solved = Boolean(attempt?.solved);
    const remainingAttempts = Math.max(0, hint.max_attempts - attemptsCount);

    hints.push({
      id: hint.id,
      label: hint.label,
      question: isUnlocked ? hint.question : "",
      options: isUnlocked ? hint.options : [],
      unlockBeforeMinutes: hint.unlock_before_minutes,
      maxAttempts: hint.max_attempts,
      attemptsCount,
      remainingAttempts,
      solved,
      locked: !isUnlocked,
      exhausted: isUnlocked && !solved && remainingAttempts <= 0
    });
  }

  return hints;
}

export async function createNote(payload) {
  const db = getDatabase();
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const validated = validateCreatePayload(payload);
    const publicCode = await generateUniqueCode();

    const keywordHash = hashKeyword(validated.keyword);
    const expiresAt = addHours(validated.openAt, validated.durationHours);

    const result = await client.query(
      `
        INSERT INTO notes (
          public_code,
          title,
          message,
          message_pages,
          hint,
          image_data_url,
          keyword_hash,
          open_at,
          expires_at,
          duration_hours,
          read_once
        )
        VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `,
      [
        publicCode,
        validated.title,
        validated.message,
        JSON.stringify(validated.messagePages),
        validated.hint || null,
        validated.imageDataUrl || null,
        keywordHash,
        validated.openAt,
        expiresAt,
        validated.durationHours,
        validated.readOnce
      ]
    );

    const created = result.rows[0];

    await insertHints(client, created.id, validated.hints);

    await client.query("COMMIT");

    return {
      ...formatNote(created),
      share: {
        publicCode,
        openPath: `#/open/${publicCode}`
      }
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getNoteByCode(publicCode, clientKey = "") {
  const db = getDatabase();
  const code = String(publicCode || "").trim().toUpperCase();

  if (!code) {
    throw createHttpError("El código de nota es obligatorio.", 400);
  }

  const result = await db.query(
    "SELECT * FROM notes WHERE public_code = $1",
    [code]
  );

  if (result.rows.length === 0) {
    throw createHttpError("No se encontró ninguna nota con ese código.", 404);
  }

  const note = result.rows[0];
  const formatted = formatNote(note);
  const hints = await getHintsForNote(note.id, note, clientKey);

  return {
    ...formatted,
    hints,
    countdown: getCountdown(note)
  };
}

export async function unlockNote(publicCode, payload = {}) {
  const db = getDatabase();
  const code = String(publicCode || "").trim().toUpperCase();

  if (!code) {
    throw createHttpError("El código de nota es obligatorio.", 400);
  }

  const result = await db.query(
    "SELECT * FROM notes WHERE public_code = $1",
    [code]
  );

  if (result.rows.length === 0) {
    throw createHttpError("No se encontró ninguna nota con ese código.", 404);
  }

  const note = result.rows[0];
  const status = getNoteStatus(note);

  if (status === "SLEEPING") {
    const hints = await getHintsForNote(note.id, note, payload.clientKey || "");
    return {
      ...formatNote(note),
      hints,
      status: "SLEEPING"
    };
  }

  if (status === "EXPIRED") {
    return {
      ...formatNote(note),
      status: "EXPIRED"
    };
  }

  if (status === "READ") {
    throw createHttpError("Esta nota era de lectura única y ya fue abierta.", 410);
  }

  const keyword = String(payload.keyword || "").trim();
  const keywordIsValid = compareKeyword(keyword, note.keyword_hash);

  if (!keywordIsValid) {
    throw createHttpError("La palabra clave no es correcta.", 401);
  }

  const updated = await db.query(
    `
      UPDATE notes
      SET is_read = TRUE,
          updated_at = NOW()
      WHERE public_code = $1
      RETURNING *
    `,
    [code]
  );

  return {
    ...formatNote(updated.rows[0], { includeMessage: true }),
    status: "UNLOCKED"
  };
}

export async function answerHint(publicCode, hintId, payload = {}) {
  const db = getDatabase();

  const code = String(publicCode || "").trim().toUpperCase();
  const selectedIndex = Number(payload.selectedIndex);
  const clientKey = String(payload.clientKey || "").trim();

  if (!code) {
    throw createHttpError("El código de nota es obligatorio.", 400);
  }

  if (!clientKey) {
    throw createHttpError("No se pudo identificar el intento del navegador.", 400);
  }

  if (!Number.isInteger(selectedIndex)) {
    throw createHttpError("La opción seleccionada no es válida.", 400);
  }

  const noteResult = await db.query(
    "SELECT * FROM notes WHERE public_code = $1",
    [code]
  );

  if (noteResult.rows.length === 0) {
    throw createHttpError("No se encontró ninguna nota con ese código.", 404);
  }

  const note = noteResult.rows[0];
  const minutesUntilOpen = getMinutesUntilOpen(note);

  const hintResult = await db.query(
    `
      SELECT *
      FROM note_hints
      WHERE id = $1 AND note_id = $2
    `,
    [hintId, note.id]
  );

  if (hintResult.rows.length === 0) {
    throw createHttpError("No se encontró esa pista.", 404);
  }

  const hint = hintResult.rows[0];

  if (minutesUntilOpen > hint.unlock_before_minutes) {
    throw createHttpError("Esta pista todavía no está disponible.", 403);
  }

  const attemptResult = await db.query(
    `
      INSERT INTO note_hint_attempts (
        hint_id,
        client_key,
        attempts_count,
        solved,
        last_selected_index
      )
      VALUES ($1, $2, 0, FALSE, NULL)
      ON CONFLICT (hint_id, client_key)
      DO UPDATE SET updated_at = NOW()
      RETURNING *
    `,
    [hint.id, clientKey]
  );

  const attempt = attemptResult.rows[0];

  if (attempt.solved) {
    return {
      solved: true,
      correct: true,
      attemptsCount: attempt.attempts_count,
      remainingAttempts: Math.max(0, hint.max_attempts - attempt.attempts_count),
      message: "Esta pista ya estaba resuelta."
    };
  }

  if (attempt.attempts_count >= hint.max_attempts) {
    return {
      solved: false,
      correct: false,
      attemptsCount: attempt.attempts_count,
      remainingAttempts: 0,
      message: "Ya usaste todos los intentos para esta pista."
    };
  }

  const correct = selectedIndex === hint.correct_option_index;

  const updatedAttempt = await db.query(
    `
      UPDATE note_hint_attempts
      SET attempts_count = attempts_count + 1,
          solved = CASE WHEN $1 = TRUE THEN TRUE ELSE solved END,
          last_selected_index = $2,
          updated_at = NOW()
      WHERE hint_id = $3 AND client_key = $4
      RETURNING *
    `,
    [correct, selectedIndex, hint.id, clientKey]
  );

  const nextAttempt = updatedAttempt.rows[0];

  return {
    solved: Boolean(nextAttempt.solved),
    correct,
    attemptsCount: nextAttempt.attempts_count,
    remainingAttempts: Math.max(0, hint.max_attempts - nextAttempt.attempts_count),
    message: correct
      ? "Respuesta correcta. Pista desbloqueada."
      : "Respuesta incorrecta. Te queda otro intento si todavía no agotaste el límite."
  };
}

export async function cleanupExpiredNotes() {
  const db = getDatabase();

  const result = await db.query(
    "DELETE FROM notes WHERE expires_at < NOW()"
  );

  return {
    deleted: result.rowCount || 0
  };
}