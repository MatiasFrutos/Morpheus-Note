"use strict";

import { renderLayout } from "../components/layout.component.js";
import { renderHomePage } from "../pages/home.page.js";
import { renderCreateNotePage } from "../pages/create-note.page.js";
import { renderOpenNotePage } from "../pages/open-note.page.js";
import { renderSleepingNotePage } from "../pages/sleeping-note.page.js";
import { renderUnlockedNotePage } from "../pages/unlocked-note.page.js";
import { renderExpiredNotePage } from "../pages/expired-note.page.js";

const app = document.querySelector("#app");

function getRoute() {
  const hash = window.location.hash || "#/";
  const cleanHash = hash.trim();

  if (cleanHash.startsWith("#/open/")) {
    const code = cleanHash.replace("#/open/", "").trim();
    return {
      page: "open",
      params: { code }
    };
  }

  if (cleanHash.startsWith("#/sleeping/")) {
    const code = cleanHash.replace("#/sleeping/", "").trim();
    return {
      page: "sleeping",
      params: { code }
    };
  }

  if (cleanHash.startsWith("#/unlocked/")) {
    const code = cleanHash.replace("#/unlocked/", "").trim();
    return {
      page: "unlocked",
      params: { code }
    };
  }

  if (cleanHash.startsWith("#/expired/")) {
    const code = cleanHash.replace("#/expired/", "").trim();
    return {
      page: "expired",
      params: { code }
    };
  }

  switch (cleanHash) {
    case "#/":
    case "#":
      return { page: "home", params: {} };

    case "#/create":
      return { page: "create", params: {} };

    case "#/open":
      return { page: "open", params: {} };

    default:
      return { page: "home", params: {} };
  }
}

function renderPage(route) {
  switch (route.page) {
    case "home":
      return renderHomePage();

    case "create":
      return renderCreateNotePage();

    case "open":
      return renderOpenNotePage(route.params);

    case "sleeping":
      return renderSleepingNotePage(route.params);

    case "unlocked":
      return renderUnlockedNotePage(route.params);

    case "expired":
      return renderExpiredNotePage(route.params);

    default:
      return renderHomePage();
  }
}

export function router() {
  const route = getRoute();

  app.innerHTML = renderLayout({
    content: renderPage(route)
  });

  const pageEvent = new CustomEvent("morpheus:page-mounted", {
    detail: route
  });

  window.dispatchEvent(pageEvent);
}