# APP 端接口文档

> 版本: v1.0  
> 日期: 2026-04-11  
> 适用对象: APP 客户端、第三方系统集成

---

## 一、认证流程

### 1.1 流程图

```
┌─────────────┐                         ┌─────────────┐
│  APP 客户端 │                         │   服务端    │
└─────────────┘                         └─────────────┘
       │                                       │
       │  步骤1: 获取临时凭证                    │
       │  POST /api/auth/token                 │
       │  {token, barCode}                     │
       │──────────────────────────────────────→│
       │                                       │ 调用远程API验证
       │                                       │ 创建 Session（单设备绑定）
       │                                       │
       │←──────────────────────────────────────│
       │  {code:0, data:{accessToken}}         │
       │                                       │
       │  步骤2: 使用凭证调用接口                │
       │  POST /api/config/simple              │
       │  Header: X-Access-Token: xxx          │
       │──────────────────────────────────────→│ 验证 Session
       │                                       │ 验证 barCode 匹配
       │                                       │
       │←──────────────────────────────────────│
       │  {code:0, msg:"配置已保存"}            │
       │                                       │
```

### 1.2 凭证传递方式

APP 客户端可通过以下任一方式传递 `accessToken`：

| 优先级 | 方式 | 示例 |
|--------|------|------|
| 1 | Authorization Header | `Authorization: Bearer <accessToken>` |
| 2 | X-Access-Token Header | `X-Access-Token: <accessToken>` |
| 3 | Query 参数 | `?accessToken=<accessToken>` |
| 4 | Body 参数 | `{ "accessToken": "<accessToken>" }` |

**建议**: 推荐使用 Header 方式（Authorization 或 X-Access-Token），安全性更高。

### 1.3 单设备绑定

一个 `barCode` 只允许一个有效 Session：

- 新设备登录时，自动清除该 `barCode` 的旧 Session
- 确保 Token 有效期内，同一设备只有最新登录有效

---

## 二、接口列表

### 2.1 认证接口

#### POST /api/auth/token

**用途**: 通过 token + barCode 获取临时访问凭证

**认证**: 无需认证（本身就是认证入口）

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
| token | string | 是 | 用户授权 token（从业务系统获取） |
| barCode | string | 是 | 设备唯一标识（如设备序列号、MAC地址等） |

**响应（成功）**:
```json
{
  "code": 0,
  "msg": "认证成功",
  "currentTime": 1775887200,
  "data": {
    "accessToken": "a1b2c3d4e5f6...",
    "expiresIn": 86400
  }
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| accessToken | string | 临时访问凭证，用于后续接口调用 |
| expiresIn | number | 有效期（秒），默认 86400（24小时） |

**响应（参数错误）**:
```json
{
  "code": 1002,
  "msg": "token参数必传",
  "currentTime": 1775887200
}
```

**响应（认证失败）**:
```json
{
  "code": 1003,
  "msg": "认证失败",
  "currentTime": 1775887200
}
```

**说明**:
- 远程 API 验证成功后返回 `accessToken`
- 返回的 `accessToken` 需保存，用于后续所有接口调用
- Token 有效期 24 小时，过期需重新认证

---

### 2.2 配置接口

#### POST /api/config/simple

**用途**: 简化配置接口 - 保存配置

**认证**: 需要认证（携带 accessToken）

**请求**:
```json
{
  "accessToken": "a1b2c3d4e5f6...",
  "apiUrl": "https://api.example.com",
  "apiKey": "sk-xxx",
  "modelName": "gpt-4",
  "barCode": "设备标识",
  "appId": "应用ID",
  "appSecret": "应用密钥",
  "nickName": "用户昵称",
  "authToken": "认证Token"
}
```

**请求参数说明**:

| 参数 | 类型 | 必传 | 说明 |
|------|------|------|------|
| accessToken | string | 是* | 临时访问凭证（或通过 Header/Query 传递） |
| apiUrl | string | 是 | AI API 地址 |
| apiKey | string | 是 | AI API Key |
| modelName | string | 是 | 模型 ID |
| barCode | string | 是 | 设备标识（需与认证时的 barCode 一致） |
| appId | string | 条件 | 应用 ID（appId+appSecret 或 nickName+authToken 必须传一组） |
| appSecret | string | 条件 | 应用密钥 |
| nickName | string | 条件 | 用户昵称 |
| authToken | string | 条件 | 认证 Token |

**凭证传递方式（任选其一）**:

```javascript
// 方式1: Authorization Header
fetch('/api/config/simple', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer a1b2c3d4e5f6...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ apiUrl, apiKey, modelName, barCode, ... })
});

// 方式2: X-Access-Token Header
fetch('/api/config/simple', {
  method: 'POST',
  headers: {
    'X-Access-Token': 'a1b2c3d4e5f6...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ apiUrl, apiKey, modelName, barCode, ... })
});

// 方式3: Query 参数
fetch(`/api/config/simple?accessToken=a1b2c3d4e5f6...`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ apiUrl, apiKey, modelName, barCode, ... })
});

// 方式4: Body 参数
fetch('/api/config/simple', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accessToken: 'a1b2c3d4e5f6...',
    apiUrl, apiKey, modelName, barCode, ...
  })
});
```

**响应（成功）**:
```json
{
  "code": 0,
  "msg": "配置已保存，服务正在自动重启中，请稍等一会儿后再使用",
  "currentTime": 1775887200
}
```

**响应（认证失败）**:
```json
{
  "code": 1001,
  "msg": "凭证无效或已过期",
  "currentTime": 1775887200
}
```

**响应（参数错误）**:
```json
{
  "code": 1002,
  "msg": "apiUrl必传; apiKey必传; modelName必传",
  "currentTime": 1775887200
}
```

**说明**:
- 保存配置后自动重启 Gateway 服务
- barCode 需与认证时的 barCode 一致，否则返回认证失败

---

#### GET /api/config/simple

**用途**: 查询缓存的配置参数

**认证**: 需要认证（携带 accessToken）

**请求**:
```
GET /api/config/simple?barCode=device123&accessToken=a1b2c3d4e5f6...
```

或使用 Header：
```javascript
fetch('/api/config/simple?barCode=device123', {
  headers: { 'X-Access-Token': 'a1b2c3d4e5f6...' }
});
```

**请求参数说明**:

| 参数 | 类型 | 必传 | 说明 |
|------|------|------|------|
| barCode | string | 是 | 设备标识（需与认证时的 barCode 一致） |
| accessToken | string | 是* | 临时访问凭证（或通过 Header 传递） |

**响应（成功）**:
```json
{
  "code": 0,
  "msg": "成功",
  "currentTime": 1775887200,
  "data": {
    "apiUrl": "https://api.example.com",
    "apiKey": "sk-xxx",
    "modelName": "gpt-4",
    "barCode": "device123",
    "appId": "应用ID",
    "appSecret": "应用密钥",
    "updatedAt": 1775887200
  }
}
```

**响应（设备未配置）**:
```json
{
  "code": 1001,
  "msg": "设备未配置",
  "currentTime": 1775887200
}
```

**响应（barCode不匹配）**:
```json
{
  "code": 1001,
  "msg": "凭证无效或已过期",
  "currentTime": 1775887200
}
```

**说明**:
- 返回该设备上次通过 `/api/config/simple` POST 保存的配置
- barCode 需与认证时的 barCode 一致

---

### 2.3 版本接口

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
| 1000 | 其他错误 |
| 1001 | 认证失败（凭证无效/过期/barCode不匹配） |
| 1002 | 参数错误 |
| 1003 | 远程认证失败 |

---

## 四、完整调用示例

### 4.1 认证流程

```javascript
// 步骤1: 认证获取 accessToken
async function authenticate(token, barCode) {
  const response = await fetch('https://your-domain/api/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, barCode })
  });
  
  const result = await response.json();
  
  if (result.code === 0) {
    // 保存 accessToken，用于后续调用
    const accessToken = result.data.accessToken;
    const expiresIn = result.data.expiresIn;
    
    // 存储 accessToken（建议加密存储）
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('accessTokenExpire', Date.now() + expiresIn * 1000);
    
    return accessToken;
  } else {
    // 认证失败，处理错误
    console.error('认证失败:', result.msg);
    throw new Error(result.msg);
  }
}
```

### 4.2 保存配置

```javascript
// 步骤2: 保存配置
async function saveConfig(accessToken, config) {
  const response = await fetch('https://your-domain/api/config/simple', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      apiUrl: config.apiUrl,
      apiKey: config.apiKey,
      modelName: config.modelName,
      barCode: config.barCode,
      appId: config.appId,
      appSecret: config.appSecret
    })
  });
  
  const result = await response.json();
  
  if (result.code === 0) {
    console.log('配置保存成功');
    return true;
  } else if (result.code === 1001) {
    // Token 过期，需要重新认证
    console.warn('Token已过期，需要重新认证');
    // 重新认证...
    return false;
  } else {
    console.error('保存失败:', result.msg);
    return false;
  }
}
```

### 4.3 查询配置

```javascript
// 步骤3: 查询配置
async function getConfig(accessToken, barCode) {
  const response = await fetch(
    `https://your-domain/api/config/simple?barCode=${barCode}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );
  
  const result = await response.json();
  
  if (result.code === 0) {
    return result.data;
  } else {
    console.error('查询失败:', result.msg);
    return null;
  }
}
```

### 4.4 完整流程封装

```javascript
class OpenClawClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.accessToken = null;
    this.accessTokenExpire = null;
  }
  
  // 认证
  async authenticate(token, barCode) {
    const response = await fetch(`${this.baseUrl}/api/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, barCode })
    });
    
    const result = await response.json();
    
    if (result.code === 0) {
      this.accessToken = result.data.accessToken;
      this.accessTokenExpire = Date.now() + result.data.expiresIn * 1000;
      this.barCode = barCode;
      return true;
    }
    
    throw new Error(result.msg);
  }
  
  // 检查 Token 是否有效
  isTokenValid() {
    return this.accessToken && Date.now() < this.accessTokenExpire;
  }
  
  // 通用请求方法
  async request(url, options = {}) {
    if (!this.isTokenValid()) {
      throw new Error('Token已过期，请重新认证');
    }
    
    // 自动添加认证头
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${this.accessToken}`
    };
    
    const response = await fetch(`${this.baseUrl}${url}`, options);
    const result = await response.json();
    
    if (result.code === 1001) {
      // Token 失效，清除本地存储
      this.accessToken = null;
      throw new Error('Token已失效，请重新认证');
    }
    
    return result;
  }
  
  // 保存配置
  async saveConfig(config) {
    config.barCode = this.barCode;
    return this.request('/api/config/simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
  }
  
  // 查询配置
  async getConfig() {
    return this.request(`/api/config/simple?barCode=${this.barCode}`);
  }
}

// 使用示例
const client = new OpenClawClient('https://your-domain');

// 认证
await client.authenticate('userToken', 'device123');

// 保存配置
await client.saveConfig({
  apiUrl: 'https://api.openai.com',
  apiKey: 'sk-xxx',
  modelName: 'gpt-4',
  appId: 'xxx',
  appSecret: 'xxx'
});

// 查询配置
const config = await client.getConfig();
```

---

## 五、注意事项

1. **Token 有效期**: 24 小时，过期需重新调用 `/api/auth/token` 认证
2. **barCode 一致性**: 查询/保存配置时，barCode 需与认证时的 barCode 一致
3. **单设备绑定**: 同一 barCode 只有一个有效 Token，新登录会使旧 Token 失效
4. **HTTPS**: 生产环境建议使用 HTTPS
5. **Token 存储**: 建议加密存储 accessToken，避免泄露

---

## 六、接口权限汇总

| 接口 | 认证要求 | 说明 |
|------|---------|------|
| `POST /api/auth/token` | ❌ 无 | 认证入口 |
| `POST /api/config/simple` | ✅ 必须 | 需携带 accessToken |
| `GET /api/config/simple` | ✅ 必须 | 需携带 accessToken |
| `GET /api/version` | ❌ 无 | 公开接口 |
| `GET /api/update/check` | ❌ 无 | 公开接口 |
