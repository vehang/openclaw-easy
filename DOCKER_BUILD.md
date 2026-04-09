# OpenClaw Easy Docker 构建方案

## 📋 概述

本文档描述如何构建包含 `openclaw-nim-yx-auth` 插件的 Docker 镜像。

---

## 📦 镜像版本

| 版本 | Dockerfile | 说明 |
|------|-----------|------|
| **标准版** | `Dockerfile` | 生产环境，最小化镜像 |
| **开发版** | `Dockerfile.dev` | 开发环境，包含 tmux、Claude Code CLI |

### 版本对比

| 组件 | 标准版 | 开发版 |
|------|--------|--------|
| OpenClaw | ✅ | ✅ |
| NIM 插件 | ✅ | ✅ |
| Web 界面 | ✅ | ✅ |
| tmux | ❌ | ✅ |
| Claude Code CLI | ❌ | ✅ |
| vim | ❌ | ✅ |
| htop | ❌ | ✅ |
| 国内镜像源 | ❌ | ✅ |

---

## 🏗️ 构建命令

### 标准版

```bash
# 使用 docker-compose
docker compose build

# 或直接构建
docker build -t openclaw-easy:latest .
```

### 开发版

```bash
# 使用 docker-compose
docker compose -f docker-compose.dev.yml build

# 或直接构建
docker build -f Dockerfile.dev -t openclaw-easy:dev .
```

---

## 🚀 运行命令

### 标准版

```bash
# 使用 docker-compose
docker compose up -d

# 或直接运行
docker run -d \
  --name openclaw-easy \
  -p 18780:18780 \
  -p 18789:18789 \
  -v ./openclaw-data:/home/node/.openclaw \
  openclaw-easy:latest
```

### 开发版

```bash
# 使用 docker-compose
docker compose -f docker-compose.dev.yml up -d

# 或直接运行
docker run -d \
  --name openclaw-easy-dev \
  -p 18780:18780 \
  -p 18789:18789 \
  -v ./openclaw-data:/home/node/.openclaw \
  openclaw-easy:dev
```

---

## 🛠️ 开发版特性

### 1. 国内镜像源加速

```dockerfile
# Debian 清华镜像
RUN sed -i 's|http://deb.debian.org|https://mirrors.tuna.tsinghua.edu.cn|g' /etc/apt/sources.list

# npm 淘宝镜像
RUN npm config set registry https://registry.npmmirror.com
```

### 2. 安装的开发工具

| 工具 | 用途 |
|------|------|
| `tmux` | 后台会话管理，长时间任务 |
| `claude` | Claude Code CLI，AI 编码助手 |
| `vim` | 文本编辑器 |
| `htop` | 系统监控 |
| `curl` / `wget` | 网络工具 |

### 3. Claude Code CLI

开发版预装了 Claude Code CLI，可以直接使用：

```bash
# 进入容器
docker exec -it openclaw-easy-dev bash

# 启动 Claude Code
claude --dangerously-skip-permissions

# 指定模型
claude --dangerously-skip-permissions --model glm-5
```

### 4. tmux 会话管理

```bash
# 创建新会话
tmux new-session -s my-task

# 后台运行
tmux detach

# 恢复会话
tmux attach -t my-task

# 查看所有会话
tmux list-sessions
```

---

## 🔑 关键点说明

### 1. nim-web-sdk-ng 版本（⚠️ 最关键！）

```dockerfile
# 必须指定版本！
RUN npm install nim-web-sdk-ng@10.9.77-alpha.3
```

**原因**：最新版 `nim-web-sdk-ng` 缺少 `dist/nodejs/nim.js` 文件，会导致运行时报错。

### 2. 权限优化

开发版使用 `install -d` 创建目录，避免 `chown -R` 遍历大量文件：

```dockerfile
# 快速创建目录并设置所有者
RUN install -o node -g node -d /home/node/.openclaw/extensions/openclaw-nim-yx-auth
```

### 3. 以 node 用户执行

```dockerfile
USER node
RUN npm install --production  # 文件自动属于 node
```

---

## 📁 最终目录结构

```
容器内目录：
/home/node/.openclaw/
├── extensions/
│   └── openclaw-nim-yx-auth/
│       ├── auth.ts
│       ├── channel.ts
│       ├── index.ts
│       ├── types.ts
│       ├── package.json
│       ├── openclaw.plugin.json
│       └── node_modules/
│           ├── openclaw-nim/
│           └── nim-web-sdk-ng/  # 版本 10.9.77-alpha.3
│
└── openclaw.json  # 运行时生成

/app/openclaw-easy/
├── server.js
├── public/
└── ...
```

---

## ✅ 验证

### 检查插件安装

```bash
docker exec -it openclaw-easy-dev bash

# 检查插件目录
ls -la ~/.openclaw/extensions/openclaw-nim-yx-auth/

# 检查 nim-web-sdk-ng 版本
cat ~/.openclaw/extensions/openclaw-nim-yx-auth/node_modules/nim-web-sdk-ng/package.json | grep version
# 应该输出: "version": "10.9.77-alpha.3"
```

### 检查开发工具

```bash
# 检查 tmux
tmux -V

# 检查 Claude Code
claude --version

# 检查 git 配置
git config --global user.name
git config --global user.email
```

### 检查 NIM 日志

```bash
docker logs openclaw-easy-dev | grep -i nim
```

**成功标志**：
```
[nim-yx-auth] Starting with authToken: ...
[nim] login successful — account: ocb_xxx
[nim] monitor started — account: ocb_xxx
```

---

## 🐛 常见问题

### 问题 1: Cannot find module 'nim-web-sdk-ng/dist/nodejs/nim.js'

**解决**：确保 Dockerfile 中指定了正确的版本：
```dockerfile
npm install nim-web-sdk-ng@10.9.77-alpha.3
```

### 问题 2: 插件目录不存在

**原因**：docker-compose volume 挂载覆盖了镜像中的内容

**解决**：init.sh 会在启动时自动安装插件

### 问题 3: 构建速度慢

**解决**：使用开发版，内置国内镜像源加速

---

## 📝 检查清单

构建前确认：

- [ ] Dockerfile 中的 `git clone` 地址正确
- [ ] `nim-web-sdk-ng@10.9.77-alpha.3` 版本号正确
- [ ] 构建网络正常（能访问 GitHub 和 npm）
- [ ] 开发版使用国内镜像源加速

---

## 🔗 相关链接

- [openclaw-nim-yx-auth GitHub](https://github.com/vehang/openclaw-nim-yx-auth)
- [openclaw-nim-yx-auth DEPLOY.md](../xiaoma/projects/nim-yx-auth/DEPLOY.md)
- [Claude Code CLI](https://github.com/anthropics/claude-code)
- [清华大学开源软件镜像站](https://mirrors.tuna.tsinghua.edu.cn/)
- [npm 淘宝镜像](https://npmmirror.com/)

---

_文档更新: 2026-03-28_