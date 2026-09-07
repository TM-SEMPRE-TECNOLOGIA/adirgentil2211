(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const root = document.documentElement;
  const focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(",");

  const getFocusable = (container) =>
    [...container.querySelectorAll(focusableSelector)].filter(
      (el) => !el.hidden && el.getAttribute("aria-hidden") !== "true"
    );

  const createFocusTrap = (container, onEscape) => {
    const handleKeydown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onEscape?.();
        return;
      }
      if (event.key !== "Tab") return;
      const items = getFocusable(container);
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
    };
    container.addEventListener("keydown", handleKeydown);
    return () => container.removeEventListener("keydown", handleKeydown);
  };

  /* SVG draw: aplica só na primeira entrada do hero. */
  const logoStack = document.querySelector(".hero-linefx-stack");
  if (logoStack && !prefersReducedMotion) {
    logoStack.classList.add("is-drawing");
    window.setTimeout(() => logoStack.classList.remove("is-drawing"), 2600);
  }

  /* Reveal: mantém os .reveal existentes e dispara por viewport. */
  const motionStyles = getComputedStyle(root);
  const staggerMs =
    parseFloat(motionStyles.getPropertyValue("--motion-stagger")) || 70;
  const triggerThreshold =
    parseFloat(motionStyles.getPropertyValue("--motion-trigger-threshold")) ||
    0.14;
  const triggerBottom =
    motionStyles.getPropertyValue("--motion-trigger-bottom").trim() || "-8%";

  const revealItems = [...document.querySelectorAll(".reveal")];
  revealItems.forEach((item, index) => {
    item.style.setProperty("--reveal-delay", `${(index % 5) * staggerMs}ms`);
  });

  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: triggerThreshold,
        rootMargin: `0px 0px ${triggerBottom} 0px`,
      }
    );
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("visible"));
  }

  /* Barra de progresso + variável local de seção. */
  const sections = [...document.querySelectorAll("main > section")];
  sections.forEach((section) => {
    if (section.querySelector(":scope > .motion-section-wash")) return;
    const wash = document.createElement("span");
    wash.className = "motion-section-wash";
    wash.setAttribute("aria-hidden", "true");
    section.prepend(wash);
  });
  let raf = 0;
  const paintScroll = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    const max = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight
    );
    const progress = Math.min(1, Math.max(0, y / max));
    root.style.setProperty("--motion-scroll", progress.toFixed(4));

    if (!prefersReducedMotion) {
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const range = Math.max(1, window.innerHeight + rect.height);
        const local = Math.min(
          1,
          Math.max(0, (window.innerHeight - rect.top) / range)
        );
        const flash = Math.max(0, 1 - Math.abs(local - 0.5) * 4);
        section.style.setProperty(
          "--motion-section-progress",
          local.toFixed(4)
        );
        section.style.setProperty(
          "--motion-section-flash",
          (flash * 0.28).toFixed(3)
        );
      });
    }
    raf = 0;
  };
  const requestPaint = () => {
    if (raf) return;
    raf = requestAnimationFrame(paintScroll);
  };
  paintScroll();
  window.addEventListener("scroll", requestPaint, { passive: true });
  window.addEventListener("resize", requestPaint, { passive: true });

  /* Ambiente do hero. */
  document.querySelector(".hero")?.classList.add("motion-ambient");

  /* Menu fullscreen: usa o menu atual, apenas muda comportamento/foco. */
  const menu = document.getElementById("mobileMenu");
  const menuToggle = document.querySelector(".menu-toggle");
  let releaseMenuTrap = null;
  let menuPreviousFocus = null;

  const syncMenuAccessibility = () => {
    if (!menu || !menuToggle) return;
    const open = menu.classList.contains("open");
    menu.setAttribute("aria-hidden", String(!open));
    if (open) {
      menuPreviousFocus = document.activeElement;
      releaseMenuTrap?.();
      releaseMenuTrap = createFocusTrap(menu, () => menuToggle.click());
      requestAnimationFrame(() => getFocusable(menu)[0]?.focus());
    } else {
      releaseMenuTrap?.();
      releaseMenuTrap = null;
      if (
        menuPreviousFocus instanceof HTMLElement &&
        document.contains(menuPreviousFocus)
      ) {
        menuPreviousFocus.focus({ preventScroll: true });
      }
    }
  };

  if (menu && menuToggle) {
    menu.setAttribute("aria-hidden", "true");
    const menuObserver = new MutationObserver(syncMenuAccessibility);
    menuObserver.observe(menu, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  /* Painel secundário reutilizável. */
  const panels = new Map();
  document.querySelectorAll(".motion-panel").forEach((panel) => {
    const dialog = panel.querySelector(".motion-panel__dialog");
    const closeButtons = panel.querySelectorAll("[data-motion-panel-close]");
    let previousFocus = null;
    let releaseTrap = null;

    const close = () => {
      if (!panel.classList.contains("is-open")) return;
      panel.classList.remove("is-open");
      panel.setAttribute("aria-hidden", "true");
      document.body.classList.remove("motion-panel-open");
      releaseTrap?.();
      releaseTrap = null;
      if (
        previousFocus instanceof HTMLElement &&
        document.contains(previousFocus)
      ) {
        previousFocus.focus({ preventScroll: true });
      }
    };

    const open = (trigger) => {
      previousFocus = trigger || document.activeElement;
      panel.classList.add("is-open");
      panel.setAttribute("aria-hidden", "false");
      document.body.classList.add("motion-panel-open");
      if (dialog) {
        releaseTrap?.();
        releaseTrap = createFocusTrap(dialog, close);
        requestAnimationFrame(() => dialog.focus());
      }
    };

    closeButtons.forEach((button) => button.addEventListener("click", close));
    panels.set(panel.id, { open, close });
  });

  document.querySelectorAll("[data-motion-panel-open]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      const id = trigger.getAttribute("data-motion-panel-open");
      panels.get(id)?.open(trigger);
    });
  });

  /* API opcional para testar/abrir painéis pelo console sem acoplar ao layout. */
  window.siteMotion = {
    openPanel(id) {
      panels.get(id)?.open(document.activeElement);
    },
    closePanel(id) {
      panels.get(id)?.close();
    },
    set(name, value) {
      root.style.setProperty(name, value);
    },
  };
})();
