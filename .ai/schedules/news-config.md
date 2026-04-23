# 科技资讯推送配置

## 基本信息

| 项目 | 值 |
|------|-----|
| **服务名称** | 科技资讯早/午/晚报 |
| **推送机器人** | Notify Bot |
| **Chat ID** | oc_ffc3e3276fcf68d1759933ec0e494ae8 |
| **用户 ID** | ou_7172afb8fa3c2f51bb02b6af097a4b27 |

---

## 关键词列表

### 核心关注（必须包含）
- AI / 人工智能
- 半导体 / 芯片
- 软件股 / SaaS
- 新能源
- 美联储
- 存储 / 内存
- 产业链
- 编程

### 重点公司
- 英伟达 / NVIDIA
- 台积电
- 微软
- 甲骨文 / Oracle
- Salesforce

### 技术领域
- GPU / CPU
- 数据中心
- 云计算
- 大模型 / LLM

---

## 推送时间

| 时间 | 名称 | 内容侧重 |
|------|------|----------|
| **08:00** | 早报 | 隔夜全球市场 + 重大新闻 |
| **12:00** | 午报 | 上午热点 + A股动态 |
| **20:00** | 晚报 | 全天汇总 + 明日关注 |

---

## 信息来源

### 中文源
- 36氪 (36kr.com)
- 机器之心 (jiqizhixin.com)
- 虎嗅 (huxiu.com)
- 新智元 (xinzhiyuan.com)
- 量子位 (qbitai.com)
- 财联社 (cls.cn)
- 东方财富 (eastmoney.com)

### 英文源
- TechCrunch
- The Verge
- Reuters Technology
- Bloomberg Technology

---

## 推送格式（卡片消息）

```json
{
  "config": {"wide_screen_mode": true},
  "header": {
    "template": "blue",
    "title": {"tag": "plain_text", "content": "📰 科技资讯{早/午/晚}报 - {日期} {时间}"}
  },
  "elements": [
    {"tag": "div", "fields": [
      {"is_short": true, "text": {"tag": "lark_md", "content": "**🔥 热点头条**"}},
      {"is_short": true, "text": {"tag": "lark_md", "content": ""}}
    ]},
    {"tag": "div", "text": {"tag": "plain_text", "content": "• {头条1}"}},
    {"tag": "div", "text": {"tag": "plain_text", "content": "• {头条2}"}},
    {"tag": "hr"},
    {"tag": "div", "fields": [
      {"is_short": true, "text": {"tag": "lark_md", "content": "**📈 市场动态**"}},
      {"is_short": true, "text": {"tag": "lark_md", "content": ""}}
    ]},
    {"tag": "div", "text": {"tag": "plain_text", "content": "• {市场1}"}},
    {"tag": "div", "text": {"tag": "plain_text", "content": "• {市场2}"}},
    {"tag": "hr"},
    {"tag": "div", "fields": [
      {"is_short": true, "text": {"tag": "lark_md", "content": "**🏢 公司动态**"}},
      {"is_short": true, "text": {"tag": "lark_md", "content": ""}}
    ]},
    {"tag": "div", "text": {"tag": "plain_text", "content": "• {公司1}"}},
    {"tag": "div", "text": {"tag": "plain_text", "content": "• {公司2}"}},
    {"tag": "hr"},
    {"tag": "div", "fields": [
      {"is_short": true, "text": {"tag": "lark_md", "content": "**💡 技术突破**"}},
      {"is_short": true, "text": {"tag": "lark_md", "content": ""}}
    ]},
    {"tag": "div", "text": {"tag": "plain_text", "content": "• {技术1}"}},
    {"tag": "div", "text": {"tag": "plain_text", "content": "• {技术2}"}},
    {"tag": "hr"},
    {"tag": "note", "elements": [
      {"tag": "plain_text", "content": "来源：36氪、机器之心、财联社 | Notify Bot 自动推送"}
    ]}
  ]
}
```

---

## Cron 配置

```json
{
  "newsMorning": {
    "cron": "0 8 * * *",
    "timezone": "Asia/Shanghai"
  },
  "newsNoon": {
    "cron": "0 12 * * *",
    "timezone": "Asia/Shanghai"
  },
  "newsEvening": {
    "cron": "0 20 * * *",
    "timezone": "Asia/Shanghai"
  }
}
```

---

## 搜索关键词组合

### 组合 1：AI + 芯片
```
(AI OR 人工智能 OR 大模型 OR LLM) AND (芯片 OR 半导体 OR GPU OR 英伟达 OR NVIDIA)
```

### 组合 2：市场 + 公司
```
(软件股 OR SaaS OR 云计算) AND (微软 OR 甲骨文 OR Salesforce OR 台积电)
```

### 组合 3：宏观 + 产业
```
(美联储 OR 新能源) AND (存储 OR 内存 OR 数据中心 OR 产业链)
```

---

*配置版本: v1.0*
*创建时间: 2026-02-25 18:57*
