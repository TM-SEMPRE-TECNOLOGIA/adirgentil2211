(() => {
  "use strict";

  const clamp = (value, min = 0, max = 1) =>
    Math.min(max, Math.max(min, value));
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const hero = document.querySelector("[data-hero-wipe]");
  if (hero) {
    const indicators = [...hero.querySelectorAll(".hero-wipe__status span")];
    const stage = hero.querySelector(".hero-wipe__stage");
    let ticking = false;
    const updateHero = () => {
      const rect = hero.getBoundingClientRect();
      const travel = Math.max(
        1,
        hero.offsetHeight - (stage?.offsetHeight || window.innerHeight)
      );
      const progress = clamp(-rect.top / travel);
      let yellow;
      let green;
      let blue;
      if (reduceMotion) {
        yellow = progress < 0.34 ? 1 : 0;
        green = progress >= 0.34 && progress < 0.67 ? 1 : 0;
        blue = progress >= 0.67 ? 1 : 0;
      } else {
        yellow = progress < 0.14 ? 1 : 1 - clamp((progress - 0.14) / 0.08);
        green =
          progress < 0.28
            ? 0
            : progress < 0.36
            ? clamp((progress - 0.28) / 0.08)
            : progress <= 0.64
            ? 1
            : progress < 0.72
            ? 1 - clamp((progress - 0.64) / 0.08)
            : 0;
        blue = progress < 0.78 ? 0 : clamp((progress - 0.78) / 0.08);
      }
      const scene = progress < 0.25 ? 0 : progress < 0.75 ? 1 : 2;
      hero.style.setProperty("--scene-yellow", yellow.toFixed(3));
      hero.style.setProperty("--scene-green", green.toFixed(3));
      hero.style.setProperty("--scene-blue", blue.toFixed(3));
      if (hero.dataset.scene !== String(scene)) {
        hero.dataset.scene = String(scene);
        indicators.forEach((item, index) =>
          item.classList.toggle("is-active", index === scene)
        );
      }
      ticking = false;
    };
    const requestHeroUpdate = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHero);
        ticking = true;
      }
    };
    updateHero();
    window.addEventListener("scroll", requestHeroUpdate, { passive: true });
    window.addEventListener("resize", requestHeroUpdate);
  }

  const news = document.querySelector("[data-news-carousel]");
  if (news) {
    const track = news.querySelector(".news-carousel__track");
    const move = (direction) => {
      const card = track.querySelector(".news-card");
      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      track.scrollBy({
        left:
          direction *
          ((card?.getBoundingClientRect().width || track.clientWidth) + gap),
        behavior: reduceMotion ? "auto" : "smooth",
      });
    };
    document
      .querySelector("[data-news-prev]")
      ?.addEventListener("click", () => move(-1));
    document
      .querySelector("[data-news-next]")
      ?.addEventListener("click", () => move(1));
  }

  const whatsappSvg = () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "whatsapp-inline-icon");
    svg.setAttribute("viewBox", "0 0 32 32");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
      "d",
      "M16.04 3A12.8 12.8 0 0 0 5.1 22.45L3 30l7.76-2.03A12.82 12.82 0 1 0 16.04 3Zm0 2.56a10.25 10.25 0 0 1 8.72 15.65 10.25 10.25 0 0 1-13.57 4.18l-.55-.33-4.6 1.2 1.23-4.47-.36-.58A10.24 10.24 0 0 1 16.04 5.56Zm-5.1 4.63c-.25 0-.65.1-.99.47-.34.37-1.3 1.27-1.3 3.1s1.34 3.6 1.52 3.85c.19.25 2.62 4 6.36 5.61 3.14 1.35 3.78 1.08 4.46 1.01.68-.06 2.2-.9 2.51-1.77.31-.87.31-1.61.22-1.77-.09-.16-.34-.25-.71-.44-.37-.19-2.2-1.09-2.54-1.21-.34-.12-.59-.19-.84.19-.25.37-.96 1.21-1.18 1.46-.22.25-.43.28-.81.09-.37-.19-1.57-.58-3-1.85a11.2 11.2 0 0 1-2.08-2.59c-.22-.37-.02-.57.16-.76.17-.17.37-.44.56-.65.19-.22.25-.37.37-.62.12-.25.06-.47-.03-.65-.09-.19-.84-2.02-1.15-2.77-.3-.73-.61-.63-.84-.65h-.71Z"
    );
    svg.appendChild(path);
    return svg;
  };

  const skipTags = new Set(["SCRIPT", "STYLE", "SVG", "NOSCRIPT", "TEXTAREA"]);
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (
          !node.nodeValue.trim() ||
          skipTags.has(node.parentElement?.tagName) ||
          node.parentElement?.closest(".whatsapp-word")
        )
          return NodeFilter.FILTER_REJECT;
        return /Bolso\s?Zap|\bZap\b/i.test(node.nodeValue)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    }
  );
  const zapNodes = [];
  while (walker.nextNode()) zapNodes.push(walker.currentNode);
  zapNodes.forEach((node) => {
    const text = node.nodeValue;
    const regex = /(Bolso\s?Zap|\bZap\b)/gi;
    let match;
    let last = 0;
    const fragment = document.createDocumentFragment();
    while ((match = regex.exec(text))) {
      fragment.append(text.slice(last, match.index));
      const word = document.createElement("span");
      word.className = "whatsapp-word";
      word.append(match[0], whatsappSvg());
      fragment.append(word);
      last = regex.lastIndex;
    }
    fragment.append(text.slice(last));
    node.replaceWith(fragment);
  });
})();
