# API 认证安全方案设计文档

> 版本: v1.0  
> 日期: 2026-04-11  
> 分支: feature/api-auth

---

## 一、方案概述

### 1.1 目标

为 `/api/config/simple` 等接口添加认证保护，防止未授权访问。

### 1.2 设计要点

| 要点 | 决策 |
|------|------|
| Token 有效期 | 24小时 |
| 单设备绑定 | 一个 barCode 只允许一个有效 Session |
| 凭证传递方式 | 支持所有方式（Cookie/Header/Query/Body） |
| 兼容旧接口 | 不兼容，新接口直接需要认证 |
| 远程 API 返回 | 只返回成功/失败，无用户信息 |

---

## 二、认证流程

### 2.1 APP 客户端流程

```
步骤1: 认证获取凭证
POST /api/auth/token {token, barCode}
→ 验证成功返回 accessToken

步骤2: 使用凭证调用接口
携带 accessToken（任一方式）
→ 认证通过后处理请求
```

### 2.2 网页用户流程

```
步骤1: 登录
POST /api/login {password}
→ Cookie 自动设置 session_token

步骤2: 后续请求
Cookie 自动携带，无需手动传递
```

---

## 三、接口设计

### 3.1 新增认证接口

**POST /api/auth/token**

| 项目 | 说明 |
|------|------|
| URL | `/api/auth/token` |
| 认证 | 无需认证 |
| 用途 | 通过 token + barCode 获取临时访问凭证 |

请求：
```json
{
  "token": "用户授权token（必传）",
  "barCode": "设备标识（必传）"
}
```

响应（成功）：
```json
{
  "code": 0,
  "msg": "认证成功",
  "currentTime": 1775887200,
  "data": {
    "accessToken": "abc123def456...",
    "expiresIn": 86400
  }
}
```

响应（失败）：
```json
{
  "code": 1003,
  "msg": "认证失败",
  "currentTime": 1775887200
}
```

### 3.2 修改现有接口

**POST /api/config/simple**

| 项目 | 变化 |
|------|------|
| 认证 | 新增：需要认证 |
| 参数 | 新增：accessToken（可选，可通过其他方式传递） |

**GET /api/config/simple**

| 项目 | 变化 |
|------|------|
| 认证 | 新增：需要认证 |
| 参数 | 新增：accessToken Query参数或Header |

### 3.3 接口权限汇总

| 接口 | 认证要求 | 说明 |
|------|---------|------|
| `POST /api/auth/token` | ❌ 无 | 认证入口 |
| `POST /api/login` | ❌ 无 | 网页登录 |
| `POST /api/setup/password` | ❌ 无 | 首次设置密码 |
| `POST /api/config/simple` | ✅ 必须 | **新增认证** |
| `GET /api/config/simple` | ✅ 必须 | **新增认证** |
| `GET /api/config` | ✅ 必须 | 网页配置获取 |
| `POST /api/config` | ✅ 必须 | 网页配置保存 |
| `GET /api/version` | ❌ 无 | 版本信息（公开） |
| `GET /api/update/check` | ❌ 无 | 检查更新（公开） |

---

## 四、凭证传递方式

支持以下方式，按优先级取用：

| 优先级 | 方式 | 示例 |
|--------|------|------|
| 1 | Cookie | `Cookie: session_token=abc123...` |
| 2 | Authorization Header | `Authorization: Bearer abc123...` |
| 3 | X-Access-Token Header | `X-Access-Token: abc123...` |
| 4 | Query 参数 | `?accessToken=abc123...` |
| 5 | Body 参数 | `{ "accessToken": "abc123..." }` |

---

## 五、Session 存储

### 5.1 数据结构

```javascript
{
  createdAt: Number,
  expiresAt: Number,
  source: 'web' | 'app',
  verifiedByToken: Boolean,
  verifiedByPassword: Boolean,
  barCode: String
}
```

### 5.2 单设备绑定

一个 barCode 只允许一个有效 Session。

---

## 六、错误码

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 1001 | 认证失败（凭证无效/过期） |
| 1002 | 参数错误/未设置密码 |
| 1003 | 远程认证失败 |

---

## 七、改动清单

| 序号 | 文件 | 改动内容 |
|------|------|---------|
| 1 | `routes/auth.js` | 新增 `POST /api/auth/token` |
| 2 | `routes/config.js` | 给 simple 接口添加认证 |
| 3 | `middleware/auth.js` | 扩展多渠道凭证获取 |
| 4 | `utils/session.js` | 新增设备相关函数 |
| 5 | `state/sessions.js` | Session 结构增强 |

---

## 八、客户端调用示例

### APP 客户端

```javascript
// 步骤1: 认证
const authRes = await fetch('/api/auth/token', {
  method: 'POST',
  body: JSON.stringify({ token, barCode })
});
const { data } = await authRes.json();
const accessToken = data.accessToken;

// 步骤2: 调用接口（任一方式）
fetch(`/api/config/simple?barCode=${barCode}&accessToken=${accessToken}`);
```

### 网页用户

```javascript
// 登录（Cookie 自动设置）
await fetch('/api/login', { method: 'POST', body: JSON.stringify({ password }) });
// 后续请求（Cookie 自动携带）
await fetch('/api/config');
```
