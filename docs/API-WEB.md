# Web 端接口文档

> 版本: v1.0  
> 日期: 2026-04-11  
> 适用对象: 网页用户（浏览器访问）

---

## 一、认证流程

### 1.1 流程图

```
┌─────────────┐                         ┌─────────────┐
│   浏览器    │                         │   服务端    │
└─────────────┘                         └─────────────┘
       │                                       │
       │  1. 首次访问（无密码）                  │
       │  GET /setup.html                      │
       │──────────────────────────────────────→│
       │                                       │
       │  2. 设置密码                           │
       │  POST /api/setup/password             │
       │──────────────────────────────────────→│
       │                                       │ 创建 Session
       │                                       │ Set-Cookie: session_token
       │←──────────────────────────────────────│
       │                                       │
       │  3. 后续访问（已设置密码）              │
       │  GET /login.html 或 /                 │
       │──────────────────────────────────────→│
       │                                       │
       │  4. Cookie 自动携带                    │
       │  GET /api/config                      │
       │──────────────────────────────────────→│ Cookie: session_token
       │                                       │ 验证 Session
       │←──────────────────────────────────────│ 返回数据
       │                                       │
```

### 1.2 Cookie 认证

网页用户通过 Cookie 携带 `session_token` 进行认证：

- **设置方式**: 登录成功后服务端自动设置 Cookie
- **Cookie 名称**: `session_token`
- **有效期**: 24 小时
- **属性**: `httpOnly=true`, `sameSite=strict`

---

## 二、接口列表

### 2.1 认证接口

#### POST /api/setup/password

**用途**: 首次设置管理密码

**认证**: 无需认证（仅在密码未设置时可用）

**请求**:
```json
{
  "password": "Admin123",
  "confirmPassword": "Admin123"
}
```

**请求参数说明**:

| 参数 | 类型 | 必传 | 说明 |
|------|------|------|------|
| password | string | 是 | 管理密码，需满足强度要求 |
| confirmPassword | string | 是 | 确认密码，需与 password 一致 |

**密码强度要求**:
- 至少 8 个字符
- 包含大写字母 (A-Z)
- 包含小写字母 (a-z)
- 包含数字 (0-9)

**响应（成功）**:
```json
{
  "code": 0,
  "msg": "密码设置成功",
  "currentTime": 1775887200
}
```

**响应（失败）**:
```json
{
  "code": 1000,
  "msg": "密码长度至少8位",
  "currentTime": 1775887200
}
```

**说明**: 成功后自动设置 Cookie `session_token`，用户直接进入配置页面。

---

#### POST /api/login

**用途**: 网页用户登录

**认证**: 无需认证

**请求**:
```json
{
  "password": "Admin123"
}
```

**请求参数说明**:

| 参数 | 类型 | 必传 | 说明 |
|------|------|------|------|
| password | string | 是 | 管理密码 |

**响应（成功）**:
```json
{
  "code": 0,
  "msg": "登录成功",
  "currentTime": 1775887200
}
```

**响应（失败）**:
```json
{
  "code": 1001,
  "msg": "密码错误",
  "currentTime": 1775887200
}
```

**说明**: 成功后自动设置 Cookie `session_token`。

---

#### POST /api/logout

**用途**: 退出登录

**认证**: 无需认证

**请求**: 无参数

**响应**:
```json
{
  "code": 0,
  "msg": "已退出登录",
  "currentTime": 1775887200
}
```

**说明**: 清除 Cookie `session_token`。

---

#### POST /api/verifyToken

**用途**: 通过 token + barCode 验证身份（自动登录）

**认证**: 无需认证

**请求**:
```json
{
  "token": "用户授权token",
  "barCode": "设备标识"
}
```

**请求参数说明**:

| 参数 | 类型 | 必传 | 说明 |
|------|------|------|------|
| token | string | 是 | 用户授权 token |
| barCode | string | 是 | 设备标识 |

**响应（成功）**:
```json
{
  "code": 0,
  "msg": "验证成功",
  "currentTime": 1775887200,
  "data": {
    "verified": true,
    "sessionCreated": true
  }
}
```

**响应（失败）**:
```json
{
  "code": 1003,
  "msg": "认证失败",
  "currentTime": 1775887200
}
```

**说明**: 
- 成功后自动设置 Cookie `session_token`
- 用于 Web 页面 URL 参数自动登录：`/login.html?token=xxx&barCode=xxx`

---

#### GET /api/status

**用途**: 检查系统状态

**认证**: 无需认证

**请求**: 无参数

**响应**:
```json
{
  "code": 0,
  "msg": "成功",
  "currentTime": 1775887200,
  "data": {
    "passwordSet": true,
    "authenticated": false
  }
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| passwordSet | boolean | 是否已设置密码 |
| authenticated | boolean | 当前是否已认证（Session 有效） |

---

#### POST /api/password/change

**用途**: 修改管理密码

**认证**: 需要认证（Cookie 携带 session_token）

**请求**:
```json
{
  "oldPassword": "Admin123",
  "newPassword": "NewAdmin456",
  "confirmPassword": "NewAdmin456"
}
```

**请求参数说明**:

| 参数 | 类型 | 必传 | 说明 |
|------|------|------|------|
| oldPassword | string | 是 | 原密码 |
| newPassword | string | 是 | 新密码，需满足强度要求 |
| confirmPassword | string | 是 | 确认新密码 |

**响应（成功）**:
```json
{
  "code": 0,
  "msg": "密码修改成功",
  "currentTime": 1775887200
}
```

---

### 2.2 配置接口

#### GET /api/config

**用途**: 获取配置（前端表单格式）

**认证**: 需要认证

**请求**: 无参数

**响应**:
```json
{
  "code": 0,
  "msg": "成功",
  "currentTime": 1775887200,
  "data": {
    "ai": {
      "baseUrl": "https://api.example.com",
      "apiKey": "sk-xxx",
      "modelId": "gpt-4",
      "contextWindow": 200000,
      "maxTokens": 8192
    },
    "im": {
      "feishu": { "enabled": true, "appId": "...", "appSecret": "...", "botName": "..." },
      "dingtalk": { "enabled": false, "clientId": "", "clientSecret": "" },
      "qqbot": { "enabled": false, "appId": "", "clientSecret": "" },
      "wecom": { "enabled": false, "token": "", "encodingAesKey": "" },
      "nim": { "enabled": false, "appId": "", "appSecret": "" }
    },
    "gateway": {
      "port": 18789,
      "bind": "0.0.0.0",
      "token": ""
    }
  }
}
```

---

#### GET /api/config/raw

**用途**: 获取原始配置（OpenClaw 标准格式）

**认证**: 需要认证

**请求**: 无参数

**响应**: 返回 OpenClaw 标准配置格式 JSON

---

#### GET /api/config/status

**用途**: 获取配置状态（完成度）

**认证**: 需要认证

**请求**: 无参数

**响应**:
```json
{
  "code": 0,
  "msg": "成功",
  "currentTime": 1775887200,
  "data": {
    "ai": { "configured": true, "errors": [] },
    "channels": {
      "feishu": { "enabled": true, "valid": true, "errors": [] },
      "dingtalk": { "enabled": false, "valid": true, "errors": [] }
    },
    "weixin": { "bound": false },
    "hasEnabledChannels": true,
    "enabledChannelsCount": 1,
    "percentage": 50,
    "isComplete": true
  }
}
```

---

#### POST /api/config

**用途**: 保存配置（前端表单格式）

**认证**: 需要认证

**请求**: 表单格式配置 JSON

**响应**:
```json
{
  "code": 0,
  "msg": "配置保存成功",
  "currentTime": 1775887200
}
```

---

### 2.3 系统接口

#### POST /api/gateway/restart

**用途**: 重启 Gateway 服务

**认证**: 需要认证

**请求**: 无参数

**响应**:
```json
{
  "code": 0,
  "msg": "重启命令已执行",
  "currentTime": 1775887200
}
```

---

### 2.4 微信接口

#### GET /api/weixin/login

**用途**: 微信登录（SSE 实时输出）

**认证**: 需要认证

**请求**: 无参数

**响应**: SSE 流，实时输出登录命令执行过程

---

#### GET /api/weixin/bound

**用途**: 获取微信绑定状态

**认证**: 需要认证

**请求**: 无参数

**响应**:
```json
{
  "code": 0,
  "msg": "成功",
  "currentTime": 1775887200,
  "data": { "bound": true }
}
```

---

#### POST /api/weixin/bound

**用途**: 设置微信绑定状态

**认证**: 需要认证

**请求**:
```json
{
  "bound": true
}
```

**响应**:
```json
{
  "code": 0,
  "msg": "绑定成功，服务正在自动重启中",
  "currentTime": 1775887200
}
```

---

### 2.5 版本接口

#### GET /api/version

**用途**: 获取当前版本信息

**认证**: 无需认证

**请求**: 无参数

**响应**:
```json
{
  "code": 0,
  "msg": "成功",
  "currentTime": 1775887200,
  "data": {
    "versionName": "1.0.0.0",
    "versionCode": 1000,
    "releaseDate": "2026-04-10",
    "changelog": ["初始版本", "支持简化配置接口"]
  }
}
```

---

#### GET /api/update/check

**用途**: 检查更新

**认证**: 无需认证

**请求**: 无参数

**响应**:
```json
{
  "code": 0,
  "msg": "检查更新成功",
  "currentTime": 1775887200,
  "currentVersion": { "versionName": "1.0.0.0", "versionCode": 1000 },
  "data": {
    "versionName": "1.1.0.0",
    "versionCode": 1100,
    "dlUrl": "https://...",
    "upgradeContents": ["新功能1", "新功能2"]
  }
}
```

**说明**: `data` 为 null 表示当前已是最新版本。

---

## 三、错误码

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 1000 | 参数错误或其他错误 |
| 1001 | 认证失败（密码错误、凭证无效） |
| 1002 | 参数必传或未设置密码 |
| 1003 | 远程认证失败 |

---

## 四、前端页面调用示例

### 4.1 登录页面

```javascript
// 密码登录
const response = await fetch('/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password: 'Admin123' })
});
const data = await response.json();
if (data.code === 0) {
  // Cookie 自动设置，跳转到首页
  window.location.href = '/';
}
```

### 4.2 Token 自动登录

```javascript
// URL: /login.html?token=xxx&barCode=xxx
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const barCode = urlParams.get('barCode');

const response = await fetch('/api/verifyToken', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token, barCode })
});
const data = await response.json();
if (data.code === 0) {
  // Cookie 自动设置，跳转到首页
  window.location.href = '/';
}
```

### 4.3 配置页面

```javascript
// 获取配置（Cookie 自动携带）
const response = await fetch('/api/config');
const data = await response.json();

// 保存配置
const saveResponse = await fetch('/api/config', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(configData)
});
```

---

## 五、注意事项

1. **Cookie 自动处理**: 网页端无需手动处理 Cookie，浏览器自动携带
2. **Session 有效期**: 24 小时，过期需重新登录
3. **HTTPS**: 生产环境建议使用 HTTPS 保护 Cookie 安全
