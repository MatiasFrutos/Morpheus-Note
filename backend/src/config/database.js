"use strict";

import pg from "pg";

const { Pool } = pg;

let pool = null;

export async function initDatabase() {
  pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || "morpheus_note",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      public_code VARCHAR(32) NOT NULL UNIQUE,
      title VARCHAR(80) NOT NULL,
      message TEXT NOT NULL,
      message_pages JSONB NOT NULL DEFAULT '[]'::jsonb,
      hint VARCHAR(180),
      image_data_url TEXT,
      keyword_hash TEXT,
      open_at TIMESTAMPTZ NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      duration_hours INTEGER NOT NULL DEFAULT 24,
      read_once BOOLEAN NOT NULL DEFAULT FALSE,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      reports_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE notes
      ADD COLUMN IF NOT EXISTS message_pages JSONB NOT NULL DEFAULT '[]'::jsonb;

    ALTER TABLE notes
      ADD COLUMN IF NOT EXISTS image_data_url TEXT;

    ALTER TABLE notes
      ADD COLUMN IF NOT EXISTS read_once BOOLEAN NOT NULL DEFAULT FALSE;

    ALTER TABLE notes
      ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;

    ALTER TABLE notes
      ADD COLUMN IF NOT EXISTS reports_count INTEGER NOT NULL DEFAULT 0;

    CREATE TABLE IF NOT EXISTS note_hints (
      id SERIAL PRIMARY KEY,
      note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      label VARCHAR(80) NOT NULL,
      question TEXT NOT NULL,
      options JSONB NOT NULL DEFAULT '[]'::jsonb,
      correct_option_index INTEGER NOT NULL DEFAULT 0,
      unlock_before_minutes INTEGER NOT NULL DEFAULT 999999,
      max_attempts INTEGER NOT NULL DEFAULT 2,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS note_hint_attempts (
      id SERIAL PRIMARY KEY,
      hint_id INTEGER NOT NULL REFERENCES note_hints(id) ON DELETE CASCADE,
      client_key VARCHAR(120) NOT NULL,
      attempts_count INTEGER NOT NULL DEFAULT 0,
      solved BOOLEAN NOT NULL DEFAULT FALSE,
      last_selected_index INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT note_hint_attempts_unique_client UNIQUE (hint_id, client_key)
    );

    CREATE INDEX IF NOT EXISTS idx_notes_public_code
      ON notes(public_code);

    CREATE INDEX IF NOT EXISTS idx_notes_open_at
      ON notes(open_at);

    CREATE INDEX IF NOT EXISTS idx_notes_expires_at
      ON notes(expires_at);

    CREATE INDEX IF NOT EXISTS idx_note_hints_note_id
      ON note_hints(note_id);

    CREATE INDEX IF NOT EXISTS idx_note_hint_attempts_hint_client
      ON note_hint_attempts(hint_id, client_key);
  `);

  return pool;
}

export function getDatabase() {
  if (!pool) {
    throw new Error("La conexión a PostgreSQL todavía no fue inicializada.");
  }

  return pool;
}