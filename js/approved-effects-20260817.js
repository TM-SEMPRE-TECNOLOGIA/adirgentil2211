(() => {
  "use strict";

  const unique = (items) => [...new Set(items)];

  const prepareTypewriterTitles = () => {
    const titles = unique([
      ...document.querySelectorAll("main h1:not(.sr-only)"),
      ...document.querySelectorAll("main section h2"),
    ]).filter(
      (title) =>
        !title.closest(".a11y-panel") &&
        !title.hasAttribute("data-disable-typewriter")
    );

    titles.forEach((title) => {
      title.classList.remove(
        "brand-gradient-reveal",
        "brand-gradient-settling",
        "red-gradient-reveal",
        "red-gradient-settling",
        "red-parallax-title"
      );
      title.classList.add("typewriter-title");

      const accessibleLabel = (title.textContent || "")
        .replace(/\s+/gu, " ")
        .trim();
      const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      let currentNode = walker.nextNode();
      while (currentNode) {
        textNodes.push(currentNode);
        currentNode = walker.nextNode();
      }

      textNodes.forEach((textNode) => {
        const fragment = document.createDocumentFragment();
        [...textNode.nodeValue].forEach((character) => {
          const characterNode = document.createElement("typewriter-char");
          characterNode.className = "typewriter-char";
          characterNode.setAttribute("aria-hidden", "true");
          characterNode.textContent = character;
          fragment.appendChild(characterNode);
        });
        textNode.replaceWith(fragment);
      });

      title.setAttribute("aria-label", accessibleLabel);
    });

    const show = (title) => {
      if (title.dataset.typewriterStarted === "true") return;
      title.dataset.typewriterStarted = "true";
      title.classList.add("is-typing");

      const characters = [...title.querySelectorAll(".typewriter-char")];
      const characterInterval = 38;
      const startedAt = performance.now();
      let visibleCharacters = 0;

      const typeNextCharacter = (now) => {
        const nextVisibleCount = Math.min(
          characters.length,
          Math.floor((now - startedAt) / characterInterval) + 1
        );

        while (visibleCharacters < nextVisibleCount) {
          characters[visibleCharacters].classList.add("is-visible");
          visibleCharacters += 1;
        }

        if (visibleCharacters < characters.length) {
          window.requestAnimationFrame(typeNextCharacter);
          return;
        }

        title.classList.remove("is-typing");
        title.classList.add("is-typed");
      };

      window.requestAnimationFrame(typeNextCharacter);
    };

    if (!("IntersectionObserver" in window)) {
      titles.forEach(show);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          show(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.22, rootMargin: "0px 0px -8% 0px" }
    );

    titles.forEach((title) => observer.observe(title));
  };

  const prepareCountUpNumbers = () => {
    const selectors = [
      ".mandates-section .axis-card > span",
      ".real-stat > strong",
      ".bolsozap-action > span",
      ".participate-card > span",
      ".fact-check-list article > span",
      ".jingle-list button > span",
      ".internal-hero__mark",
      ".material-category__count",
      ".hero-numbers dt",
      ".values > div > span",
      ".section-kicker > span",
      ".axis-number",
      ".journey-steps li > span",
      ".download-meta strong",
      ".hero-stamp strong",
      ".hero-stamp span",
      ".fbp-meta span",
      ".fbp-toc span",
      ".fbp-toc-mobile span",
      "[data-count-number]",
    ];

    const candidates = unique(
      selectors.flatMap((selector) => [...document.querySelectorAll(selector)])
    );
    const counters = candidates
      .map((element) => {
        const raw = (element.textContent || "").trim();
        const match = raw.match(/^(\d+)(.*)$/u);
        if (!match) return null;

        const target = Number(match[1]);
        if (!Number.isFinite(target)) return null;

        element.dataset.countTarget = String(target);
        element.dataset.countSuffix = match[2];
        element.dataset.countPad = String(match[1].length);
        element.dataset.countOriginal = raw;
        element.setAttribute("aria-label", raw);
        element.classList.add("count-up-number");
        element.textContent = `${String(0).padStart(
          match[1].startsWith("0") ? match[1].length : 1,
          "0"
        )}${match[2]}`;
        return element;
      })
      .filter(Boolean);

    const startCounter = (element) => {
      if (element.dataset.countStarted === "true") return;
      element.dataset.countStarted = "true";
      element.classList.add("is-counting");

      const target = Number(element.dataset.countTarget);
      const suffix = element.dataset.countSuffix || "";
      const pad = Number(element.dataset.countPad || 1);
      const leadingZero = (element.dataset.countOriginal || "").startsWith("0");
      const duration = Math.min(1900, 1050 + Math.log10(target + 1) * 240);
      const startedAt = performance.now();

      const update = (now) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(target * eased);
        const label = leadingZero
          ? String(value).padStart(pad, "0")
          : String(value);
        element.textContent = `${label}${suffix}`;

        if (progress < 1) {
          window.requestAnimationFrame(update);
          return;
        }

        element.textContent = element.dataset.countOriginal;
        element.classList.remove("is-counting");
        element.classList.add("is-counted");
      };

      window.requestAnimationFrame(update);
    };

    if (!("IntersectionObserver" in window)) {
      counters.forEach(startCounter);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          startCounter(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px 18% 0px" }
    );

    counters.forEach((counter) => observer.observe(counter));
  };

  const prepareSiteMotion = () => {
    const selectors = [
      "main .axis-card",
      "main .proposal-stage",
      "main .trajectory-photo",
      "main .trajectory-copy",
      "main .campaign-media",
      "main .real-stat",
      "main .real-editorial",
      "main .journey-social",
      "main .jingle-list",
      "main .news-card",
      "main .news-page-feature",
      "main .news-page-item",
      "main .material-card",
      "main .material-category",
      "main .bolsozap-grid > div",
      "main .participate-card",
      "main .fact-check-list",
      "main .testimonial-card",
      "main .biography-photo",
      "main .internal-prose",
      "main .action-detail",
      "main .contact-grid > article",
      "main .legal-list",
      "main .post-download__grid > *",
    ];

    const targets = unique(
      selectors.flatMap((selector) => [...document.querySelectorAll(selector)])
    ).filter(
      (element) =>
        !element.closest(".hero-static") && !element.matches("h1, h2")
    );
    const directions = ["left", "right", "up", "down"];

    targets.forEach((target, index) => {
      target.classList.add(
        "site-motion",
        `site-motion--${directions[index % directions.length]}`
      );
      target.dataset.siteDepth = String(0.012 + (index % 5) * 0.004);
    });

    const show = (target) => target.classList.add("is-site-visible");
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) show(entry.target);
          });
        },
        { threshold: 0.08, rootMargin: "4% 0px -5% 0px" }
      );
      targets.forEach((target) => observer.observe(target));
    } else {
      targets.forEach(show);
    }

    let scheduled = false;
    const update = () => {
      const viewportCenter = window.innerHeight / 2;
      targets.forEach((target) => {
        const rect = target.getBoundingClientRect();
        if (rect.bottom < -300 || rect.top > window.innerHeight + 300) return;
        const depth = Number(target.dataset.siteDepth || 0.012);
        const distance = rect.top + rect.height / 2 - viewportCenter;
        const offset = Math.max(-26, Math.min(26, distance * depth));
        target.style.setProperty("--site-parallax-y", `${offset.toFixed(2)}px`);
      });
      scheduled = false;
    };

    const requestUpdate = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
  };

  const preparePeopleGallery = () => {
    const gallery = document.querySelector("[data-people-parallax-carousel]");
    if (!gallery) return;
    const cards = [...gallery.querySelectorAll(".people-card")];

    // Alinhamento perfeito e uniforme: elimina a oscilação senoidal e inclinação que causava desalinhamento visual
    cards.forEach((card) => {
      card.style.setProperty("--people-parallax", "0px");
      card.style.setProperty("--people-image-parallax", "0px");
      card.style.setProperty("--people-tilt", "0deg");
    });
  };

  const prepareFakeNewsGlitch = () => {
    const panels = unique([
      ...document.querySelectorAll(
        ".fact-check-section--dark .fact-check-grid"
      ),
      ...document.querySelectorAll(
        ".internal-page--fake-news .internal-hero__grid"
      ),
      ...document.querySelectorAll(
        ".internal-page--fake-news .dark-report-section .container"
      ),
    ]);

    panels.forEach((panel, index) => {
      panel.classList.add("fake-glitch-panel");

      const run = () => {
        panel.classList.remove("is-glitching");
        void panel.offsetWidth;
        panel.classList.add("is-glitching");
        window.setTimeout(() => panel.classList.remove("is-glitching"), 1300);
        window.setTimeout(run, 6200 + Math.random() * 6200 + index * 420);
      };

      window.setTimeout(run, 2500 + index * 950 + Math.random() * 1800);
    });
  };

  const prepareDetailsHashSync = () => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (!hash) return;
      const targetId = hash.replace(/^#/u, "");
      const details = document.getElementById(targetId);
      if (details && details.tagName === "DETAILS") {
        details.open = true;
        setTimeout(() => {
          details.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
  };

  const init = () => {
    prepareTypewriterTitles();
    prepareCountUpNumbers();
    prepareSiteMotion();
    preparePeopleGallery();
    prepareFakeNewsGlitch();
    prepareDetailsHashSync();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
