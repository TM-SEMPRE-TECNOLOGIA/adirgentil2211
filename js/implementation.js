(() => {
  "use strict";

  document.querySelectorAll(".share-material").forEach((button) => {
    button.addEventListener("click", async () => {
      const relativeUrl = button.dataset.shareUrl;
      if (!relativeUrl) return;
      const absoluteUrl = new URL(relativeUrl, window.location.origin).href;
      const title = button.dataset.shareTitle || "Material de campanha";

      if (navigator.share) {
        try {
          await navigator.share({ title, url: absoluteUrl });
          return;
        } catch (error) {
          if (error?.name === "AbortError") return;
        }
      }

      const download = document.createElement("a");
      download.href = relativeUrl;
      download.download = "";
      document.body.appendChild(download);
      download.click();
      download.remove();
    });
  });
})();
