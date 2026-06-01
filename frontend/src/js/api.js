"use strict";

const API_BASE_URL = "http://localhost:3000/api";

function getClientKey() {
  const storageKey = "morpheus-client-key";
  const existing = localStorage.getItem(storageKey);

  if (existing) {
    return existing;
  }

  const value = `mn-client-${crypto.randomUUID()}`;
  localStorage.setItem(storageKey, value);

  return value;
}

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = data?.message || "Ocurrió un error inesperado.";
    throw new Error(errorMessage);
  }

  return data;
}

export async function createNote(payload) {
  return request("/notes", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function getNoteStatus(code) {
  const clientKey = getClientKey();

  return request(`/notes/${encodeURIComponent(code)}?clientKey=${encodeURIComponent(clientKey)}`, {
    method: "GET"
  });
}

export async function unlockNote(code, payload) {
  return request(`/notes/${encodeURIComponent(code)}/unlock`, {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      clientKey: getClientKey()
    })
  });
}

export async function answerHint(code, hintId, selectedIndex) {
  return request(`/notes/${encodeURIComponent(code)}/hints/${encodeURIComponent(hintId)}/answer`, {
    method: "POST",
    body: JSON.stringify({
      selectedIndex,
      clientKey: getClientKey()
    })
  });
}