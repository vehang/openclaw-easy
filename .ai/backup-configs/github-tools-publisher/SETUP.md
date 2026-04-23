# GitHub 热门工具公众号发布器 - 配置指南

## 📁 文件结构

```
/root/.openclaw/skills/github-tools-publisher/
├── SKILL.md              # Skill 主文件
├── accounts.json         # 公众号配置
├── scripts.sh            # GitHub 采集脚本
├── styles.json           # 文章样式配置
└── SETUP.md              # 本文件
```

---

## 🔧 快速配置

### 1. 配置公众号

编辑 `accounts.json`：

```json
{
  "default": "main",
  "accounts": {
    "main": {
      "name": "程序员宝盒",
      "appid": "你的AppID",
      "secret": "你的AppSecret",
      "author": "程序员宝盒"
    }
  }
}
```

### 2. （可选）配置 GitHub Token

提高 API 限额（从 60次/小时 到 5000次/小时）：

```bash
export GITHUB_TOKEN="ghp_xxxxx"
```

获取 Token：https://github.com/settings/tokens

---

## 📝 使用方式

### 基础用法

```
发布GitHub工具
```

### 指定参数

```
发布GitHub工具，语言=Python，数量=5，时间=weekly
```

### 手动测试脚本

```bash
# 今日热门（默认）
bash /root/.openclaw/skills/github-tools-publisher/scripts.sh daily "" 10

# 本周热门，JavaScript 项目
bash /root/.openclaw/skills/github-tools-publisher/scripts.sh weekly javascript 5

# 本月热门，Python 项目
bash /root/.openclaw/skills/github-tools-publisher/scripts.sh monthly python 8
```

---

## 🕐 定时任务

### 每周一早上 9 点发布

```bash
openclaw cron add \
  --name "github-tools-weekly" \
  --cron "0 9 * * 1" \
  --tz "Asia/Shanghai" \
  --session isolated \
  --message "用 main 账号发布GitHub工具；时间=weekly；数量=5；不要提问，直接执行"
```

### 每天早上 8 点发布

```bash
openclaw cron add \
  --name "github-tools-daily" \
  --cron "0 8 * * *" \
  --tz "Asia/Shanghai" \
  --session isolated \
  --message "发布GitHub工具；时间=daily；数量=3；不要提问，直接执行"
```

---

## 📊 与 wechat-ai-publisher 的对比

| 对比项 | wechat-ai-publisher | github-tools-publisher |
|--------|---------------------|------------------------|
| 内容来源 | AI 热点新闻（Tavily/Exa） | GitHub Trending |
| 内容类型 | 行业动态、技术趋势 | 开源工具推荐 |
| 目标读者 | AI 从业者 | 程序员、职场人士 |
| 文章风格 | 深度分析 | 实用推荐 |
| 更新频率 | 每天 | 每周（建议） |
| 公众号 | 通用 | 程序员宝盒 |

---

## ⚠️ 注意事项

1. **GitHub API 限额**：未配置 Token 时每小时只有 60 次请求
2. **内容筛选**：确保推荐的工具确实有用
3. **版权问题**：转载项目信息需标注来源
4. **时效性**：热门项目变化快，建议每周更新

---

## 📋 待办清单

- [ ] 提供程序员宝盒公众号的 AppID
- [ ] 提供程序员宝盒公众号的 AppSecret
- [ ] （可选）配置 GitHub Token
- [ ] 测试发布流程
