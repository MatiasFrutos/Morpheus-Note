"use strict";

import {
  answerHint,
  cleanupExpiredNotes,
  createNote,
  getNoteByCode,
  unlockNote
} from "../services/notes.service.js";

export async function createNoteController(req, res, next) {
  try {
    const note = await createNote(req.body);

    res.status(201).json({
      ok: true,
      message: "Nota dormida creada correctamente.",
      data: note
    });
  } catch (error) {
    next(error);
  }
}

export async function getNoteStatusController(req, res, next) {
  try {
    const clientKey = req.query.clientKey || "";
    const note = await getNoteByCode(req.params.code, clientKey);

    res.status(200).json({
      ok: true,
      message: "Estado de nota obtenido correctamente.",
      data: note
    });
  } catch (error) {
    next(error);
  }
}

export async function unlockNoteController(req, res, next) {
  try {
    const note = await unlockNote(req.params.code, req.body);

    res.status(200).json({
      ok: true,
      message: "Resultado de apertura obtenido correctamente.",
      data: note
    });
  } catch (error) {
    next(error);
  }
}

export async function answerHintController(req, res, next) {
  try {
    const result = await answerHint(req.params.code, req.params.hintId, req.body);

    res.status(200).json({
      ok: true,
      message: "Respuesta de pista procesada correctamente.",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function cleanupExpiredNotesController(req, res, next) {
  try {
    const result = await cleanupExpiredNotes();

    res.status(200).json({
      ok: true,
      message: "Notas expiradas limpiadas correctamente.",
      data: result
    });
  } catch (error) {
    next(error);
  }
}