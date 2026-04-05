# OpenClaw 整合版镜像构建指南

> 本目录包含构建 OpenClaw 整合版 Docker 镜像的所有文件，基于 openclaw-easy 项目构建。

## 📁 目录结构

```
openclaw-easy/
├── server.js                    # Web 配置界面主程序
├── public/                       # 前端静态文件
├── Dockerfile.integrated        # 整合版镜像构建文件（根目录）
├── docker/
│   ├── Dockerfile.base              # 基础镜像构建文件
│   ├── Dockerfile.version-template  # 版本镜像模板
│   ├── Dockerfile.integrated        # 整合版镜像构建文件
│   ├── build.sh                     # 构建脚本
│   ├── init-integrated.sh           # 整合版启动脚本
│   ├── supervisord-integrated.conf  # supervisord 配置
│   └── README.md                    # 本文档
```

## 🏗️ 镜像层级关系

```
openclaw-base:latest (基础镜像 ~3GB)
    │
    ├── 安装系统依赖 (supervisor, git)
    ├── 安装 Node.js 工具 (bun, uv)
    ├── 安装 Playwright + Chromium
    └── 安装 @tobilu/qmd@1.1.6
         │
         └── openclaw:版本-root (版本镜像 ~4GB)
              │
              ├── 安装 openclaw@指定版本
              └── 安装微信插件
                   │
                   └── openclaw:版本-integrated (整合版镜像 ~4.7GB)
                        │
                        ├── 安装 NIM YX Auth 插件
                        ├── 复制 openclaw-easy (Web 配置界面)
                        └── 配置 supervisord
```

## 🚀 快速开始

### 前置条件

- Docker 已安装
- 已克隆 openclaw-easy 仓库

```bash
git clone -b root-version https://github.com/vehang/openclaw-easy.git
cd openclaw-easy
```

### 一键构建

```bash
# 构建整合版镜像（自动构建依赖）
./docker/build.sh integrated 2026.3.13
```

### 分步构建

```bash
# 1. 构建基础镜像 (~15-20分钟)
./docker/build.sh base

# 2. 构建版本镜像 (~2-3分钟)
./docker/build.sh version 2026.3.13

# 3. 构建整合版镜像 (~3-5分钟)
./docker/build.sh integrated 2026.3.13
```

## 🔧 构建脚本命令

```bash
./docker/build.sh <命令> [参数]

命令:
  base                  构建基础镜像
  version <版本>        构建版本镜像 (如: 2026.3.13)
  integrated [版本]     构建整合版镜像 (默认: 2026.4.1)
  all                   构建所有版本
  clean                 清理 Docker 构建缓存
  help                  显示帮助

示例:
  ./docker/build.sh base                    # 构建基础镜像
  ./docker/build.sh version 2026.3.13       # 构建 2026.3.13 版本
  ./docker/build.sh integrated 2026.3.13    # 构建 2026.3.13 整合版
```

## 📦 镜像说明

### 1. 基础镜像 (openclaw-base:latest)

提供通用的运行环境，避免每次重复安装依赖。

**包含内容**:
- Node.js + npm + bun
- Python 3.12
- Playwright + Chromium
- @tobilu/qmd@1.1.6

**大小**: 约 3GB

---

### 2. 版本镜像 (openclaw:版本-root)

安装指定版本的 OpenClaw + 微信插件。

**包含内容**:
- openclaw@指定版本
- 微信插件 (@tencent-weixin/openclaw-weixin)

**大小**: 约 4GB

---

### 3. 整合版镜像 (openclaw:版本-integrated)

完整的生产环境镜像，包含所有插件和 Web 管理界面。

**包含内容**:
- OpenClaw (指定版本)
- NIM YX Auth 插件 (网易云信 IM)
- 微信插件
- openclaw-easy (Web 配置界面)
- supervisord (进程管理)

**大小**: 约 4.7GB

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
| `/root/.openclaw-seed/extensions` | 种子插件目录 |
| `/app/openclaw-easy` | Web 配置界面 |

## 🔄 插件同步机制

启动时自动从种子目录同步插件：

```
/root/.openclaw-seed/extensions/ → 同步到 → /root/.openclaw/extensions/
```

## ⚠️ 常见问题

### 1. 插件未加载

确保 `plugins.allow` 和 `plugins.load.paths` 配置正确：

```json
{
  "plugins": {
    "allow": ["nim", "openclaw-weixin"],
    "load": {
      "paths": [
        "/root/.openclaw/extensions/openclaw-nim-yx-auth",
        "/root/.openclaw/extensions/openclaw-weixin"
      ]
    }
  }
}
```

### 2. Gateway 启动被阻止

确保启动命令包含 `--allow-unconfigured` 参数。

### 3. npm 升级失败

不要在容器内升级 npm，会破坏环境。Node v22 + npm 10.9.7 已足够。

## 📝 版本支持

| OpenClaw 版本 | 微信插件版本 | NIM 插件版本 |
|--------------|-------------|-------------|
| 2026.3.13 | 1.0.3 (compat) | 1.0.0 |
| 2026.3.24 | 2.1.6 (latest) | 1.0.0 |
| 2026.4.1 | 2.1.6 (latest) | 1.0.0 |

## 📄 相关文档

- [openclaw-easy README](../README.md)
- [API 文档](../API.md)
