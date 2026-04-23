---
name: github-tools-publisher
description: 自动采集 GitHub 热门开源工具，整理成公众号推文并发布到草稿箱。当用户说"发布GitHub工具"、"推荐开源工具"、"程序员宝盒推文"、"publish github tools"时触发。
homepage: https://github.com/openclaw/openclaw
metadata: {"openclaw":{"emoji":"📦","requires":{"bins":["bash","curl","jq"]}}}
---

# GitHub 热门工具公众号发布器

专为「程序员宝盒」类公众号设计，自动采集 GitHub 热门开源工具，整理成推荐推文。

## 完整链路

```
1. 采集 GitHub Trending 数据
       ↓
2. 筛选适合程序员/职场人士的工具
       ↓
3. 获取项目详细信息（star、描述、功能）
       ↓
4. 撰写推荐文章（Markdown 格式）
       ↓
5. 生成配图（可选）
       ↓
6. 上传图片到微信服务器
       ↓
7. 转换 HTML 并发布到公众号草稿箱
       ↓
8. 提示用户检查
```

---

## 配置信息

### 微信公众号 API

**配置文件**：`/root/.openclaw/skills/github-tools-publisher/accounts.json`

```json
{
  "default": "main",
  "accounts": {
    "main": {
      "name": "程序员宝盒",
      "appid": "你的AppID",
      "secret": "你的AppSecret",
      "author": "程序员宝盒",
      "default_style": "github",
      "default_images": "封面+3张"
    }
  }
}
```

### GitHub API（可选，提高限额）

- 无需配置也可使用（使用公开 API，每小时 60 次请求）
- 如需更高限额，配置 `GITHUB_TOKEN`：https://github.com/settings/tokens

---

## 执行流程详解

### Step 1: 采集 GitHub Trending 数据

**数据源**：

1. **GitHub Trending 页面**（官方热门榜单）
2. **GitHub API**（获取详细信息）

**采集参数**：

| 参数 | 默认值 | 说明 |
|------|--------|------|
| 时间范围 | `daily` | 今日热门（可选：weekly/monthly） |
| 编程语言 | 多种 | 筛选特定语言或全部 |
| 数量 | 20 | 采集数量 |
| 最少 star | 100 | 过滤门槛 |

**采集代码示例**：

```bash
# 获取 GitHub Trending 数据
curl -s "https://api.gitterapp.com/repositories?language=&since=daily" | jq '.[0:20]'

# 或使用 GitHub 官方 API（搜索热门）
curl -s "https://api.github.com/search/repositories?q=stars:>1000&sort=stars&order=desc&per_page=20"
```

---

### Step 2: 筛选适合程序员/职场人士的工具

**筛选标准**：

1. **实用性**：能解决实际问题
2. **易用性**：文档清晰、上手简单
3. **活跃度**：近期有更新
4. **star 数**：优先高 star 项目
5. **类别匹配**：适合程序员日常使用

**推荐类别**：

| 类别 | 示例项目 |
|------|----------|
| 开发工具 | IDE 插件、命令行工具、代码生成器 |
| 效率工具 | 自动化脚本、工作流工具 |
| 学习资源 | 教程、面试题库、算法练习 |
| UI 组件 | 前端框架、组件库 |
| DevOps | CI/CD、监控、部署工具 |
| AI 工具 | LLM 工具、AI 辅助开发 |

**排除类别**：

- 纯娱乐项目
- 不活跃项目（超过 1 年未更新）
- 过于小众的工具

---

### Step 3: 获取项目详细信息

**需要获取的信息**：

```json
{
  "name": "项目名称",
  "full_name": "owner/repo",
  "description": "项目描述",
  "stars": 12345,
  "forks": 1234,
  "language": "TypeScript",
  "topics": ["cli", "tool", "developer-tools"],
  "url": "https://github.com/owner/repo",
  "homepage": "https://项目官网.com",
  "updated_at": "2026-02-28T00:00:00Z"
}
```

**获取方式**：

```bash
# 使用 GitHub API 获取详情
curl -s "https://api.github.com/repos/owner/repo" | jq '{
  name, full_name, description, stargazers_count, forks_count, 
  language, topics, html_url, homepage, updated_at
}'
```

---

### Step 4: 撰写推荐文章

**文章结构**：

```markdown
# 📦 本周 GitHub 热门开源工具推荐（第 X 期）

> 精选 5 个值得关注的开源项目，提升你的开发效率

---

## 1. 项目名称 ⭐ 12.3k

**一句话介绍**：简洁明了的功能描述

**适合人群**：前端开发 / 后端开发 / 全栈 / DevOps

**核心功能**：
- 功能点 1
- 功能点 2
- 功能点 3

**快速上手**：
```bash
npm install xxx
```

**项目地址**：[GitHub](链接)

---

## 2. 项目名称 ⭐ 8.9k
...

---

## 💡 使用建议

1. 根据自己的技术栈选择
2. 先看文档再上手
3. 关注项目活跃度

---

## 📌 往期推荐

- [第 1 期](链接) - AI 工具合集
- [第 2 期](链接) - 效率工具合集

---

> 每周更新，关注「程序员宝盒」获取更多优质开源工具
```

**写作风格**：

- 简洁实用，不说废话
- 突出「能帮我解决什么问题」
- 配上快速上手指引
- 面向职场人士，强调效率提升

---

### Step 5: 生成配图（可选）

**封面图**：

```
Prompt: "GitHub 开源工具推荐封面，展示代码和工具图标，科技感蓝色调，简洁扁平设计，中文标注：程序员宝盒"
```

**配图建议**：

- 项目截图（如果有）
- 功能演示 GIF
- 架构图/流程图

---

### Step 6-8: 发布到公众号

与 `wechat-ai-publisher` 相同的流程：

1. 上传图片到微信服务器
2. 转换 HTML 并发布草稿
3. 提示用户检查

---

## 使用方式

### 基础用法

```
发布GitHub工具
```

### 指定账号

```
用 programmer 账号发布GitHub工具
```

### 自定义参数

```
发布GitHub工具，语言=Python，数量=5，时间=weekly
```

### 完整示例

```
用 main 账号发布GitHub工具
时间范围：本周热门
编程语言：不限
数量：5 个工具
风格：简洁实用
配图：封面+2张
```

---

## 参数说明

### 时间范围

| 值 | 说明 |
|------|------|
| `daily` | 今日热门（默认） |
| `weekly` | 本周热门 |
| `monthly` | 本月热门 |

### 编程语言

| 值 | 说明 |
|------|------|
| 不填 | 全部语言 |
| `javascript` | JavaScript 项目 |
| `python` | Python 项目 |
| `java` | Java 项目 |
| `go` | Go 项目 |
| `typescript` | TypeScript 项目 |

### 数量

- 默认：5 个
- 建议：3-8 个（太多读者看不完）

---

## 定时任务

### 每周发布

```bash
openclaw cron add \
  --name "github-tools-weekly" \
  --cron "0 9 * * 1" \
  --tz "Asia/Shanghai" \
  --session isolated \
  --message "用 main 账号发布GitHub工具；时间=weekly；数量=5；不要提问，直接执行"
```

### 每天发布

```bash
openclaw cron add \
  --name "github-tools-daily" \
  --cron "0 9 * * *" \
  --tz "Asia/Shanghai" \
  --session isolated \
  --message "发布GitHub工具；时间=daily；数量=3；不要提问，直接执行"
```

---

## 注意事项

1. **项目筛选**：确保推荐的工具确实有用
2. **版权问题**：转载项目信息需标注来源
3. **更新频率**：建议每周 1-2 次，避免内容同质化
4. **读者反馈**：关注哪些类型的工具更受欢迎
5. **时效性**：热门项目变化快，注意及时更新

---

## 与 wechat-ai-publisher 的区别

| 对比项 | wechat-ai-publisher | github-tools-publisher |
|--------|---------------------|------------------------|
| 内容来源 | AI 热点新闻 | GitHub Trending |
| 内容类型 | 行业动态、技术趋势 | 开源工具推荐 |
| 目标读者 | AI 从业者 | 程序员、职场人士 |
| 文章风格 | 深度分析 | 实用推荐 |
| 更新频率 | 每天 | 每周（建议） |
