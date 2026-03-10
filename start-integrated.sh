#!/bin/bash

# OpenClaw Easy 整合版启动脚本
# 同时启动 OpenClaw Gateway 和配置管理服务

set -e

echo "=== OpenClaw Easy 整合版启动 ==="

# 配置变量
OPENCLAW_HOME="/home/node/.openclaw"
EASY_PORT="${EASY_PORT:-18780}"
GATEWAY_BIND="${OPENCLAW_GATEWAY_BIND:-0.0.0.0}"
GATEWAY_PORT="${OPENCLAW_GATEWAY_PORT:-18789}"

# 确保 .openclaw 目录存在
mkdir -p "$OPENCLAW_HOME"

# 创建基础配置文件（如果不存在）
CONFIG_FILE="$OPENCLAW_HOME/openclaw.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "创建基础配置文件..."
    cat > "$CONFIG_FILE" <<'EOF'
{
  "meta": { "lastTouchedVersion": "2026.3.8" },
  "update": { "checkOnStart": false },
  "browser": {
    "headless": true,
    "noSandbox": true,
    "defaultProfile": "openclaw",
    "executablePath": "/usr/bin/chromium"
  },
  "models": { "mode": "merge", "providers": { "default": { "models": [] } } },
  "agents": {
    "defaults": {
      "compaction": { "mode": "safeguard" },
      "sandbox": { "mode": "off" },
      "elevatedDefault": "full",
      "maxConcurrent": 4
    }
  },
  "gateway": {
    "port": 18789,
    "bind": "0.0.0.0",
    "mode": "local"
  },
  "channels": {},
  "plugins": { "entries": {}, "installs": {} }
}
EOF
    echo "✅ 基础配置文件已创建"
fi

# 定义清理函数
cleanup() {
    echo "=== 接收到停止信号，正在关闭服务 ==="

    if [ -n "$GATEWAY_PID" ]; then
        echo "停止 OpenClaw Gateway (PID: $GATEWAY_PID)..."
        kill -TERM "$GATEWAY_PID" 2>/dev/null || true
        wait "$GATEWAY_PID" 2>/dev/null || true
    fi

    if [ -n "$EASY_PID" ]; then
        echo "停止 OpenClaw Easy (PID: $EASY_PID)..."
        kill -TERM "$EASY_PID" 2>/dev/null || true
        wait "$EASY_PID" 2>/dev/null || true
    fi

    echo "=== 服务已停止 ==="
    exit 0
}

# 捕获终止信号
trap cleanup SIGTERM SIGINT SIGQUIT

# 设置环境变量
export HOME=/home/node
export DBUS_SESSION_BUS_ADDRESS=/dev/null
export BUN_INSTALL="/usr/local"
export PATH="$BUN_INSTALL/bin:$PATH"

# 启动 OpenClaw Gateway
echo "=== 启动 OpenClaw Gateway ==="
echo "Gateway 端口: $GATEWAY_PORT"
echo "Gateway 绑定: $GATEWAY_BIND"

if [ -n "$OPENCLAW_GATEWAY_TOKEN" ]; then
    openclaw gateway run \
        --bind "$GATEWAY_BIND" \
        --port "$GATEWAY_PORT" \
        --token "$OPENCLAW_GATEWAY_TOKEN" \
        --verbose &
    GATEWAY_PID=$!
    echo "✅ OpenClaw Gateway 已启动 (PID: $GATEWAY_PID)"
else
    echo "⚠️ OPENCLAW_GATEWAY_TOKEN 未设置，跳过 Gateway 启动"
fi

# 启动 OpenClaw Easy 配置管理服务
echo "=== 启动 OpenClaw Easy 配置管理服务 ==="
echo "配置管理端口: $EASY_PORT"

cd /app/easy
node server.js &
EASY_PID=$!
echo "✅ OpenClaw Easy 已启动 (PID: $EASY_PID)"

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║       OpenClaw Easy 整合版已启动 🦞        ║"
echo "╠════════════════════════════════════════════╣"
echo "║  Gateway 服务: http://localhost:$GATEWAY_PORT        ║"
echo "║  配置管理界面: http://localhost:$EASY_PORT          ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# 等待任一子进程退出
wait -n $GATEWAY_PID $EASY_PID 2>/dev/null || wait $GATEWAY_PID $EASY_PID

# 如果任一进程退出，触发清理
EXIT_CODE=$?
echo "=== 服务异常退出 (退出码: $EXIT_CODE) ==="
cleanup
exit $EXIT_CODE
