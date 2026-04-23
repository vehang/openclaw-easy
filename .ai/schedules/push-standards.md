# 推送服务规范文档

> 本文档定义了天气和资讯推送的标准格式，所有推送必须严格遵守此规范。
> 
> **创建时间**: 2026-03-21  
> **最后更新**: 2026-03-21 12:15

---

## 一、天气推送规范

### 1.1 基本信息

| 项目 | 值 |
|------|-----|
| **服务名称** | 天气早报 |
| **推送机器人** | Notify Bot |
| **推送时间** | 每天 07:00 |
| **推送渠道** | 飞书群聊 |
| **Chat ID** | oc_ffc3e3276fcf68d1759933ec0e494ae8 |

### 1.2 位置信息（重要）

```
坐标: 30.77,111.33
地址: 湖北省宜昌市夷陵区东湖大道50号
区域: 小溪塔（夷陵区中心）
```

**⚠️ 严格要求**: 必须使用坐标 `30.77,111.33`，不能使用城市名或其他坐标。

### 1.3 脚本位置

```
/root/.openclaw/workspace/scripts/weather-card.cjs
```

### 1.4 配置参数

```javascript
const CONFIG = {
  appId: 'cli_a91476e0a5f8dbc0',
  appSecret: 'CRV8phtp1hTE7sz5tpwlCfGXnaIEvWCV',
  chatId: 'oc_ffc3e3276fcf68d1759933ec0e494ae8',
  location: '30.77,111.33',  // ⚠️ 必须使用坐标，不能用城市名
  lang: 'zh-cn'
};
```

### 1.5 卡片标题格式

```
🌤️ 宜昌夷陵区 天气早报
```

### 1.6 卡片内容要求

必须包含：
- 📅 日期和星期
- 🌡️ 当前温度、体感温度
- 📊 今日温度范围（最低 ~ 最高）
- 💧 湿度
- 🌬️ 风向、风速
- 🌅 日出、日落时间
- 📆 未来两天预报
- 💡 生活建议（穿搭、出行）

### 1.7 卡片消息格式（重要）

```json
{
  "config": { "wide_screen_mode": true },
  "header": {
    "template": "turquoise",
    "title": { "tag": "plain_text", "content": "🌤️ 宜昌夷陵区 天气早报" }
  },
  "elements": [
    { "tag": "div", "text": { "tag": "lark_md", "content": "**📅 3月21日 周六**" } },
    { "tag": "hr" },
    { "tag": "div", "text": { "tag": "lark_md", "content": "**🌡️ 当前温度**: 17°C (体感 15°C)" } },
    ...
  ]
}
```

**⚠️ 重要**: 
- `msg_type` 必须是 `'interactive'`
- `content` 必须是 `JSON.stringify(card)` (JSON字符串)
- 卡片必须包含 `config`、`header`、`elements` 三个字段

---

## 二、资讯推送规范

### 2.1 基本信息

| 项目 | 值 |
|------|-----|
| **服务名称** | 科技资讯早/午/晚报 |
| **推送机器人** | Notify Bot |
| **Chat ID** | oc_ffc3e3276fcf68d1759933ec0e494ae8 |
| **推送时间** | 08:00（早报）、12:00（午报）、20:00（晚报） |

### 2.2 脚本位置

```
/root/.openclaw/workspace/scripts/news-card.cjs
```

### 2.3 关键词列表

#### 核心关注（必须包含至少一个）
- AI / 人工智能
- 半导体 / 芯片
- 英伟达 / NVIDIA
- DeepSeek / OpenAI / Anthropic
- 大模型 / LLM
- 特斯拉 / 苹果 / 微软 / 谷歌
- 月之暗面 / MiniMax
- 存储 / 新能源

### 2.4 信息来源

| 来源 | URL | 说明 |
|------|-----|------|
| 虎嗅 | https://www.huxiu.com/rss/ | 科技资讯 |
| 36氪 | https://36kr.com/feed | 创投资讯 |

### 2.5 卡片格式要求（重要）

#### 格式规范

```json
{
  "config": { "wide_screen_mode": true },
  "header": {
    "template": "blue",
    "title": { "tag": "plain_text", "content": "📰 科技资讯早报 - 3月21日 08:00" }
  },
  "elements": [
    {
      "tag": "div",
      "fields": [
        { "is_short": true, "text": { "tag": "lark_md", "content": "**🔥 热点头条**" } },
        { "is_short": true, "text": { "tag": "lark_md", "content": "" } }
      ]
    },
    {
      "tag": "div",
      "text": { "tag": "lark_md", "content": "• [新闻标题](https://链接地址)" }
    },
    { "tag": "hr" },
    ...
    {
      "tag": "note",
      "elements": [
        { "tag": "plain_text", "content": "来源：36氪、虎嗅 | Notify Bot · 3月21日 08:00" }
      ]
    }
  ]
}
```

#### ⚠️ 严格要求

1. **卡片结构**: 必须包含 `config`、`header`、`elements` 三个字段
2. **消息类型**: `msg_type` 必须是 `'interactive'`
3. **内容格式**: `content` 必须是 `JSON.stringify(card)` (JSON字符串)
4. **分类标题**: 必须使用 `fields` 布局（左标题右空白）
5. **新闻内容**: 必须使用 `lark_md` 格式的可点击链接 `[标题](URL)`
6. **分隔线**: 各分类之间使用 `{ "tag": "hr" }` 分隔
7. **数量限制**: 每个分类最多显示 3 条新闻
8. **底部格式**: 必须注明来源和推送时间

#### 分类名称

- 🔥 热点头条
- 📈 市场动态
- 🏢 公司动态
- 💡 技术突破

### 2.6 去重机制

| 项目 | 值 |
|------|-----|
| **去重文件** | `/root/.openclaw/workspace/scripts/sent-news.json` |
| **去重方式** | 标题+链接的 MD5 哈希 |
| **记录保留** | 7 天 |
| **最大记录数** | 1000 条 |

### 2.7 推送逻辑

1. 获取 RSS 源（虎嗅、36氪）
2. 过滤关键词匹配的新闻
3. 去重（过滤已发送的）
4. 分类（热点/市场/公司/技术）
5. 构建卡片（可点击链接）
6. 发送到飞书（使用 interactive 消息类型）
7. 标记为已发送

---

## 三、Cron 定时任务配置

### 3.1 当前配置

| 任务 ID | 名称 | 时间 | 状态 |
|---------|------|------|------|
| weather-morning | 天气早报 | 07:00 | ✅ 启用 |
| news-morning | 资讯早报 | 08:00 | ✅ 启用 |
| news-noon | 资讯午报 | 12:00 | ✅ 启用 |
| news-evening | 资讯晚报 | 20:00 | ✅ 启用 |

### 3.2 配置文件位置

```
/root/.openclaw/cron/jobs.json
```

---

## 四、推送行为规范

### 4.1 推送原则

1. **静默推送**: 推送完成后不在对话中汇报结果
2. **自动执行**: 按时自动推送，无需人工干预
3. **格式一致**: 严格按照本文档的格式推送
4. **位置准确**: 天气必须使用坐标 30.77,111.33

### 4.2 错误处理

- 如果推送失败，记录到日志
- 不向用户发送错误消息（除非是严重故障）
- 下次推送时自动恢复

### 4.3 手动测试

当用户要求测试推送时：
1. 直接执行脚本推送
2. 不在对话中汇报结果
3. 用户会在飞书收到推送内容

---

## 五、配置参数速查表

### 5.1 Notify Bot 配置

```javascript
appId: 'cli_a91476e0a5f8dbc0'
appSecret: 'CRV8phtp1hTE7sz5tpwlCfGXnaIEvWCV'
chatId: 'oc_ffc3e3276fcf68d1759933ec0e494ae8'
userId: 'ou_7172afb8fa3c2f51bb02b6af097a4b27'
```

### 5.2 天气 API

```
wttr.in/{坐标}?format=j1&lang=zh-cn
示例: https://wttr.in/30.77,111.33?format=j1&lang=zh-cn
```

### 5.3 RSS 源

```
虎嗅: https://www.huxiu.com/rss/
36氪: https://36kr.com/feed
```

### 5.4 飞书消息发送 API

```
POST https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id
Headers:
  Authorization: Bearer {tenant_access_token}
  Content-Type: application/json
Body:
{
  "receive_id": "oc_ffc3e3276fcf68d1759933ec0e494ae8",
  "msg_type": "interactive",
  "content": "{JSON字符串化的卡片对象}"
}
```

---

## 六、变更记录

| 日期 | 变更内容 | 操作人 |
|------|----------|--------|
| 2026-03-21 | 创建规范文档，定义天气和资讯推送标准 | Agent |
| 2026-03-21 | 修正天气坐标为 30.77,111.33 | Agent |
| 2026-03-21 | 修正资讯格式为可点击链接 | Agent |
| 2026-03-21 | 补充卡片消息格式要求，强调 msg_type 和 content 格式 | Agent |

---

## 七、相关文档

- [每日天气提醒配置](./daily-weather-yichang.md)
- [天气早报模板](./weather-template.md)
- [科技资讯推送配置](./news-config.md)
- [Notify Bot 配置](./notify-bot-config.md)

---

**⚠️ 重要提示**: 
1. 所有修改推送脚本或配置的操作，必须确保符合本文档的规范。
2. 卡片消息必须使用 `msg_type: 'interactive'` 和正确的卡片JSON结构。
3. 测试推送时，用户会直接在飞书收到卡片，无需在对话中汇报。

*文档版本: v1.1*  
*创建时间: 2026-03-21*  
*最后更新: 2026-03-21 12:15*
