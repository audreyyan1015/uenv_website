#!/usr/bin/env node

import { access, cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import GithubSlugger from "github-slugger";
import hljs from "highlight.js";
import MarkdownIt from "markdown-it";

import config from "../docs.config.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const mermaidRuntimePath = path.resolve(
  projectRoot,
  "node_modules/mermaid/dist/mermaid.min.js",
);

function fail(message) {
  throw new Error(message);
}

function parseArguments(argv) {
  const options = {
    check: false,
    sourceDirectory: process.env.UENV_DOCS_SOURCE_DIR || config.sourceDirectory,
    outputDirectory: process.env.UENV_DOCS_OUTPUT_DIR || config.outputDirectory,
    template: process.env.UENV_DOCS_TEMPLATE || config.template,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") {
      options.check = true;
      continue;
    }

    const optionNames = new Map([
      ["--source", "sourceDirectory"],
      ["--output", "outputDirectory"],
      ["--template", "template"],
    ]);
    const optionName = optionNames.get(argument);
    if (optionName) {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) fail(`${argument} requires a path`);
      options[optionName] = value;
      index += 1;
      continue;
    }

    if (argument === "--help" || argument === "-h") {
      console.log(`Usage: node scripts/build-docs.mjs [options]

Options:
  --check             Validate sources, links, headings, and template only
  --source <path>     Markdown directory (or UENV_DOCS_SOURCE_DIR)
  --output <path>     Build directory (or UENV_DOCS_OUTPUT_DIR)
  --template <path>   Documentation HTML template
  --help              Show this help`);
      process.exit(0);
    }

    fail(`Unknown argument: ${argument}`);
  }

  return options;
}

function resolveFromProject(value) {
  return path.isAbsolute(value) ? path.normalize(value) : path.resolve(projectRoot, value);
}

async function fileExists(filename) {
  try {
    await access(filename);
    return true;
  } catch {
    return false;
  }
}

function validateConfiguration() {
  if (!Array.isArray(config.sections) || config.sections.length === 0) {
    fail("docs.config.mjs must define at least one navigation section");
  }
  if (!Array.isArray(config.documents) || config.documents.length === 0) {
    fail("docs.config.mjs must define at least one document");
  }

  const slugs = new Set();
  const files = new Set();
  const sectionTitles = new Set();
  const configuredDocuments = [];
  for (const [sectionIndex, section] of config.sections.entries()) {
    if (!section || typeof section.title !== "string" || !section.title.trim()) {
      fail(`Navigation section ${sectionIndex + 1} must have a title`);
    }
    if (sectionTitles.has(section.title)) fail(`Duplicate navigation section: ${section.title}`);
    if (!Array.isArray(section.subsections) || section.subsections.length === 0) {
      fail(`Navigation section ${section.title} must contain at least one subsection`);
    }
    sectionTitles.add(section.title);
    const subsectionTitles = new Set();
    for (const [subsectionIndex, subsection] of section.subsections.entries()) {
      if (!subsection || typeof subsection.title !== "string" || !subsection.title.trim()) {
        fail(
          `Navigation subsection ${section.title}/${subsectionIndex + 1} must have a title`,
        );
      }
      if (subsectionTitles.has(subsection.title)) {
        fail(`Duplicate navigation subsection in ${section.title}: ${subsection.title}`);
      }
      if (!Array.isArray(subsection.pages) || subsection.pages.length === 0) {
        fail(`Navigation subsection ${section.title}/${subsection.title} must contain pages`);
      }
      subsectionTitles.add(subsection.title);
      configuredDocuments.push(
        ...subsection.pages.map((page) => ({
          ...page,
          section: section.title,
          subsection: subsection.title,
        })),
      );
    }
  }

  if (JSON.stringify(configuredDocuments) !== JSON.stringify(config.documents)) {
    fail("config.documents must be the ordered section/subsection/page flattening");
  }

  for (const [index, document] of config.documents.entries()) {
    if (!document || typeof document !== "object") {
      fail(`Document ${index + 1} must be an object`);
    }
    for (const field of ["file", "slug", "title"]) {
      if (typeof document[field] !== "string" || !document[field].trim()) {
        fail(`Document ${index + 1} has an invalid ${field}`);
      }
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(document.slug)) {
      fail(`Document slug must be stable ASCII kebab-case: ${document.slug}`);
    }
    if (slugs.has(document.slug)) fail(`Duplicate document slug: ${document.slug}`);
    if (files.has(document.file)) fail(`Duplicate document source: ${document.file}`);
    if (!sectionTitles.has(document.section)) {
      fail(`Document ${document.file} has an unknown navigation section: ${document.section}`);
    }
    if (typeof document.subsection !== "string" || !document.subsection.trim()) {
      fail(`Document ${document.file} has an invalid navigation subsection`);
    }
    slugs.add(document.slug);
    files.add(document.file);
  }

  const completePageList = config.documents.map((document) => ({
    slug: document.slug,
    id: document.slug,
    title: document.title,
    section: document.section,
    subsection: document.subsection,
    source: document.file,
  }));
  const completeSlugs = new Set();
  const completeIds = new Set();
  for (const page of completePageList) {
    if (!page.slug || !page.id || !page.title) fail("Every page must have a slug, id, and title");
    if (completeSlugs.has(page.slug)) fail(`Duplicate page slug: ${page.slug}`);
    if (completeIds.has(page.id)) fail(`Duplicate page id: ${page.id}`);
    completeSlugs.add(page.slug);
    completeIds.add(page.id);
  }

  for (const [alias, target] of Object.entries(config.aliases || {})) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(alias)) {
      fail(`Page alias must be stable ASCII kebab-case: ${alias}`);
    }
    if (completeSlugs.has(alias)) fail(`Page alias conflicts with a page slug: ${alias}`);
    if (!completeSlugs.has(target)) fail(`Page alias ${alias} points to unknown slug: ${target}`);
  }

  return completePageList;
}

function visibleInlineText(inline) {
  if (!inline) return "";
  return (inline.children || [])
    .filter((child) => child.type !== "html_inline")
    .map((child) => child.type === "softbreak" ? " " : child.content)
    .join("") || inline.content || "";
}

function createMarkdownRenderer() {
  const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: false,
    highlight(code, language) {
      const normalizedLanguage = language.trim().toLowerCase();
      if (normalizedLanguage && hljs.getLanguage(normalizedLanguage)) {
        return hljs.highlight(code, {
          language: normalizedLanguage,
          ignoreIllegals: true,
        }).value;
      }
      return md.utils.escapeHtml(code);
    },
  });

  // markdown-it enables fenced code blocks and GFM-style tables by default.
  // Assign heading IDs during token processing so links can be validated before
  // rendering and duplicate headings follow GitHub's suffix rules.
  md.core.ruler.push("uenv_heading_ids", (state) => {
    const slugger = new GithubSlugger();
    const headingIds = new Set();
    for (let index = 0; index < state.tokens.length; index += 1) {
      const token = state.tokens[index];
      if (token.type !== "heading_open") continue;
      const inline = state.tokens[index + 1];
      if (!inline || inline.type !== "inline") continue;
      const visibleHeading = visibleInlineText(inline);
      const localId = slugger.slug(visibleHeading);
      const id = state.env.pageSlug ? `${state.env.pageSlug}--${localId}` : localId;
      token.attrSet("id", id);
      headingIds.add(localId);
    }
    state.env.headingIds = headingIds;
  });

  const defaultFenceRenderer = md.renderer.rules.fence;
  md.renderer.rules.fence = (tokens, index, options, env, self) => {
    const token = tokens[index];
    const language = token.info.trim().split(/\s+/u)[0].toLowerCase();
    if (language === "mermaid") {
      const source = md.utils.escapeHtml(token.content.trimEnd());
      return `<figure class="mermaid-figure">
<div class="mermaid" data-mermaid-pending>${source}</div>
</figure>\n`;
    }
    let rendered = defaultFenceRenderer(tokens, index, options, env, self);
    rendered = rendered.includes('<code class="')
      ? rendered.replace('<code class="', '<code class="hljs ')
      : rendered.replace("<code>", '<code class="hljs">');
    if (!language) return rendered.replace("<pre>", '<pre class="code-block">');
    return rendered.replace(
      "<pre>",
      `<pre class="code-block" data-language="${md.utils.escapeHtml(language)}">`,
    );
  };

  md.renderer.rules.table_open = (tokens, index, options, env, self) =>
    `<div class="table-scroll" tabindex="0">${self.renderToken(tokens, index, options)}`;
  md.renderer.rules.table_close = (tokens, index, options, env, self) =>
    `${self.renderToken(tokens, index, options)}</div>`;

  return md;
}

function walkTokens(tokens, callback) {
  for (const token of tokens) {
    callback(token);
    if (Array.isArray(token.children)) walkTokens(token.children, callback);
  }
}

function decodeUrlPart(value, context) {
  try {
    return decodeURIComponent(value);
  } catch {
    fail(`Invalid URL encoding in ${context}: ${value}`);
  }
}

function splitHref(href) {
  const hashIndex = href.indexOf("#");
  const beforeHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const rawFragment = hashIndex >= 0 ? href.slice(hashIndex + 1) : "";
  const queryIndex = beforeHash.indexOf("?");
  return {
    pathname: queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash,
    query: queryIndex >= 0 ? beforeHash.slice(queryIndex) : "",
    fragment: rawFragment ? decodeUrlPart(rawFragment, `link ${href}`) : "",
  };
}

function isExternalHref(href) {
  return /^(?:https?:)?\/\//iu.test(href);
}

function isRelativeMarkdownHref(href) {
  if (!href || href.startsWith("#") || href.startsWith("?") || href.startsWith("/")) return false;
  if (/^[a-z][a-z\d+.-]*:/iu.test(href) || href.startsWith("//")) return false;
  const { pathname } = splitHref(href);
  return decodeUrlPart(pathname, `link ${href}`).toLowerCase().endsWith(".md");
}

function assertHeadingTarget(targetDocument, fragment, sourceLabel, originalHref) {
  if (!fragment) return;
  if (!targetDocument.headingIds.has(fragment)) {
    fail(
      `Broken heading link in ${sourceLabel}: ${originalHref} ` +
        `(heading #${fragment} does not exist in ${targetDocument.file})`,
    );
  }
}

function isLocalAssetHref(href) {
  if (!href || href.startsWith("#") || href.startsWith("?") || href.startsWith("/")) {
    return false;
  }
  if (isExternalHref(href) || /^[a-z][a-z\d+.-]*:/iu.test(href) || href.startsWith("//")) {
    return false;
  }
  return !isRelativeMarkdownHref(href);
}

function assetOutputHref(relativePath, query, fragment) {
  const encodedPath = relativePath
    .split(path.sep)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `./${encodedPath}${query}${fragment ? `#${encodeURIComponent(fragment)}` : ""}`;
}

async function planLocalAsset(
  token,
  attribute,
  originalHref,
  sourceDocument,
  sourceDirectory,
  assetsByRelativePath,
) {
  const { pathname, query, fragment } = splitHref(originalHref);
  const decodedPathname = decodeUrlPart(pathname, `asset ${originalHref}`);
  const sourcePath = path.resolve(path.dirname(sourceDocument.absolutePath), decodedPathname);
  const relativePath = path.relative(sourceDirectory, sourcePath);

  if (!relativePath || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
    fail(
      `Local asset must stay inside the documentation source directory in ` +
        `${sourceDocument.file}: ${originalHref}`,
    );
  }
  if (!(await fileExists(sourcePath))) {
    fail(`Missing local asset in ${sourceDocument.file}: ${originalHref}`);
  }
  const sourceStats = await stat(sourcePath);
  if (!sourceStats.isFile()) {
    fail(`Local asset is not a file in ${sourceDocument.file}: ${originalHref}`);
  }

  const normalizedRelativePath = path.normalize(relativePath);
  const existingSource = assetsByRelativePath.get(normalizedRelativePath);
  if (existingSource && existingSource !== sourcePath) {
    fail(`Multiple local assets map to ${normalizedRelativePath}`);
  }
  assetsByRelativePath.set(normalizedRelativePath, sourcePath);
  token.attrSet(attribute, assetOutputHref(normalizedRelativePath, query, fragment));
}

async function rewriteAndValidateLinks(parsedDocuments, documentsByPath, sourceDirectory) {
  const assetsByRelativePath = new Map();
  for (const sourceDocument of parsedDocuments) {
    const relevantTokens = [];
    walkTokens(sourceDocument.tokens, (token) => {
      if (token.type === "link_open" || token.type === "image") relevantTokens.push(token);
    });

    for (const token of relevantTokens) {
      const attribute = token.type === "image" ? "src" : "href";
      const href = token.attrGet(attribute);
      if (!href) continue;

      if (token.type === "image") {
        if (isLocalAssetHref(href)) {
          await planLocalAsset(
            token,
            attribute,
            href,
            sourceDocument,
            sourceDirectory,
            assetsByRelativePath,
          );
        }
        continue;
      }

      if (isExternalHref(href)) {
        token.attrSet("target", "_blank");
        token.attrSet("rel", "noopener noreferrer");
        continue;
      }

      if (href.startsWith("#")) {
        const fragment = decodeUrlPart(href.slice(1), `link ${href}`);
        assertHeadingTarget(sourceDocument, fragment, sourceDocument.file, href);
        token.attrSet("href", `#${sourceDocument.slug}--${fragment}`);
        continue;
      }

      if (!isRelativeMarkdownHref(href)) {
        if (isLocalAssetHref(href)) {
          await planLocalAsset(
            token,
            attribute,
            href,
            sourceDocument,
            sourceDirectory,
            assetsByRelativePath,
          );
        }
        continue;
      }
      const { pathname, query, fragment } = splitHref(href);
      if (query) fail(`Queries on Markdown links are not supported in ${sourceDocument.file}: ${href}`);

      const decodedPathname = decodeUrlPart(pathname, `link ${href}`);
      const targetPath = path.resolve(path.dirname(sourceDocument.absolutePath), decodedPathname);
      const targetDocument = documentsByPath.get(path.normalize(targetPath));
      if (!targetDocument) {
        fail(`Broken document link in ${sourceDocument.file}: ${href}`);
      }
      assertHeadingTarget(targetDocument, fragment, sourceDocument.file, href);
      token.attrSet(
        "href",
        `?page=${encodeURIComponent(targetDocument.slug)}${fragment ? `#${targetDocument.slug}--${fragment}` : ""}`,
      );
    }
  }
  return [...assetsByRelativePath.entries()].map(([relativePath, sourcePath]) => ({
    relativePath,
    sourcePath,
  }));
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function serializeForInlineScript(value) {
  return JSON.stringify(value, null, 2)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

function renderPageData(pages, aliases) {
  return `<script>
window.__UENV_DOC_PAGES__ = ${serializeForInlineScript(pages)};
window.__UENV_DOC_ALIASES__ = ${serializeForInlineScript(aliases || {})};
</script>`;
}

function renderSidebar(sections, documents) {
  const documentsBySlug = new Map(documents.map((document) => [document.slug, document]));
  return sections
    .map((section, sectionIndex) => {
      const subsections = section.subsections.map((subsection) => {
        const links = subsection.pages.map((page) => {
          const document = documentsBySlug.get(page.slug);
          if (!document) fail(`Navigation references an unread document: ${page.slug}`);
          return `<a class="sidebar-link" href="?page=${encodeURIComponent(document.slug)}">${escapeHtml(document.title)}</a>`;
        });
        return `<div class="sidebar-subsection">
    <p class="sidebar-subsection-label">${escapeHtml(subsection.title)}</p>
    ${links.join("\n    ")}
  </div>`;
      });
      return `<details class="sidebar-section" data-section="${escapeHtml(section.title)}"${sectionIndex === 0 ? " open" : ""}>
  <summary class="sidebar-label"><span>${escapeHtml(section.title)}</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 8 3 3 3-3"></path></svg></summary>
  <div class="sidebar-section-content">
  ${subsections.join("\n  ")}
  </div>
</details>`;
    })
    .join("\n");
}

function renderTopnav(sections) {
  return sections.map((section) => {
    const firstPage = section.subsections[0]?.pages[0];
    if (!firstPage) fail(`Navigation section has no first page: ${section.title}`);
    return `<a class="topnav-link" data-section="${escapeHtml(section.title)}" href="?page=${encodeURIComponent(firstPage.slug)}">${escapeHtml(section.title)}</a>`;
  }).join("\n          ");
}

function renderDocumentSections(documents, md) {
  return documents
    .map((document, index) => {
      const renderedMarkdown = md.renderer.render(document.tokens, md.options, document.environment);
      const initialState = index === 0 ? " is-current-page" : "";
      const hidden = index === 0 ? "" : " hidden";
      return `<section class="doc-section markdown-body${initialState}" id="${escapeHtml(document.slug)}" data-title="${escapeHtml(document.title)}" data-source="${escapeHtml(document.file)}"${hidden}>
${renderedMarkdown.trimEnd()}
</section>`;
    })
    .join("\n\n");
}

function injectSingleMarker(template, name, content) {
  const marker = `<!-- DOCS:${name} -->`;
  const count = template.split(marker).length - 1;
  if (count !== 1) {
    fail(`Template must contain exactly one ${marker} marker (found ${count})`);
  }
  return template.replace(marker, content);
}

function injectTemplate(template, replacements) {
  let result = template;
  for (const [name, content] of Object.entries(replacements)) {
    result = injectSingleMarker(result, name, content);
  }
  return result;
}

function validateRenderedPage(renderedPage, pages) {
  if (/data-language="mermaid"|language-mermaid/iu.test(renderedPage)) {
    fail("Mermaid fences must render as diagrams, not highlighted code blocks");
  }
  const allIds = new Map();
  for (const match of renderedPage.matchAll(/\sid="([^"]+)"/gu)) {
    const id = match[1];
    allIds.set(id, (allIds.get(id) || 0) + 1);
  }
  const duplicateIds = [...allIds.entries()]
    .filter(([, count]) => count > 1)
    .map(([id]) => id);
  if (duplicateIds.length) {
    fail(`Generated HTML contains duplicate id values: ${duplicateIds.join(", ")}`);
  }

  const documentSectionIds = new Set();
  for (const match of renderedPage.matchAll(/<section\b[^>]*>/giu)) {
    const tag = match[0];
    const className = tag.match(/\sclass="([^"]*)"/iu)?.[1] || "";
    if (!className.split(/\s+/u).includes("doc-section")) continue;
    const id = tag.match(/\sid="([^"]+)"/iu)?.[1];
    if (id) documentSectionIds.add(id);
  }
  const missingSections = pages
    .filter((page) => !documentSectionIds.has(page.id))
    .map((page) => page.id);
  if (missingSections.length) {
    fail(`Template is missing doc-section elements for: ${missingSections.join(", ")}`);
  }
}

async function selectTemplate(requestedTemplate, allowFallback) {
  const requestedPath = resolveFromProject(requestedTemplate);
  if (await fileExists(requestedPath)) return requestedPath;

  // The fallback is diagnostic-only: production builds must always use the
  // explicit template so generated output can never become the next template.
  if (allowFallback && requestedTemplate === config.template && config.fallbackTemplate) {
    const fallbackPath = resolveFromProject(config.fallbackTemplate);
    if (await fileExists(fallbackPath)) {
      console.warn(`Template ${path.relative(projectRoot, requestedPath)} is missing; checking fallback ${path.relative(projectRoot, fallbackPath)}`);
      return fallbackPath;
    }
  }
  fail(`Template does not exist: ${requestedPath}`);
}

async function readDocuments(sourceDirectory, md) {
  const missingFiles = [];
  const documents = [];

  for (const definition of config.documents) {
    const absolutePath = path.resolve(sourceDirectory, definition.file);
    const relativePath = path.relative(sourceDirectory, absolutePath);
    if (!relativePath || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
      fail(`Document source must stay inside the documentation directory: ${definition.file}`);
    }
    if (!(await fileExists(absolutePath))) {
      missingFiles.push(definition.file);
      continue;
    }
    const markdown = await readFile(absolutePath, "utf8");
    const environment = { source: definition.file, pageSlug: definition.slug };
    const tokens = md.parse(markdown, environment);
    const firstHeadingIndex = tokens.findIndex((token) => token.type === "heading_open");
    const firstHeading = tokens[firstHeadingIndex];
    if (firstHeadingIndex !== 0 || !firstHeading || firstHeading.tag !== "h1") {
      fail(`${definition.file} must start with an H1 heading`);
    }
    const sourceTitle = visibleInlineText(tokens[firstHeadingIndex + 1]).trim();
    if (sourceTitle !== definition.title) {
      fail(
        `${definition.file} navigation title must equal its H1: ` +
          `configured "${definition.title}", source "${sourceTitle}"`,
      );
    }
    documents.push({
      ...definition,
      absolutePath: path.normalize(absolutePath),
      markdown,
      tokens,
      environment,
      headingIds: environment.headingIds || new Set(),
    });
  }

  if (missingFiles.length) {
    fail(`Missing Markdown source file(s) in ${sourceDirectory}: ${missingFiles.join(", ")}`);
  }
  return documents;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const sourceDirectory = resolveFromProject(options.sourceDirectory);
  const outputDirectory = resolveFromProject(options.outputDirectory);
  const websiteDirectory = path.resolve(projectRoot, "website");
  if (!(await fileExists(mermaidRuntimePath))) {
    fail("Local Mermaid runtime is missing; run npm ci before checking or building docs");
  }
  const completePageList = validateConfiguration();
  const md = createMarkdownRenderer();
  const parsedDocuments = await readDocuments(sourceDirectory, md);
  const documentsByPath = new Map(
    parsedDocuments.map((document) => [document.absolutePath, document]),
  );

  const localAssets = await rewriteAndValidateLinks(
    parsedDocuments,
    documentsByPath,
    sourceDirectory,
  );

  const templatePath = await selectTemplate(options.template, options.check);
  const template = await readFile(templatePath, "utf8");
  const renderedPage = injectTemplate(template, {
    PAGE_DATA: renderPageData(completePageList, config.aliases),
    TOPNAV: renderTopnav(config.sections),
    SIDEBAR: renderSidebar(config.sections, parsedDocuments),
    CONTENT: renderDocumentSections(parsedDocuments, md),
  });

  if (renderedPage.includes("<!-- DOCS:")) {
    fail("An unrecognized DOCS template marker remains after rendering");
  }
  validateRenderedPage(renderedPage, completePageList);

  if (options.check) {
    console.log(`Documentation check passed: ${parsedDocuments.length} files, ${completePageList.length} pages`);
    return;
  }

  const outputName = path.basename(outputDirectory);
  if (
    path.dirname(outputDirectory) !== projectRoot ||
    !/^(?:dist|build)(?:[-_][a-z0-9]+)*$/iu.test(outputName)
  ) {
    fail(`Refusing to replace unsafe output directory: ${outputDirectory}`);
  }
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });
  const sourceOnlyPaths = new Set([
    path.join("docs", "README.md"),
    path.join("docs", "index.html"),
    path.join("docs", "index.html.bak"),
  ]);
  await cp(websiteDirectory, outputDirectory, {
    recursive: true,
    filter(source) {
      const normalizedSource = path.normalize(source);
      if (normalizedSource === path.normalize(templatePath)) return false;
      const relativeSource = path.relative(websiteDirectory, normalizedSource);
      return !sourceOnlyPaths.has(relativeSource);
    },
  });
  const outputDocsDirectory = path.join(outputDirectory, "docs");
  await mkdir(outputDocsDirectory, { recursive: true });
  await cp(mermaidRuntimePath, path.join(outputDocsDirectory, "mermaid.min.js"));
  for (const asset of localAssets) {
    const assetOutputPath = path.join(outputDocsDirectory, asset.relativePath);
    if (await fileExists(assetOutputPath)) {
      fail(`Local documentation asset conflicts with a website file: ${asset.relativePath}`);
    }
    await mkdir(path.dirname(assetOutputPath), { recursive: true });
    await cp(asset.sourcePath, assetOutputPath);
  }
  await writeFile(path.join(outputDocsDirectory, "index.html"), renderedPage, "utf8");

  console.log(
    `Built ${parsedDocuments.length} Markdown documents and ${localAssets.length} local assets into ${path.relative(projectRoot, outputDirectory) || "."}`,
  );
}

main().catch((error) => {
  console.error(`Documentation build failed: ${error.message}`);
  process.exitCode = 1;
});
