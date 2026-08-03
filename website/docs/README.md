# UEnv Release Website Prototype

这是一个无构建依赖的 UEnv 使用文档站静态原型，第一版包含：

- ROCK 风格的顶部导航、左侧使用文档目录、正文和右侧页内目录
- UEnv 概览、快速开始、架构总览、核心组件、Episode 数据流与协议说明
- 深色模式、使用文档搜索、代码复制和移动端侧栏

## 本地预览

```bash
python3 -m http.server 8080
```

然后访问 `http://127.0.0.1:8080/`。

## 内容基线

原型内容以目标主机 `/home/uenv-bridge-alignment-merge` 当前 `bridge-alignment` 分支的源码、Cargo 清单、配置结构和实际可执行入口为准。README 不作为运行命令依据；后续应继续补齐正式使用文档内容，并建立从源码接口到站点的版本同步机制。
