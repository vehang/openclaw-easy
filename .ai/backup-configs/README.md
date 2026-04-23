# OpenClaw 配置备份说明

## 备份内容

### 1. 工作区文件（主备份）
路径：`/root/.openclaw/workspace/`
- 个性化配置：AGENTS.md, SOUL.md, USER.md, IDENTITY.md, TOOLS.md
- 长期记忆：MEMORY.md
- 日常日志：memory/
- 脚本：scripts/
- 调度文档：schedules/

### 2. Skills 配置
路径：`backup-configs/`
- `github-tools-publisher/` - 程序员宝盒公众号 skill
- `multi-agent-dev/` - 多 Agent 协作 skill
- `wechat-ai-publisher/` - 微信公众号发布 skill

### 3. Cron 任务配置
- `cron-jobs.json` - 定时任务配置备份

### 4. OpenClaw 主配置模板
- `openclaw.json.template` - 配置模板（敏感信息已替换为占位符）

## 恢复指南

### 恢复主配置
1. 复制模板文件：
   ```bash
   cp backup-configs/openclaw.json.template /root/.openclaw/openclaw.json
   ```

2. 替换占位符为实际值：
   - `{{GLM_API_KEY_DEFAULT}}` - 智谱 AI 默认 API Key
   - `{{GLM_API_KEY_CODING}}` - 智谱 AI 编码 API Key
   - `{{FEISHU_MAIN_APP_ID}}` - 飞书主账号 App ID
   - `{{FEISHU_MAIN_APP_SECRET}}` - 飞书主账号 App Secret
   - `{{FEISHU_DEV_APP_ID}}` - 飞书开发账号 App ID
   - `{{FEISHU_DEV_APP_SECRET}}` - 飞书开发账号 App Secret
   - `{{FEISHU_NOTIFY_APP_ID}}` - 飞书通知账号 App ID
   - `{{FEISHU_NOTIFY_APP_SECRET}}` - 飞书通知账号 App Secret
   - `{{FEISHU_WECHAT_APP_ID}}` - 飞书微信账号 App ID
   - `{{FEISHU_WECHAT_APP_SECRET}}` - 飞书微信账号 App Secret
   - `{{GATEWAY_AUTH_TOKEN}}` - Gateway 认证 Token

### 恢复 Skills
```bash
cp -r backup-configs/github-tools-publisher /root/.openclaw/skills/
cp -r backup-configs/multi-agent-dev /root/.openclaw/skills/
cp -r backup-configs/wechat-ai-publisher /root/.openclaw/skills/
```

### 恢复 Cron 任务
```bash
cp backup-configs/cron-jobs.json /root/.openclaw/cron/jobs.json
```

## 不备份的内容（敏感/运行时数据）

- `/root/.openclaw/credentials/` - 凭证文件
- `/root/.openclaw/sessions/` - 会话数据
- `/root/.openclaw/logs/` - 日志文件
- `/root/.openclaw/delivery-queue/` - 消息队列
- 实际的 `openclaw.json`（包含 API keys）

## 自动备份

- 频率：每小时
- 脚本：`scripts/git-backup.sh`
- 仓库：https://github.com/vehang/openclaw_backup
