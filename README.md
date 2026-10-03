# UEnv 网站与用户手册

网站使用现有静态首页与 Markdown 文档构建器。正文默认读取 `/home/UEnv_用户手册`，包含用户指南、全部数据集示例说明和维护者说明。正文只在该目录维护，`docs.config.mjs` 定义导航、标题与旧地址映射。

## 构建

需要 Node.js 20 或以上版本。首次安装依赖运行 `npm ci`，更新正文后运行：

```bash
npm run check
npm test
npm run build
```

其他机器可使用 `UENV_DOCS_SOURCE_DIR=/path/to/handbook npm run build`。`--output dist-next` 可先构建到独立目录再切换。

## 157 上的网页服务

访问 `http://8.130.75.157:8000/docs/`。`uenv-handbook.service` 使用 `scripts/serve-dist.py` 提供 `dist/`，开机启动并在进程异常退出后自动重启。

```bash
sudo systemctl status uenv-handbook
sudo systemctl restart uenv-handbook
sudo journalctl -u uenv-handbook -n 50 --no-pager
sudo systemctl stop uenv-handbook
```

此服务部署当前手册的构建结果；修改 Markdown 后需要重新构建。已替换 8000 端口的旧版文档进程，8080 留给 UEnv Hub。本次没有向 GitHub/Gitea 推送，也没有修改旧版 Pages 发布工作流；该工作流仍面向旧文档源，不能用于发布本版手册。
