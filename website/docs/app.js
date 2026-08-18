(function () {
  "use strict";

  const FALLBACK_PAGES = [
    {
      slug: "overview",
      id: "overview",
      title: "UEnv 文档",
      section: "了解 UEnv",
      subsection: "",
    },
  ];
  const FALLBACK_ALIASES = {
    "quick-start": "basic-deployment",
    "data-flow": "episode-lifecycle",
    "uenv-bridge": "integration",
    adapter: "server",
    "uenv-server": "server",
    "uenv-worker": "worker-registration",
    "uenv-hub": "hub",
    "adapter-contract": "integration-contract",
    "integration-openhands": "integration",
    "case-trajectory-swe": "trajectory",
  };

  const root = document.documentElement;
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
  const breadcrumbSubsectionSeparator = document.getElementById("breadcrumbSubsectionSeparator");
  const breadcrumbCurrent = document.getElementById("breadcrumbCurrent");
  const pagePagination = document.getElementById("pagePagination");
  const toc = document.querySelector(".toc");
  const tocNav = document.getElementById("tocNav");
  const inlineToc = document.getElementById("inlineToc");
  const inlineTocNav = document.getElementById("inlineTocNav");
  const sections = Array.from(document.querySelectorAll(".doc-section[id]"));
  const sectionIds = new Set(sections.map((section) => section.id));

  function sanitizePages(value) {
    if (!Array.isArray(value)) return [];
    const seenSlugs = new Set();
    const seenIds = new Set();
    return value.flatMap((candidate) => {
      if (!candidate || typeof candidate !== "object") return [];
      const slug = typeof candidate.slug === "string" ? candidate.slug.trim() : "";
      const id = typeof candidate.id === "string" ? candidate.id.trim() : slug;
      const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
      const section = typeof candidate.section === "string" ? candidate.section.trim() : "UEnv 文档";
      const subsection = typeof candidate.subsection === "string" ? candidate.subsection.trim() : "";
      if (!slug || !id || !title || seenSlugs.has(slug) || seenIds.has(id)) return [];
      seenSlugs.add(slug);
      seenIds.add(id);
      return [{ slug, id, title, section, subsection, source: candidate.source }];
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

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function lower(value) {
    return normalizeText(value).toLocaleLowerCase("zh-CN");
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

  function pageTrail(page) {
    return [page.section, page.subsection, page.title].filter(Boolean).join(" / ");
  }

  const injectedPages = sanitizePages(window.__UENV_DOC_PAGES__);
  const PAGE_DEFS = (injectedPages.length ? injectedPages : FALLBACK_PAGES)
    .filter((page) => sectionIds.has(page.id));
  if (!PAGE_DEFS.length) return;

  const PAGE_ALIASES = sanitizeAliases(window.__UENV_DOC_ALIASES__);
  const sidebarLinks = Array.from(document.querySelectorAll(".sidebar-link"));
  const topnavLinks = Array.from(document.querySelectorAll(".topnav [data-section]"));
  const pageBySlug = new Map(PAGE_DEFS.map((page) => [page.slug, page]));
  const pageById = new Map(PAGE_DEFS.map((page) => [page.id, page]));

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
    const owner = target?.closest(".doc-section[id]");
    return owner ? pageById.get(owner.id) : undefined;
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

  if ((requestedSlug && normalizedSlug !== requestedSlug) || (requestedSlug && !pageBySlug.has(normalizedSlug))) {
    window.history.replaceState(null, "", pageUrl(currentPage, canonicalHash));
  } else if (!requestedSlug && hashPage && hashPage.slug !== "overview") {
    window.history.replaceState(null, "", pageUrl(hashPage, canonicalHash === hashPage.id ? "" : canonicalHash));
  }

  root.dataset.theme = "light";
  document.title = `UEnv 文档 — ${currentPage.title}`;
  sections.forEach((section) => {
    const isCurrent = section.id === currentPage.id;
    section.hidden = !isCurrent;
    section.classList.toggle("is-current-page", isCurrent);
  });

  const sectionLanding = PAGE_DEFS.find((page) => page.section === currentPage.section) || currentPage;
  if (breadcrumbSection) {
    breadcrumbSection.textContent = currentPage.section;
    breadcrumbSection.href = pageUrl(sectionLanding);
  }
  if (breadcrumbSubsection && breadcrumbSubsectionSeparator) {
    const hasSubsection = Boolean(currentPage.subsection);
    breadcrumbSubsection.hidden = !hasSubsection;
    breadcrumbSubsectionSeparator.hidden = !hasSubsection;
    breadcrumbSubsection.textContent = currentPage.subsection;
  }
  if (breadcrumbCurrent) breadcrumbCurrent.textContent = currentPage.title;

  topnavLinks.forEach((link) => {
    const isCurrent = link.dataset.section === currentPage.section;
    link.classList.toggle("active", isCurrent);
    if (isCurrent) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });

  let activeSidebarLink;
  sidebarLinks.forEach((link) => {
    const isCurrent = pageFromLink(link)?.slug === currentPage.slug;
    link.classList.toggle("active", isCurrent);
    if (isCurrent) {
      activeSidebarLink = link;
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  document.querySelectorAll(".sidebar-section").forEach((details) => {
    const containsCurrent = details.contains(activeSidebarLink);
    details.open = containsCurrent;
    details.classList.toggle("contains-current", containsCurrent);
  });
  document.querySelectorAll(".sidebar-subsection").forEach((details) => {
    const containsCurrent = details.contains(activeSidebarLink);
    details.open = containsCurrent;
    details.classList.toggle("contains-current", containsCurrent);
  });
  requestAnimationFrame(() => activeSidebarLink?.scrollIntoView({ block: "center" }));

  function renderPagination() {
    if (!pagePagination) return;
    const previous = PAGE_DEFS[currentIndex - 1];
    const next = PAGE_DEFS[currentIndex + 1];
    const previousLink = previous
      ? `<a class="page-pagination-link previous" href="${pageUrl(previous)}"><span>上一页 · ${escapeHtml([previous.section, previous.subsection].filter(Boolean).join(" / "))}</span><strong>← ${escapeHtml(previous.title)}</strong></a>`
      : '<span class="page-pagination-spacer" aria-hidden="true"></span>';
    const nextLink = next
      ? `<a class="page-pagination-link next" href="${pageUrl(next)}"><span>下一页 · ${escapeHtml([next.section, next.subsection].filter(Boolean).join(" / "))}</span><strong>${escapeHtml(next.title)} →</strong></a>`
      : '<span class="page-pagination-spacer" aria-hidden="true"></span>';
    pagePagination.innerHTML = `${previousLink}<span class="page-pagination-count">${currentIndex + 1} / ${PAGE_DEFS.length}</span>${nextLink}`;
  }

  let tocObserver;

  function setActiveToc(id) {
    [tocNav, inlineTocNav].forEach((navigation) => {
      navigation?.querySelectorAll("a").forEach((link) => {
        link.classList.toggle("active", link.dataset.target === id);
      });
    });
  }

  function tocMarkup(headings) {
    return headings.map((heading, index) => {
      const level = /^H[2-4]$/.test(heading.tagName) ? heading.tagName.slice(1) : "2";
      return `<a class="toc-level-${level}${index === 0 ? " active" : ""}" data-target="${escapeHtml(heading.id)}" href="#${encodeURIComponent(heading.id)}">${escapeHtml(heading.textContent.trim())}</a>`;
    }).join("");
  }

  function renderToc() {
    const headings = Array.from(currentSection.querySelectorAll("h2, h3, h4"));
    const hasHeadings = headings.length > 0;
    if (toc) toc.hidden = !hasHeadings;
    if (inlineToc) inlineToc.hidden = !hasHeadings;
    if (!hasHeadings) return;

    headings.forEach((heading, index) => {
      if (!heading.id) heading.id = `${currentPage.id}-heading-${index + 1}`;
    });
    if (tocNav) tocNav.innerHTML = tocMarkup(headings);
    if (inlineTocNav) inlineTocNav.innerHTML = tocMarkup(headings);
    [tocNav, inlineTocNav].forEach((navigation) => {
      navigation?.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          setActiveToc(link.dataset.target);
          if (navigation === inlineTocNav && inlineToc) inlineToc.open = false;
        });
      });
    });

    if (inlineToc) currentSection.querySelector("h1")?.after(inlineToc);
    if ("IntersectionObserver" in window) {
      tocObserver?.disconnect();
      tocObserver = new IntersectionObserver((entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
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

  async function renderMermaidDiagrams() {
    const figures = Array.from(currentSection.querySelectorAll('.mermaid-figure[data-mermaid-state="pending"]'));
    if (!figures.length) return;
    const showFallback = (figure, message) => {
      figure.dataset.mermaidState = "error";
      const status = figure.querySelector(".mermaid-status");
      if (status) status.textContent = message;
      const fallback = figure.querySelector(".mermaid-fallback");
      if (fallback) fallback.open = true;
    };
    const runtime = window.mermaid;
    if (!runtime?.initialize || !runtime?.run) {
      figures.forEach((figure) => showFallback(figure, "图表运行时未加载，已保留源码。"));
      return;
    }

    try {
      runtime.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        themeVariables: {
          background: "#ffffff",
          primaryColor: "#edf4ff",
          primaryBorderColor: "#87aef3",
          primaryTextColor: "#102036",
          secondaryColor: "#edf9f4",
          secondaryBorderColor: "#80c9a8",
          tertiaryColor: "#f6f8fb",
          lineColor: "#61758e",
          textColor: "#102036",
          fontFamily: 'Inter, system-ui, "PingFang SC", "Microsoft YaHei", sans-serif',
        },
        flowchart: { htmlLabels: false, useMaxWidth: true },
        sequence: { useMaxWidth: true, wrap: true },
      });
    } catch {
      figures.forEach((figure) => showFallback(figure, "图表初始化失败，已保留源码。"));
      return;
    }

    for (const figure of figures) {
      const diagram = figure.querySelector(".mermaid");
      const status = figure.querySelector(".mermaid-status");
      const source = diagram?.textContent || "";
      try {
        if (!diagram) throw new Error("Mermaid diagram container is missing");
        if (runtime.parse) await runtime.parse(source, { suppressErrors: false });
        await runtime.run({ nodes: [diagram], suppressErrors: false });
        if (!diagram?.querySelector("svg")) throw new Error("Mermaid did not produce an SVG");
        figure.dataset.mermaidState = "ready";
        if (status) status.hidden = true;
      } catch {
        if (diagram) diagram.textContent = source;
        showFallback(figure, "图表渲染失败，已显示源码。");
      }
    }
  }

  let sidebarReturnFocus;

  function closeSidebar({ restoreFocus = false } = {}) {
    sidebar?.classList.remove("open");
    if (sidebarBackdrop) {
      sidebarBackdrop.classList.remove("open");
      sidebarBackdrop.hidden = true;
    }
    document.body.classList.remove("sidebar-open");
    menuButton?.setAttribute("aria-expanded", "false");
    if (restoreFocus) sidebarReturnFocus?.focus();
  }

  function openSidebar() {
    sidebarReturnFocus = document.activeElement;
    sidebar?.classList.add("open");
    if (sidebarBackdrop) {
      sidebarBackdrop.hidden = false;
      sidebarBackdrop.classList.add("open");
    }
    document.body.classList.add("sidebar-open");
    menuButton?.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => (activeSidebarLink || sidebar)?.focus());
  }

  menuButton?.addEventListener("click", () => {
    if (sidebar?.classList.contains("open")) closeSidebar({ restoreFocus: true });
    else openSidebar();
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
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) throw new Error("Clipboard write failed");
  }

  currentSection.querySelectorAll("pre").forEach((pre) => {
    if (pre.closest(".mermaid-fallback") || pre.parentElement?.classList.contains("markdown-code-block")) return;
    const wrapper = document.createElement("div");
    wrapper.className = "markdown-code-block";
    wrapper.dataset.language = pre.dataset.language || "代码";
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

  function headingText(heading) {
    const level = Number(heading.tagName.slice(1));
    const parts = [heading.textContent];
    let sibling = heading.nextElementSibling;
    while (sibling) {
      if (/^H[1-6]$/.test(sibling.tagName) && Number(sibling.tagName.slice(1)) <= level) break;
      if (!sibling.matches(".mermaid-fallback")) parts.push(sibling.textContent);
      sibling = sibling.nextElementSibling;
    }
    return normalizeText(parts.join(" "));
  }

  const searchable = PAGE_DEFS.flatMap((page) => {
    const section = document.getElementById(page.id);
    if (!section) return [];
    const pageText = normalizeText(section.textContent);
    const pageEntry = { ...page, hash: "", heading: "", text: pageText, kind: "page" };
    const headingEntries = Array.from(section.querySelectorAll("h2, h3, h4")).map((heading) => ({
      ...page,
      hash: heading.id,
      heading: heading.textContent.trim(),
      text: headingText(heading),
      kind: "heading",
    }));
    return [pageEntry, ...headingEntries];
  });

  function scoreResult(item, query) {
    if (!query) return item.kind === "page" ? 1 : 0;
    const title = lower(item.title);
    const heading = lower(item.heading);
    const path = lower(`${item.section} ${item.subsection}`);
    const text = lower(item.text);
    let score = 0;
    if (title === query) score += 140;
    else if (title.startsWith(query)) score += 115;
    else if (title.includes(query)) score += 90;
    if (heading === query) score += 105;
    else if (heading.startsWith(query)) score += 85;
    else if (heading.includes(query)) score += 70;
    if (path.includes(query)) score += 45;
    if (text.includes(query)) score += 18;
    if (item.kind === "page") score += 4;
    return score;
  }

  function resultSnippet(item, query) {
    if (!query) return item.heading ? item.text : "打开此文档页面";
    const text = normalizeText(item.text);
    const index = lower(text).indexOf(query);
    if (index < 0) return text.slice(0, 92);
    const start = Math.max(0, index - 34);
    const end = Math.min(text.length, index + query.length + 58);
    return `${start ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
  }

  function highlightText(value, query) {
    if (!query) return escapeHtml(value);
    const source = String(value);
    const normalizedSource = source.toLocaleLowerCase("zh-CN");
    let cursor = 0;
    let result = "";
    while (cursor < source.length) {
      const index = normalizedSource.indexOf(query, cursor);
      if (index < 0) {
        result += escapeHtml(source.slice(cursor));
        break;
      }
      result += escapeHtml(source.slice(cursor, index));
      result += `<mark>${escapeHtml(source.slice(index, index + query.length))}</mark>`;
      cursor = index + query.length;
    }
    return result;
  }

  let selectedResultIndex = 0;

  function selectResult(index) {
    const results = Array.from(searchResults?.querySelectorAll(".search-result") || []);
    if (!results.length) return;
    selectedResultIndex = (index + results.length) % results.length;
    results.forEach((result, resultIndex) => {
      const selected = resultIndex === selectedResultIndex;
      result.classList.toggle("selected", selected);
      result.setAttribute("aria-selected", String(selected));
    });
    const selected = results[selectedResultIndex];
    searchInput?.setAttribute("aria-activedescendant", selected.id);
    selected.scrollIntoView({ block: "nearest" });
  }

  function renderResults(query = "") {
    if (!searchResults) return;
    const normalized = lower(query);
    let matches;
    if (!normalized) {
      const suggested = new Set(["basic-deployment", "evaluation", "training", "integration"]);
      matches = searchable.filter((item) => item.kind === "page" && suggested.has(item.slug));
    } else {
      matches = searchable
        .map((item, sourceIndex) => ({ item, sourceIndex, score: scoreResult(item, normalized) }))
        .filter((candidate) => candidate.score > 4)
        .sort((a, b) => b.score - a.score || a.sourceIndex - b.sourceIndex)
        .slice(0, 12)
        .map((candidate) => candidate.item);
    }
    if (!matches.length) {
      searchResults.innerHTML = '<div class="search-empty">没有找到相关内容。可以尝试“部署”“评测”“训练”或“轨迹”。</div>';
      searchInput?.removeAttribute("aria-activedescendant");
      return;
    }
    searchResults.innerHTML = matches.map((item, index) => {
      const label = item.heading || item.title;
      const snippet = resultSnippet(item, normalized);
      return `<button id="search-result-${index}" class="search-result${index === 0 ? " selected" : ""}" type="button" role="option" aria-selected="${index === 0}" data-page="${escapeHtml(item.slug)}" data-hash="${escapeHtml(item.hash)}">
        <span class="search-result-copy"><strong>${highlightText(label, normalized)}</strong><small>${escapeHtml(pageTrail(item))}</small><span>${highlightText(snippet, normalized)}</span></span><em aria-hidden="true">↵</em>
      </button>`;
    }).join("");
    selectedResultIndex = 0;
    searchInput?.setAttribute("aria-activedescendant", "search-result-0");
    searchResults.querySelectorAll(".search-result").forEach((result) => {
      result.addEventListener("click", () => openResult(result.dataset.page, result.dataset.hash));
      result.addEventListener("mousemove", () => {
        const results = Array.from(searchResults.querySelectorAll(".search-result"));
        selectResult(results.indexOf(result));
      });
    });
  }

  let searchReturnFocus;

  function openSearch() {
    if (!searchDialog || !searchInput) return;
    searchReturnFocus = document.activeElement;
    searchDialog.hidden = false;
    document.body.classList.add("dialog-open");
    renderResults("");
    requestAnimationFrame(() => searchInput.focus());
  }

  function closeSearch({ restoreFocus = true } = {}) {
    if (!searchDialog || !searchInput) return;
    searchDialog.hidden = true;
    document.body.classList.remove("dialog-open");
    searchInput.value = "";
    searchInput.removeAttribute("aria-activedescendant");
    if (restoreFocus) searchReturnFocus?.focus();
  }

  function openResult(slug, resultHash = "") {
    closeSearch({ restoreFocus: false });
    const page = pageBySlug.get(slug);
    if (page) window.location.href = pageUrl(page, resultHash);
  }

  function trapDialogFocus(event) {
    if (event.key !== "Tab" || searchDialog?.hidden) return;
    const focusable = Array.from(searchDialog.querySelectorAll('button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'));
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
  }

  searchButton?.addEventListener("click", openSearch);
  searchCloseButton?.addEventListener("click", () => closeSearch());
  searchDialog?.addEventListener("click", (event) => {
    if (event.target === searchDialog) closeSearch();
  });
  searchDialog?.addEventListener("keydown", trapDialogFocus);
  searchInput?.addEventListener("input", () => renderResults(searchInput.value));
  searchInput?.addEventListener("keydown", (event) => {
    const resultCount = searchResults?.querySelectorAll(".search-result").length || 0;
    if (event.key === "ArrowDown" && resultCount) {
      event.preventDefault();
      selectResult(selectedResultIndex + 1);
    } else if (event.key === "ArrowUp" && resultCount) {
      event.preventDefault();
      selectResult(selectedResultIndex - 1);
    } else if (event.key === "Enter" && resultCount) {
      event.preventDefault();
      const selected = searchResults.querySelectorAll(".search-result")[selectedResultIndex];
      if (selected) openResult(selected.dataset.page, selected.dataset.hash);
    }
  });
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openSearch();
    }
    if (event.key === "Escape") {
      if (searchDialog && !searchDialog.hidden) closeSearch();
      else if (sidebar?.classList.contains("open")) closeSidebar({ restoreFocus: true });
    }
  });

  const systemKey = document.querySelector(".system-key");
  if (systemKey && /Mac|iPhone|iPad/u.test(navigator.platform)) systemKey.textContent = "⌘";

  renderPagination();
  renderToc();
  scrollToHash();
  void renderMermaidDiagrams();
}());
