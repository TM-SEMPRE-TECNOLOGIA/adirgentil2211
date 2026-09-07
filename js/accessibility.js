(() => {
  "use strict";

  const STORAGE_KEY = "flavio-site-accessibility-v1";
  const root = document.documentElement;
  const body = document.body;
  const panel = document.getElementById("accessibilityPanel");
  const toggle = document.getElementById("accessibilityToggle");
  const closeButton = document.getElementById("accessibilityClose");
  const resetButton = document.getElementById("accessibilityReset");
  const fontLevel = document.getElementById("a11yFontLevel");
  const toolbarFontLevel = document.getElementById("a11yToolbarFontLevel");
  const status = document.getElementById("a11yStatus");
  if (!panel || !toggle) return;

  const defaults = {
    fontScale: 1,
    readable: false,
    letterSpacing: false,
    lineSpacing: false,
    readingMode: false,
    highContrast: false,
    darkMode: false,
    invert: false,
    grayscale: false,
    highlightLinks: false,
    reduceMotion: false,
    largeCursor: false,
  };

  const classMap = {
    readable: "a11y-readable",
    letterSpacing: "a11y-letter-spacing",
    lineSpacing: "a11y-line-spacing",
    readingMode: "a11y-reading-mode",
    highContrast: "a11y-high-contrast",
    darkMode: "a11y-dark-mode",
    invert: "a11y-invert",
    grayscale: "a11y-grayscale",
    highlightLinks: "a11y-highlight-links",
    reduceMotion: "a11y-reduce-motion",
    largeCursor: "a11y-large-cursor",
  };

  let state = { ...defaults };
  let previousFocus = null;

  const readState = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      state = { ...defaults, ...saved };
      state.fontScale = Math.min(
        1.4,
        Math.max(0.9, Number(state.fontScale) || 1)
      );
    } catch (_) {
      state = { ...defaults };
    }
  };

  const saveState = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  };

  const announce = (message) => {
    if (!status) return;
    status.textContent = "";
    window.setTimeout(() => {
      status.textContent = message;
    }, 20);
  };

  const applyState = ({ announceChange = false } = {}) => {
    root.style.fontSize = `${Math.round(state.fontScale * 100)}%`;
    if (fontLevel)
      fontLevel.textContent = `${Math.round(state.fontScale * 100)}%`;
    if (toolbarFontLevel)
      toolbarFontLevel.textContent = `${Math.round(state.fontScale * 100)}%`;

    Object.entries(classMap).forEach(([key, className]) => {
      root.classList.toggle(className, Boolean(state[key]));
      document
        .querySelectorAll(`[data-a11y-toggle="${key}"]`)
        .forEach((button) => {
          button.setAttribute("aria-pressed", String(Boolean(state[key])));
        });
    });

    /* Os modos de cor são mutuamente exclusivos para manter contraste previsível. */
    if (state.highContrast && (state.invert || state.darkMode)) {
      state.invert = false;
      state.darkMode = false;
      root.classList.remove(classMap.invert);
      root.classList.remove(classMap.darkMode);
      document
        .querySelectorAll(
          '[data-a11y-toggle="invert"], [data-a11y-toggle="darkMode"]'
        )
        .forEach((button) => button.setAttribute("aria-pressed", "false"));
    }

    if (announceChange) announce("Preferências de acessibilidade atualizadas.");
  };

  const focusableSelector =
    'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const focusables = () =>
    [...panel.querySelectorAll(focusableSelector)].filter(
      (el) => el.offsetParent !== null
    );

  const openPanel = () => {
    previousFocus = document.activeElement;
    panel.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
    body.classList.add("a11y-panel-open");
    window.requestAnimationFrame(() => closeButton?.focus());
  };

  const closePanel = () => {
    panel.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    body.classList.remove("a11y-panel-open");
    if (
      previousFocus instanceof HTMLElement &&
      document.contains(previousFocus)
    )
      previousFocus.focus({ preventScroll: true });
    else toggle.focus({ preventScroll: true });
  };

  toggle.addEventListener("click", () => {
    if (panel.getAttribute("aria-hidden") === "false") closePanel();
    else openPanel();
  });
  closeButton?.addEventListener("click", closePanel);

  panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closePanel();
      return;
    }
    if (event.key !== "Tab") return;
    const items = focusables();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (panel.getAttribute("aria-hidden") !== "false") return;
    if (panel.contains(event.target) || toggle.contains(event.target)) return;
    closePanel();
  });

  document.querySelectorAll("[data-a11y-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.a11yAction;
      if (action === "font-increase")
        state.fontScale = Math.min(1.4, +(state.fontScale + 0.1).toFixed(1));
      if (action === "font-decrease")
        state.fontScale = Math.max(0.9, +(state.fontScale - 0.1).toFixed(1));
      saveState();
      applyState();
      announce(
        `Tamanho do texto ajustado para ${Math.round(
          state.fontScale * 100
        )} por cento.`
      );
    });
  });

  document.querySelectorAll("[data-a11y-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.a11yToggle;
      if (!(key in state)) return;
      state[key] = !state[key];

      if (key === "highContrast" && state.highContrast) state.invert = false;
      if (key === "highContrast" && state.highContrast) state.darkMode = false;
      if (key === "invert" && state.invert) {
        state.highContrast = false;
        state.darkMode = false;
      }
      if (key === "darkMode" && state.darkMode) {
        state.highContrast = false;
        state.invert = false;
      }

      saveState();
      applyState();
      const label = button.textContent.trim().replace(/\s+/g, " ");
      announce(`${label}: ${state[key] ? "ativado" : "desativado"}.`);
    });
  });

  resetButton?.addEventListener("click", () => {
    state = { ...defaults };
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
    applyState();
    announce("Preferências de acessibilidade restauradas para o padrão.");
  });

  /* O sistema operacional inicia a experiência com movimento reduzido, sem sobrescrever escolha persistida. */
  const systemReduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );
  const syncSystemMotion = () => {
    let hasSavedPreference = false;
    try {
      hasSavedPreference = Boolean(localStorage.getItem(STORAGE_KEY));
    } catch (_) {}
    if (!hasSavedPreference && systemReduceMotion.matches) {
      state.reduceMotion = true;
      applyState();
    }
  };

  readState();
  applyState();
  syncSystemMotion();
  systemReduceMotion.addEventListener?.("change", syncSystemMotion);
})();
