"use strict";

import { Router } from "express";
import {
  answerHintController,
  cleanupExpiredNotesController,
  createNoteController,
  getNoteStatusController,
  unlockNoteController
} from "../controllers/notes.controller.js";

const router = Router();

router.post("/", createNoteController);

router.get("/cleanup/expired", cleanupExpiredNotesController);

router.get("/:code", getNoteStatusController);

router.post("/:code/unlock", unlockNoteController);

router.post("/:code/hints/:hintId/answer", answerHintController);

export default router;