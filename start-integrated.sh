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
NODE_UID="$(id -u node)"
NODE_GID="$(id -g node)"

# ==================== 权限修复 ====================
# 如果以 root 运行，修复挂载目录权限
if [ "$(id -u)" -eq 0 ]; then
    echo "=== 检查并修复目录权限 ==="

    # 确保 .openclaw 目录存在
    mkdir -p "$OPENCLAW_HOME"

    # 检查挂载目录权限
    CURRENT_OWNER="$(stat -c '%u:%g' "$OPENCLAW_HOME" 2>/dev/null || echo unknown:unknown)"
    echo "挂载目录: $OPENCLAW_HOME"
    echo "当前所有者(UID:GID): $CURRENT_OWNER"
    echo "目标所有者(UID:GID): ${NODE_UID}:${NODE_GID}"

    if [ "$CURRENT_OWNER" != "${NODE_UID}:${NODE_GID}" ]; then
        echo "检测到权限不一致，正在修复..."
        chown -R node:node "$OPENCLAW_HOME" || {
            echo "⚠️ 权限修复失败，可能是 SELinux 限制"
            echo "请尝试以下方案："
            echo "  1. 在宿主机执行: sudo chown -R 1000:1000 <挂载目录>"
            echo "  2. 或在 docker run 时添加 :z 标志重新标记 SELinux"
        }
    fi

    # 验证写权限
    if ! gosu node test -w "$OPENCLAW_HOME" 2>/dev/null; then
        echo "❌ 权限检查失败：node 用户无法写入 $OPENCLAW_HOME"
        echo "请在宿主机执行："
        echo "  sudo chown -R ${NODE_UID}:${NODE_GID} <你的挂载目录>"
        exit 1
    fi

    echo "✅ 权限检查通过"
fi

# ==================== 配置同步 ====================

# 同步配置函数（简化版）
sync_config() {
    local config_file="$OPENCLAW_HOME/openclaw.json"

    # 如果配置文件不存在，创建基础骨架
    if [ ! -f "$config_file" ]; then
        echo "创建基础配置文件..."

        # 以 node 用户创建配置文件
        if [ "$(id -u)" -eq 0 ]; then
            gosu node bash -c "cat > '$config_file' <<'EOF'
{
  \"meta\": { \"lastTouchedVersion\": \"2026.3.8\" },
  \"update\": { \"checkOnStart\": false },
  \"browser\": {
    \"headless\": true,
    \"noSandbox\": true,
    \"defaultProfile\": \"openclaw\",
    \"executablePath\": \"/usr/bin/chromium\"
  },
  \"models\": { \"mode\": \"merge\", \"providers\": { \"default\": { \"models\": [] } } },
  \"agents\": {
    \"defaults\": {
      \"compaction\": { \"mode\": \"safeguard\" },
      \"sandbox\": { \"mode\": \"off\" },
      \"elevatedDefault\": \"full\",
      \"maxConcurrent\": 4
    }
  },
  \"gateway\": {
    \"port\": 18789,
    \"bind\": \"0.0.0.0\",
    \"mode\": \"local\"
  },
  \"channels\": {},
  \"plugins\": { \"entries\": {}, \"installs\": {} }
}
EOF"
        else
            cat > "$config_file" <<'EOF'
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
        fi
        echo "✅ 基础配置文件已创建"
    else
        echo "✅ 配置文件已存在: $config_file"
    fi
}

sync_config

# ==================== 清理函数 ====================

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

# ==================== 启动服务 ====================

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
    if [ "$(id -u)" -eq 0 ]; then
        gosu node env HOME=/home/node DBUS_SESSION_BUS_ADDRESS=/dev/null \
            BUN_INSTALL="/usr/local" PATH="/usr/local/bin:$PATH" \
            openclaw gateway run \
            --bind "$GATEWAY_BIND" \
            --port "$GATEWAY_PORT" \
            --token "$OPENCLAW_GATEWAY_TOKEN" \
            --verbose &
    else
        openclaw gateway run \
            --bind "$GATEWAY_BIND" \
            --port "$GATEWAY_PORT" \
            --token "$OPENCLAW_GATEWAY_TOKEN" \
            --verbose &
    fi
    GATEWAY_PID=$!
    echo "✅ OpenClaw Gateway 已启动 (PID: $GATEWAY_PID)"
else
    echo "⚠️ OPENCLAW_GATEWAY_TOKEN 未设置，跳过 Gateway 启动"
fi

# 启动 OpenClaw Easy 配置管理服务
echo "=== 启动 OpenClaw Easy 配置管理服务 ==="
echo "配置管理端口: $EASY_PORT"

cd /app/easy
if [ "$(id -u)" -eq 0 ]; then
    gosu node env HOME=/home/node node server.js &
else
    node server.js &
fi
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
