"use strict";

export function toIsoDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

export function addHours(value, hours) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const safeHours = Number.isFinite(Number(hours)) ? Number(hours) : 24;
  date.setHours(date.getHours() + safeHours);

  return date.toISOString();
}

export function getNoteStatus(note) {
  const now = new Date();
  const openAt = new Date(note.open_at);
  const expiresAt = new Date(note.expires_at);

  if (Number.isNaN(openAt.getTime()) || Number.isNaN(expiresAt.getTime())) {
    return "INVALID";
  }

  if (now < openAt) {
    return "SLEEPING";
  }

  if (now > expiresAt) {
    return "EXPIRED";
  }

  if (note.read_once && note.is_read) {
    return "READ";
  }

  return "READY";
}

export function getMinutesUntilOpen(note) {
  const now = new Date();
  const openAt = new Date(note.open_at);

  if (Number.isNaN(openAt.getTime())) {
    return null;
  }

  return Math.max(0, Math.ceil((openAt.getTime() - now.getTime()) / 60000));
}

export function getCountdown(note) {
  const now = new Date();
  const openAt = new Date(note.open_at);

  if (Number.isNaN(openAt.getTime())) {
    return {
      totalSeconds: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    };
  }

  const diff = Math.max(0, openAt.getTime() - now.getTime());

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    totalSeconds,
    days,
    hours,
    minutes,
    seconds
  };
}

export function normalizeJsonArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

export function formatNote(row, options = {}) {
  if (!row) {
    return null;
  }

  const status = getNoteStatus(row);
  const messagePages = normalizeJsonArray(row.message_pages);

  const note = {
    id: row.id,
    publicCode: row.public_code,
    title: row.title,
    hint: row.hint || "",
    imageDataUrl: row.image_data_url || "",
    openAt: row.open_at,
    expiresAt: row.expires_at,
    durationHours: row.duration_hours,
    hasKeyword: Boolean(row.keyword_hash),
    readOnce: Boolean(row.read_once),
    isRead: Boolean(row.is_read),
    totalPages: messagePages.length,
    status,
    countdown: getCountdown(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };

  if (options.includeMessage) {
    note.message = row.message;
    note.messagePages = messagePages.length > 0 ? messagePages : [row.message];
  }

  return note;
}