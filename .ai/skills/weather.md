# 天气查询 Skill

## wttr.in API（当前使用）

**服务商**: wttr.in  
**特点**: 免费免配置，全球可用

### 常用城市

| 城市 | 查询代码 |
|------|----------|
| 武汉 | Wuhan |
| 北京 | Beijing |
| 上海 | Shanghai |
| 广州 | Guangzhou |
| 深圳 | Shenzhen |
| 成都 | Chengdu |
| 杭州 | Hangzhou |
| 重庆 | Chongqing |

### API 端点

**JSON格式**: `https://wttr.in/{城市}?format=j1`

**简洁格式**: `https://wttr.in/{城市}?format=3`

### 使用示例

```bash
# JSON 格式
curl "https://wttr.in/Wuhan?format=j1"

# 简洁格式
curl "https://wttr.in/Wuhan?format=3"
# 输出: 武汉: ⛅ +13°C
```

### 返回数据说明

| 字段 | 说明 |
|------|------|
| `temp_C` | 当前温度（摄氏度） |
| `FeelsLikeC` | 体感温度 |
| `weatherDesc` | 天气描述 |
| `humidity` | 湿度 |
| `windspeedKmph` | 风速 |
| `winddir16Point` | 风向 |

## 和风天气 API（备选）

**API Key**: 14caf0470fa149ccb6afc442d55a0884
**状态**: 待配置白名单

⚠️ 需要在控制台配置 IP 白名单后才能使用。

控制台地址：https://dev.qweather.com/
