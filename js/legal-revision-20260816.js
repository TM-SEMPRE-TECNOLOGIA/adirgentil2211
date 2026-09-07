(() => {
  "use strict";

  const newsTabs = [...document.querySelectorAll(".news-toolbar [data-tab]")];
  const newsPanels = [...document.querySelectorAll(".tab-panel[data-panel]")];
  const activateNewsPanel = (target) => {
    newsTabs.forEach((button) => {
      const active = button.dataset.tab === target;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    newsPanels.forEach((panel) =>
      panel.classList.toggle("active", panel.dataset.panel === target)
    );
  };
  newsTabs.forEach((button) =>
    button.addEventListener("click", () =>
      activateNewsPanel(button.dataset.tab)
    )
  );
  const newsHash = window.location.hash.slice(1);
  if (newsPanels.some((panel) => panel.dataset.panel === newsHash))
    activateNewsPanel(newsHash);

  const consentKey = "flavio22-cookie-consent-v1";
  const banner = document.getElementById("cookieConsent");
  const dialog = document.getElementById("cookieDialog");
  const manage = document.getElementById("cookieManage");
  if (!banner || !dialog || !manage) return;

  const inputs = {
    performance: dialog.querySelector('[name="performance"]'),
    preferences: dialog.querySelector('[name="preferences"]'),
    marketing: dialog.querySelector('[name="marketing"]'),
  };

  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(consentKey) || "null");
    } catch {
      return null;
    }
  };
  const write = (value) => {
    localStorage.setItem(
      consentKey,
      JSON.stringify({
        necessary: true,
        ...value,
        updatedAt: new Date().toISOString(),
      })
    );
    banner.hidden = true;
    dialog.close();
  };
  const fill = () => {
    const value = read() || {};
    Object.entries(inputs).forEach(([key, input]) => {
      input.checked = Boolean(value[key]);
    });
  };

  banner.hidden = Boolean(read());
  manage.addEventListener("click", () => {
    fill();
    dialog.showModal();
  });
  document.querySelectorAll("[data-cookie-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.cookieAction;
      if (action === "customize") {
        fill();
        dialog.showModal();
      }
      if (action === "accept")
        write({ performance: true, preferences: true, marketing: true });
      if (action === "reject")
        write({ performance: false, preferences: false, marketing: false });
      if (action === "save")
        write(
          Object.fromEntries(
            Object.entries(inputs).map(([key, input]) => [key, input.checked])
          )
        );
    });
  });
})();
