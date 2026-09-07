(() => {
  "use strict";

  const librasTrigger = document.getElementById("a11yLibrasTrigger");
  const status = document.getElementById("a11yStatus");
  let librasInitialized = false;
  let librasOpen = false;

  const announce = (message) => {
    if (!status) return;
    status.textContent = "";
    window.setTimeout(() => {
      status.textContent = message;
    }, 20);
  };

  const initializeLibras = () => {
    return false;
  };

  window.addEventListener("load", initializeLibras, { once: true });

  const waitForLibras = () =>
    new Promise((resolve) => {
      let attempts = 0;
      const check = () => {
        initializeLibras();
        const officialButton = document.querySelector("[vw-access-button]");
        if (officialButton instanceof HTMLElement && librasInitialized) {
          resolve(officialButton);
          return;
        }
        attempts += 1;
        if (attempts >= 80) {
          resolve(null);
          return;
        }
        window.setTimeout(check, 100);
      };
      check();
    });

  librasTrigger?.addEventListener("click", async () => {
    librasTrigger.setAttribute("aria-busy", "true");
    librasTrigger.disabled = true;

    const officialButton = await waitForLibras();
    if (officialButton) {
      if (librasOpen) {
        const closeButton = document.querySelector(
          "[vw-plugin-wrapper] .vpw-header-btn-close"
        );
        if (closeButton instanceof HTMLElement) closeButton.click();
        else officialButton.click();
        librasOpen = false;
      } else {
        officialButton.click();
        librasOpen = true;
      }
      librasTrigger.setAttribute("aria-pressed", String(librasOpen));
      librasTrigger.classList.toggle("is-active", librasOpen);
      librasTrigger.setAttribute(
        "aria-label",
        `${librasOpen ? "Fechar" : "Abrir"} tradução em Libras`
      );
      announce(
        librasOpen
          ? "Tradutor em Libras aberto."
          : "Tradutor em Libras fechado."
      );
    } else {
      announce(
        "Não foi possível carregar o tradutor em Libras. Verifique a conexão e tente novamente."
      );
    }

    librasTrigger.disabled = false;
    librasTrigger.setAttribute("aria-busy", "false");
  });
})();
