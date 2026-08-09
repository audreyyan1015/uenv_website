(function () {
  "use strict";

  const STATIC_PAGE_DEFS = [
    { slug: "overview", id: "overview", title: "概览" },
    { slug: "architecture", id: "architecture", title: "架构总览" },
    { slug: "data-flow", id: "data-flow", title: "Episode 数据流" },
    { slug: "uenv-bridge", id: "uenv-bridge", title: "uenv-bridge" },
    { slug: "uenv-server", id: "uenv-server", title: "uenv-server" },
    { slug: "uenv-worker", id: "uenv-worker", title: "uenv-worker" },
    { slug: "uenv-hub", id: "uenv-hub", title: "uenv-hub" },
  ];

  const GUIDE_FALLBACKS = [
    { slug: "basic-deployment", id: "basic-deployment", title: "基础部署指南" },
    { slug: "multi-node-deployment", id: "multi-node-deployment", title: "多机部署指南" },
    { slug: "hub", id: "hub", title: "UEnv Hub 使用指南" },
    { slug: "evaluation", id: "evaluation", title: "评测指南" },
    { slug: "training", id: "training", title: "训练指南" },
  ];

  const COMPLETE_FALLBACK = [
    STATIC_PAGE_DEFS[0],
    ...GUIDE_FALLBACKS,
    ...STATIC_PAGE_DEFS.slice(1),
  ];

  const PAGE_ALIASES = new Map([
    ["quick-start", "basic-deployment"],
    ["workflow", "basic-deployment"],
    ["configuration", "basic-deployment"],
    ["why-uenv", "overview"],
    ["components", "uenv-bridge"],
    ["protocol", "architecture"],
    ["roadmap", "overview"],
  ]);

  const root = document.documentElement;
  const menuButton = document.getElementById("menuButton");
  const sidebar = document.getElementById("sidebar");
  const sidebarBackdrop = document.getElementById("sidebarBackdrop");
  const searchButton = document.getElementById("searchButton");
  const searchDialog = document.getElementById("searchDialog");
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");
  const breadcrumbCurrent = document.getElementById("breadcrumbCurrent");
  const pagePagination = document.getElementById("pagePagination");
  const tocNav = document.getElementById("tocNav");
  const sections = Array.from(document.querySelectorAll(".doc-section[id]"));
  const sectionIds = new Set(sections.map((section) => section.id));

  function sanitizePageDefs(value) {
    if (!Array.isArray(value)) return [];
    const seenSlugs = new Set();
    const seenIds = new Set();
    return value.flatMap((page) => {
      if (!page || typeof page !== "object") return [];
      const slug = typeof page.slug === "string" ? page.slug.trim() : "";
      const id = typeof page.id === "string" ? page.id.trim() : slug;
      const title = typeof page.title === "string" ? page.title.trim() : "";
      if (!slug || !id || !title || seenSlugs.has(slug) || seenIds.has(id)) return [];
      seenSlugs.add(slug);
      seenIds.add(id);
      return [{ slug, id, title, source: typeof page.source === "string" ? page.source : undefined }];
    });
  }

  const injectedPages = sanitizePageDefs(window.__UENV_DOC_PAGES__);
  const injectedIsComplete = injectedPages.some((page) => page.slug === "overview")
    && injectedPages.some((page) => page.slug === "architecture");
  const configuredPages = injectedIsComplete
    ? injectedPages
    : injectedPages.length
      ? [STATIC_PAGE_DEFS[0], ...injectedPages, ...STATIC_PAGE_DEFS.slice(1)]
      : COMPLETE_FALLBACK;
  const PAGE_DEFS = configuredPages.filter((page) => sectionIds.has(page.id));

  if (!PAGE_DEFS.length) return;

  const sidebarLinks = Array.from(document.querySelectorAll(".sidebar-link"));
  const pageBySlug = new Map(PAGE_DEFS.map((page) => [page.slug, page]));
  const pageById = new Map(PAGE_DEFS.map((page) => [page.id, page]));

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
      const slug = PAGE_ALIASES.get(url.searchParams.get("page")) || url.searchParams.get("page") || "overview";
      return pageBySlug.get(slug);
    } catch {
      return undefined;
    }
  }

  function pageContainingHash(hash) {
    if (!hash) return undefined;
    const directPage = pageById.get(hash) || pageBySlug.get(PAGE_ALIASES.get(hash) || hash);
    if (directPage) return directPage;
    const target = document.getElementById(hash);
    const section = target?.closest(".doc-section[id]");
    return section ? pageById.get(section.id) : undefined;
  }

  const params = new URLSearchParams(window.location.search);
  const requestedSlug = params.get("page");
  const normalizedSlug = PAGE_ALIASES.get(requestedSlug) || requestedSlug;
  const hash = decodedHash();
  const hashPage = pageContainingHash(hash);
  const currentPage = pageBySlug.get(normalizedSlug) || hashPage || pageBySlug.get("overview") || PAGE_DEFS[0];
  const currentIndex = PAGE_DEFS.indexOf(currentPage);
  const currentSection = document.getElementById(currentPage.id);

  if (!currentSection) return;

  if ((requestedSlug && normalizedSlug !== requestedSlug) || (requestedSlug && !pageBySlug.has(normalizedSlug))) {
    window.history.replaceState(null, "", pageUrl(currentPage, hash));
  } else if (!requestedSlug && hashPage && hashPage.slug !== "overview") {
    window.history.replaceState(null, "", pageUrl(hashPage, hash === hashPage.id ? "" : hash));
  }

  document.title = `UEnv 使用文档 — ${currentPage.title}`;
  if (breadcrumbCurrent) breadcrumbCurrent.textContent = currentPage.title;
  sections.forEach((section) => {
    const isCurrent = section.id === currentPage.id;
    section.hidden = !isCurrent;
    section.classList.toggle("is-current-page", isCurrent);
  });
  sidebarLinks.forEach((link) => {
    const isCurrent = pageFromLink(link)?.slug === currentPage.slug;
    link.classList.toggle("active", isCurrent);
    if (isCurrent) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  function renderPagination() {
    if (!pagePagination) return;
    const previous = PAGE_DEFS[currentIndex - 1];
    const next = PAGE_DEFS[currentIndex + 1];
    const previousLink = previous
      ? `<a class="page-pagination-link previous" href="${pageUrl(previous)}"><span>上一页</span><strong>← ${escapeHtml(previous.title)}</strong></a>`
      : '<span class="page-pagination-spacer" aria-hidden="true"></span>';
    const nextLink = next
      ? `<a class="page-pagination-link next" href="${pageUrl(next)}"><span>下一页</span><strong>${escapeHtml(next.title)} →</strong></a>`
      : '<span class="page-pagination-spacer" aria-hidden="true"></span>';
    pagePagination.innerHTML = `${previousLink}<span class="page-pagination-count">${currentIndex + 1} / ${PAGE_DEFS.length}</span>${nextLink}`;
  }

  let tocObserver;

  function setActiveToc(id) {
    if (!tocNav) return;
    tocNav.querySelectorAll("a").forEach((link) => {
      link.classList.toggle("active", link.dataset.target === id);
    });
  }

  function renderToc() {
    if (!tocNav) return;
    const isMarkdown = currentSection.classList.contains("markdown-body");
    const selector = isMarkdown
      ? "h2, h3, h4"
      : ":scope > h1, :scope > h2, :scope > h3, :scope > .overview-why > h2, :scope > .component-heading h2";
    const headings = Array.from(currentSection.querySelectorAll(selector));
    if (!headings.length) {
      tocNav.innerHTML = `<a class="active" data-target="${escapeHtml(currentPage.id)}" href="#${encodeURIComponent(currentPage.id)}">${escapeHtml(currentPage.title)}</a>`;
      return;
    }

    headings.forEach((heading, index) => {
      if (!heading.id) heading.id = `${currentPage.id}-heading-${index + 1}`;
    });
    tocNav.innerHTML = headings
      .map((heading, index) => {
        const level = /^H[2-4]$/.test(heading.tagName) ? heading.tagName.slice(1) : "2";
        return `<a class="toc-level-${level}${index === 0 ? " active" : ""}" data-target="${escapeHtml(heading.id)}" href="#${encodeURIComponent(heading.id)}">${escapeHtml(heading.textContent.trim())}</a>`;
      })
      .join("");

    tocNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setActiveToc(link.dataset.target));
    });

    if ("IntersectionObserver" in window) {
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
    const target = document.getElementById(hash);
    if (!target || !currentSection.contains(target)) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: "start", behavior: "auto" });
        setActiveToc(target.id);
      });
    });
  }

  renderPagination();
  renderToc();
  scrollToHash();

  root.dataset.theme = "light";

  function closeSidebar() {
    sidebar?.classList.remove("open");
    sidebarBackdrop?.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
  }

  menuButton?.addEventListener("click", () => {
    const isOpen = sidebar?.classList.toggle("open") || false;
    sidebarBackdrop?.classList.toggle("open", isOpen);
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });
  sidebarBackdrop?.addEventListener("click", closeSidebar);
  sidebarLinks.forEach((link) => link.addEventListener("click", closeSidebar));

  async function writeClipboard(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  function flashCopied(button) {
    const original = button.innerHTML;
    button.textContent = "已复制";
    setTimeout(() => { button.innerHTML = original; }, 1400);
  }

  document.querySelectorAll(".markdown-body pre").forEach((pre) => {
    if (pre.parentElement?.classList.contains("markdown-code-block")) return;
    const wrapper = document.createElement("div");
    wrapper.className = "markdown-code-block";
    pre.before(wrapper);
    wrapper.appendChild(pre);
    const button = document.createElement("button");
    button.className = "markdown-copy-button";
    button.type = "button";
    button.setAttribute("aria-label", "复制代码");
    button.textContent = "复制";
    button.addEventListener("click", async () => {
      try {
        await writeClipboard(pre.textContent);
        flashCopied(button);
      } catch {
        button.textContent = "复制失败";
        setTimeout(() => { button.textContent = "复制"; }, 1400);
      }
    });
    wrapper.appendChild(button);
  });

  document.querySelectorAll(".copy-button[data-copy-target]").forEach((button) => {
    button.addEventListener("click", async () => {
      const target = document.getElementById(button.dataset.copyTarget);
      if (!target) return;
      try {
        await writeClipboard(target.innerText);
        flashCopied(button);
      } catch {
        // Keep the original label when clipboard access is denied.
      }
    });
  });

  const searchable = PAGE_DEFS.map((page) => {
    const section = document.getElementById(page.id);
    return {
      ...page,
      text: section?.textContent.replace(/\s+/g, " ").trim() || "",
    };
  });

  function renderResults(query = "") {
    if (!searchResults) return;
    const normalized = query.trim().toLocaleLowerCase("zh-CN");
    const matches = searchable
      .filter((item) => !normalized
        || item.title.toLocaleLowerCase("zh-CN").includes(normalized)
        || item.text.toLocaleLowerCase("zh-CN").includes(normalized))
      .slice(0, 8);
    if (!matches.length) {
      searchResults.innerHTML = '<div class="search-empty">没有找到相关内容</div>';
      return;
    }
    searchResults.innerHTML = matches
      .map((item, index) => `
        <button class="search-result${index === 0 ? " selected" : ""}" type="button" data-page="${escapeHtml(item.slug)}">
          <div><strong>${escapeHtml(item.title)}</strong><span>UEnv 使用文档 / ${escapeHtml(item.title)}</span></div><em>↵</em>
        </button>`)
      .join("");
    searchResults.querySelectorAll(".search-result").forEach((result) => {
      result.addEventListener("click", () => openResult(result.dataset.page));
    });
  }

  function openSearch() {
    if (!searchDialog || !searchInput) return;
    searchDialog.hidden = false;
    document.body.style.overflow = "hidden";
    renderResults("");
    requestAnimationFrame(() => searchInput.focus());
  }

  function closeSearch() {
    if (!searchDialog || !searchInput) return;
    searchDialog.hidden = true;
    document.body.style.overflow = "";
    searchInput.value = "";
  }

  function openResult(slug) {
    closeSearch();
    const page = pageBySlug.get(slug);
    if (page) window.location.href = pageUrl(page);
  }

  searchButton?.addEventListener("click", openSearch);
  searchDialog?.addEventListener("click", (event) => {
    if (event.target === searchDialog) closeSearch();
  });
  searchInput?.addEventListener("input", () => renderResults(searchInput.value));
  searchInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const first = searchResults?.querySelector(".search-result");
      if (first) openResult(first.dataset.page);
    }
  });
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openSearch();
    }
    if (event.key === "Escape") {
      if (searchDialog && !searchDialog.hidden) closeSearch();
      closeSidebar();
    }
  });
})();
