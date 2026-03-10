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

# 运行容器
docker run -d \
  --name openclaw-easy \
  -p 18780:18780 \
  -v ~/.openclaw:/root/.openclaw \
  openclaw-easy
```

### 方式三：Docker Compose

**独立模式（仅配置管理服务）：**
```bash
docker-compose --profile standalone up -d
```

**整合模式（Gateway + 配置管理）：**
```bash
docker-compose --profile integrated up -d
```

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
| 企业微信 | Token, Encoding AES Key, Agent ID |

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
  "models": {
    "mode": "merge",
    "providers": {
      "default": {
        "api": {
          "baseURL": "https://api.openai.com/v1",
          "apiKey": "sk-xxx"
        },
        "models": [
          {
            "id": "gpt-4o",
            "name": "gpt-4o",
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
      "imageModel": { "primary": "default/gpt-4o" }
    }
  },
  "channels": {
    "feishu": {
      "enabled": true,
      "accounts": {
        "main": {
          "appId": "xxx",
          "appSecret": "xxx"
        }
      }
    },
    "wecom": {
      "enabled": true,
      "default": {
        "token": "xxx",
        "encodingAesKey": "xxx"
      }
    }
  },
  "gateway": {
    "port": 18789,
    "bind": "0.0.0.0",
    "auth": {
      "mode": "token",
      "token": "your-token"
    }
  }
}
```

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
