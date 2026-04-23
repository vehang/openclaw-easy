# Claude Code CLI 安装指南

## 当前环境信息

| 项目 | 值 |
|------|-----|
| 已安装版本 | 2.1.112 |
| 安装路径 | `/usr/local/lib/node_modules/@anthropic-ai/claude-code/` |
| 可执行文件 | `/usr/local/bin/claude` |
| 配置文件 | `/root/.claude/settings.json` |
| API 端点 | 智谱 Anthropic 兼容 (`https://open.bigmodel.cn/api/anthropic`) |
| 模型 | glm-5 |

## 安装命令

```bash
# ✅ 正确：指定 2.1.112 版本
npm install -g @anthropic-ai/claude-code@2.1.112

# ❌ 错误：@latest（2.1.114+）无法在此环境运行
npm install -g @anthropic-ai/claude-code@latest
```

## 版本限制说明

### 为什么不能用最新版？

**2.1.113 起架构变更**：

| 版本范围 | 架构 | 本机状态 |
|----------|------|---------|
| ≤ 2.1.112 | 纯 Node.js（cli.js） | ✅ 可运行 |
| ≥ 2.1.113 | Rust 原生二进制 | ❌ 无法安装 |

2.1.113 的 CHANGELOG 原文：
> "Changed the CLI to spawn a native Claude Code binary (via a per-platform optional dependency) instead of bundled JavaScript"

### 根本原因

1. `@anthropic-ai/claude-code-linux-x64` 在 npm registry 上是**空壳包**（version 0.0.0，只有 LICENSE.md）
2. Anthropic 没有把 Linux x64 原生二进制发布到 npm
3. postinstall 脚本找不到原生包，所以 CLI 无法启动

### 如果未来想用最新版

需要在 npm 上能拿到 `@anthropic-ai/claude-code-linux-x64` 的实际二进制文件。可能的方案：
- 等待 Anthropic 修复 npm 发布流程
- 从 Anthropic 官方 CDN 手动下载二进制

## 配置文件

### `/root/.claude/settings.json`

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "智谱AI Token",
    "ANTHROPIC_BASE_URL": "https://open.bigmodel.cn/api/anthropic",
    "API_TIMEOUT_MS": "3000000",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-5",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-5",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-5"
  },
  "enabledPlugins": {
    "example-skills@anthropic-agent-skills": true
  },
  "skipDangerousModePermissionPrompt": true
}
```

### 备份位置

- OpenClaw 备份：`/root/.openclaw/claude-config/settings.json`
- 迁移数据：`/root/.openclaw/data/claude-config/settings.json`

## 验证安装

```bash
claude --version
# 预期输出: 2.1.112 (Claude Code)

claude --help
# 预期输出: Usage 信息
```

## 注意事项

1. **不要 `npm update -g`** — 会升级到不能用的版本
2. **hermes 镜像**也是用 2.1.112（Dockerfile.base 中 `npm install -g @anthropic-ai/claude-code`，构建时的 latest 就是 2.1.112）
3. **固定版本**：如果要确保兼容，在 Dockerfile 和手动安装时都指定 `@2.1.112`

---

_最后更新: 2026-04-18_
