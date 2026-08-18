# UEnv 文档站开发说明

文档站保留静态 HTML/CSS/JavaScript 实现，部署时将
`uenv_pre_release/Docs/guide` 中的公开 Markdown 编译进页面。
生成文件位于 `dist/`，不要手工编辑生成后的 HTML。

## 本地构建

把两个仓库放在同一目录：

```text
workspace/
├── uenv_pre_release/
└── uenv_website/
```

在 `uenv_website` 中执行：

```bash
npm ci
npm run check
npm run build
python3 -m http.server 8080 --directory dist
```

然后访问 `http://127.0.0.1:8080/`。如两个仓库不在同一目录，可通过
`UENV_DOCS_SOURCE_DIR` 或 `--source` 指定 Markdown 目录：

```bash
UENV_DOCS_SOURCE_DIR=/path/to/Docs/guide npm run build
```

## 文档配置

`docs.config.mjs` 是 section、subsection、页面顺序、标题、源文件名、旧地址映射
和公开 slug 的唯一配置源。公开 slug 应保持稳定；修改 Markdown 文件名后，同时
更新该配置。组件说明、部署步骤和案例正文只维护在 Markdown 中，不在 HTML 模板
中复制第二份。导航标题必须与对应 Markdown 的 H1 完全一致。

构建器会自动完成：

- Markdown、GFM 表格和代码块转换
- GitHub 兼容标题锚点
- 相对 `.md` 链接和跨页锚点重写
- 本地图片、附件校验与复制
- 代码高亮、Mermaid 图表容器和本地 Mermaid runtime 复制
- section/subsection 折叠侧栏、完整面包屑和页面顺序生成
- 页面及标题级搜索入口生成，并保留完整分类路径
- 缺失文件、断链、孤立导航项、重复 slug、无效旧地址和重复 HTML ID 校验
- 导航标题与 Markdown H1 一致性校验

Markdown 中的本地图片或附件必须位于 `Docs/guide` 内。例如：

```markdown
![部署拓扑](./assets/deployment-topology.png)
[下载示例配置](./assets/example.yaml)
```

## 自动发布

`uenv_website/.github/workflows/deploy-pages.yml` 会检出两个仓库、构建
`dist/` 并发布到 GitHub Pages。它支持：

- 网站仓库 `main` 分支相关文件变化
- 手动 `workflow_dispatch`，可指定文档 branch、tag 或 commit
- `repository_dispatch: deployment-docs-updated`

`uenv_pre_release/.github/workflows/notify-website-docs.yml` 会在
`Docs/guide/**` 变化时发送上述事件，并携带精确 commit SHA。

要启用跨仓库自动触发，请在 `uenv_pre_release` 的 Actions secrets 中增加：

```text
WEBSITE_DISPATCH_TOKEN
```

其值应是仅授权 `audreyyan1015/uenv_website`、具有 `Contents: write`
权限的 fine-grained personal access token。未配置时仍可在网站仓库手动运行
Pages workflow。
