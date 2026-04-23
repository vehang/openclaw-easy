# MEMORY.md - Notify Bot 记忆

## 每日任务

### 1️⃣ 天气早报推送

| 项目 | 配置 |
|------|------|
| **推送时间** | 每天 07:00 (Asia/Shanghai) |
| **地址** | 湖北省宜昌市夷陵区东湖大道50号 |
| **坐标** | 30.77°N, 111.33°E |
| **用户ID** | ou_7172afb8fa3c2f51bb02b6af097a4b27 |
| **推送方式** | 飞书私聊卡片消息 |

**模板位置**: `/root/.openclaw/workspace/.ai/schedules/weather-template.md`
**配置位置**: `/root/.openclaw/workspace/.ai/schedules/daily-weather-yichang.md`

---

### 2️⃣ 科技资讯推送

| 时间 | 名称 | Cron |
|------|------|------|
| **08:00** | 早报 | `0 8 * * *` |
| **12:00** | 午报 | `0 12 * * *` |
| **20:00** | 晚报 | `0 20 * * *` |

**关键词筛选**:
- AI / 人工智能 / 大模型 / LLM
- 芯片 / 半导体 / GPU / CPU
- 英伟达 / NVIDIA / 台积电
- 微软 / 甲骨文 / Salesforce
- 新能源 / 存储 / 内存
- 软件股 / SaaS / 云计算

**信息来源**:
- 36氪 (36kr.com)
- 虎嗅 (huxiu.com)
- 机器之心 (jiqizhixin.com)
- IT之家 (ithome.com)

**配置位置**: `/root/.openclaw/workspace/.ai/schedules/news-config.md`
**执行指南**: `/root/.openclaw/workspace/.ai/schedules/cron-news-task.md`

---

### 3️⃣ GitHub 仓库日报

| 项目 | 配置 |
|------|------|
| **仓库** | openclaw/openclaw |
| **推送时间** | 每天 21:00 (Asia/Shanghai) |
| **Cron** | `0 21 * * *` |
| **监控内容** | Commits + Pull Requests |
| **脚本位置** | `/root/.openclaw/workspace/scripts/github-repo-monitor.js` |
| **状态文件** | `/root/.openclaw/workspace/scripts/github-monitor-state.json` |
| **认证方式** | GitHub PAT (ghp_...HPAF) |
| **推送方式** | 飞书卡片消息 |

**卡片标题**: `🐙 OpenClaw 仓库日报 - {日期}`

**内容结构**:
1. PR 概览（已合并/新开/关闭）
2. 已合并 PR 详情（含 label、作者）
3. 新开/关闭 PR
4. Commits 按分类展示（新功能/修复/优化/重构/文档/CI/其他）
5. 贡献者统计

---

## 重要修正记录

### 2026-03-21 天气位置修正
- ❌ 错误配置: `location: 'Shanghai'`
- ✅ 正确配置: `location: 'Yichang'` → 改为坐标 `30.77,111.33`

### 2026-03-21 资讯格式修正
- ❌ 错误格式: 简单 `lark_md` 列表
- ✅ 正确格式: fields 布局 + plain_text 内容 + hr 分隔

---

## 推送规范

### 天气推送规范
- 卡片标题: `🌤️ 宜昌夷陵区 天气早报`
- 必须包含: 日期、农历、温度、湿度、风速、日出日落、穿搭建议、出行建议

### 资讯推送规范
- 卡片标题: `📰 科技资讯早/午/晚报 - {日期} {时间}`
- 分类标题使用 fields 布局（左标题右空白）
- 新闻内容使用 plain_text 格式
- 分隔线使用 hr
- 底部注明来源

---

*创建时间: 2026-03-31*
_来源: 主工作区记忆文件迁移_