# MEMORY.md - 长期记忆

## 技术发现

### Feishu 图片发送（重要！）

**⚠️ 务必按以下方式发送图片，否则无法成功！**

#### 正确方式
```
message 工具参数:
- action: "send"
- channel: "feishu"
- media: "/完整/本地/路径/xxx.png"   ← 关键！必须是完整绝对路径
- message: "图片说明文字"
- target: "user:ou_xxx" 或 "chat:oc_xxx"
```

#### 支持格式
jpg, jpeg, png, gif, webp, bmp, ico, tiff

#### 示例
```json
{
  "action": "send",
  "channel": "feishu",
  "media": "/root/.openclaw/workspace/webpage-screenshot.png",
  "message": "网页截图",
  "target": "user:ou_c181a94df7dab9d310523c96dd6f473a"
}
```

#### 常用路径
- 截图目录：`/root/.openclaw/workspace/screenshots/`
- 工作区根目录：`/root/.openclaw/workspace/`

#### 错误方式（不要用！）
- ❌ `buffer` 参数 + base64 数据 → 不支持，mediaUrl 会是 null
- ❌ 相对路径 → 必须用绝对路径
- ❌ 不存在的路径 → 发送前务必确认文件存在

#### 发送前检查
```bash
# 确认文件存在
ls -la /path/to/image.png
```

- **验证日期**：2026-03-03（测试通过）

## 重要配置

### Feishu
- 用户 ID：`ou_d1561ab7efa7c3915dbc48da95564b6a`
- 新闻推送群：`oc_ffc3e3276fcf68d1759933ec0e494ae8`
- 模板备份文档：`Fj7sddouPohl5KxNoRkcTmqknxB`

### Git 自动备份
- 仓库：https://github.com/vehang/openclaw_backup
- 分支：master
- 备份频率：每小时（有更新才备份）
- 脚本：`/root/.openclaw/workspace/scripts/git-backup.sh`
- 日志：`/root/.openclaw/workspace/memory/git-backup.log`
- Cron ID：`3b73210c-7ecf-4523-a1b7-a780c5a925cd`

**备份内容：**
1. 工作区配置（AGENTS.md, SOUL.md, USER.md, MEMORY.md 等）
2. Skills 配置（github-tools-publisher, multi-agent-dev, wechat-ai-publisher）
3. Cron 任务配置（cron-jobs.json）
4. OpenClaw 主配置模板（openclaw.json.template，敏感信息已脱敏）

**恢复指南：** `backup-configs/README.md`

### 模型配置
- 只有 GLM-5（智谱）可用
- default/glm-5：通用任务
- coding/glm-5：开发任务

### 网络限制
- 可访问：GitHub、Baidu、Zhipu AI
- 不可访问：Hacker News、Bing 等国际站点

## 已安装的 Skills

### ClawHub Skills
- multi-search-engine：17 个搜索引擎（8 国内 + 9 国际）
- x-reader：国内链接解析（微信/小红书/B站/X）
- find-skills：搜索发现更多 skill

### cafe3310 Skills（16个）
- remove-model-cliche：去 AI 腔
- content-research-writer：深度文章写作
- weekly-report-writer：周报撰写
- project-learner：项目学习
- im-local-kb：IM 知识库整理
- long-audio-transcript-processor：长语音转写
- git-snapshot-rollback：Git 安全回退
- doc-todo-log-loop：轻量开发循环
- project-management：项目管理范式
- pmp-dev-process：PMP 式迭代
- project-design-concept-organizer：设计理念整理
- tdd-dev-cycle：TDD 工作流
- browser-testing：浏览器测试
- code-naming-auditor：代码术语审计
- media-organizer：媒体库整理
- im-contact-sorter：IM 联系人整理

### 自定义 Skills
- wechat-ai-publisher：微信公众号自动发布
- github-tools-publisher：程序员宝盒公众号
- multi-agent-dev：多 Agent 协作开发

## 待办事项
- [ ] 等待用户提供微信公众号 AppID/AppSecret
- [ ] 重启 Docker 容器让 compaction 配置生效

### npm 全局安装目录（重要！）
- **路径**：`/root/.openclaw/npm-global/`
- **配置**：`npm config set prefix '/root/.openclaw/npm-global'`
- **原因**：此目录在宿主机挂载，Docker 升级后不丢失
- **已安装工具**：
  - `claude` (Claude Code 2.1.63)
- **使用方式**：
  ```bash
  export PATH="/root/.openclaw/npm-global/bin:$PATH"
  claude --version
  ```
- **自动修复脚本**：`/root/.openclaw/workspace/scripts/ensure-npm-path.sh`
- **触发条件**：如果发现 claude 命令不可用，自动执行修复脚本
- **日期**：2026-03-03

### Claude Code 配置（智谱 GLM-5）
- **配置目录**：`/root/.openclaw/claude-config/`（符号链接到 `~/.claude`）
- **配置文件**：
  - `settings.json` - 环境变量配置
  - `~/.claude.json` - 完成引导标记
- **模型映射**：全部使用 GLM-5
  - Opus → GLM-5
  - Sonnet → GLM-5
  - Haiku → GLM-5
- **API Base URL**：`https://open.bigmodel.cn/api/anthropic`
- **自动修复**：升级后运行 `scripts/ensure-npm-path.sh` 自动恢复
- **日期**：2026-03-03

## 技术发现

### Context Limit 配置
- **问题**：Context limit exceeded 导致对话重置
- **配置**：`agents.defaults.compaction.reserveTokensFloor: 20000`
- **位置**：`/root/.openclaw/openclaw.json`
- **日期**：2026-03-03

### 媒体路径安全限制
- **问题**：`LocalMediaAccessError: Local media path is not under an allowed directory: /tmp/`
- **原因**：OpenClaw 安全策略限制，`/tmp/` 不在白名单
- **解决方案**：截图和临时文件保存到 `~/.openclaw/workspace/screenshots/`
- **已修复文件**：
  - `wechat-ai-publisher/scripts.sh`
  - `wechat-ai-publisher/SKILL.md`
  - `scripts/playwright-test.py`
- **日期**：2026-03-03

### Agent 超时配置
- 配置文件：`/root/.openclaw/openclaw.json`
- 添加 `agents.defaults.timeoutSeconds: 120`
- 解决 "Request timed out before a response was generated" 错误

### x-reader 使用
- **命令**：`x-reader <URL>`
- **支持**：微信公众号、小红书、B站、X/Twitter
- **原理**：Jina AI 抓取 → Playwright 浏览器回退
- **存储**：`unified_inbox.json`（当前目录）
