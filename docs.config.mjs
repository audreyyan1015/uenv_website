/**
 * Public documentation navigation.
 *
 * Markdown under `uenv_pre_release/Docs/guide` is the single source of truth.
 * Keep public slugs stable and use `aliases` when a public concept is renamed.
 */

const page = (file, slug, title) => Object.freeze({ file, slug, title });
const subsection = (title, pages) => Object.freeze({
  title,
  pages: Object.freeze(pages),
});
const section = (title, { pages = [], subsections = [] }) => Object.freeze({
  title,
  pages: Object.freeze(pages),
  subsections: Object.freeze(subsections),
});

export const sections = Object.freeze([
  section("了解 UEnv", {
    pages: [
      page("index.md", "overview", "UEnv 使用手册"),
      page("concepts/architecture.md", "architecture", "架构与组件"),
      page("concepts/episode-lifecycle.md", "episode-lifecycle", "一次 Episode 如何完成"),
    ],
  }),
  section("部署 UEnv", {
    subsections: [
      subsection("部署方式", [
        page("deployment/single-node.md", "basic-deployment", "单机部署"),
        page("deployment/multi-node.md", "multi-node-deployment", "多机部署"),
      ]),
      subsection("连接服务", [
        page("deployment/server.md", "server", "配置 UEnv Server"),
        page("deployment/worker-registration.md", "worker-registration", "配置并注册 Worker"),
        page("deployment/hub.md", "hub", "部署和使用 Hub"),
      ]),
    ],
  }),
  section("运行任务", {
    subsections: [
      subsection("任务概览", [
        page("usage/README.md", "usage", "使用指南"),
        page("cases/README.md", "cases", "案例库"),
      ]),
      subsection("评测", [
        page("usage/evaluation.md", "evaluation", "通用评测流程"),
        page("cases/evaluation-gsm8k.md", "case-eval-gsm8k", "数学问答"),
        page("cases/evaluation-code.md", "case-eval-code", "代码生成"),
        page("cases/evaluation-swe-verified.md", "case-eval-swe", "软件工程修复"),
      ]),
      subsection("强化学习训练", [
        page("usage/post-training.md", "training", "强化学习训练指南"),
        page("cases/training-gsm8k-verl.md", "case-train-gsm8k", "数学问答"),
        page("cases/training-code-verl.md", "case-train-code", "代码生成"),
        page("cases/training-process-plugin.md", "case-train-plugin", "自定义环境"),
        page("cases/training-swe-smith-verl.md", "case-train-swe", "软件工程修复"),
      ]),
      subsection("结果与轨迹", [
        page("usage/trajectory.md", "trajectory", "轨迹采集指南"),
      ]),
    ],
  }),
  section("接入强化学习框架", {
    pages: [
      page("integration/README.md", "integration", "强化学习框架接入指南"),
      page("integration/contract.md", "integration-contract", "强化学习 Bridge 接入契约"),
      page("integration/verl.md", "integration-verl", "VeRL 强化学习接入"),
      page("integration/custom-framework.md", "integration-custom", "自定义强化学习框架接入"),
      page("integration/support-matrix.md", "support-matrix", "强化学习框架支持矩阵"),
    ],
  }),
  section("运维 UEnv", {
    subsections: [
      subsection("运维流程", [
        page("deployment/operations.md", "operations", "运行维护"),
        page("reference/troubleshooting.md", "troubleshooting", "故障排查"),
      ]),
    ],
  }),
  section("查阅参考", {
    pages: [
      page("reference/glossary.md", "glossary", "术语表"),
      page("reference/ports.md", "ports", "端口与连接方向"),
      page("reference/configuration.md", "configuration", "Server 与 Worker 配置参考"),
      page("reference/protocols.md", "protocols", "协议与调用方向"),
    ],
  }),
]);

function flattenSections(navigationSections) {
  return navigationSections.flatMap((navigationSection) => [
    ...navigationSection.pages.map((document) => Object.freeze({
      ...document,
      section: navigationSection.title,
      subsection: "",
    })),
    ...navigationSection.subsections.flatMap((navigationSubsection) =>
      navigationSubsection.pages.map((document) => Object.freeze({
        ...document,
        section: navigationSection.title,
        subsection: navigationSubsection.title,
      })),
    ),
  ]);
}

export const documents = Object.freeze(flattenSections(sections));

export const aliases = Object.freeze({
  "quick-start": "basic-deployment",
  workflow: "basic-deployment",
  "why-uenv": "overview",
  components: "architecture",
  protocol: "protocols",
  "data-flow": "episode-lifecycle",
  "uenv-bridge": "integration",
  adapter: "server",
  "uenv-server": "server",
  "uenv-worker": "worker-registration",
  "uenv-hub": "hub",
  "adapter-contract": "integration-contract",
  "integration-openhands": "integration",
  "case-trajectory-swe": "trajectory",
  roadmap: "support-matrix",
});

export default Object.freeze({
  sourceDirectory: "../uenv_pre_release/Docs/guide",
  sourceRepositoryRoot: "../..",
  sourceRepositoryUrl: "https://github.com/audreyyan1015/uenv_pre_release",
  sourceRepositoryRef: "main",
  template: "website/docs/index.template.html",
  outputDirectory: "dist",
  sections,
  documents,
  aliases,
});
