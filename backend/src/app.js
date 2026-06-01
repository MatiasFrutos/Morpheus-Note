"use strict";

import express from "express";
import cors from "cors";
import notesRoutes from "./routes/notes.routes.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5500",
  "http://127.0.0.1:5500"
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false
  })
);

app.options("*", cors());

app.use(
  express.json({
    limit: "2mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb"
  })
);

app.get("/api", (req, res) => {
  res.status(200).json({
    ok: true,
    message: "Morpheus Note API operativa.",
    data: {
      service: "Morpheus Note API",
      version: "0.1.0",
      status: "ok",
      timestamp: new Date().toISOString(),
      endpoints: {
        health: "GET /api",
        createNote: "POST /api/notes",
        getNoteStatus: "GET /api/notes/:code",
        unlockNote: "POST /api/notes/:code/unlock",
        cleanupExpired: "GET /api/notes/cleanup/expired"
      }
    }
  });
});

app.use("/api/notes", notesRoutes);

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: "Ruta no encontrada.",
    data: null
  });
});

app.use((error, req, res, next) => {
  console.error("Error interno:", error);

  res.status(error.statusCode || 500).json({
    ok: false,
    message: error.message || "Error interno del servidor.",
    data: null
  });
});

export { app };