(() => {
  const configElement = document.getElementById("siteCmsConfig");
  if (!configElement) return;

  let config = { pageKey: "", sections: [], fields: {} };
  try {
    config = JSON.parse(configElement.textContent || "{}");
  } catch (_) {
    return;
  }

  const editorMode =
    new URLSearchParams(window.location.search).get("cms_editor") === "1";
  const normalizeKey = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "secao";
  const sectionConfig = new Map(
    (config.sections || []).map((item) => [item.key, item])
  );
  const discoveredSections = [];
  const discoveredFields = [];
  const keyCounts = new Map();

  const uniqueSectionKey = (element, index, fixedKey = "") => {
    const base = normalizeKey(
      fixedKey ||
        element.id ||
        [...element.classList].find(
          (name) => !["reveal", "is-visible", "active"].includes(name)
        ) ||
        `secao-${index + 1}`
    );
    const count = (keyCounts.get(base) || 0) + 1;
    keyCounts.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  };

  const main = document.querySelector("main");
  const regions = [];
  const header = document.querySelector("body > header, .site-header");
  const footer = document.querySelector("body > footer, .site-footer");
  if (header)
    regions.push({ element: header, key: "site-header", locked: true });
  if (main) {
    [...main.children]
      .filter(
        (element) => !["SCRIPT", "STYLE", "TEMPLATE"].includes(element.tagName)
      )
      .forEach((element) => regions.push({ element, key: "", locked: false }));
  }
  if (footer)
    regions.push({ element: footer, key: "site-footer", locked: true });

  regions.forEach((region, index) => {
    const element = region.element;
    const key = uniqueSectionKey(element, index, region.key);
    const saved = sectionConfig.get(key);
    const heading = element.querySelector("h1, h2, h3");
    const label =
      (saved && saved.label) ||
      (heading && heading.textContent.trim().slice(0, 80)) ||
      element.id ||
      key.replace(/-/g, " ");
    element.dataset.cmsSection = key;
    element.dataset.cmsSectionLabel = label;
    if (saved && saved.visible === false) {
      element.hidden = true;
      element.dataset.cmsHidden = "true";
    }
    if (saved && saved.backgroundImage) {
      element.style.backgroundImage = `url("${String(
        saved.backgroundImage
      ).replace(/["\\]/g, "\\$&")}")`;
      element.style.backgroundSize = "cover";
      element.style.backgroundPosition = "center";
    }
    discoveredSections.push({
      key,
      label,
      visible: !(saved && saved.visible === false),
      locked: region.locked,
      element,
    });
  });

  if (main && Array.isArray(config.sections) && config.sections.length) {
    const movable = discoveredSections.filter(
      (section) => !section.locked && section.element.parentElement === main
    );
    const byKey = new Map(
      movable.map((section) => [section.key, section.element])
    );
    config.sections.forEach((section) => {
      const element = byKey.get(section.key);
      if (element) main.appendChild(element);
    });
    movable.forEach((section) => {
      if (!config.sections.some((item) => item.key === section.key))
        main.appendChild(section.element);
    });
  }

  const textSelector =
    "h1,h2,h3,h4,h5,h6,p,small,label,button,a,li,figcaption,blockquote,span,strong";
  discoveredSections.forEach((section) => {
    let textIndex = 0;
    let imageIndex = 0;
    let linkIndex = 0;
    let embedIndex = 0;

    const textNodes = section.element.matches(textSelector)
      ? [section.element, ...section.element.querySelectorAll(textSelector)]
      : [...section.element.querySelectorAll(textSelector)];
    textNodes.forEach((node) => {
      if (
        node.closest("script,style,[aria-hidden='true'],[data-cms-ignore]") ||
        node.classList.contains("sr-only")
      )
        return;
      const hasElementContent = [...node.children].some(
        (child) => child.tagName !== "BR"
      );
      const value = node.textContent.trim();
      if (!value || hasElementContent) return;
      const id = `${section.key}:text:${textIndex++}`;
      node.dataset.cmsNode = id;
      node.dataset.cmsType = "text";
      const saved = config.fields && config.fields[id];
      if (saved && saved.type === "text") node.textContent = saved.value;
      discoveredFields.push({
        id,
        type: "text",
        element: node,
        sectionKey: section.key,
      });
    });

    section.element.querySelectorAll("img").forEach((node) => {
      if (node.closest("[data-cms-ignore]")) return;
      const id = `${section.key}:image:${imageIndex++}`;
      node.dataset.cmsNode = id;
      node.dataset.cmsType = "image";
      const saved = config.fields && config.fields[id];
      if (saved && saved.type === "image") {
        if (saved.src) node.src = saved.src;
        node.alt = saved.alt || "";
      }
      discoveredFields.push({
        id,
        type: "image",
        element: node,
        sectionKey: section.key,
      });
    });

    const links = section.element.matches("a[href]")
      ? [section.element, ...section.element.querySelectorAll("a[href]")]
      : [...section.element.querySelectorAll("a[href]")];
    links.forEach((node) => {
      if (node.closest("[data-cms-ignore]")) return;
      const id = `${section.key}:link:${linkIndex++}`;
      node.dataset.cmsLink = id;
      const saved = config.fields && config.fields[id];
      if (saved && saved.type === "link" && saved.href)
        node.setAttribute("href", saved.href);
      discoveredFields.push({
        id,
        type: "link",
        element: node,
        sectionKey: section.key,
      });
    });

    const embeds = section.element.matches("iframe")
      ? [section.element]
      : [...section.element.querySelectorAll("iframe")];
    embeds.forEach((node) => {
      const id = `${section.key}:embed:${embedIndex++}`;
      node.dataset.cmsNode = id;
      node.dataset.cmsType = "embed";
      const saved = config.fields && config.fields[id];
      if (saved && saved.type === "embed" && saved.src) node.src = saved.src;
      discoveredFields.push({
        id,
        type: "embed",
        element: node,
        sectionKey: section.key,
      });
    });
  });

  if (editorMode) {
    document.documentElement.classList.add("cms-editor-preview");
    const style = document.createElement("style");
    style.textContent = `
      .cms-editor-preview [data-cms-node], .cms-editor-preview [data-cms-link] { cursor: pointer !important; }
      .cms-editor-preview [data-cms-node]:hover, .cms-editor-preview [data-cms-link]:hover { outline: 2px dashed #ffcb05 !important; outline-offset: 3px !important; }
      .cms-editor-preview [data-cms-section].cms-section-selected { outline: 4px solid #12b24b !important; outline-offset: -4px !important; }
      .cms-editor-preview [data-cms-node].cms-node-selected, .cms-editor-preview [data-cms-link].cms-node-selected { outline: 3px solid #ffcb05 !important; outline-offset: 3px !important; }
      .cms-editor-preview [data-cms-hidden='true'] { display: block !important; opacity: .24 !important; filter: grayscale(1); }
    `;
    document.head.appendChild(style);
  }

  window.SiteCMS = {
    config,
    sections: discoveredSections,
    fields: discoveredFields,
    findField(id) {
      return discoveredFields.find((field) => field.id === id) || null;
    },
    setSectionOrder(keys) {
      if (!main) return;
      const byKey = new Map(
        discoveredSections
          .filter((section) => !section.locked)
          .map((section) => [section.key, section.element])
      );
      keys.forEach((key) => {
        const element = byKey.get(key);
        if (element) main.appendChild(element);
      });
    },
    setSectionVisibility(key, visible) {
      const section = discoveredSections.find((item) => item.key === key);
      if (!section || section.locked) return;
      section.visible = visible;
      section.element.hidden = !visible;
      section.element.dataset.cmsHidden = visible ? "false" : "true";
    },
  };

  window.dispatchEvent(
    new CustomEvent("sitecmsready", { detail: { pageKey: config.pageKey } })
  );
  if (window.parent !== window)
    window.parent.postMessage(
      { type: "site-cms-ready", pageKey: config.pageKey },
      window.location.origin
    );
})();
