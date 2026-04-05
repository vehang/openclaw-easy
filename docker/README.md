# OpenClaw 整合版镜像构建指南

本目录包含构建 OpenClaw 整合版 Docker 镜像的所有文件。

## 📁 目录结构

```
docker/
├── Dockerfile.base              # 基础镜像构建文件
├── Dockerfile.version-template  # 版本镜像模板
├── Dockerfile.integrated        # 整合版镜像构建文件
├── build.sh                     # 构建脚本
├── init-integrated.sh           # 整合版启动脚本
├── supervisord-integrated.conf  # supervisord 配置
└── README.md                    # 本文档
```

## 🏗️ 镜像层级关系

```
openclaw-base:latest (基础镜像 ~3GB)
    │
    ├── 安装系统依赖 (supervisor, git)
    ├── 安装 Node.js 工具 (bun, uv)
    ├── 安装 Playwright + Chromium
    ├── 安装 Homebrew (清华镜像)
    ├── 安装 websockify
    └── 安装 @tobilu/qmd@1.1.6
         │
         └── openclaw:版本-root (版本镜像 ~4GB)
              │
              ├── 安装 openclaw@指定版本
              ├── 同步种子扩展
              └── 安装微信插件
                   │
                   └── openclaw:版本-integrated (整合版镜像 ~4.7GB)
                        │
                        ├── 安装 NIM YX Auth 插件
                        ├── 安装 openclaw-easy
                        └── 配置 supervisord
```

## 🚀 快速开始

### 前置条件

- Docker 已安装
- 网络可访问 npm、GitHub、阿里云镜像

### 一键构建

```bash
# 构建整合版镜像（自动构建依赖）
./build.sh integrated 2026.3.13
```

### 分步构建

```bash
# 1. 构建基础镜像 (~15-20分钟)
./build.sh base

# 2. 构建版本镜像 (~2-3分钟)
./build.sh version 2026.3.13

# 3. 构建整合版镜像 (~3-5分钟)
./build.sh integrated 2026.3.13
```

## 📦 镜像说明

### 1. 基础镜像 (openclaw-base:latest)

**用途**: 提供通用的运行环境，避免每次重复安装依赖

**包含内容**:
- Node.js + npm + bun
- Python 3.12
- Playwright + Chromium
- Homebrew (清华镜像)
- websockify
- @tobilu/qmd@1.1.6

**构建命令**:
```bash
./build.sh base
```

**大小**: 约 3GB

---

### 2. 版本镜像 (openclaw:版本-root)

**用途**: 安装指定版本的 OpenClaw + 微信插件

**基于**: `openclaw-base:latest`

**包含内容**:
- openclaw@指定版本
- 微信插件 (@tencent-weixin/openclaw-weixin)
- 种子扩展 (napcat)

**构建命令**:
```bash
./build.sh version 2026.3.13
./build.sh version 2026.3.24
./build.sh version 2026.4.1
```

**大小**: 约 4GB

---

### 3. 整合版镜像 (openclaw:版本-integrated)

**用途**: 完整的生产环境镜像，包含所有插件和 Web 管理界面

**基于**: `openclaw:版本-root`

**包含内容**:
- OpenClaw (指定版本)
- NIM YX Auth 插件 (网易云信 IM)
- 微信插件
- openclaw-easy (Web 配置界面)
- supervisord (进程管理)

**构建命令**:
```bash
./build.sh integrated 2026.3.13
```

**大小**: 约 4.7GB

**标签**:
- `openclaw:版本-integrated`
- `openclaw-integrated:latest`

## 🔧 构建脚本命令

```bash
./build.sh <命令> [参数]

命令:
  base                  构建基础镜像
  version <版本>        构建版本镜像 (如: 2026.3.13)
  integrated [版本]     构建整合版镜像 (默认: 2026.4.1)
  all                   构建所有版本
  clean                 清理 Docker 构建缓存
  help                  显示帮助

示例:
  ./build.sh base                    # 构建基础镜像
  ./build.sh version 2026.3.13       # 构建 2026.3.13 版本
  ./build.sh integrated 2026.3.13    # 构建 2026.3.13 整合版
```

## 🌐 暴露端口

| 端口 | 服务 | 说明 |
|------|------|------|
| 18780 | openclaw-easy | Web 配置界面 |
| 18789 | OpenClaw Gateway | WebSocket Gateway |
| 18790 | OpenClaw Node | Node 服务 |

## 🚢 运行容器

```bash
docker run -d \
  --name openclaw \
  -p 18780:18780 \
  -p 18789:18789 \
  -p 18790:18790 \
  openclaw:2026.3.13-integrated
```

**访问**:
- Web 界面: http://localhost:18780
- Gateway: ws://localhost:18789

## 📂 重要目录

| 容器路径 | 说明 |
|---------|------|
| `/root/.openclaw` | OpenClaw 配置目录 |
| `/root/.openclaw/extensions` | 插件目录 |
| `/root/.openclaw-seed/extensions` | 种子插件目录（不会被挂载覆盖） |
| `/app/openclaw-easy` | Web 配置界面 |
| `/var/log/supervisor` | Supervisor 日志 |

## 🔄 插件同步机制

为解决挂载卷覆盖插件目录的问题，采用种子目录同步机制：

```
启动时:
/root/.openclaw-seed/extensions/ → 同步到 → /root/.openclaw/extensions/
```

**支持的同步模式** (通过 `SYNC_EXTENSIONS_MODE` 环境变量):
- `missing`: 仅补充缺失的插件 (默认)
- `overwrite`: 强制覆盖所有插件
- `seed-version`: 根据版本号决定是否同步

## ⚠️ 常见问题

### 1. OPENCLAW_HOME 路径问题

**问题**: 显示 `$OPENCLAW_HOME/.openclaw/openclaw.json`

**原因**: OpenClaw 会在 `OPENCLAW_HOME` 下创建 `.openclaw/` 目录

**解决**: 设置 `OPENCLAW_HOME=/root` 而不是 `/root/.openclaw`

### 2. --bind 参数无效

**问题**: `Invalid --bind (use "loopback", "lan", "tailnet", "auto", or "custom")`

**原因**: 不支持 IP 地址格式

**解决**: 使用 `--bind lan` 代替 `--bind 0.0.0.0`

### 3. Gateway 启动被阻止

**问题**: `Gateway start blocked: set gateway.mode=local`

**原因**: 未配置 gateway.mode

**解决**: 添加 `--allow-unconfigured` 参数

### 4. 插件 ID 不匹配警告

**问题**: `plugin id mismatch (manifest uses "nim", entry hints "openclaw-nim-yx-auth")`

**原因**: 配置中的 `plugins.entries` 与插件 manifest 不一致

**解决**: 移除 `plugins.entries`，让 OpenClaw 自动发现插件

## 📝 版本支持

| OpenClaw 版本 | 微信插件版本 | NIM 插件版本 |
|--------------|-------------|-------------|
| 2026.3.13 | 1.0.3 (compat) | 1.0.0 |
| 2026.3.24 | 2.1.6 (latest) | 1.0.0 |
| 2026.4.1 | 2.1.6 (latest) | 1.0.0 |

## 📄 相关文档

- [openclaw-easy README](../README.md)
- [API 文档](../API.md)
- [Docker 使用说明](../DOCKER_USAGE.md)
