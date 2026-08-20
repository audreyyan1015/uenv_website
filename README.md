# UEnv 网站与公开文档

本仓库包含 UEnv 产品首页和公开文档站。文档正文来自相邻
`uenv_pre_release/Docs/guide` 目录，本站负责分组导航、链接校验、标题级搜索和静态构建。

## 对外组件关系

主链固定为：`评测程序 / 强化学习框架 → UEnv Bridge → UEnv Server → UEnv Worker`。
UEnv Hub 是按需访问的环境包分发旁路，不参与每次 Episode 调度。

Server 是用户部署和访问的中心服务，负责 Worker 注册、Episode 调度和状态管理。
当前可执行文件和 systemd 服务仍使用 `uenv-adapter-core` 这个兼容代码名；公开界面
和文档统一称为 UEnv Server。

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
| `website/docs/app.js` | 页面切换、折叠导航、目录、搜索和 Mermaid 渲染 |
| `docs.config.mjs` | section / subsection / page 层级、公开 slug 和旧地址映射 |
| `scripts/build-docs.mjs` | Markdown、Mermaid、链接、标题与构建校验 |
| `dist/` | 构建产物，不作为正文真源 |

更详细的维护说明见 [`website/docs/README.md`](./website/docs/README.md)。

## License

Apache-2.0
