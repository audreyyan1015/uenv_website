# UEnv 网站与用户手册

网站使用现有静态首页与 Markdown 文档构建器。正文默认读取规范代码仓库的 `/data/yanziyi/src/uenv_refactor/docs/user`，包含用户指南及数据集示例说明。正文统一在代码仓库维护，`docs.config.mjs` 定义导航、标题与旧地址映射；`/home/UEnv_用户手册` 仅作为历史材料保留，不参与构建。

## 构建

需要 Node.js 20 或以上版本。首次安装依赖运行 `npm ci`，更新正文后运行：

```bash
npm run check
npm test
npm run build
```

其他机器可使用 `UENV_DOCS_SOURCE_DIR=/path/to/uenv_refactor/docs/user npm run build`。发布前使用 `node scripts/build-docs.mjs --output dist-next` 构建独立产物，通过检查后再切换到 `dist`；构建失败时保留原网站。

每次构建在 `docs/build-info.json` 记录文档来源提交、文档目录是否含未提交改动、输入文件摘要、生成页面摘要及构建时间。未提交内容通过实际文件摘要追溯，不把提交号当作全部内容的证明。修改 Markdown 或提交 Git 后仍需重新构建和发布，线上不会直接读取 Markdown。

## 157 上的网页服务

访问 `http://8.130.75.157:8000/docs/`。`uenv-handbook.service` 使用 `scripts/serve-dist.py` 提供 `dist/`，开机启动并在进程异常退出后自动重启。

```bash
sudo systemctl status uenv-handbook
sudo systemctl restart uenv-handbook
sudo journalctl -u uenv-handbook -n 50 --no-pager
sudo systemctl stop uenv-handbook
```

此服务提供当前手册的静态构建结果。替换 `dist` 内的文件后，新请求会读取更新内容，无需因文档更新重启服务。构建来源及本次内容身份可在 `/docs/build-info.json` 查看。
