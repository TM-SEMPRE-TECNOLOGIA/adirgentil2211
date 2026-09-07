(() => {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // Preloader moved to /js/preloader-wipe.js (isolated component).

  // MENU MOBILE
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const closeMenu = () => {
    mobileMenu?.classList.remove("open");
    document.body.classList.remove("menu-open");
    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-label", "Abrir menu");
  };

  menuToggle?.addEventListener("click", () => {
    const isOpen = mobileMenu?.classList.toggle("open");
    document.body.classList.toggle("menu-open", Boolean(isOpen));
    menuToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Fechar menu" : "Abrir menu"
    );
  });

  mobileMenu
    ?.querySelectorAll("a")
    .forEach((link) => link.addEventListener("click", closeMenu));

  // Pesquisa do header: painel interno do site, sem prompt/alert nativo do navegador.
  const searchToggle = document.querySelector(".search-toggle");
  const siteSearch = document.getElementById("siteSearch");
  const siteSearchForm = document.getElementById("siteSearchForm");
  const siteSearchInput = document.getElementById("siteSearchInput");
  const siteSearchResults = document.getElementById("siteSearchResults");
  const searchableSections = [
    ...document.querySelectorAll("main > section[id]"),
  ];

  const normalizeSearchText = (value = "") =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const getSectionLabel = (section) => {
    const heading = section.querySelector("h1, h2, h3");
    if (heading?.textContent?.trim()) return heading.textContent.trim();
    return section.id.replace(/-/g, " ");
  };

  const closeSearch = () => {
    if (!siteSearch) return;
    siteSearch.classList.remove("is-open");
    siteSearch.setAttribute("aria-hidden", "true");
    document.body.classList.remove("search-open");
    searchToggle?.setAttribute("aria-expanded", "false");
  };

  const openSearch = () => {
    if (!siteSearch) return;
    closeMenu();
    siteSearch.classList.add("is-open");
    siteSearch.setAttribute("aria-hidden", "false");
    document.body.classList.add("search-open");
    searchToggle?.setAttribute("aria-expanded", "true");
    window.setTimeout(() => siteSearchInput?.focus(), 80);
  };

  const renderSearchResults = (rawTerm) => {
    if (!siteSearchResults) return [];
    const term = normalizeSearchText(rawTerm.trim());
    if (term.length < 2) {
      siteSearchResults.innerHTML =
        '<p class="site-search__hint">Digite pelo menos 2 caracteres para pesquisar nas seções do site.</p>';
      return [];
    }

    const matches = searchableSections
      .filter((section) => {
        const haystack = normalizeSearchText(section.textContent || "");
        return haystack.includes(term);
      })
      .slice(0, 7);

    if (!matches.length) {
      siteSearchResults.innerHTML =
        '<p class="site-search__empty">Nenhum resultado encontrado. Tente outro termo.</p>';
      return [];
    }

    siteSearchResults.innerHTML = matches
      .map((section, index) => {
        const label = getSectionLabel(section);
        return `<a class="site-search__result" href="#${
          section.id
        }" data-search-result>
        <span class="site-search__result-index">${String(index + 1).padStart(
          2,
          "0"
        )}</span>
        <strong>${label}</strong>
        <span aria-hidden="true">→</span>
      </a>`;
      })
      .join("");

    siteSearchResults
      .querySelectorAll("[data-search-result]")
      .forEach((link) => {
        link.addEventListener("click", closeSearch, { once: true });
      });

    return matches;
  };

  searchToggle?.setAttribute("aria-expanded", "false");
  searchToggle?.addEventListener("click", openSearch);
  siteSearch
    ?.querySelectorAll("[data-search-close]")
    .forEach((button) => button.addEventListener("click", closeSearch));
  siteSearchInput?.addEventListener("input", () =>
    renderSearchResults(siteSearchInput.value)
  );
  siteSearchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const matches = renderSearchResults(siteSearchInput?.value || "");
    const first = matches[0];
    if (!first) return;
    closeSearch();
    first.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && siteSearch?.classList.contains("is-open"))
      closeSearch();
  });

  // ACCORDIONS
  document.querySelectorAll("[data-accordion]").forEach((group) => {
    group.querySelectorAll(".accordion-button").forEach((button) => {
      button.addEventListener("click", () => {
        const item = button.closest(".accordion-item");
        if (!item) return;
        const wasOpen = item.classList.contains("open");

        group.querySelectorAll(".accordion-item").forEach((other) => {
          other.classList.remove("open");
          other
            .querySelector(".accordion-button")
            ?.setAttribute("aria-expanded", "false");
        });

        if (!wasOpen) {
          item.classList.add("open");
          button.setAttribute("aria-expanded", "true");
        }
      });
    });
  });

  // TABS
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.tab;
      tabButtons.forEach((btn) => {
        const active = btn === button;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-selected", String(active));
      });
      tabPanels.forEach((panel) =>
        panel.classList.toggle("active", panel.dataset.panel === target)
      );
    });
  });

  // PROPOSAL CAROUSEL
  const proposalTrack = document.getElementById("proposalTrack");
  const proposalDots = document.querySelectorAll(
    ".proposal-stage .dot, .proposals .dot"
  );

  const scrollToProposalCard = (index) => {
    if (!proposalTrack) return;
    const cards = [...proposalTrack.querySelectorAll(".proposal-card")];
    if (!cards.length) return;
    const normalized = Math.max(0, Math.min(cards.length - 1, index));
    const card = cards[normalized];
    const targetLeft =
      card.offsetLeft - (proposalTrack.clientWidth - card.clientWidth) / 2;
    proposalTrack.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  proposalDots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      scrollToProposalCard(index);
    });
  });

  proposalTrack?.addEventListener(
    "scroll",
    () => {
      const cards = [...proposalTrack.querySelectorAll(".proposal-card")];
      if (!cards.length) return;
      const center = proposalTrack.scrollLeft + proposalTrack.clientWidth / 2;
      let closestIndex = 0;
      let closestDistance = Infinity;
      cards.forEach((card, i) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const d = Math.abs(cardCenter - center);
        if (d < closestDistance) {
          closestDistance = d;
          closestIndex = i;
        }
      });
      proposalDots.forEach((dot, i) =>
        dot.classList.toggle("active", i === closestIndex)
      );
    },
    { passive: true }
  );

  const proposalPrev = document.getElementById("proposalPrev");
  const proposalNext = document.getElementById("proposalNext");

  const getProposalIndex = () => {
    if (!proposalTrack) return 0;
    const cards = [...proposalTrack.querySelectorAll(".proposal-card")];
    if (!cards.length) return 0;
    const center = proposalTrack.scrollLeft + proposalTrack.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Infinity;
    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(cardCenter - center);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    return closestIndex;
  };

  const goToProposal = (index) => {
    const cards = proposalTrack
      ? [...proposalTrack.querySelectorAll(".proposal-card")]
      : [];
    if (!cards.length) return;
    const normalized = (index + cards.length) % cards.length;
    scrollToProposalCard(normalized);
  };

  proposalPrev?.addEventListener("click", () =>
    goToProposal(getProposalIndex() - 1)
  );
  proposalNext?.addEventListener("click", () =>
    goToProposal(getProposalIndex() + 1)
  );

  // REVEAL SYSTEM WITH STAGGER + ALTERNATING DIRECTION
  const revealItems = [...document.querySelectorAll(".reveal")];
  revealItems.forEach((item, index) => {
    item.style.setProperty(
      "--reveal-delay",
      `${Math.min((index % 5) * 55, 220)}ms`
    );
    if (!item.closest(".hero") && index % 4 === 1)
      item.classList.add("scroll-from-left");
    if (!item.closest(".hero") && index % 4 === 3)
      item.classList.add("scroll-from-right");
  });

  if (!reduceMotion && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("visible"));
  }

  // SCROLL PROGRESS + SECTION PARALLAX VARIABLES
  const siteHeader = document.querySelector(".site-header");
  const progressBar = document.getElementById("scrollProgress");
  const sections = [...document.querySelectorAll("main > section")];
  const heroCopy = document.querySelector(".hero-copy");
  let ticking = false;
  let previousScrollTop = window.scrollY || document.documentElement.scrollTop;
  let smoothedVelocity = 0;

  const clamp = (value, min = 0, max = 1) =>
    Math.min(max, Math.max(min, value));

  const updateScrollScene = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const documentHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const globalProgress =
      documentHeight > 0 ? (scrollTop / documentHeight) * 100 : 0;
    const normalizedProgress = Math.max(0, Math.min(1, globalProgress / 100));
    const rawVelocity = Math.min(18, Math.abs(scrollTop - previousScrollTop));
    smoothedVelocity += (rawVelocity - smoothedVelocity) * 0.18;
    previousScrollTop = scrollTop;

    document.documentElement.style.setProperty(
      "--scroll-progress",
      `${globalProgress}%`
    );
    document.documentElement.style.setProperty(
      "--brand-sp",
      normalizedProgress.toFixed(4)
    );
    document.documentElement.style.setProperty(
      "--brand-velocity",
      smoothedVelocity.toFixed(3)
    );
    if (progressBar) progressBar.style.width = `${globalProgress}%`;

    siteHeader?.classList.toggle("is-scrolled", scrollTop > 22);

    if (!reduceMotion) {
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const visibleRange = window.innerHeight + rect.height;
        const progress = clamp((window.innerHeight - rect.top) / visibleRange);
        section.style.setProperty("--section-progress", progress.toFixed(4));
      });

      if (heroCopy && scrollTop < window.innerHeight * 1.25) {
        const heroProgress = clamp(scrollTop / Math.max(1, window.innerHeight));
        heroCopy.style.transform = `translate3d(0, ${heroProgress * -22}px, 0)`;
      }
    }

    ticking = false;
  };

  const requestScrollUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateScrollScene);
  };

  updateScrollScene();
  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate, { passive: true });

  // MOUSE PARALLAX JUST ON HERO (very subtle)
  const hero = document.querySelector(".hero");
  const victoryV = document.querySelector(".victory-v");
  const canPointerParallax =
    !reduceMotion &&
    window.matchMedia("(hover:hover) and (pointer:fine)").matches;
  if (hero && canPointerParallax) {
    hero.addEventListener(
      "pointermove",
      (event) => {
        const rect = hero.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        if (victoryV) victoryV.style.translate = `${x * 18}px ${y * 10}px`;
      },
      { passive: true }
    );

    hero.addEventListener("pointerleave", () => {
      if (victoryV) victoryV.style.translate = "";
    });
  }

  // FORM DEMO
  document
    .getElementById("volunteerForm")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();
      const button = event.currentTarget.querySelector("button");
      if (!button) return;
      const original = button.textContent;
      button.textContent = "Enviado";
      button.disabled = true;
      setTimeout(() => {
        button.textContent = original;
        button.disabled = false;
      }, 1500);
      event.currentTarget.reset();
    });
})();
