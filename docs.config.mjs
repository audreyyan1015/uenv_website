// Navigation for the current UEnv handbook. Titles match Markdown H1 headings.
const navigation = [
  {
    "title": "认识 UEnv",
    "subsections": [
      {
        "title": "系统概览",
        "pages": [
          {
            "file": "01-认识UEnv/1.1-UEnv的定位与使用场景.md",
            "slug": "introduction",
            "title": "UEnv 的定位与使用场景"
          },
          {
            "file": "01-认识UEnv/1.2-系统组成与任务执行流程.md",
            "slug": "architecture",
            "title": "系统组成与任务执行流程"
          }
        ]
      }
    ]
  },
  {
    "title": "安装部署",
    "subsections": [
      {
        "title": "部署方式",
        "pages": [
          {
            "file": "02-安装部署与环境准备/2.1-安装与运行环境准备.md",
            "slug": "preparation",
            "title": "安装与运行环境准备"
          },
          {
            "file": "02-安装部署与环境准备/2.2-单机部署.md",
            "slug": "basic-deployment",
            "title": "单机部署"
          },
          {
            "file": "02-安装部署与环境准备/2.3-多机部署.md",
            "slug": "multi-node-deployment",
            "title": "多机部署"
          },
          {
            "file": "02-安装部署与环境准备/2.5-部署配置.md",
            "slug": "deployment-config",
            "title": "部署配置"
          }
        ]
      }
    ]
  },
  {
    "title": "运行任务",
    "subsections": [
      {
        "title": "配置与执行",
        "pages": [
          {
            "file": "03-配置与运行任务/3.2-运行评测.md",
            "slug": "evaluation",
            "title": "运行评测"
          },
          {
            "file": "03-配置与运行任务/3.3-以轨迹采集为目的运行任务.md",
            "slug": "trajectory",
            "title": "轨迹采集"
          },
          {
            "file": "03-配置与运行任务/3.4-使用VeRL训练.md",
            "slug": "training",
            "title": "强化学习训练"
          }
        ]
      }
    ]
  },
  {
    "title": "扩展 UEnv",
    "subsections": [
      {
        "title": "开发与接入",
        "pages": [
          {
            "file": "04-扩展UEnv/4.1-接入新的数据集.md",
            "slug": "custom-dataset",
            "title": "接入新的数据集"
          },
          {
            "file": "04-扩展UEnv/4.2-定义新的智能体.md",
            "slug": "custom-agent",
            "title": "定义新的智能体"
          },
          {
            "file": "04-扩展UEnv/4.3-定义新的工具.md",
            "slug": "custom-tool",
            "title": "定义新的工具"
          },
          {
            "file": "04-扩展UEnv/4.4-接入新的训练框架.md",
            "slug": "integration-custom",
            "title": "接入新的训练框架"
          }
        ]
      }
    ]
  },
  {
    "title": "完整示例",
    "subsections": [
      {
        "title": "示例入口",
        "pages": [
          {
            "file": "examples/datasets/README.md",
            "slug": "cases",
            "title": "数据集示例"
          }
        ]
      },
      {
        "title": "数据集",
        "pages": [
          {
            "file": "examples/datasets/gsm8k/README.md",
            "slug": "dataset-gsm8k",
            "title": "GSM8K 全量示例"
          },
          {
            "file": "examples/datasets/pubmedqa/README.md",
            "slug": "dataset-pubmedqa",
            "title": "pubmedqa 全量示例"
          },
          {
            "file": "examples/datasets/olymmath/README.md",
            "slug": "dataset-olymmath",
            "title": "olymmath 全量示例"
          },
          {
            "file": "examples/datasets/scitab/README.md",
            "slug": "dataset-scitab",
            "title": "scitab 全量示例"
          },
          {
            "file": "examples/datasets/dscodebench/README.md",
            "slug": "dataset-dscodebench",
            "title": "dscodebench 全量示例"
          },
          {
            "file": "examples/datasets/swe_lite/README.md",
            "slug": "dataset-swe-lite",
            "title": "swe_lite 全量示例"
          },
          {
            "file": "examples/datasets/swe_verified/README.md",
            "slug": "dataset-swe-verified",
            "title": "swe_verified 全量示例"
          },
          {
            "file": "examples/datasets/swe_pro/README.md",
            "slug": "dataset-swe-pro",
            "title": "swe_pro 全量示例"
          },
          {
            "file": "examples/datasets/swe_smith/README.md",
            "slug": "dataset-swe-smith",
            "title": "swe_smith 全量示例"
          }
        ]
      }
    ]
  },
{
  "title": "维护者说明",
  "subsections": [
    {
      "title": "源码、部署与验收",
      "pages": [
        {
          "file": "维护者说明/仓库修改说明.md",
          "slug": "maintenance-source",
          "title": "仓库修改说明"
        },
        {
          "file": "维护者说明/真实部署验收.md",
          "slug": "maintenance-live-acceptance",
          "title": "真实部署与维护验收（2026-09-18）"
        },
        {
          "file": "维护者说明/自定义部署与源码构建.md",
          "slug": "maintenance-custom-build",
          "title": "自定义部署与源码构建"
        },
        {
          "file": "维护者说明/自动部署实现与验收.md",
          "slug": "maintenance-installer",
          "title": "安装部署实现与验收"
        },
        {
          "file": "维护者说明/示例覆盖与验证.md",
          "slug": "maintenance-examples",
          "title": "示例覆盖与验证"
        },
        {
          "file": "维护者说明/Registry迁移.md",
          "slug": "maintenance-registry-migration",
          "title": "Registry 分发切换"
        }
      ]
    }
  ]
}
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
  "custom-environment": "custom-dataset",
  "examples": "cases",
  "usage": "evaluation",
  "run-configuration": "evaluation",
  "quick-start": "basic-deployment",
  "workflow": "basic-deployment",
  "overview": "introduction",
  "why-uenv": "introduction",
  "components": "architecture",
  "episode-lifecycle": "architecture",
  "data-flow": "architecture",
  "integration": "integration-custom",
  "bridge-contract": "integration-custom",
  "runtime-semantics": "integration-custom",
  "support-matrix": "integration-custom",
  "uenv-bridge": "integration-custom",
  "adapter-contract": "integration-custom",
  "integration-openhands": "integration-custom",
  "roadmap": "integration-custom",
  "integration-verl": "training",
  "server": "basic-deployment",
  "uenv-adapter": "basic-deployment",
  "uenv-server": "basic-deployment",
  "adapter": "basic-deployment",
  "worker-registration": "multi-node-deployment",
  "uenv-worker": "multi-node-deployment",
  "hub": "basic-deployment",
  "uenv-hub": "basic-deployment",
  "case-trajectory-swe": "trajectory",
  "case-eval-gsm8k": "dataset-gsm8k",
  "case-train-gsm8k": "dataset-gsm8k",
  "case-eval-code": "dataset-dscodebench",
  "case-train-code": "dataset-dscodebench",
  "case-eval-swe": "dataset-swe-verified",
  "case-train-swe": "dataset-swe-smith",
  "operations": "evaluation",
  "troubleshooting": "evaluation",
  "concepts": "architecture",
  "glossary": "architecture",
  "configuration": "evaluation",
  "ports": "multi-node-deployment",
  "protocols": "architecture",
  "protocol": "architecture"
});

export default Object.freeze({
  sourceDirectory: "/data/yanziyi/src/uenv_refactor/docs/user",
  template: "website/docs/index.template.html",
  outputDirectory: "dist",
  sections, documents, aliases,
});
