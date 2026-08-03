# UEnv — Distributed Environment Runtime for LLM Post-Training

[![Rust](https://img.shields.io/badge/language-Rust-orange)](https://www.rust-lang.org)
[![Python](https://img.shields.io/badge/language-Python-blue)](https://www.python.org)
[![gRPC](https://img.shields.io/badge/communication-gRPC-brightgreen)](https://grpc.io)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](#license)

UEnv 将 LLM 后训练流程与环境执行解耦，为 Episode 调度、多步环境交互、模型服务调用、运行状态管理和环境元数据注册提供统一的分布式基础设施。

当前主线中，`uenv-bridge` 已实现面向 **VeRL pre-rollout AgentLoop** 的接入；`uenv-server` 负责控制面调度；`uenv-worker` 执行 Episode 并管理环境实例；`uenv-hub` 持久化管理环境 manifest、版本、镜像引用、资源需求和接口 schema。

> 说明：VeRL 是当前 Bridge 主线的已实现入口。ROLL、NexRL、NeMo-RL、OpenRLHF 等可通过 Bridge 适配层扩展，但不表示仓库当前已内置并验证全部适配器。

## 架构

```text
Training Framework
(VeRL current; ROLL / NexRL / NeMo-RL / OpenRLHF extensible)
        │
        ▼
uenv-bridge
Python AgentLoop adapter + Rust adapter core
        │ EpisodeRequest / EpisodeResult
        ▼
uenv-server
Episode scheduling · Worker registry · dispatch · result aggregation
        │ DispatchEpisode
        ▼
uenv-worker
Environment instance pool · plugin process · model endpoint · WAL
        │ RegisterWorker / Heartbeat / ReportResult
        └────────────────────────► uenv-server
        │
        ├──────── HTTP/gRPC ──────► Model Service
        ├──────── L2 local IPC ───► Environment Plugin
        └──────── HTTP metadata ──► uenv-hub ──► SQLite (WAL)
```

`uenv-hub` 是持久化环境注册中心，不参与 Episode 的实时调度。Worker 可在拉起环境实例前通过 Hub 查询并合并环境 manifest。

## 核心组件

| 组件 | 语言 | 职责 | 主要入口 |
|---|---|---|---|
| [`uenv-bridge`](./uenv-bridge/) | Python + Rust | 训练框架适配；当前主线为 VeRL pre-rollout AgentLoop | `pip install -e ./uenv-bridge` |
| [`uenv-server`](./uenv-server/) | Rust | Episode 接收、Worker 注册表、调度、主动下发与结果聚合 | `uenv-server -b 0.0.0.0:50051` |
| [`uenv-worker`](./uenv-worker/) | Rust | Episode 执行、环境实例池、插件子进程、模型服务直连与 WAL | `uenv-worker serve --config config/uenv-worker.yaml` |
| [`uenv-hub`](./uenv-hub/) | Rust | 环境元数据、版本、manifest、schema、镜像引用和 CLI | `cargo run -p uenv-hub-server` |
| [`uenv-ctl`](./uenv-ctl) | Python | 查看运行中 Server/Worker 的状态 | `./uenv-ctl status` |

## 快速开始

### 1. 准备环境

需要：

- Rust 工具链（以仓库的 [`rust-toolchain.toml`](./rust-toolchain.toml) 为准）
- Python 3.10+
- `protoc`（Server、Worker 和 Adapter Core 会在 Cargo 构建阶段自动生成 Rust gRPC 代码）
- Linux/macOS；Windows 建议使用 WSL2

```bash
git clone https://github.com/audreyyan1015/uenv.git
cd uenv
```

### 2. 构建核心组件

根工作区包含 Server、Worker、Bridge Core 和环境插件；Hub 使用独立 Rust workspace。

```bash
# Server、Worker 和 Adapter Core 的 build.rs 会自动编译 protobuf
cargo build -p uenv-server -p uenv-worker -p uenv-adapter-core

# 构建环境注册中心
cd uenv-hub
cargo build
cd ..
```

### 3. 启动 uenv-server

```bash
cargo run -p uenv-server -- -b 0.0.0.0:50051
```

Server 接收 Episode 请求、维护 Worker 注册表，并主动调用 Worker 的 `DispatchEpisode`。

### 4. 启动 uenv-hub

开发环境可关闭 token 校验：

```bash
cd uenv-hub
UENV_HUB_AUTH__REQUIRE_TOKEN=false cargo run -p uenv-hub-server
```

默认服务提供 `/healthz`、`/version` 和 `/metrics`。生产部署请使用 [`uenv-hub/config/hub.example.toml`](./uenv-hub/config/hub.example.toml) 配置数据库、鉴权、限流和 CORS。

### 5. 启动 uenv-worker

回到仓库根目录，在 Worker 启动前指定 Server 和 Hub：

```bash
export UENV_SERVER_ENDPOINT=127.0.0.1:50051
export UENV_HUB_ENDPOINT=http://127.0.0.1:8080
export UENV_WORKER_LISTEN=0.0.0.0:50052

cargo run -p uenv-worker -- serve --config config/uenv-worker.yaml
```

Worker 会向 Server 注册并持续发送心跳；收到 Episode 后，Worker 从本地实例池获取或拉起环境，并可从 Hub 解析环境元数据。

### 6. 安装 Bridge

```bash
python3 -m pip install -e ./uenv-bridge
```

当前 VeRL 接入使用 `UEnvAgentLoop`，配置与四层验证方式见 [`uenv-bridge/README.md`](./uenv-bridge/README.md)。常用配置入口：

```text
uenv-bridge/configs/uenv-agent-loop.yaml
uenv-bridge/scripts/run_layer4_smoke_with_services.sh
uenv-bridge/scripts/run_layer4_distributed_smoke.sh
```

## uenv-hub CLI

Hub workspace 会构建名为 `uenv` 的命令行工具：

```bash
cd uenv-hub
cargo build -p uenv-hub-client
export UENV_HUB_ENDPOINT=http://localhost:8080

./target/debug/uenv hub status
./target/debug/uenv env list
./target/debug/uenv env init mymath --template math
cd mymath && ../target/debug/uenv env validate
../target/debug/uenv env publish --manifest manifest.toml
```

## 通信关系

| 链路 | 协议 | 作用 |
|---|---|---|
| Bridge → Server/Worker | Adapter Core function boundary / gRPC | 提交 prompt-only Episode，接收 response、reward 与 trajectory |
| Client → Server | `UEnvService` | 提交 Episode |
| Worker → Server | `ControlPlaneService` | 注册、心跳和结果上报 |
| Server → Worker | `WorkerGrpcService` | 主动下发 `DispatchEpisode` |
| Worker → Environment Plugin | `plugin_proto/` + local IPC/UDS | `reset`、`step`、`close`、`health_check` |
| Worker → Model Service | HTTP/gRPC | 调用推理服务，不经 Server 转发 |
| Worker/CLI → Hub | HTTP REST | 查询、发布和管理环境元数据 |

协议权威路径：

- [`proto/`](./proto/)：Server、Scheduler、Episode、Agent 等 L1 协议
- [`plugin_proto/`](./plugin_proto/)：Worker 与环境插件之间的 L2 协议
- [`PROTOCOL.md`](./PROTOCOL.md)：通信与数据结构说明

## 目录结构

```text
uenv/
├── uenv-bridge/       # 训练框架适配层；当前主线为 VeRL AgentLoop
├── uenv-server/       # 分布式控制面和 Episode 调度
├── uenv-worker/       # 执行节点、实例池、插件和模型调用
├── uenv-hub/          # 独立环境注册中心 workspace
├── uenv-common/       # 共享 Rust 类型与工具
├── proto/             # L1 protobuf
├── plugin_proto/      # L2 plugin protobuf
├── plugins/           # math、code 等环境插件
├── integrations/      # 外部系统集成
├── config/            # Worker 等运行配置
├── deploy/            # systemd 等部署文件
├── frontend/          # 前端控制台
├── Docs/              # 架构、联调和模块文档
└── uenv-ctl            # 状态查看工具
```

## 开发命令

```bash
cargo build -p uenv-server -p uenv-worker -p uenv-adapter-core
cargo test -p uenv-server
cargo test -p uenv-worker
cargo test -p uenv-adapter-core

cd uenv-hub
cargo test
```

## 当前实现边界

- Bridge 当前只维护 VeRL pre-rollout AgentLoop 主线。
- Worker 的主路径是独立插件子进程，不是历史内嵌 Python 环境。
- Worker 可从 Hub 获取 manifest，但环境制品仍可来自本地 `plugins/`。
- Hub 是离线元数据目录服务，不参与运行时调度。
- 多卡训练、权重同步和高并发吞吐仍需要结合具体训练栈进行验证。

## 文档

- [`uenv-bridge/README.md`](./uenv-bridge/README.md)
- [`uenv-server/README.md`](./uenv-server/README.md)
- [`uenv-worker/README.md`](./uenv-worker/README.md)
- [`uenv-hub/README.md`](./uenv-hub/README.md)
- [`PROTOCOL.md`](./PROTOCOL.md)
- [`Docs/`](./Docs/)

## License

Apache-2.0


nohup python3 -m http.server 8777 \
  --bind 0.0.0.0 \
  --directory /home/uenv-release-website/website \
  >/tmp/uenv-release-website-8777.log 2>&1 </dev/null &