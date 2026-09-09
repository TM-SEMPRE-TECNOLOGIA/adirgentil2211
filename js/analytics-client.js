/**
 * Telemetria & Analytics em Tempo Real — Campanha Oficial Adir Gentil 2211
 * Eventos de interacao observados no site, sem cookies invasivos.
 * Pageviews e IP sao registrados apenas pelo servidor para evitar duplicidade
 * e impedir que o navegador informe um endereco arbitrario.
 */
(function () {
  "use strict";

  const isMobile =
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768;
  const clientTz =
    Intl && Intl.DateTimeFormat
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "America/Sao_Paulo";

  function pushDataLayer(type, meta = {}) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: type,
      event_name: type,
      page_path: window.location.pathname,
      device_type: isMobile ? "mobile" : "desktop",
      client_timezone: clientTz,
      ...(meta || {}),
    });
  }

  function trackEvent(type, meta = {}) {
    const payload = {
      type: type || "event",
      page: window.location.pathname,
      device: isMobile ? "mobile" : "desktop",
      client_tz: clientTz,
      meta: meta || {},
    };

    // O mesmo evento alimenta o GTM e a telemetria interna. Dados pessoais,
    // e-mail e IP nunca sao enviados pelo navegador ao dataLayer.
    pushDataLayer(payload.type, payload.meta);

    const apiBase =
      window.__CAMPAIGN_API_BASE ||
      (window.location.port === "3001" || window.location.hostname === "localhost"
        ? "http://localhost:3005"
        : "");

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], {
          type: "application/json",
        });
        navigator.sendBeacon(`${apiBase}/api/analytics/track`, blob);
      } else {
        fetch(`${apiBase}/api/analytics/track`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(function () {});
      }
    } catch (_) {}
  }

  window.siteAnalytics = Object.freeze({ track: trackEvent });

  // O pageview interno e registrado pelo servidor. Este evento apenas deixa
  // a navegacao disponivel no GTM sem duplicar a telemetria proprietaria.
  pushDataLayer("site_page_view");

  // Intercepta cliques em conversoes, downloads e redes.
  document.addEventListener(
    "click",
    function (e) {
      const target = e.target.closest("a, button");
      if (!target) return;

      const href = target.getAttribute("href") || "";
      const trackAttr = target.getAttribute("data-track") || "";

      const explicitMeta = {
        origin: target.getAttribute("data-origin") || "",
        name: target.getAttribute("data-name") || "",
        category: target.getAttribute("data-category") || "",
        format: target.getAttribute("data-format") || "",
        href: href,
      };

      // Midias de campanha precisam manter o evento granular em vez de serem
      // absorvidas pelo rastreamento generico de arquivos.
      if (
        trackAttr === "download_jingle" ||
        trackAttr === "download_figurinha"
      ) {
        trackEvent(trackAttr, explicitMeta);
        return;
      }

      // 2.1. RASTREAMENTO UNIVERSAL DE DOWNLOADS DE MATERIAIS
      const isMaterialDownload =
        trackAttr === "download_material" ||
        trackAttr === "download_plano_governo" ||
        href.includes("materiais.adirgentil2211.com.br") ||
        href.startsWith("/downloads/") ||
        /\.(pdf|zip|ai|eps|jpg|jpeg|png|psd|mp3|wav|webp)(\?.*)?$/i.test(href);

      if (isMaterialDownload) {
        // Estes caminhos sao contabilizados no servidor quando o arquivo e
        // realmente solicitado. Enviar tambem aqui duplicaria o download.
        const serverTrackedDownload =
          href.startsWith("/downloads/") ||
          href.split("?")[0] === "/plano-integracao/plano-de-governo.pdf";
        if (serverTrackedDownload) return;

        const slug =
          target.getAttribute("data-slug") ||
          target.getAttribute("data-name") ||
          href
            .split("/")
            .pop()
            .split("?")[0]
            .replace(/\.[^/.]+$/, "");

        const title =
          target.getAttribute("data-title") ||
          (target.querySelector("strong")
            ? target.querySelector("strong").innerText.trim()
            : "") ||
          target.innerText.trim().slice(0, 80) ||
          slug;

        const category =
          target.getAttribute("data-category") ||
          target.getAttribute("data-type") ||
          (href.includes("plano")
            ? "Plano de Governo"
            : href.includes("logo")
            ? "Logotipos"
            : href.includes("foto")
            ? "Fotos Oficiais"
            : "Kit de Campanha");

        const format =
          target.getAttribute("data-format") ||
          (href.split(".").pop().split("?")[0] || "ARQUIVO").toUpperCase();

        trackEvent("download_material", {
          file_slug: slug,
          slug: slug,
          material: title,
          material_title: title,
          category: category,
          format: format,
          url: href,
        });
        return;
      }

      // Elementos com evento editorial explicito preservam o nome configurado.
      // Os eventos abaixo com significado comum continuam normalizados para os
      // indicadores de conversao do painel.
      // 2.2. WhatsApp
      if (
        href.includes("wa.me") ||
        href.includes("api.whatsapp.com") ||
        target.hasAttribute("data-share-whatsapp") ||
        href.includes("whatsapp")
      ) {
        const whatsappEvent = trackAttr.startsWith("share_")
          ? trackAttr
          : "whatsapp_click";
        trackEvent(whatsappEvent, {
          ...explicitMeta,
          text: target.innerText.trim().slice(0, 40),
        });
        return;
      }

      // 2.3. Doação / Contribua
      if (
        href === "/contribua" ||
        href.includes("contribua") ||
        target.hasAttribute("data-track-donation") ||
        target.innerText.toLowerCase().includes("doe agora") ||
        target.innerText.toLowerCase().includes("doação")
      ) {
        trackEvent("donation_click", explicitMeta);
        return;
      }

      // 2.4. Redes Sociais
      if (
        href.includes("instagram.com") ||
        href.includes("facebook.com") ||
        href.includes("youtube.com") ||
        href.includes("tiktok.com") ||
        href.includes("kwai.com") ||
        href.includes("x.com") ||
        href.includes("twitter.com")
      ) {
        trackEvent(
          trackAttr && trackAttr.startsWith("share_news_")
            ? trackAttr
            : "social_click",
          { ...explicitMeta, platform: href }
        );
        return;
      }

      if (trackAttr) trackEvent(trackAttr, explicitMeta);
    },
    { passive: true }
  );
})();
