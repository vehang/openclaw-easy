# OpenClaw Easy API 文档

OpenClaw Easy 提供完整的 REST API，支持通过程序化方式配置和管理。

## 基础信息

- **基础 URL**: `http://设备IP:18780`
- **认证方式**: Cookie Session（登录后获取）
- **Content-Type**: `application/json`

---

## 认证相关 API

### 1. 首次设置密码

首次访问时需要设置管理密码。

```
POST /api/setup/password
```

**请求参数：**
```json
{
  "password": "your-password"
}
```

**响应：**
```json
{
  "success": true,
  "message": "密码设置成功"
}
```

---

### 2. 登录

```
POST /api/login
```

**请求参数：**
```json
{
  "password": "your-password"
}
```

**响应：**
```json
{
  "success": true,
  "message": "登录成功"
}
```

---

### 3. 登出

```
POST /api/logout
```

**响应：**
```json
{
  "success": true,
  "message": "登出成功"
}
```

---

### 4. 修改密码

需要先登录。

```
POST /api/password/change
```

**请求参数：**
```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

**响应：**
```json
{
  "success": true,
  "message": "密码修改成功"
}
```

---

## 配置相关 API

### 5. 获取系统状态

无需认证。

```
GET /api/status
```

**响应：**
```json
{
  "configured": true,
  "hasPassword": true
}
```

---

### 6. 获取配置（表单格式）

需要登录。

```
GET /api/config
```

**响应：**
```json
{
  "ai": {
    "apiUrl": "https://api.openai.com/v1",
    "apiKey": "sk-xxx",
    "modelName": "gpt-4"
  },
  "im": {
    "feishu": { "enabled": false },
    "nim": { "enabled": true, "authToken": "xxx" }
  }
}
```

---

### 7. 获取原始配置

返回 OpenClaw 原生 JSON 格式配置。

```
GET /api/config/raw
```

**响应：**
```json
{
  "models": { ... },
  "agents": { ... },
  "channels": { ... },
  "plugins": { ... }
}
```

---

### 8. 获取配置状态

```
GET /api/config/status
```

**响应：**
```json
{
  "hasAiConfig": true,
  "hasImConfig": true,
  "ready": true
}
```

---

### 9. 验证配置

```
POST /api/config/validate
```

**请求参数：**
```json
{
  "ai": {
    "apiUrl": "https://api.openai.com/v1",
    "apiKey": "sk-xxx",
    "modelName": "gpt-4"
  },
  "im": { ... }
}
```

**响应：**
```json
{
  "valid": true,
  "errors": []
}
```

---

### 10. 保存配置（完整格式）

保存完整配置，自动重启 Gateway。

```
POST /api/config
```

**请求参数：**
```json
{
  "ai": {
    "apiUrl": "https://api.openai.com/v1",
    "apiKey": "sk-xxx",
    "modelName": "gpt-4"
  },
  "im": {
    "nim": {
      "enabled": true,
      "authToken": "xxx",
      "nickName": "我的机器人"
    }
  }
}
```

**响应：**
```json
{
  "success": true,
  "message": "配置保存成功",
  "restart": {
    "success": true,
    "message": "Gateway 重启成功"
  }
}
```

---

### 11. 简化配置接口 ⭐ 推荐

通过简单参数快速配置，适合自动化集成。

```
POST /api/config/simple
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `nickName` | string | 否 | 机器人昵称 |
| `apiUrl` | string | ✅ | AI API 地址 |
| `apiKey` | string | ✅ | API Key |
| `modelName` | string | ✅ | 模型名称 |
| `appId` | string | 二选一 | 耘想 App ID |
| `appSecret` | string | 配合 appId | 耘想 App Secret |
| `authToken` | string | 二选一 | 耘想 Auth Token |

**请求示例：**

```bash
# 使用 authToken 方式
curl -X POST http://localhost:18780/api/config/simple \
  -H "Content-Type: application/json" \
  -d '{
    "nickName": "龙虾Bot",
    "apiUrl": "https://api.openai.com/v1",
    "apiKey": "sk-xxx",
    "modelName": "gpt-4",
    "authToken": "Ccu06OPZhOcYM0kl..."
  }'

# 使用 appId + appSecret 方式
curl -X POST http://localhost:18780/api/config/simple \
  -H "Content-Type: application/json" \
  -d '{
    "nickName": "我的机器人",
    "apiUrl": "https://api.openai.com/v1",
    "apiKey": "sk-xxx",
    "modelName": "gpt-4",
    "appId": "OC_xxx",
    "appSecret": "xxx"
  }'
```

**响应：**
```json
{
  "code": 0,
  "msg": "成功",
  "currentTime": 1710835200
}
```

**错误响应：**
```json
{
  "code": 1002,
  "msg": "apiKey 不能为空",
  "currentTime": 1710835200
}
```

---

## 服务管理 API

### 12. 重启 Gateway

```
POST /api/gateway/restart
```

**响应：**
```json
{
  "success": true,
  "message": "Gateway 重启成功"
}
```

---

### 13. 测试 AI 连接

```
POST /api/test/ai
```

**请求参数：**
```json
{
  "apiKey": "sk-xxx",
  "baseUrl": "https://api.openai.com/v1",
  "modelId": "gpt-4"
}
```

**响应：**
```json
{
  "success": true,
  "message": "AI 配置验证通过"
}
```

---

## 完整使用示例

### 场景：自动化配置脚本

```bash
#!/bin/bash

OPENCLAW_URL="http://192.168.1.100:18780"

# 1. 首次设置密码
curl -X POST "$OPENCLAW_URL/api/setup/password" \
  -H "Content-Type: application/json" \
  -d '{"password": "admin123"}'

# 2. 登录获取 session
curl -X POST "$OPENCLAW_URL/api/login" \
  -H "Content-Type: application/json" \
  -d '{"password": "admin123"}' \
  -c cookies.txt

# 3. 配置 AI 和 IM（使用简化接口）
curl -X POST "$OPENCLAW_URL/api/config/simple" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "nickName": "龙虾Bot",
    "apiUrl": "https://api.openai.com/v1",
    "apiKey": "sk-xxx",
    "modelName": "gpt-4o",
    "authToken": "Ccu06OPZhOcYM0kl..."
  }'

# 4. 验证配置
curl -X GET "$OPENCLAW_URL/api/config/status" \
  -b cookies.txt

# 5. 重启服务（如果需要）
curl -X POST "$OPENCLAW_URL/api/gateway/restart" \
  -b cookies.txt

echo "配置完成！"
```

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 1000 | 配置保存失败 |
| 1002 | 参数验证失败 |
| 401 | 未授权/需要登录 |
| 500 | 服务器内部错误 |

---

## 注意事项

1. **认证**：除 `/api/status` 和 `/api/setup/password` 外，其他 API 需要先登录
2. **自动重启**：保存配置后会自动重启 Gateway 服务
3. **CORS**：API 支持 CORS，可以从前端直接调用
4. **端口**：
   - `18780`: Web 界面和 API
   - `18789`: Gateway API
   - `18790`: Gateway Control UI

---

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 1.1.0 | 2026-03-26 | 预装耘想 IM 认证插件 |
| 1.0.0 | 2026-03-17 | 初始版本 |