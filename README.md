# OpenClaw Easy

OpenClaw 配置管理 Web 界面，提供简洁易用的图形化配置管理功能。

## 功能特性

- **密码保护** - 首次访问设置管理密码，后续访问需验证
- **AI 模型配置** - 支持多种 AI Provider（OpenAI、Claude、DeepSeek 等）
- **IM 渠道配置** - 支持飞书、钉钉、QQ机器人、企业微信
- **服务管理** - 支持重启 OpenClaw Gateway 服务
- **配置持久化** - 配置保存到 `~/.openclaw/openclaw.json`

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

### 方式二：Docker 运行

```bash
# 构建镜像
docker build -t openclaw-easy .

# 运行容器
docker run -d \
  --name openclaw-easy \
  -p 18780:18780 \
  -v ~/.openclaw:/root/.openclaw \
  openclaw-easy
```

### 方式三：Docker Compose

```yaml
version: '3.8'
services:
  openclaw-easy:
    image: openclaw-easy
    container_name: openclaw-easy
    ports:
      - "18780:18780"
    volumes:
      - ~/.openclaw:/root/.openclaw
    restart: unless-stopped
```

## 访问地址

启动后访问：http://localhost:18780

## 配置说明

### AI 模型配置

| 字段 | 说明 | 必填 |
|------|------|------|
| Provider | AI 服务提供商 | 是 |
| API Key | API 密钥 | 是 |
| Base URL | 自定义 API 端点 | 否 |
| 模型 ID | 模型标识符 | 是 |

支持的 Provider：
- OpenAI
- Anthropic (Claude)
- Azure OpenAI
- DeepSeek
- Moonshot (Kimi)
- 智谱 AI
- 百度文心
- 阿里通义
- 自定义

### IM 渠道配置

| 渠道 | 配置项 |
|------|--------|
| 飞书 | App ID, App Secret |
| 钉钉 | Client ID, Client Secret |
| QQ机器人 | App ID, App Secret |
| 企业微信 | Corp ID, Agent ID, Secret |

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/status` | GET | 获取系统状态 |
| `/api/setup/password` | POST | 首次设置密码 |
| `/api/login` | POST | 登录验证 |
| `/api/logout` | POST | 退出登录 |
| `/api/password/change` | POST | 修改密码 |
| `/api/config` | GET | 获取配置 |
| `/api/config` | POST | 保存配置 |
| `/api/gateway/restart` | POST | 重启 Gateway 服务 |

## 配置文件

配置保存在 `~/.openclaw/openclaw.json`：

```json
{
  "ai": {
    "provider": "openai",
    "apiKey": "sk-xxx",
    "baseUrl": "",
    "modelId": "gpt-4o"
  },
  "im": {
    "feishu": {
      "enabled": false,
      "appId": "",
      "appSecret": ""
    },
    "dingtalk": {
      "enabled": false,
      "clientId": "",
      "clientSecret": ""
    },
    "qqbot": {
      "enabled": false,
      "appId": "",
      "appSecret": ""
    },
    "wecom": {
      "enabled": false,
      "corpId": "",
      "agentId": "",
      "secret": ""
    }
  }
}
```

## 技术栈

- **后端**: Node.js + Express
- **前端**: 纯 HTML/CSS/JavaScript（无需构建）
- **认证**: bcrypt 密码加密 + Session 机制

## 许可证

MIT License
