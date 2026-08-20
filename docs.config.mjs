/**
 * Public documentation navigation.
 *
 * The hierarchy is deliberately three levels deep:
 * user activity (section) -> topic (subsection) -> document (page).
 * Markdown H1 headings are the source of truth for page titles; the build
 * fails when a configured title and its H1 diverge.
 */
const navigation = [
  {
    title: "了解 UEnv",
    subsections: [
      {
        title: "概览",
        pages: [
          { file: "1-了解UEnv/01-index.md", slug: "overview", title: "UEnv 使用手册" },
        ],
      },
      {
        title: "核心概念",
        pages: [
          { file: "1-了解UEnv/02-architecture.md", slug: "architecture", title: "架构与组件" },
          { file: "1-了解UEnv/03-episode-lifecycle.md", slug: "episode-lifecycle", title: "一次 Episode 如何完成" },
        ],
      },
    ],
  },
  {
    title: "部署 UEnv",
    subsections: [
      {
        title: "部署方式",
        pages: [
          { file: "2-部署UEnv/01-single-node.md", slug: "basic-deployment", title: "单机部署" },
          { file: "2-部署UEnv/02-multi-node.md", slug: "multi-node-deployment", title: "多机部署" },
        ],
      },
      {
        title: "服务配置",
        pages: [
          { file: "2-部署UEnv/03-server.md", slug: "server", title: "配置 UEnv Server" },
          { file: "2-部署UEnv/04-worker-registration.md", slug: "worker-registration", title: "配置并注册 UEnv Worker" },
          { file: "2-部署UEnv/05-hub.md", slug: "hub", title: "部署和使用 UEnv Hub" },
        ],
      },
    ],
  },
  {
    title: "运行任务",
    subsections: [
      {
        title: "任务概览",
        pages: [
          { file: "3-运行任务/01-usage.md", slug: "usage", title: "使用指南" },
          { file: "3-运行任务/02-cases.md", slug: "cases", title: "案例库" },
        ],
      },
      {
        title: "评测",
        pages: [
          { file: "3-运行任务/03-evaluation.md", slug: "evaluation", title: "通用评测流程" },
          { file: "3-运行任务/04-evaluation-gsm8k.md", slug: "case-eval-gsm8k", title: "数学问答" },
          { file: "3-运行任务/05-evaluation-code.md", slug: "case-eval-code", title: "代码生成" },
          { file: "3-运行任务/06-evaluation-swe-verified.md", slug: "case-eval-swe", title: "代码修复" },
        ],
      },
      {
        title: "强化学习训练",
        pages: [
          { file: "3-运行任务/07-post-training.md", slug: "training", title: "强化学习训练指南" },
          { file: "3-运行任务/08-training-gsm8k-verl.md", slug: "case-train-gsm8k", title: "数学问答" },
          { file: "3-运行任务/09-training-code-verl.md", slug: "case-train-code", title: "代码生成" },
          { file: "3-运行任务/10-training-swe-smith-verl.md", slug: "case-train-swe", title: "代码修复" },
        ],
      },
      {
        title: "自定义环境",
        pages: [
          { file: "3-运行任务/11-process-plugin.md", slug: "custom-environment", title: "自定义环境" },
        ],
      },
      {
        title: "结果与轨迹",
        pages: [
          { file: "3-运行任务/12-trajectory.md", slug: "trajectory", title: "轨迹采集指南" },
        ],
      },
    ],
  },
  {
    title: "接入强化学习框架",
    subsections: [
      {
        title: "接口与实现",
        pages: [
          { file: "4-接入强化学习框架/01-integration.md", slug: "integration", title: "接入强化学习框架" },
          { file: "4-接入强化学习框架/02-contract.md", slug: "bridge-contract", title: "接口与数据契约" },
          { file: "4-接入强化学习框架/03-custom-framework.md", slug: "integration-custom", title: "自定义强化学习框架接入" },
        ],
      },
      {
        title: "生产化",
        pages: [
          { file: "4-接入强化学习框架/06-runtime-semantics.md", slug: "runtime-semantics", title: "生产运行语义" },
        ],
      },
      {
        title: "框架案例",
        pages: [
          { file: "4-接入强化学习框架/04-verl.md", slug: "integration-verl", title: "VeRL 强化学习接入" },
          { file: "4-接入强化学习框架/05-support-matrix.md", slug: "support-matrix", title: "支持状态与接入验收" },
        ],
      },
    ],
  },
  {
    title: "运维 UEnv",
    subsections: [
      {
        title: "运维流程",
        pages: [
          { file: "5-运维UEnv/01-operations.md", slug: "operations", title: "运行维护" },
          { file: "5-运维UEnv/02-troubleshooting.md", slug: "troubleshooting", title: "故障排查" },
        ],
      },
    ],
  },
  {
    title: "查阅参考",
    subsections: [
      {
        title: "名称与配置",
        pages: [
          { file: "6-查阅参考/01-glossary.md", slug: "glossary", title: "术语表" },
          { file: "6-查阅参考/02-configuration.md", slug: "configuration", title: "UEnv Server 与 UEnv Worker 配置参考" },
        ],
      },
      {
        title: "网络与协议",
        pages: [
          { file: "6-查阅参考/03-ports.md", slug: "ports", title: "端口与连接方向" },
          { file: "6-查阅参考/04-protocols.md", slug: "protocols", title: "协议与调用方向" },
        ],
      },
    ],
  },
];

export const sections = Object.freeze(navigation.map((section) => Object.freeze({
  ...section,
  subsections: Object.freeze(section.subsections.map((subsection) => Object.freeze({
    ...subsection,
    pages: Object.freeze(subsection.pages.map((page) => Object.freeze({ ...page }))),
  }))),
})));

export const documents = Object.freeze(
  sections.flatMap((section) =>
    section.subsections.flatMap((subsection) =>
      subsection.pages.map((page) => Object.freeze({
        ...page,
        section: section.title,
        subsection: subsection.title,
      })),
    ),
  ),
);

export const aliases = Object.freeze({
  "quick-start": "basic-deployment",
  workflow: "basic-deployment",
  "why-uenv": "overview",
  components: "architecture",
  protocol: "protocols",
  "data-flow": "episode-lifecycle",
  "uenv-bridge": "integration",
  "uenv-adapter": "server",
  "uenv-server": "server",
  adapter: "server",
  "uenv-worker": "worker-registration",
  "uenv-hub": "hub",
  "adapter-contract": "bridge-contract",
  "integration-openhands": "integration",
  "case-trajectory-swe": "trajectory",
  roadmap: "support-matrix",
});

export default Object.freeze({
  sourceDirectory: "../uenv_pre_release/Docs/guide",
  template: "website/docs/index.template.html",
  outputDirectory: "dist",
  sections,
  documents,
  aliases,
});
