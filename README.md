# UEnv 网站与公开文档

本仓库包含 UEnv 产品首页和公开文档站。文档正文来自相邻
`uenv_pre_release/Docs/guide` 目录，本站负责分组导航、链接校验、标题级搜索和静态构建。

## 对外组件关系

```text
评测程序 / 训练框架
        │
        ▼
UEnv Bridge
        │
        ▼
UEnv Server
        │
        ▼
UEnv Worker

UEnv Hub（可选旁路，用于环境包与版本分发）
```

UEnv Server 是用户部署和访问的中心服务，负责 Worker 注册、Episode 调度、
状态与结果管理。UEnv Hub 是可选的环境包与版本服务，不参与每次 Episode 的
中心调度。

## 本地构建

把两个仓库放在同一目录：

```text
workspace/
├── uenv_pre_release/
└── uenv_website/
```

然后执行：

```bash
cd uenv_website
npm ci
npm run check
npm run build
python3 -m http.server 8080 --directory dist
```

访问 `http://127.0.0.1:8080/`。两个仓库不相邻时，可显式指定文档目录：

```bash
UENV_DOCS_SOURCE_DIR=/absolute/path/to/Docs/guide npm run build
```

## 目录

| 路径 | 用途 |
|---|---|
| `website/index.html` | 产品首页 |
| `website/docs/index.template.html` | 文档站外壳，不包含重复的组件正文 |
| `website/docs/app.js` | 页面切换、折叠导航、Mermaid、目录和分层搜索 |
| `docs.config.mjs` | 文档 section/subsection、顺序、公开 slug 和旧地址映射 |
| `scripts/build-docs.mjs` | Markdown 编译、H1/链接校验与静态构建 |
| `dist/` | 构建产物，不作为正文真源 |

更详细的维护说明见 [`website/docs/README.md`](./website/docs/README.md)。

## License

Apache-2.0
