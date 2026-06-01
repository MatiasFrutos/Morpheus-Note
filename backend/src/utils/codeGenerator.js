"use strict";

import crypto from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePublicCode(prefix = "MN") {
  let code = "";

  for (let index = 0; index < 6; index += 1) {
    const randomIndex = crypto.randomInt(0, ALPHABET.length);
    code += ALPHABET[randomIndex];
  }

  return `${prefix}-${code}`;
}

export function hashKeyword(keyword) {
  if (!keyword || !String(keyword).trim()) {
    return null;
  }

  return crypto
    .createHash("sha256")
    .update(String(keyword).trim().toLowerCase())
    .digest("hex");
}

export function compareKeyword(keyword, storedHash) {
  if (!storedHash) {
    return true;
  }

  if (!keyword || !String(keyword).trim()) {
    return false;
  }

  return hashKeyword(keyword) === storedHash;
}