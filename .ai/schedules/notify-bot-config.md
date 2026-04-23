# Notify Bot 配置

## 机器人信息

| 项目 | 值 |
|------|-----|
| **名称** | Notify Bot |
| **App ID** | cli_a91476e0a5f8dbc0 |
| **App Secret** | CRV8phtp1hTE7sz5tpwlCfGXnaIEvWCV |
| **用途** | 通知类消息专用 |

## 推送配置

| 项目 | 值 |
|------|-----|
| **Chat ID** | oc_ffc3e3276fcf68d1759933ec0e494ae8 |
| **用户 ID** | ou_7172afb8fa3c2f51bb02b6af097a4b27 |

## 发送方式

### 方式 1：获取 Token
```bash
curl -X POST "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal" \
  -H "Content-Type: application/json" \
  -d '{"app_id":"cli_a91476e0a5f8dbc0","app_secret":"CRV8phtp1hTE7sz5tpwlCfGXnaIEvWCV"}'
```

### 方式 2：发送消息
```bash
curl -X POST "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"receive_id":"oc_ffc3e3276fcf68d1759933ec0e494ae8","msg_type":"text","content":"{\"text\":\"消息内容\"}"}'
```

## 天气早报配置

- **地址**: 湖北省宜昌市夷陵区东湖大道50号
- **坐标**: 30.77, 111.33
- **推送时间**: 每天 7:00
- **API**: wttr.in

---

*更新时间: 2026-02-25 18:34*
