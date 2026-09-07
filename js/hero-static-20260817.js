(() => {
  const frame = document.querySelector("#planPackageFrame");
  if (frame) {
    const resizeFrame = () => {
      try {
        const documentHeight =
          frame.contentDocument?.documentElement?.scrollHeight;
        if (documentHeight) frame.style.height = `${documentHeight}px`;
      } catch (_error) {
        // O conteúdo é local e de mesma origem; o fallback CSS mantém a página utilizável.
      }
    };
    frame.addEventListener("load", resizeFrame);
    window.addEventListener("resize", resizeFrame, { passive: true });
    window.requestAnimationFrame(resizeFrame);
  }

  const items = [...document.querySelectorAll("[data-home-parallax]")];
  if (!items.length) return;

  let scheduled = false;
  const update = () => {
    const viewportCenter = window.innerHeight / 2;
    items.forEach((item) => {
      const depth = Number(item.dataset.homeParallax || 0);
      const rect = item.getBoundingClientRect();
      const distance = rect.top + rect.height / 2 - viewportCenter;
      const offset = Math.max(-28, Math.min(28, distance * depth));
      item.style.setProperty("--home-parallax-y", `${offset.toFixed(2)}px`);
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
})();
