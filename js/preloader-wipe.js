(() => {
  "use strict";

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const params = new URLSearchParams(window.location.search);

  // Lê a configuração amigável definida em js/page-transition-config.js
  const userConfig = window.PAGE_TRANSITION_CONFIG || {};

  const isEnabled = userConfig.enabled !== false && userConfig.mode !== "disabled";
  const mode = userConfig.mode || "every_page";
  const displayDurationMs =
    typeof userConfig.displayDurationMs === "number"
      ? userConfig.displayDurationMs
      : 1400;
  const exitTransitionMs =
    typeof userConfig.exitTransitionMs === "number"
      ? userConfig.exitTransitionMs
      : 700;
  const transitionStyle = userConfig.transitionStyle || "slide-up";
  const sessionKey = userConfig.sessionKey || "adir-site-intro-seen-v2";

  // Identifica se a página atual é a home
  const currentPath = window.location.pathname.replace(/^.*[\\\/]/, "").toLowerCase();
  const isHomePage = currentPath === "" || currentPath === "index.html";

  // Permite forçar teste via ?intro=1
  const forcedByQuery = params.get("intro") === "1";

  const shouldSkipIntro = () => {
    if (forcedByQuery) return false;
    if (!isEnabled || reduceMotion) return true;
    if (mode === "home_only" && !isHomePage) return true;
    if (mode === "first_visit_only") {
      try {
        if (sessionStorage.getItem(sessionKey) === "1") return true;
      } catch (_) {}
    }
    return false;
  };

  const intro = document.getElementById("siteIntro");

  const markIntroSeen = () => {
    try {
      sessionStorage.setItem(sessionKey, "1");
    } catch (_) {}
  };

  const removeIntro = () => {
    document.documentElement.classList.remove("site-intro-lock");
    intro?.remove();
  };

  if (intro) {
    if (shouldSkipIntro()) {
      removeIntro();
    } else {
      // Aplica cores personalizadas se configuradas
      if (userConfig.backgroundColor) {
        intro.style.setProperty("--site-intro-bg", userConfig.backgroundColor);
        intro.style.backgroundColor = userConfig.backgroundColor;
      }
      if (userConfig.numberColor) {
        const sym = intro.querySelector(".site-intro__symbol");
        if (sym) sym.style.color = userConfig.numberColor;
      }

      // Configura a transição de saída dinâmica
      if (transitionStyle === "fade") {
        intro.style.transition = `opacity ${exitTransitionMs}ms ease, visibility 0s ${exitTransitionMs + 20}ms`;
      } else {
        intro.style.transition = `transform ${exitTransitionMs}ms cubic-bezier(0.76, 0, 0.24, 1), opacity ${exitTransitionMs}ms ease, visibility 0s ${exitTransitionMs + 20}ms`;
      }

      document.documentElement.classList.add("site-intro-lock");
      requestAnimationFrame(() => intro.classList.add("is-running"));

      window.setTimeout(() => {
        markIntroSeen();
        if (transitionStyle === "fade") {
          intro.style.opacity = "0";
          intro.style.pointerEvents = "none";
        } else if (transitionStyle === "zoom-out") {
          intro.style.transform = "scale(0.85)";
          intro.style.opacity = "0";
          intro.style.pointerEvents = "none";
        } else {
          intro.classList.add("is-exiting");
        }
        window.setTimeout(removeIntro, exitTransitionMs);
      }, displayDurationMs);
    }
  }

  /* Wipe horizontal: progresso calculado apenas enquanto a seção está próxima da viewport. */
  const wipes = [...document.querySelectorAll("[data-site-scroll-wipe]")];
  if (!wipes.length || reduceMotion) return;

  let frame = 0;

  const clamp = (value, min = 0, max = 1) =>
    Math.min(max, Math.max(min, value));

  const paintWipes = () => {
    const vh = window.innerHeight || document.documentElement.clientHeight;

    wipes.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.bottom < -vh * 0.25 || rect.top > vh * 1.25) return;

      const available = Math.max(1, rect.height - vh);
      const raw = clamp(-rect.top / available);
      const start =
        Number.parseFloat(
          section.dataset.wipeStart ||
            getComputedStyle(section).getPropertyValue("--site-wipe-start")
        ) || 0.18;
      const end =
        Number.parseFloat(
          section.dataset.wipeEnd ||
            getComputedStyle(section).getPropertyValue("--site-wipe-end")
        ) || 0.73;
      const normalized = clamp((raw - start) / Math.max(0.001, end - start));

      section.style.setProperty("--site-wipe-progress", normalized.toFixed(4));
      section.style.setProperty("--site-wipe-raw", raw.toFixed(4));
    });

    frame = 0;
  };

  const requestPaint = () => {
    if (frame) return;
    frame = requestAnimationFrame(paintWipes);
  };

  paintWipes();
  window.addEventListener("scroll", requestPaint, { passive: true });
  window.addEventListener("resize", requestPaint, { passive: true });

  /* API para QA e controle em tempo real pelo console */
  window.sitePreloaderWipe = {
    config: userConfig,
    replayIntro() {
      try {
        sessionStorage.removeItem(sessionKey);
      } catch (_) {}
      window.location.reload();
    },
    setWipeRange(section, start, end) {
      if (!section) return;
      section.dataset.wipeStart = String(start);
      section.dataset.wipeEnd = String(end);
      requestPaint();
    },
  };
})();
