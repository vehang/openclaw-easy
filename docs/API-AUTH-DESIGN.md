# OpenClaw Easy - App API 认证体系方案 & 实施明细

> 创建时间：2026-04-14
> 基线分支：feature/modular-refactor (versionCode: 1005)
> 目标版本：1.0.0.6 (versionCode: 1006)
> 状态：✅ 已实施（待部署）

---

## 一、背景

当前 App 端接口（`/api/config/simple` 等）无需任何认证即可直接调用，存在安全隐患。
`feature/modular-refactor` 分支已有基础认证框架（`/api/auth/token` + `authMiddleware`），
但存在以下问题导致**实际未生效**：

| 问题 | 说明 |
|------|------|
| App 接口未加认证 | 5 个 App 接口没有挂载任何中间件 |
| Token 纯内存 | Session 存在内存 Map，服务重启即丢失 |
| 有效期太短 | 跟 Web session 一致（24h），App 端体验差 |
| 无开关控制 | 没有 `appAuthRequired` 开关，无法灰度兼容 |

## 二、认证流程

```
App 启动
  │
  ▼
本地是否有缓存的 accessToken 且未过期？
  │                    │
 有                   无/过期
  │                    │
  │              POST /api/auth/token
  │              { token, barCode }
  │                    │
  │                    ▼
  │         调用远程验证接口
  │         https://api.yun.tilldream.com/api/im/openClaw/verifyByAdmin
  │         { token, barCode }
  │                    │
  │            ┌───────┴───────┐
  │         成功│            失败│
  │            ▼               ▼
  │     生成/复用 accessToken  返回错误
  │     有效期 7 天           提示重新登录
  │     持久化到文件
  │            │
  │            ▼
  │     App 本地缓存 accessToken
  │            │
  ▼            ▼
后续 App API 请求（携带 accessToken）
  │
  ▼
appAuthMiddleware 校验
  │
  ├─ appAuthRequired=false → 直接放行（兼容旧版）
  │
  └─ appAuthRequired=true
       │
       ├─ accessToken 有效 → 放行，注入 req.appDevice
       │
       └─ accessToken 无效/过期 → 返回 code:4001
```

## 三、认证接口

### POST /api/auth/token（改造已有接口）

用 token + barCode 换取持久化 accessToken。

**请求参数：**

| 参数 | 类型 | 必传 | 说明 |
|------|------|------|------|
| token | string | ✅ | 用户授权 token（App 登录凭证） |
| barCode | string | ✅ | 设备标识 |

**验证逻辑：**
1. 调用远程接口 `verifyByAdmin` 验证 token + barCode
2. 验证成功后检查该 barCode 是否已有有效 token → 有则复用
3. 没有 → 生成新的 `ac_` + `crypto.randomBytes(32).toString('hex')`
4. 同一 barCode 只保留一个 token，旧的自动失效
5. 持久化到 `~/.openclaw/.app-tokens.json`

**成功响应：**

```json
{
  "code": 0,
  "msg": "认证成功",
  "currentTime": 1713000000,
  "data": {
    "accessToken": "ac_a1b2c3d4e5f6g7h8i9j0...",
    "expiresIn": 604800,
    "barCode": "DEVICE001"
  }
}
```

**失败响应：**

```json
{
  "code": 1003,
  "errorMsg": "验证失败：token 无效",
  "currentTime": 1713000000
}
```

## 四、appAuthMiddleware 中间件

### Token 提取策略（按优先级）

| 优先级 | 来源 | 示例 |
|--------|------|------|
| 1 | Header `Authorization` | `Bearer ac_xxx` |
| 2 | Header `X-Access-Token` | `ac_xxx` |
| 3 | Query 参数 | `?accessToken=ac_xxx` |
| 4 | Body 字段 | `{ "accessToken": "ac_xxx" }` |
| 5 | Cookie | `access_token=ac_xxx` |

### 校验逻辑

```
1. 读取 version.json 中的 appAuthRequired
2. appAuthRequired=false → next() 直接放行
3. appAuthRequired=true → 从 5 种来源提取 accessToken
4. 找不到 / 不存在 / 已过期 → 返回 code:4001
5. token 有效 → 注入 req.appDevice = { barCode, createdAt, expiresAt }, next()
```

### 错误响应

```json
{
  "code": 4001,
  "errorMsg": "accessToken 无效或已过期，请重新认证",
  "currentTime": 1713000000
}
```

## 五、接口保护分类

### 受保护（需 accessToken，当 appAuthRequired=true）

| 方法 | 路径 | 所在文件 |
|------|------|----------|
| POST | `/api/config/simple` | routes/config.js |
| GET | `/api/config/simple` | routes/config.js |
| POST | `/api/fix` | routes/system.js |
| POST | `/api/weixin/qr/start` | routes/weixin.js |
| GET | `/api/weixin/qr/status` | routes/weixin.js |

### 不受保护（App 可直接访问）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/token` | 认证入口 |
| GET | `/api/status` | 系统状态 |
| GET | `/api/version` | 版本信息 |
| GET | `/api/update/check` | 检查更新 |
| POST | `/api/update` | 一键更新 |

### Web 端接口（保持原 authMiddleware 不变）

所有 Web 端接口认证方式不变，不受本方案影响。

## 六、Token 存储

### 文件：~/.openclaw/.app-tokens.json

```json
[
  {
    "accessToken": "ac_a1b2c3d4e5f6g7h8i9j0...",
    "barCode": "DEVICE001",
    "createdAt": 1713000000,
    "expiresAt": 1713604800
  }
]
```

### 规则

- 一个 barCode 只对应一个 accessToken
- 重新认证时旧 token 自动替换
- 服务启动时从文件加载到内存 Map
- 每次写入同步到文件
- 过期 token 在加载时自动清理

## 七、version.json 变更

### 变更前

```json
{
  "versionName": "1.0.0.5",
  "versionCode": 1005,
  "appAuthRequired": null  // 不存在
}
```

### 变更后

```json
{
  "versionName": "1.0.0.6",
  "versionCode": 1006,
  "appAuthRequired": true
}
```

### 开关说明

| 值 | 效果 |
|----|------|
| `true` | App 接口需要 accessToken 认证 |
| `false` / 不存在 | App 接口直接访问，兼容旧版 App |

## 八、实施明细

### 修改文件清单（9 个文件 + 1 个新增）

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `constants/config.js` | 修改 | 新增 `APP_TOKENS_FILE`、`APP_TOKEN_EXPIRE_TIME` 常量 |
| `state/app-tokens.js` | **新增** | 持久化 token 管理（加载/保存/生成/校验/复用） |
| `state/index.js` | 修改 | 注册 app-tokens 模块 |
| `middleware/auth.js` | 修改 | 新增 `appAuthMiddleware`（5种来源 + 开关控制） |
| `routes/auth.js` | 修改 | 改造 `/api/auth/token` 使用持久化 token（7天+复用） |
| `routes/config.js` | 修改 | `POST/GET /config/simple` 加 `appAuthMiddleware` |
| `routes/system.js` | 修改 | `POST /fix` 加 `appAuthMiddleware` |
| `routes/weixin.js` | 修改 | `POST /qr/start`、`GET /qr/status` 加 `appAuthMiddleware` |
| `server.js` | 修改 | 启动时调用 `loadAppTokens()` |
| `version.json` | 修改 | 升级 1.0.0.6，新增 `appAuthRequired: true` |

### 统计

```
10 files changed, 126 insertions(+), 61 deletions(-)
新增文件: state/app-tokens.js
```

## 九、兼容性

- `appAuthRequired = false` 或不存在时，所有 App 接口行为不变，**完全兼容旧版 App**
- App 端升级后检测到 `appAuthRequired = true` 再走认证流程
- Web 端所有接口不受影响（仍使用 `authMiddleware`）
- `/api/status`、`/api/version` 等基础接口始终可访问

## 十、部署步骤

```bash
# 1. 将修改后的文件上传到服务器
scp -P 22345 -r . root@192.168.1.123:/app/openclaw-easy/

# 2. 重启服务
ssh -p 22345 root@192.168.1.123 "supervisorctl restart openclaw-easy"

# 3. 验证
curl http://192.168.1.123:18780/api/version
# 应返回 versionCode: 1006, appAuthRequired: true
```

### 关闭认证（如需回退）

修改服务器上 `/app/openclaw-easy/version.json`：
```json
"appAuthRequired": false
```
然后重启服务即可，无需改代码。

---

_方案设计 & 实施：2026-04-14_
