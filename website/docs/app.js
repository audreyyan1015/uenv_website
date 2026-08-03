(function () {
  const PAGE_DEFS = [
    { slug: "overview", id: "overview", title: "概览" },
    { slug: "quick-start", id: "quick-start", title: "快速开始" },
    { slug: "workflow", id: "workflow", title: "使用流程" },
    { slug: "configuration", id: "configuration", title: "配置说明" },
    { slug: "architecture", id: "architecture", title: "架构总览" },
    { slug: "data-flow", id: "data-flow", title: "Episode 数据流" },
    { slug: "uenv-bridge", id: "uenv-bridge", title: "uenv-bridge" },
    { slug: "uenv-server", id: "uenv-server", title: "uenv-server" },
    { slug: "uenv-worker", id: "uenv-worker", title: "uenv-worker" },
    { slug: "uenv-hub", id: "uenv-hub", title: "uenv-hub" },
  ];

  const PAGE_ALIASES = new Map([
    ["why-uenv", "overview"],
    ["components", "uenv-bridge"],
    ["protocol", "architecture"],
    ["roadmap", "overview"],
  ]);

  const root = document.documentElement;
  const themeButton = document.getElementById("themeButton");
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
  const sidebarLinks = Array.from(document.querySelectorAll(".sidebar-link"));
  const pageBySlug = new Map(PAGE_DEFS.map((page) => [page.slug, page]));
  const pageById = new Map(PAGE_DEFS.map((page) => [page.id, page]));

  function pageUrl(page) {
    return page.slug === "overview" ? "./" : `?page=${encodeURIComponent(page.slug)}`;
  }

  function pageFromLink(link) {
    const url = new URL(link.href, window.location.href);
    return pageBySlug.get(url.searchParams.get("page") || "overview");
  }

  const params = new URLSearchParams(window.location.search);
  const requestedSlug = params.get("page");
  const normalizedSlug = PAGE_ALIASES.get(requestedSlug) || requestedSlug;
  const legacyHash = window.location.hash ? window.location.hash.slice(1) : "";
  const legacyHashPage = pageById.get(legacyHash) || pageBySlug.get(PAGE_ALIASES.get(legacyHash));
  const currentPage = pageBySlug.get(normalizedSlug) || legacyHashPage || PAGE_DEFS[0];
  const currentIndex = PAGE_DEFS.indexOf(currentPage);
  const currentSection = document.getElementById(currentPage.id);

  if (PAGE_ALIASES.has(requestedSlug)) {
    window.history.replaceState(null, "", pageUrl(currentPage));
  } else if (!pageBySlug.has(requestedSlug) && legacyHashPage) {
    window.history.replaceState(null, "", pageUrl(legacyHashPage));
  }

  document.title = `UEnv 使用文档 — ${currentPage.title}`;
  breadcrumbCurrent.textContent = currentPage.title;
  sections.forEach((section) => {
    const isCurrent = section.id === currentPage.id;
    section.hidden = !isCurrent;
    section.classList.toggle("is-current-page", isCurrent);
  });
  sidebarLinks.forEach((link) => {
    link.classList.toggle("active", pageFromLink(link)?.slug === currentPage.slug);
  });

  function renderPagination() {
    const previous = PAGE_DEFS[currentIndex - 1];
    const next = PAGE_DEFS[currentIndex + 1];
    const previousLink = previous
      ? `<a class="page-pagination-link previous" href="${pageUrl(previous)}"><span>上一页</span><strong>← ${previous.title}</strong></a>`
      : '<span class="page-pagination-spacer" aria-hidden="true"></span>';
    const nextLink = next
      ? `<a class="page-pagination-link next" href="${pageUrl(next)}"><span>下一页</span><strong>${next.title} →</strong></a>`
      : '<span class="page-pagination-spacer" aria-hidden="true"></span>';
    pagePagination.innerHTML = `${previousLink}<span class="page-pagination-count">${currentIndex + 1} / ${PAGE_DEFS.length}</span>${nextLink}`;
  }

  function renderToc() {
    const headings = Array.from(currentSection.querySelectorAll(":scope > h1, :scope > h2, :scope > h3, :scope > .overview-why > h2, :scope > .component-heading h2"));
    if (!headings.length) {
      tocNav.innerHTML = `<a class="active" href="#${currentPage.id}">${currentPage.title}</a>`;
      return;
    }
    headings.forEach((heading, index) => {
      if (!heading.id) heading.id = `${currentPage.id}-heading-${index + 1}`;
    });
    tocNav.innerHTML = headings
      .map((heading, index) => `<a class="${index === 0 ? "active" : ""}" href="#${heading.id}">${heading.textContent.trim()}</a>`)
      .join("");
  }

  renderPagination();
  renderToc();

  let storedTheme = null;
  try {
    storedTheme = localStorage.getItem("uenv-theme");
  } catch {
    storedTheme = null;
  }
  if (storedTheme === "light" || storedTheme === "dark") {
    root.dataset.theme = storedTheme;
  } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
    root.dataset.theme = "light";
  }

  themeButton.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem("uenv-theme", root.dataset.theme);
    } catch {
      // Storage may be unavailable in local file previews.
    }
  });

  function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarBackdrop.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  }

  menuButton.addEventListener("click", () => {
    const isOpen = sidebar.classList.toggle("open");
    sidebarBackdrop.classList.toggle("open", isOpen);
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });
  sidebarBackdrop.addEventListener("click", closeSidebar);
  sidebarLinks.forEach((link) => link.addEventListener("click", closeSidebar));

  document.querySelectorAll(".copy-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const target = document.getElementById(button.dataset.copyTarget);
      if (!target) return;
      await navigator.clipboard.writeText(target.innerText);
      const original = button.innerHTML;
      button.textContent = "已复制";
      setTimeout(() => { button.innerHTML = original; }, 1400);
    });
  });

  const searchable = PAGE_DEFS.map((page) => {
    const section = document.getElementById(page.id);
    return {
      ...page,
      text: section.textContent.replace(/\s+/g, " ").trim(),
    };
  });

  function renderResults(query = "") {
    const normalized = query.trim().toLowerCase();
    const matches = searchable
      .filter((item) => !normalized || item.title.toLowerCase().includes(normalized) || item.text.toLowerCase().includes(normalized))
      .slice(0, 7);
    if (!matches.length) {
      searchResults.innerHTML = '<div class="search-empty">没有找到相关内容</div>';
      return;
    }
    searchResults.innerHTML = matches
      .map((item, index) => `
        <button class="search-result${index === 0 ? " selected" : ""}" type="button" data-page="${item.slug}">
          <div><strong>${item.title}</strong><span>UEnv 使用文档 / ${item.title}</span></div><em>↵</em>
        </button>`)
      .join("");
    searchResults.querySelectorAll(".search-result").forEach((result) => {
      result.addEventListener("click", () => openResult(result.dataset.page));
    });
  }

  function openSearch() {
    searchDialog.hidden = false;
    document.body.style.overflow = "hidden";
    renderResults("");
    requestAnimationFrame(() => searchInput.focus());
  }

  function closeSearch() {
    searchDialog.hidden = true;
    document.body.style.overflow = "";
    searchInput.value = "";
  }

  function openResult(slug) {
    closeSearch();
    const page = pageBySlug.get(slug);
    if (page) window.location.href = pageUrl(page);
  }

  searchButton.addEventListener("click", openSearch);
  searchDialog.addEventListener("click", (event) => {
    if (event.target === searchDialog) closeSearch();
  });
  searchInput.addEventListener("input", () => renderResults(searchInput.value));
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const first = searchResults.querySelector(".search-result");
      if (first) openResult(first.dataset.page);
    }
  });
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openSearch();
    }
    if (event.key === "Escape") {
      if (!searchDialog.hidden) closeSearch();
      closeSidebar();
    }
  });
})();
