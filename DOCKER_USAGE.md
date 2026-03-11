# OpenClaw Easy Docker 使用指南

## 📦 项目结构

```
openclaw-easy/
├── server.js              # Web 配置界面主程序
├── public/                # 前端静态文件
├── package.json           # Node.js 依赖
├── Dockerfile             # Docker 镜像定义
├── init-fixed.sh          # 修复后的启动脚本（关键修复）
├── supervisord.conf       # 进程管理配置
└── .dockerignore          # Docker 构建忽略文件
```

## 🔧 核心修复

### 原问题
上游镜像 `justlikemaki/openclaw-docker-cn-im` 的 init.sh 脚本在启动 Gateway 时，直接使用环境变量：
```bash
# ❌ 原代码（有问题）
openclaw gateway run \
    --bind "$OPENCLAW_GATEWAY_BIND" \
    --port "$OPENCLAW_GATEWAY_PORT" \
    --token "$OPENCLAW_GATEWAY_TOKEN"
```

**问题：** 如果环境变量为空，会传递空值导致 Gateway 启动失败。

### 修复方案
在 `init-fixed.sh` 中实现三级优先级配置：
```bash
# ✅ 修复后的代码
GATEWAY_BIND="${OPENCLAW_GATEWAY_BIND:-$(jq -r '.gateway.bind // "lan"' ~/.openclaw/openclaw.json)}"
GATEWAY_PORT="${OPENCLAW_GATEWAY_PORT:-$(jq -r '.gateway.port // 18789' ~/.openclaw/openclaw.json)}"
GATEWAY_TOKEN="${OPENCLAW_GATEWAY_TOKEN:-$(jq -r '.gateway.auth.token' ~/.openclaw/openclaw.json)}"
```

**优先级：**
1. 环境变量（最高）
2. 配置文件（openclaw.json）
3. 默认值（最低）

## 🚀 使用方法

### 1. 构建镜像

```bash
cd /home/node/.openclaw/workspace/openclaw-easy
docker build -t openclaw-easy:latest .
```

### 2. 运行容器

```bash
docker run -d \
  --name openclaw-easy \
  --restart unless-stopped \
  -p 18780:18780 \
  -p 18789:18789 \
  -p 18790:18790 \
  -v openclaw-data:/home/node/.openclaw \
  -e TZ=Asia/Shanghai \
  openclaw-easy:latest
```

### 3. 访问服务

- **Web 配置界面**：http://设备IP:18780
- **Gateway API**：http://设备IP:18789
- **Gateway Control UI**：http://设备IP:18790

## 💡 产品化流程（零技术要求）

```
1. 设备出厂预装 Docker 镜像
   ↓
2. 客户收到设备，上电开机
   ↓
3. 访问 http://设备IP:18780
   ↓
4. 首次访问设置管理密码
   ↓
5. 填写配置信息：
   - AI 模型（API Key、Base URL、Model ID）
   - IM 渠道（飞书、钉钉、企业微信等）
   ↓
6. 保存配置
   ↓
7. 容器自动重启（约10秒）
   ↓
8. 立即使用！
```

## ✨ 技术特性

1. ✅ **修复原镜像 bug**：环境变量空值问题
2. ✅ **三级配置优先级**：环境变量 > 配置文件 > 默认值
3. ✅ **自动生成 token**：防止空值启动失败
4. ✅ **进程守护**：supervisord 自动重启
5. ✅ **健康检查**：自动监控服务状态
6. ✅ **统一日志**：便于故障排查
7. ✅ **零门槛配置**：Web 界面完成所有设置

## 📋 验证清单

- ✅ Dockerfile 正确引用当前目录
- ✅ init-fixed.sh 包含关键修复
- ✅ supervisord.conf 配置正确
- ✅ .dockerignore 排除不必要的文件
- ✅ 所有脚本有执行权限

## 🔍 故障排查

### 查看日志
```bash
# 查看所有日志
docker logs openclaw-easy

# 查看 Gateway 日志
docker exec openclaw-easy tail -f /var/log/supervisor/gateway.log

# 查看 Web 界面日志
docker exec openclaw-easy tail -f /var/log/supervisor/easy.log
```

### 检查健康状态
```bash
docker ps
# 查看 STATUS 列是否显示 (healthy)
```

### 进入容器调试
```bash
docker exec -it openclaw-easy bash
```

## 📝 配置文件位置

容器内配置文件路径：
- **OpenClaw 配置**：`/home/node/.openclaw/openclaw.json`
- **Gateway 日志**：`/var/log/supervisor/gateway.log`
- **Web 日志**：`/var/log/supervisor/easy.log`

## 🎯 下一步

1. 构建镜像测试
2. 运行容器验证
3. Web 界面配置
4. 功能测试

---

**项目已完成，可以开始测试！** 🚀
