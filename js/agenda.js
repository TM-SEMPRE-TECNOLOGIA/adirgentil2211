/**
 * Scripts de Interatividade e Métricas da Agenda Oficial
 * Flávio Bolsonaro Presidente 22
 */

(function () {
  "use strict";

  function pushAnalytics(eventName, eventData = {}) {
    if (
      window.siteAnalytics &&
      typeof window.siteAnalytics.track === "function"
    ) {
      window.siteAnalytics.track(eventName, eventData);
      return;
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      ...eventData,
    });
  }

  // Registra visualização da página da agenda se estivermos nela
  if (window.location.pathname === "/agenda") {
    pushAnalytics("agenda_view");
  } else if (window.location.pathname.startsWith("/agenda/")) {
    const slug = window.location.pathname.replace("/agenda/", "");
    pushAnalytics("agenda_event_view", { event_slug: slug });
  }

  document.addEventListener("DOMContentLoaded", function () {
    // 1. Controle de Dropdowns "Adicionar à Agenda"
    const dropdownToggles = document.querySelectorAll("[data-cal-toggle]");
    dropdownToggles.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const parent = btn.closest(".agenda-cal-dropdown");
        if (!parent) return;
        const menu = parent.querySelector(".agenda-cal-menu");
        if (!menu) return;

        const isCurrentlyOpen = menu.classList.contains("is-open");
        // Fecha todos os outros abertos
        document
          .querySelectorAll(".agenda-cal-menu.is-open")
          .forEach(function (m) {
            m.classList.remove("is-open");
          });

        if (!isCurrentlyOpen) {
          menu.classList.add("is-open");
        }
      });
    });

    // Fecha dropdown ao clicar fora
    document.addEventListener("click", function () {
      document
        .querySelectorAll(".agenda-cal-menu.is-open")
        .forEach(function (m) {
          m.classList.remove("is-open");
        });
    });

    // 2. Tracking de cliques em "Adicionar ao Calendário"
    const calLinks = document.querySelectorAll("[data-track-calendar]");
    calLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        const calType = link.getAttribute("data-track-calendar");
        const eventTitle = link.getAttribute("data-event-title") || "";
        pushAnalytics("agenda_add_calendar", {
          calendar_type: calType,
          event_title: eventTitle,
        });
      });
    });

    // 3. Compartilhamento no WhatsApp
    const shareBtns = document.querySelectorAll("[data-share-whatsapp]");
    shareBtns.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        const url = btn.getAttribute("data-event-url") || window.location.href;
        const city = btn.getAttribute("data-event-city") || "sua região";
        const text = `Confira este compromisso da agenda oficial de Adir Gentil 2211 em ${city}: ${url}`;
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
          text
        )}`;

        pushAnalytics("agenda_share_whatsapp", {
          event_city: city,
        });

        window.open(waUrl, "_blank", "noopener,noreferrer");
      });
    });

    // 4. Filtros da Página /agenda
    const stateSelect = document.getElementById("agendaStateFilter");
    const periodTabs = document.querySelectorAll("[data-agenda-period]");
    const eventCards = document.querySelectorAll("[data-event-card]");
    const emptyNotice = document.getElementById("agendaFilterEmpty");

    function applyFilters() {
      if (!stateSelect && periodTabs.length === 0) return;

      const selectedState = stateSelect ? stateSelect.value : "ALL";
      let selectedPeriod = "all";
      periodTabs.forEach(function (tab) {
        if (tab.classList.contains("is-active")) {
          selectedPeriod = tab.getAttribute("data-agenda-period");
        }
      });

      let visibleCount = 0;

      eventCards.forEach(function (card) {
        const cardState = card.getAttribute("data-state") || "";
        const cardPeriod = card.getAttribute("data-period") || "";

        const matchState =
          selectedState === "ALL" ||
          cardState.toUpperCase() === selectedState.toUpperCase();
        const matchPeriod =
          selectedPeriod === "all" || cardPeriod === selectedPeriod;

        if (matchState && matchPeriod) {
          card.style.display = "";
          visibleCount++;
        } else {
          card.style.display = "none";
        }
      });

      if (emptyNotice) {
        emptyNotice.style.display = visibleCount === 0 ? "block" : "none";
      }
    }

    if (stateSelect) {
      stateSelect.addEventListener("change", applyFilters);
    }

    periodTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        periodTabs.forEach(function (t) {
          t.classList.remove("is-active");
        });
        tab.classList.add("is-active");
        applyFilters();
      });
    });
  });
})();
