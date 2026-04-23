# MEMORY.md - Dev Bot 私有记忆

> 本 Agent 负责项目开发，公共记忆在 `~/.openclaw/memory/MEMORY.md`

---

## 项目概览

### BaoBoxs 项目

- **描述**: 导航网站 + 工具集合
- **前端**: Next.js 15 (baoboxs-nav)
- **后端**: Spring Boot 2.1.5 (baoboxs-service)
- **数据库**: MySQL 5.7/8.0

### 部署信息

- **目标服务器**: 192.168.1.123:22345
- **前端端口**: 43000
- **后端端口**: 48080
- **数据库端口**: 16033

### openclaw-easy 项目

- **描述**: OpenClaw Easy 配置管理系统
- **技术**: Node.js + Express
- **端口**: 18780
- **仓库**: https://github.com/vehang/openclaw-easy
- **分支**: root-version

---

## 重要配置

### GitHub Token
见 `BAOBOXS-CONFIG.md`

### 环境变量
见 `DEPLOY.md`

---

## 任务记录

见 `tasks/` 目录

---

## 迁移记录

### 2026-03-30
- 从 niuma 工作区迁移到 dev
- 迁移内容：项目源码、配置、部署规范、任务记录

---

## 工作记录

### 2026-04-15
- Hermes Docker 镜像构建（暂缓，SIGTERM + chown 慢）
- openclaw-easy verify 页面布局修复（bddc20a → 最终用户自修 1c73ebf）
- OpenClaw 智谱 GLM-5.1 模型配置（双模型共存）
- 微信插件安装流程分析，待在构建时集成 CLI 更新
- 详情见 `memory/2026-04-15.md`

### 2026-04-10
- openclaw-easy 项目优化
  - update.sh 多格式压缩支持
  - /api/fix 异步化
  - login/setup 重定向问题修复
  - barCode 设备标识参数
  - HTML/API 路由修复
- 详情见 `memory/2026-04-10.md`

### 2026-04-17
- hermes-docker 构建完成并启动
  - `hermes-base:latest` (2.02GB) + `hermes-agent:latest` (4.92GB) 已构建
  - 容器运行于 49080 端口，WebSocket 飞书已连接
  - 模型配置：glm-5.1 + 智谱 GLM (zai)
  - 数据卷 hermes-data 持久化配置
  - 详情见 `projects/hermes-docker/README.md`

### 2026-04-14
- openclaw-easy 两大改造（基于 feature/modular-refactor 分支）
  - App API 认证体系：持久化 accessToken（7天有效）、appAuthMiddleware 保护5个接口、appAuthRequired 开关
  - 更新机制重构：同级目录+测试启动+mv切换，routes/update.js 从370行简化到169行
- Git 推送：001069e, c6c5241, 61389cd → vehang/openclaw-easy feature/modular-refactor
- 创建了 hermes-docker 部署项目
- 教训：不同项目必须在各自 git 目录下操作，push 前确认 remote
- 详情见 `memory/2026-04-14.md`
