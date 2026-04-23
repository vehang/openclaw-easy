# 天气早报模板 v3.0

## 简约卡片模板

```json
{
  "config": {"wide_screen_mode": true},
  "header": {
    "template": "blue",
    "title": {"tag": "plain_text", "content": "🌤️ 天气早报"}
  },
  "elements": [
    {
      "tag": "div",
      "text": {"tag": "lark_md", "content": "**📅 {日期} {星期} | {农历}**\n🕐 当前时间：{当前时间}"}
    },
    {"tag": "hr"},
    {
      "tag": "div",
      "text": {"tag": "lark_md", "content": "**📍 宜昌** · {天气描述}"}
    },
    {
      "tag": "div",
      "fields": [
        {"is_short": true, "text": {"tag": "lark_md", "content": "🌡️ **{当前温度}°C**"}},
        {"is_short": true, "text": {"tag": "lark_md", "content": "💨 {风速}km/h"}}
      ]
    },
    {
      "tag": "div",
      "fields": [
        {"is_short": true, "text": {"tag": "lark_md", "content": "💧 {湿度}%"}},
        {"is_short": true, "text": {"tag": "lark_md", "content": "🌅 {日出} | 🌇 {日落}"}}
      ]
    },
    {"tag": "hr"},
    {
      "tag": "div",
      "text": {"tag": "lark_md", "content": "**📊 今日气温**\n🌡️ {最低温度}°C ~ {最高温度}°C · {天气趋势}"}
    },
    {"tag": "hr"},
    {
      "tag": "div",
      "text": {"tag": "lark_md", "content": "**👕 穿搭建议**\n{穿搭建议}"}
    },
    {
      "tag": "div",
      "text": {"tag": "lark_md", "content": "**🚶 出行建议**\n{出行建议}"}
    },
    {"tag": "hr"},
    {
      "tag": "note",
      "elements": [
        {"tag": "plain_text", "content": "Notify Bot · {推送时间}"}
      ]
    }
  ]
}
```

---

## 变量说明

| 变量 | 说明 | 示例 |
|------|------|------|
| {日期} | 日期 | 2月27日 |
| {星期} | 星期 | 周五 |
| {农历} | 农历日期 | 正月初十 |
| {当前时间} | 推送时的当前时间 | 07:00 |
| {天气描述} | 当前天气描述 | 小雨 |
| {当前温度} | 当前气温 | 7 |
| {风速} | 风速 | 4.7 |
| {湿度} | 湿度百分比 | 91 |
| {日出} | 日出时间 | 06:54 |
| {日落} | 日落时间 | 18:18 |
| {最低温度} | 今日最低温 | 7 |
| {最高温度} | 今日最高温 | 9 |
| {天气趋势} | 今日天气趋势 | 全天小雨 |
| {穿搭建议} | 穿衣建议 | 厚外套、保暖内衣 |
| {出行建议} | 出行提示 | 带伞、路面湿滑 |
| {推送时间} | 推送时间戳 | 07:00 |

---

## 配置信息

| 项目 | 值 |
|------|-----|
| **机器人** | Notify Bot |
| **Chat ID** | ou_7172afb8fa3c2f51bb02b6af097a4b27 |
| **推送时间** | 每天 07:00 |
| **坐标** | 30.77, 111.33 (宜昌) |

---

*模板版本: v3.0*
*更新时间: 2026-02-27*
