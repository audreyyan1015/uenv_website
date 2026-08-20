(function () {
  "use strict";

  const FALLBACK_PAGES = [
    {
      slug: "overview",
      id: "overview",
      title: "UEnv 文档",
      section: "了解 UEnv",
      subsection: "概览",
    },
  ];
  const FALLBACK_ALIASES = {
    "quick-start": "basic-deployment",
    "data-flow": "episode-lifecycle",
    "uenv-bridge": "integration",
    "uenv-adapter": "server",
    "uenv-server": "server",
    "uenv-worker": "worker-registration",
    "uenv-hub": "hub",
    adapter: "server",
    "integration-openhands": "integration",
    "case-trajectory-swe": "trajectory",
  };

  const menuButton = document.getElementById("menuButton");
  const sidebar = document.getElementById("sidebar");
  const sidebarBackdrop = document.getElementById("sidebarBackdrop");
  const searchButton = document.getElementById("searchButton");
  const searchCloseButton = document.getElementById("searchCloseButton");
  const searchDialog = document.getElementById("searchDialog");
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");
  const breadcrumbSection = document.getElementById("breadcrumbSection");
  const breadcrumbSubsection = document.getElementById("breadcrumbSubsection");
  const breadcrumbCurrent = document.getElementById("breadcrumbCurrent");
  const pagePagination = document.getElementById("pagePagination");
  const tocNav = document.getElementById("tocNav");
  const inlineTocNav = document.getElementById("inlineTocNav");
  const sections = Array.from(document.querySelectorAll(".doc-section[id]"));
  const sectionIds = new Set(sections.map((section) => section.id));

  function sanitizePages(value) {
    if (!Array.isArray(value)) return [];
    const seenSlugs = new Set();
    const seenIds = new Set();
    return value.flatMap((page) => {
      if (!page || typeof page !== "object") return [];
      const slug = typeof page.slug === "string" ? page.slug.trim() : "";
      const id = typeof page.id === "string" ? page.id.trim() : slug;
      const title = typeof page.title === "string" ? page.title.trim() : "";
      const section = typeof page.section === "string" ? page.section.trim() : "文档";
      const subsection = typeof page.subsection === "string"
        ? page.subsection.trim()
        : "内容";
      if (!slug || !id || !title || seenSlugs.has(slug) || seenIds.has(id)) return [];
      seenSlugs.add(slug);
      seenIds.add(id);
      return [{ slug, id, title, section, subsection, source: page.source }];
    });
  }

  function sanitizeAliases(value) {
    const result = new Map(Object.entries(FALLBACK_ALIASES));
    if (!value || typeof value !== "object" || Array.isArray(value)) return result;
    Object.entries(value).forEach(([alias, target]) => {
      if (typeof alias === "string" && typeof target === "string" && alias && target) {
        result.set(alias, target);
      }
    });
    return result;
  }

  const injectedPages = sanitizePages(window.__UENV_DOC_PAGES__);
  const PAGE_DEFS = (injectedPages.length ? injectedPages : FALLBACK_PAGES)
    .filter((page) => sectionIds.has(page.id));
  if (!PAGE_DEFS.length) return;

  const PAGE_ALIASES = sanitizeAliases(window.__UENV_DOC_ALIASES__);
  const pageBySlug = new Map(PAGE_DEFS.map((page) => [page.slug, page]));
  const pageById = new Map(PAGE_DEFS.map((page) => [page.id, page]));
  const sidebarLinks = Array.from(document.querySelectorAll(".sidebar-link"));
  const sidebarGroups = Array.from(document.querySelectorAll("details.sidebar-section"));
  const topnavLinks = Array.from(document.querySelectorAll(".topnav-link"));

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function decodedHash() {
    const raw = window.location.hash.slice(1);
    if (!raw) return "";
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }

  function pageUrl(page, hash = "") {
    const base = page.slug === "overview" ? "./" : `?page=${encodeURIComponent(page.slug)}`;
    return hash ? `${base}#${encodeURIComponent(hash)}` : base;
  }

  function pageFromLink(link) {
    try {
      const url = new URL(link.href, window.location.href);
      const requested = url.searchParams.get("page") || "overview";
      return pageBySlug.get(PAGE_ALIASES.get(requested) || requested);
    } catch {
      return undefined;
    }
  }

  function pageContainingHash(hash) {
    if (!hash) return undefined;
    const direct = pageById.get(hash) || pageBySlug.get(PAGE_ALIASES.get(hash) || hash);
    if (direct) return direct;
    const target = document.getElementById(hash);
    const containingSection = target?.closest(".doc-section[id]");
    return containingSection ? pageById.get(containingSection.id) : undefined;
  }

  const params = new URLSearchParams(window.location.search);
  const requestedSlug = params.get("page");
  const normalizedSlug = PAGE_ALIASES.get(requestedSlug) || requestedSlug;
  const hash = decodedHash();
  const canonicalHash = PAGE_ALIASES.has(hash) ? "" : hash;
  const hashPage = pageContainingHash(hash);
  const currentPage = pageBySlug.get(normalizedSlug)
    || hashPage
    || pageBySlug.get("overview")
    || PAGE_DEFS[0];
  const currentIndex = PAGE_DEFS.indexOf(currentPage);
  const currentSection = document.getElementById(currentPage.id);
  if (!currentSection) return;

  if (
    (requestedSlug && normalizedSlug !== requestedSlug)
    || (requestedSlug && !pageBySlug.has(normalizedSlug))
  ) {
    window.history.replaceState(null, "", pageUrl(currentPage, canonicalHash));
  } else if (!requestedSlug && hashPage && hashPage.slug !== "overview") {
    window.history.replaceState(
      null,
      "",
      pageUrl(hashPage, canonicalHash === hashPage.id ? "" : canonicalHash),
    );
  }

  document.title = `UEnv 文档 — ${currentPage.title}`;
  if (breadcrumbSection) breadcrumbSection.textContent = currentPage.section;
  if (breadcrumbSubsection) breadcrumbSubsection.textContent = currentPage.subsection;
  if (breadcrumbCurrent) breadcrumbCurrent.textContent = currentPage.title;

  sections.forEach((section) => {
    const isCurrent = section.id === currentPage.id;
    section.hidden = !isCurrent;
    section.classList.toggle("is-current-page", isCurrent);
  });

  let activeSidebarLink;
  sidebarLinks.forEach((link) => {
    const isCurrent = pageFromLink(link)?.slug === currentPage.slug;
    link.classList.toggle("active", isCurrent);
    if (isCurrent) {
      link.setAttribute("aria-current", "page");
      activeSidebarLink = link;
    } else {
      link.removeAttribute("aria-current");
    }
  });

  const currentSidebarGroup = activeSidebarLink?.closest("details.sidebar-section");
  sidebarGroups.forEach((group) => {
    group.open = group === currentSidebarGroup;
    group.addEventListener("toggle", () => {
      if (!group.open) return;
      sidebarGroups.forEach((other) => {
        if (other !== group) other.open = false;
      });
    });
  });

  topnavLinks.forEach((link) => {
    const isCurrent = link.dataset.section === currentPage.section;
    link.classList.toggle("active", isCurrent);
    if (isCurrent) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  function revealActiveSidebarLink(behavior = "auto") {
    if (!sidebar || !activeSidebarLink) return;
    const targetTop = activeSidebarLink.offsetTop
      - (sidebar.clientHeight / 2)
      + (activeSidebarLink.offsetHeight / 2);
    sidebar.scrollTo({ top: Math.max(0, targetTop), behavior });
  }

  function renderPagination() {
    if (!pagePagination) return;
    const previous = PAGE_DEFS[currentIndex - 1];
    const next = PAGE_DEFS[currentIndex + 1];
    const previousLink = previous
      ? `<a class="page-pagination-link previous" href="${pageUrl(previous)}"><span>上一页 · ${escapeHtml(previous.section)} / ${escapeHtml(previous.subsection)}</span><strong>← ${escapeHtml(previous.title)}</strong></a>`
      : '<span class="page-pagination-spacer" aria-hidden="true"></span>';
    const nextLink = next
      ? `<a class="page-pagination-link next" href="${pageUrl(next)}"><span>下一页 · ${escapeHtml(next.section)} / ${escapeHtml(next.subsection)}</span><strong>${escapeHtml(next.title)} →</strong></a>`
      : '<span class="page-pagination-spacer" aria-hidden="true"></span>';
    pagePagination.innerHTML = `${previousLink}<span class="page-pagination-count">${currentIndex + 1} / ${PAGE_DEFS.length}</span>${nextLink}`;
  }

  let tocObserver;
  const tocContainers = [tocNav, inlineTocNav].filter(Boolean);

  function setActiveToc(id) {
    tocContainers.forEach((container) => {
      container.querySelectorAll("a").forEach((link) => {
        const isActive = link.dataset.target === id;
        link.classList.toggle("active", isActive);
        if (isActive) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    });
  }

  function renderToc() {
    const headings = Array.from(currentSection.querySelectorAll("h2, h3, h4"));
    const links = headings.length
      ? headings.map((heading, index) => {
        if (!heading.id) heading.id = `${currentPage.id}-heading-${index + 1}`;
        const level = /^H[2-4]$/.test(heading.tagName) ? heading.tagName.slice(1) : "2";
        return `<a class="toc-level-${level}${index === 0 ? " active" : ""}" data-target="${escapeHtml(heading.id)}" href="#${encodeURIComponent(heading.id)}">${escapeHtml(heading.textContent.trim())}</a>`;
      }).join("")
      : `<a class="active" data-target="${escapeHtml(currentPage.id)}" href="#${encodeURIComponent(currentPage.id)}">${escapeHtml(currentPage.title)}</a>`;

    tocContainers.forEach((container) => {
      container.innerHTML = links;
      container.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => setActiveToc(link.dataset.target));
      });
    });

    if (headings.length && "IntersectionObserver" in window) {
      tocObserver?.disconnect();
      tocObserver = new IntersectionObserver((entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveToc(visible[0].target.id);
      }, { rootMargin: "-92px 0px -68%", threshold: 0 });
      headings.forEach((heading) => tocObserver.observe(heading));
    }
  }

  function scrollToHash() {
    if (!hash) return;
    const target = document.getElementById(canonicalHash);
    if (!target || !currentSection.contains(target)) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      target.scrollIntoView({ block: "start", behavior: "auto" });
      setActiveToc(target.id);
    }));
  }

  function loadMermaidRuntime() {
    if (window.mermaid?.initialize && window.mermaid?.render) {
      return Promise.resolve(window.mermaid);
    }
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-uenv-mermaid-runtime]');
      if (existing) {
        existing.addEventListener("load", () => resolve(window.mermaid), { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = "./mermaid.min.js";
      script.dataset.uenvMermaidRuntime = "true";
      script.addEventListener("load", () => resolve(window.mermaid), { once: true });
      script.addEventListener("error", reject, { once: true });
      document.head.appendChild(script);
    });
  }

  async function renderMermaidDiagrams() {
    const diagrams = Array.from(currentSection.querySelectorAll(".mermaid[data-mermaid-pending]"));
    if (!diagrams.length) return;
    let runtime;
    try {
      runtime = await loadMermaidRuntime();
    } catch {
      diagrams.forEach((diagram) => diagram.classList.add("is-fallback"));
      return;
    }
    if (!runtime?.initialize || !runtime?.render) {
      diagrams.forEach((diagram) => diagram.classList.add("is-fallback"));
      return;
    }

    runtime.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      suppressErrorRendering: true,
      theme: "neutral",
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
    });

    for (const [index, diagram] of diagrams.entries()) {
      const source = diagram.textContent.trim();
      try {
        const result = await runtime.render(`uenv-mermaid-${currentPage.id}-${index + 1}`, source);
        diagram.innerHTML = result.svg;
        result.bindFunctions?.(diagram);
        diagram.removeAttribute("data-mermaid-pending");
        diagram.dataset.mermaidRendered = "true";
        const svg = diagram.querySelector("svg");
        if (svg) {
          svg.setAttribute("role", "img");
          svg.setAttribute("aria-label", `${currentPage.title}流程图 ${index + 1}`);
        }
      } catch {
        diagram.textContent = source;
        diagram.classList.add("is-fallback");
        diagram.setAttribute("role", "note");
        diagram.setAttribute("aria-label", "流程图渲染失败，以下显示 Mermaid 源码");
      }
    }
  }

  renderPagination();
  renderToc();
  scrollToHash();
  renderMermaidDiagrams();
  requestAnimationFrame(() => revealActiveSidebarLink());

  function closeSidebar({ restoreFocus = false } = {}) {
    const wasOpen = sidebar?.classList.contains("open");
    sidebar?.classList.remove("open");
    sidebarBackdrop?.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
    if (wasOpen && !searchDialog?.hidden) return;
    document.body.classList.remove("navigation-locked");
    if (restoreFocus && wasOpen) menuButton?.focus();
  }

  menuButton?.addEventListener("click", () => {
    const isOpen = sidebar?.classList.toggle("open") || false;
    sidebarBackdrop?.classList.toggle("open", isOpen);
    menuButton.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("navigation-locked", isOpen);
    if (isOpen) requestAnimationFrame(() => revealActiveSidebarLink("smooth"));
  });
  sidebarBackdrop?.addEventListener("click", () => closeSidebar({ restoreFocus: true }));
  sidebarLinks.forEach((link) => link.addEventListener("click", () => closeSidebar()));

  async function writeClipboard(value) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  document.querySelectorAll(".markdown-body pre").forEach((pre) => {
    if (
      pre.closest(".mermaid-figure")
      || pre.parentElement?.classList.contains("markdown-code-block")
    ) return;
    const wrapper = document.createElement("div");
    wrapper.className = "markdown-code-block";
    if (pre.dataset.language) wrapper.dataset.language = pre.dataset.language;
    pre.before(wrapper);
    wrapper.appendChild(pre);
    const button = document.createElement("button");
    button.className = "markdown-copy-button";
    button.type = "button";
    button.setAttribute("aria-label", "复制代码");
    button.setAttribute("aria-live", "polite");
    button.textContent = "复制";
    button.addEventListener("click", async () => {
      try {
        await writeClipboard(pre.textContent);
        button.textContent = "已复制";
      } catch {
        button.textContent = "复制失败";
      }
      window.setTimeout(() => { button.textContent = "复制"; }, 1400);
    });
    wrapper.appendChild(button);
  });

  function textWithoutCode(element) {
    const clone = element.cloneNode(true);
    clone.querySelectorAll("pre, script, style").forEach((item) => item.remove());
    return clone.textContent.replace(/\s+/g, " ").trim();
  }

  function headingText(heading) {
    const level = Number(heading.tagName.slice(1));
    const parts = [heading.textContent];
    let sibling = heading.nextElementSibling;
    while (sibling) {
      if (/^H[1-6]$/.test(sibling.tagName) && Number(sibling.tagName.slice(1)) <= level) break;
      if (!sibling.matches("pre, .markdown-code-block, .mermaid-figure")) {
        parts.push(sibling.textContent);
      }
      sibling = sibling.nextElementSibling;
    }
    return parts.join(" ").replace(/\s+/g, " ").trim();
  }

  const searchable = PAGE_DEFS.flatMap((page, pageOrder) => {
    const pageSection = document.getElementById(page.id);
    if (!pageSection) return [];
    const pageText = textWithoutCode(pageSection);
    const pageEntry = {
      ...page,
      hash: "",
      heading: "",
      text: pageText,
      pageOrder,
      headingOrder: -1,
    };
    const headingEntries = Array.from(pageSection.querySelectorAll("h2, h3, h4"))
      .map((heading, headingOrder) => ({
        ...page,
        hash: heading.id,
        heading: heading.textContent.trim(),
        text: headingText(heading),
        pageOrder,
        headingOrder,
      }));
    return [pageEntry, ...headingEntries];
  });

  function normalizedText(value) {
    return String(value).toLocaleLowerCase("zh-CN");
  }

  function searchScore(item, query) {
    if (!query) return item.heading ? -1 : 1;
    const title = normalizedText(item.title);
    const heading = normalizedText(item.heading);
    const text = normalizedText(item.text);
    let score = 0;
    if (title === query) score += 1200;
    else if (title.startsWith(query)) score += 800;
    else if (title.includes(query)) score += 600;
    if (heading === query) score += 1000;
    else if (heading.startsWith(query)) score += 700;
    else if (heading.includes(query)) score += 500;
    if (text.includes(query)) score += 120;
    return score;
  }

  function resultSnippet(item, query) {
    if (!query) return "";
    const text = item.text.replace(/\s+/g, " ").trim();
    const position = normalizedText(text).indexOf(query);
    if (position < 0) return "";
    const start = Math.max(0, position - 30);
    const end = Math.min(text.length, position + query.length + 48);
    return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
  }

  let currentMatches = [];
  let selectedResultIndex = 0;

  function updateSelectedResult(nextIndex) {
    const results = Array.from(searchResults?.querySelectorAll(".search-result") || []);
    if (!results.length) return;
    selectedResultIndex = (nextIndex + results.length) % results.length;
    results.forEach((result, index) => {
      const isSelected = index === selectedResultIndex;
      result.classList.toggle("selected", isSelected);
      result.setAttribute("aria-selected", String(isSelected));
      if (isSelected) result.scrollIntoView({ block: "nearest" });
    });
  }

  function renderResults(query = "") {
    if (!searchResults) return;
    const normalized = normalizedText(query.trim());
    currentMatches = searchable
      .map((item) => ({ item, score: searchScore(item, normalized) }))
      .filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score
        || left.item.pageOrder - right.item.pageOrder
        || left.item.headingOrder - right.item.headingOrder)
      .slice(0, 12)
      .map(({ item }) => item);
    selectedResultIndex = 0;

    if (!currentMatches.length) {
      searchResults.innerHTML = '<div class="search-empty">没有找到相关内容</div>';
      return;
    }

    searchResults.innerHTML = currentMatches.map((item, index) => {
      const snippet = resultSnippet(item, normalized);
      return `<button class="search-result${index === 0 ? " selected" : ""}" type="button" role="option" aria-selected="${index === 0}" data-page="${escapeHtml(item.slug)}" data-hash="${escapeHtml(item.hash)}">
        <span class="search-result-copy"><strong>${escapeHtml(item.heading || item.title)}</strong><small>${escapeHtml(item.section)} / ${escapeHtml(item.subsection)} / ${escapeHtml(item.title)}</small>${snippet ? `<span>${escapeHtml(snippet)}</span>` : ""}</span><em>↵</em>
      </button>`;
    }).join("");

    searchResults.querySelectorAll(".search-result").forEach((result, index) => {
      result.addEventListener("mouseenter", () => updateSelectedResult(index));
      result.addEventListener("click", () => openResult(result.dataset.page, result.dataset.hash));
    });
  }

  let searchOpener;

  function openSearch() {
    if (!searchDialog || !searchInput) return;
    closeSidebar();
    searchOpener = document.activeElement;
    searchDialog.hidden = false;
    document.body.classList.add("navigation-locked");
    renderResults("");
    requestAnimationFrame(() => searchInput.focus());
  }

  function closeSearch({ restoreFocus = true } = {}) {
    if (!searchDialog || !searchInput || searchDialog.hidden) return;
    searchDialog.hidden = true;
    document.body.classList.remove("navigation-locked");
    searchInput.value = "";
    if (restoreFocus && searchOpener instanceof HTMLElement) searchOpener.focus();
  }

  function openResult(slug, resultHash = "") {
    closeSearch({ restoreFocus: false });
    const page = pageBySlug.get(slug);
    if (page) window.location.href = pageUrl(page, resultHash);
  }

  searchButton?.addEventListener("click", openSearch);
  searchCloseButton?.addEventListener("click", () => closeSearch());
  searchDialog?.addEventListener("click", (event) => {
    if (event.target === searchDialog) closeSearch();
  });
  searchInput?.addEventListener("input", () => renderResults(searchInput.value));
  searchInput?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      updateSelectedResult(selectedResultIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      updateSelectedResult(selectedResultIndex - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const match = currentMatches[selectedResultIndex];
      if (match) openResult(match.slug, match.hash);
    }
  });

  searchDialog?.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const focusable = Array.from(searchDialog.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    )).filter((element) => !element.hidden && element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openSearch();
    }
    if (event.key === "Escape") {
      if (searchDialog && !searchDialog.hidden) closeSearch();
      else closeSidebar({ restoreFocus: true });
    }
  });
})();
