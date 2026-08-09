/**
 * The five Markdown documents are the source of truth for the user-guide
 * section. Keep public slugs stable even if a source filename or title changes.
 */
export const documents = Object.freeze([
  {
    file: "UEnv基础部署指南.md",
    slug: "basic-deployment",
    title: "基础部署指南",
  },
  {
    file: "UEnv多机部署指南.md",
    slug: "multi-node-deployment",
    title: "多机部署指南",
  },
  {
    file: "UEnv Hub使用指南.md",
    slug: "hub",
    title: "UEnv Hub 使用指南",
  },
  {
    file: "UEnv评测指南.md",
    slug: "evaluation",
    title: "评测指南",
  },
  {
    file: "UEnv训练指南.md",
    slug: "training",
    title: "训练指南",
  },
]);

export const staticPagesBefore = Object.freeze([
  { slug: "overview", id: "overview", title: "概览" },
]);

export const staticPagesAfter = Object.freeze([
  { slug: "architecture", id: "architecture", title: "架构总览" },
  { slug: "data-flow", id: "data-flow", title: "Episode 数据流" },
  { slug: "uenv-bridge", id: "uenv-bridge", title: "uenv-bridge" },
  { slug: "uenv-server", id: "uenv-server", title: "uenv-server" },
  { slug: "uenv-worker", id: "uenv-worker", title: "uenv-worker" },
  { slug: "uenv-hub", id: "uenv-hub", title: "uenv-hub" },
]);

export default Object.freeze({
  sourceDirectory: "../uenv_pre_release/Docs/deployment",
  template: "website/docs/index.template.html",
  fallbackTemplate: "website/docs/index.html",
  outputDirectory: "dist",
  documents,
  staticPagesBefore,
  staticPagesAfter,
});
