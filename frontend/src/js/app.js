"use strict";

import { router } from "./router.js";
import { initFx, onPageMounted } from "./fx.js";
import { enhancePage } from "./enhance.js";

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

window.addEventListener("morpheus:page-mounted", (event) => {
  enhancePage(event.detail);
  onPageMounted();
  activateLucideIcons();
});

function boot() {
  initFx();
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