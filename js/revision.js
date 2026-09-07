(() => {
  "use strict";

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---------------------------------------------------------------
     Carrossel de propostas: drag nativo por mouse / pointer.
     Mantém scroll-snap, dots e teclado já existentes.
     --------------------------------------------------------------- */
  const track = document.getElementById("proposalTrack");
  if (track) {
    let pointerId = null;
    let startX = 0;
    let startScroll = 0;
    let moved = false;

    const finishDrag = () => {
      if (pointerId !== null) {
        try {
          track.releasePointerCapture(pointerId);
        } catch (_) {}
      }
      pointerId = null;
      track.classList.remove("is-dragging");

      if (!moved) return;
      const cards = [...track.querySelectorAll(".proposal-card")];
      if (!cards.length) return;
      const center = track.scrollLeft + track.clientWidth / 2;
      let closest = cards[0];
      let distance = Infinity;
      cards.forEach((card) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const d = Math.abs(cardCenter - center);
        if (d < distance) {
          distance = d;
          closest = card;
        }
      });
      requestAnimationFrame(() => {
        const targetScrollLeft =
          closest.offsetLeft - (track.clientWidth - closest.clientWidth) / 2;
        track.scrollTo({
          left: Math.max(0, targetScrollLeft),
          behavior: reduceMotion ? "auto" : "smooth",
        });
      });
    };

    track.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startScroll = track.scrollLeft;
      moved = false;
      /* NÃO capturar aqui: o pointer capture antecipado desvia o evento
         de 'click' do <a> interno para o track, quebrando a navegação.
         A captura é feita no pointermove, só quando o arrasto confirmar. */
    });

    track.addEventListener("pointermove", (event) => {
      if (event.pointerId !== pointerId) return;
      const delta = event.clientX - startX;
      if (Math.abs(delta) > 5) {
        if (!moved) {
          /* Capturar só aqui, quando o arrasto é confirmado. */
          track.setPointerCapture?.(pointerId);
        }
        moved = true;
        track.classList.add("is-dragging");
      }
      if (!moved) return;
      event.preventDefault();
      track.scrollLeft = startScroll - delta * 1.08;
    });

    track.addEventListener("pointerup", (event) => {
      if (event.pointerId !== pointerId) return;
      const wasMoved = moved;
      finishDrag();
      /* Se não houve drag, deixa o evento de click propagar normalmente
         para que links dentro dos cards funcionem */
      if (!wasMoved) return;
    });
    track.addEventListener("pointercancel", finishDrag);
    track.addEventListener("lostpointercapture", () => {
      pointerId = null;
      track.classList.remove("is-dragging");
    });

    track.addEventListener(
      "click",
      (event) => {
        if (!moved) return;
        event.preventDefault();
        event.stopPropagation();
        moved = false;
      },
      true
    );
  }

  /* ---------------------------------------------------------------
     Marca animada: mesma lógica visual do preloader.
     Header roda quando o preloader some; footer ao entrar na viewport.
     --------------------------------------------------------------- */
  const brands = [...document.querySelectorAll("[data-animated-brand]")];

  const playBrand = (brand) => {
    if (!brand || brand.dataset.brandPlayed === "1") return;
    brand.dataset.brandPlayed = "1";
    if (reduceMotion) {
      brand.classList.add("is-complete");
      return;
    }

    brand.classList.remove("is-complete");
    brand.classList.add("is-animating");
    window.setTimeout(() => {
      brand.classList.remove("is-animating");
      brand.classList.add("is-complete");
    }, 1500);
  };

  const headerBrand = brands.find(
    (brand) => brand.dataset.animatedBrand === "header"
  );
  const footerBrand = brands.find(
    (brand) => brand.dataset.animatedBrand === "footer"
  );

  const startHeaderBrand = () =>
    window.setTimeout(() => playBrand(headerBrand), 140);
  if (headerBrand) {
    const intro = document.getElementById("siteIntro");
    if (!intro) {
      startHeaderBrand();
    } else {
      const observer = new MutationObserver(() => {
        if (document.getElementById("siteIntro")) return;
        observer.disconnect();
        startHeaderBrand();
      });
      observer.observe(document.body, { childList: true });
    }
  }

  if (footerBrand) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      playBrand(footerBrand);
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          playBrand(footerBrand);
          observer.disconnect();
        },
        { threshold: 0.35 }
      );
      observer.observe(footerBrand);
    }
  }
})();
