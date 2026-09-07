(() => {
  "use strict";

  const checkbox = document.querySelector("#heroWhatsappOptin");
  const whatsappLink = document.querySelector("[data-whatsapp-optin]");

  if (checkbox && whatsappLink) {
    const destination = whatsappLink.dataset.optInHref;

    const syncOptIn = () => {
      const accepted = checkbox.checked;
      whatsappLink.classList.toggle("is-optin-locked", !accepted);
      whatsappLink.setAttribute("aria-disabled", String(!accepted));
      if (accepted) {
        whatsappLink.setAttribute("href", destination);
      } else {
        whatsappLink.removeAttribute("href");
      }
    };

    whatsappLink.addEventListener("click", (event) => {
      if (checkbox.checked) return;
      event.preventDefault();
      checkbox.focus();
    });

    checkbox.addEventListener("change", syncOptIn);
    syncOptIn();
  }
})();
