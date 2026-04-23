# Cron 任务执行指南

## 科技资讯推送任务

当收到此任务时，请按以下步骤执行：

### 1. 获取资讯
从以下 RSS Feed 获取最新资讯：
- 36氪: https://36kr.com/feed
- 虎嗅: https://www.huxiu.com/rss/0.xml
- 机器之心: https://www.jiqizhixin.com/rss
- IT之家: https://www.ithome.com/rss

### 2. 筛选关键词
只保留包含以下关键词的新闻：
- AI / 人工智能 / 大模型 / LLM
- 芯片 / 半导体 / GPU / CPU
- 英伟达 / NVIDIA / 台积电
- 微软 / 甲骨文 / Salesforce
- 新能源 / 存储 / 内存
- 软件股 / SaaS / 云计算
- 数据中心

### 3. 整理分类
按以下分类整理（每类2-3条）：
- 🔥 热点头条
- 📈 市场动态
- 🏢 公司动态
- 💡 技术突破
- 🔋 新能源

### 4. 发送卡片消息

**必须**使用飞书 API 发送卡片消息，不要只返回文本！

**获取 Access Token:**
```bash
curl -s -X POST "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal" \
  -H "Content-Type: application/json" \
  -d '{"app_id":"cli_a91476e0a5f8dbc0","app_secret":"CRV8phtp1hTE7sz5tpwlCfGXnaIEvWCV"}'
```

**发送卡片消息:**
```bash
curl -s -X POST "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "receive_id": "oc_ffc3e3276fcf68d1759933ec0e494ae8",
    "msg_type": "interactive",
    "content": "{卡片JSON}"
  }'
```

**卡片模板:**
```json
{
  "config": {"wide_screen_mode": true},
  "header": {
    "template": "blue",
    "title": {"tag": "plain_text", "content": "📰 科技资讯{早/午/晚}报 - {日期} {时间}"}
  },
  "elements": [
    {"tag": "div", "fields": [{"is_short": true, "text": {"tag": "lark_md", "content": "**🔥 热点头条**"}}, {"is_short": true, "text": {"tag": "lark_md", "content": ""}}]},
    {"tag": "div", "text": {"tag": "plain_text", "content": "• {新闻1}"}},
    {"tag": "div", "text": {"tag": "plain_text", "content": "• {新闻2}"}},
    {"tag": "hr"},
    {"tag": "div", "fields": [{"is_short": true, "text": {"tag": "lark_md", "content": "**📈 市场动态**"}}, {"is_short": true, "text": {"tag": "lark_md", "content": ""}}]},
    {"tag": "div", "text": {"tag": "plain_text", "content": "• {新闻1}"}},
    {"tag": "div", "text": {"tag": "plain_text", "content": "• {新闻2}"}},
    {"tag": "hr"},
    {"tag": "div", "fields": [{"is_short": true, "text": {"tag": "lark_md", "content": "**🏢 公司动态**"}}, {"is_short": true, "text": {"tag": "lark_md", "content": ""}}]},
    {"tag": "div", "text": {"tag": "plain_text", "content": "• {新闻1}"}},
    {"tag": "div", "text": {"tag": "plain_text", "content": "• {新闻2}"}},
    {"tag": "hr"},
    {"tag": "div", "fields": [{"is_short": true, "text": {"tag": "lark_md", "content": "**💡 技术突破**"}}, {"is_short": true, "text": {"tag": "lark_md", "content": ""}}]},
    {"tag": "div", "text": {"tag": "plain_text", "content": "• {新闻1}"}},
    {"tag": "div", "text": {"tag": "plain_text", "content": "• {新闻2}"}},
    {"tag": "hr"},
    {"tag": "div", "fields": [{"is_short": true, "text": {"tag": "lark_md", "content": "**🔋 新能源**"}}, {"is_short": true, "text": {"tag": "lark_md", "content": ""}}]},
    {"tag": "div", "text": {"tag": "plain_text", "content": "• {新闻1}"}},
    {"tag": "hr"},
    {"tag": "note", "elements": [{"tag": "plain_text", "content": "来源：36氪、虎嗅、机器之心、IT之家 | Notify Bot 自动推送"}]}
  ]
}
```

### 5. 完成确认
发送成功后返回：✅ 科技资讯{早/午/晚}报已发送

---

## 重要提醒

⚠️ **必须实际调用飞书 API 发送卡片消息！**
⚠️ **不要只返回文本摘要！**
⚠️ **Chat ID: oc_ffc3e3276fcf68d1759933ec0e494ae8**

---

*创建时间: 2026-02-26 08:10*
