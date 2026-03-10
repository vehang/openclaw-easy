# OpenClaw Easy

OpenClaw 配置管理 Web 界面，提供简洁易用的图形化配置管理功能。

## 功能特性

- **密码保护** - 首次访问设置管理密码，后续访问需验证
- **AI 模型配置** - 配置 Base URL、API Key、模型 ID
- **IM 渠道配置** - 支持飞书、钉钉、QQ机器人、企业微信
- **Gateway 配置** - 配置端口、绑定地址、认证 Token
- **服务管理** - 支持重启 OpenClaw Gateway 服务
- **配置持久化** - 配置保存到 `~/.openclaw/openclaw.json`（OpenClaw 标准格式）
- **完全 Web 化** - 所有配置通过 Web 界面完成，无需环境变量

## 快速开始

### 方式一：直接运行

```bash
# 克隆仓库
git clone https://github.com/vehang/openclaw-easy.git
cd openclaw-easy

# 安装依赖
npm install

# 启动服务
npm start
```

### 方式二：Docker 运行（独立模式）

```bash
# 构建镜像
docker build -f Dockerfile.standalone -t openclaw-easy .

# 创建配置目录并设置权限
mkdir -p ~/.openclaw
# 如果使用非 root 用户运行，需要设置权限
# sudo chown -R 1000:1000 ~/.openclaw

# 运行容器
docker run -d \
  --name openclaw-easy \
  -p 18780:18780 \
  -v ~/.openclaw:/root/.openclaw \
  openclaw-easy
```

> **⚠️ 权限说明**：如果遇到 `Permission denied` 错误，请在宿主机执行：
> ```bash
> # 独立模式（容器以 root 运行）
> chmod 777 ~/.openclaw
>
> # 或者使用 :z 标志（SELinux 系统）
> docker run ... -v ~/.openclaw:/root/.openclaw:z ...
> ```

### 方式三：Docker Compose

**独立模式（仅配置管理服务）：**
```bash
docker-compose --profile standalone up -d
```

**整合模式（Gateway + 配置管理）：**
```bash
# 创建配置目录并设置权限
mkdir -p ./data/openclaw-config
sudo chown -R 1000:1000 ./data/openclaw-config

# 启动服务
docker-compose --profile integrated up -d
```

> **⚠️ 整合模式权限说明**：
> - 整合模式容器内使用 `node` 用户（UID 1000）运行
> - 挂载目录必须对 UID 1000 可写
> - 启动脚本会自动检测并尝试修复权限（需要容器以 root 启动）
> - 如果权限修复失败，请手动执行：
>   ```bash
>   sudo chown -R 1000:1000 ./data/openclaw-config
>   ```

## 访问地址

启动后访问：http://localhost:18780

首次访问需要设置管理密码。

## 配置说明

所有配置通过 Web 界面完成，配置保存在 `~/.openclaw/openclaw.json`。

### AI 模型配置

| 字段 | 说明 | 必填 |
|------|------|------|
| Base URL | API 端点地址 | 是 |
| API Key | API 密钥 | 是 |
| 模型 ID | 模型标识符（如 gpt-4o, claude-3-opus） | 是 |

### IM 渠道配置

| 渠道 | 配置项 |
|------|--------|
| 飞书 | App ID, App Secret |
| 钉钉 | Client ID, Client Secret |
| QQ机器人 | App ID, Client Secret |
| 企业微信 | Token, Encoding AES Key |

### Gateway 配置

| 字段 | 说明 | 默认值 |
|------|------|--------|
| 端口 | Gateway 监听端口 | 18789 |
| 绑定地址 | Gateway 绑定地址 | 0.0.0.0 |
| Token | Gateway 认证 Token | - |

## 配置文件格式

配置使用 OpenClaw 标准格式，保存在 `~/.openclaw/openclaw.json`：

```json
{
  "meta": {
    "lastTouchedVersion": "2026.3.8"
  },
  "models": {
    "mode": "merge",
    "providers": {
      "default": {
        "baseUrl": "https://api.openai.com/v1",
        "apiKey": "sk-xxx",
        "api": "openai-completions",
        "models": [
          {
            "id": "gpt-4o",
            "name": "gpt-4o",
            "reasoning": false,
            "input": ["text", "image"],
            "cost": {
              "input": 0,
              "output": 0,
              "cacheRead": 0,
              "cacheWrite": 0
            },
            "contextWindow": 200000,
            "maxTokens": 8192
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "default/gpt-4o" },
      "imageModel": { "primary": "default/gpt-4o" },
      "compaction": { "mode": "safeguard" },
      "sandbox": { "mode": "off" }
    }
  },
  "channels": {
    "feishu": {
      "enabled": true,
      "dmPolicy": "open",
      "groupPolicy": "open",
      "allowFrom": ["*"],
      "streaming": true,
      "footer": { "elapsed": true, "status": true },
      "requireMention": true,
      "accounts": {
        "default": {
          "appId": "cli_xxx",
          "appSecret": "xxx",
          "botName": "OpenClaw Bot"
        }
      }
    },
    "dingtalk": {
      "enabled": true,
      "clientId": "xxx",
      "clientSecret": "xxx",
      "robotCode": "xxx",
      "dmPolicy": "open",
      "groupPolicy": "open",
      "messageType": "markdown",
      "allowFrom": ["*"]
    },
    "qqbot": {
      "enabled": true,
      "appId": "xxx",
      "clientSecret": "xxx",
      "dmPolicy": "open",
      "groupPolicy": "open",
      "allowFrom": ["*"]
    },
    "wecom": {
      "enabled": true,
      "dmPolicy": "open",
      "groupPolicy": "open",
      "allowFrom": ["*"],
      "default": {
        "token": "xxx",
        "encodingAesKey": "xxx"
      },
      "commands": {
        "enabled": true,
        "allowlist": ["/new", "/status", "/help", "/compact"]
      }
    }
  },
  "gateway": {
    "port": 18789,
    "bind": "0.0.0.0",
    "mode": "local",
    "auth": {
      "mode": "token",
      "token": "your-token"
    }
  },
  "tools": {
    "profile": "full",
    "sessions": { "visibility": "all" },
    "fs": { "workspaceOnly": true }
  },
  "plugins": {
    "enabled": true,
    "entries": {},
    "installs": {}
  }
}
```

## 配置字段说明

### models.providers 配置

| 字段 | 类型 | 说明 |
|------|------|------|
| baseUrl | string | API 端点地址 |
| apiKey | string | API 密钥 |
| api | string | API 协议类型（默认 openai-completions） |
| models | array | 模型列表 |

### models.providers.models 配置

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 模型 ID |
| name | string | 模型名称 |
| reasoning | boolean | 是否支持推理 |
| input | array | 输入类型（text, image） |
| contextWindow | number | 上下文窗口大小 |
| maxTokens | number | 最大输出 Token 数 |

### channels.feishu 配置

| 字段 | 类型 | 说明 |
|------|------|------|
| enabled | boolean | 是否启用 |
| dmPolicy | string | 私聊策略（open） |
| groupPolicy | string | 群聊策略（open） |
| allowFrom | array | 允许的来源 |
| streaming | boolean | 是否启用流式输出 |
| accounts.default.appId | string | 飞书应用 App ID |
| accounts.default.appSecret | string | 飞书应用 App Secret |
| accounts.default.botName | string | 机器人名称 |

### channels.wecom 配置

| 字段 | 类型 | 说明 |
|------|------|------|
| enabled | boolean | 是否启用 |
| default.token | string | 企业微信 Token |
| default.encodingAesKey | string | Encoding AES Key |
| commands.enabled | boolean | 是否启用命令 |
| commands.allowlist | array | 允许的命令列表 |

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/status` | GET | 获取系统状态 |
| `/api/setup/password` | POST | 首次设置密码 |
| `/api/login` | POST | 登录验证 |
| `/api/logout` | POST | 退出登录 |
| `/api/password/change` | POST | 修改密码 |
| `/api/config` | GET | 获取配置（表单格式） |
| `/api/config/raw` | GET | 获取原始配置（OpenClaw 格式） |
| `/api/config` | POST | 保存配置 |
| `/api/gateway/restart` | POST | 重启 Gateway 服务 |

## 技术栈

- **后端**: Node.js + Express
- **前端**: 纯 HTML/CSS/JavaScript（无需构建）
- **认证**: bcrypt 密码加密 + Session 机制

## 许可证

MIT License
