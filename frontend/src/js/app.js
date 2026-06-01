"use strict";

import { router } from "./router.js";

function activateLucideIcons() {
  window.lucide?.createIcons();
}

function bindMobileMenu() {
  const button = document.querySelector("#mnMenuButton");
  const nav = document.querySelector("#mnNav");

  if (!button || !nav) return;

  button.addEventListener("click", () => {
    nav.classList.toggle("mn-nav--open");
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("mn-nav--open");
    });
  });
}

function boot() {
  router();
  activateLucideIcons();
  bindMobileMenu();
}

window.addEventListener("DOMContentLoaded", boot);

window.addEventListener("hashchange", () => {
  router();
  activateLucideIcons();
  bindMobileMenu();
});