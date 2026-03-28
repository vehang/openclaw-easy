# OpenClaw Easy Docker 构建方案

## 📋 概述

本文档描述如何构建包含 `openclaw-nim-yx-auth` 插件的 Docker 镜像。

---

## 🐳 Dockerfile

```dockerfile
# OpenClaw Easy Docker Image
# 基于上游镜像 justlikemaki/openclaw-docker-cn-im，集成 Web 配置界面和 NIM 插件

FROM justlikemaki/openclaw-docker-cn-im:latest

LABEL maintainer="OpenClaw Easy"
LABEL description="OpenClaw with Web Configuration Interface - 耘想定制版"
LABEL version="1.2.0"

# 安装 supervisord 和 git（用于克隆插件）
RUN apt-get update && \
    apt-get install -y --no-install-recommends supervisor git && \
    rm -rf /var/lib/apt/lists/*

# 创建日志目录
RUN mkdir -p /var/log/supervisor

# ========== NIM YX Auth 插件安装 ==========
# 参考: openclaw-nim-yx-auth/DEPLOY.md

# 1. 创建插件目录
RUN mkdir -p /home/node/.openclaw/extensions/openclaw-nim-yx-auth

# 2. 从 GitHub 克隆插件源码
RUN git clone --depth 1 https://github.com/vehang/openclaw-nim-yx-auth.git /tmp/openclaw-nim-yx-auth && \
    cp -r /tmp/openclaw-nim-yx-auth/* /home/node/.openclaw/extensions/openclaw-nim-yx-auth/ && \
    rm -rf /tmp/openclaw-nim-yx-auth

# 3. 安装插件依赖（关键：必须指定 nim-web-sdk-ng 版本！）
RUN cd /home/node/.openclaw/extensions/openclaw-nim-yx-auth && \
    npm install --production && \
    npm install nim-web-sdk-ng@10.9.77-alpha.3

# 4. 清理不需要的文件
RUN cd /home/node/.openclaw/extensions/openclaw-nim-yx-auth && \
    rm -rf .git dist node_modules/.cache

# 5. 设置权限
RUN chown -R node:node /home/node/.openclaw

# ========== OpenClaw Easy Web 界面 ==========

# 复制 openclaw-easy Web 界面
COPY . /app/openclaw-easy
WORKDIR /app/openclaw-easy

# 安装 openclaw-easy 依赖
RUN npm install --production

# 设置默认工作目录
WORKDIR /home/node

# 复制启动脚本
COPY init-fixed.sh /usr/local/bin/init-fixed.sh
RUN chmod +x /usr/local/bin/init-fixed.sh

# 复制 supervisord 配置
COPY supervisord.conf /etc/supervisor/conf.d/openclaw.conf

# 清除基础镜像的 ENTRYPOINT
ENTRYPOINT []

# 禁用环境变量同步
ENV SYNC_MODEL_CONFIG=false

# 暴露端口
# 18780: Web 配置界面
# 18789: OpenClaw Gateway API
# 18790: Gateway Control UI
EXPOSE 18780 18789 18790

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:18789/health && curl -f http://localhost:18780/api/status || exit 1

# 启动
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/openclaw.conf"]
```

---

## 🔑 关键点说明

### 1. 插件来源

```dockerfile
# 从 GitHub 克隆（推荐）
RUN git clone --depth 1 https://github.com/vehang/openclaw-nim-yx-auth.git /tmp/openclaw-nim-yx-auth
```

**优点**：
- 始终获取最新代码
- 不需要维护本地副本

**缺点**：
- 构建时需要网络
- 依赖 GitHub 可用性

### 2. nim-web-sdk-ng 版本（⚠️ 最关键！）

```dockerfile
# 必须指定版本！
RUN npm install nim-web-sdk-ng@10.9.77-alpha.3
```

**原因**：最新版 `nim-web-sdk-ng` 缺少 `dist/nodejs/nim.js` 文件，会导致运行时报错。

### 3. 清理不必要的文件

```dockerfile
# 清理 .git 和 dist，减少镜像体积
RUN rm -rf .git dist node_modules/.cache
```

### 4. 权限设置

```dockerfile
# 确保 node 用户有权限访问
RUN chown -R node:node /home/node/.openclaw
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

## 🏗️ 构建命令

```bash
# 构建镜像
docker build -t openclaw-easy:latest .

# 构建时带版本号
docker build -t openclaw-easy:1.2.0-$(date +%y%m%d%H%M) .
```

---

## 🚀 运行命令

```bash
# 基础运行
docker run -d \
  --name openclaw-easy \
  -p 18780:18780 \
  -p 18789:18789 \
  openclaw-easy:latest

# 持久化配置
docker run -d \
  --name openclaw-easy \
  -p 18780:18780 \
  -p 18789:18789 \
  -v openclaw-config:/home/node/.openclaw \
  openclaw-easy:latest
```

---

## ✅ 验证

### 检查插件是否安装成功

```bash
# 进入容器
docker exec -it openclaw-easy bash

# 检查插件目录
ls -la /home/node/.openclaw/extensions/openclaw-nim-yx-auth/

# 检查 nim-web-sdk-ng 版本
cat /home/node/.openclaw/extensions/openclaw-nim-yx-auth/node_modules/nim-web-sdk-ng/package.json | grep version
# 应该输出: "version": "10.9.77-alpha.3"
```

### 检查日志

```bash
docker logs openclaw-easy | grep -i nim
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

### 问题 2: plugin id mismatch

**解决**：这是插件代码问题，确保从正确的 GitHub 仓库克隆。

### 问题 3: NIM runtime not initialized

**解决**：这是插件代码问题，确保从正确的 GitHub 仓库克隆。

---

## 📝 检查清单

构建前确认：

- [ ] Dockerfile 中的 `git clone` 地址正确
- [ ] `nim-web-sdk-ng@10.9.77-alpha.3` 版本号正确
- [ ] `chown -R node:node` 权限设置存在
- [ ] 构建网络正常（能访问 GitHub 和 npm）

---

## 🔗 相关链接

- [openclaw-nim-yx-auth GitHub](https://github.com/vehang/openclaw-nim-yx-auth)
- [openclaw-nim-yx-auth DEPLOY.md](../xiaoma/projects/nim-yx-auth/DEPLOY.md)

---

_文档更新: 2026-03-28_