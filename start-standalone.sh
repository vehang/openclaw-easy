#!/bin/bash

# OpenClaw Easy 独立版启动脚本

set -e

echo "=== OpenClaw Easy 独立版启动 ==="

# 配置变量
OPENCLAW_HOME="${OPENCLAW_HOME:-/root/.openclaw}"
EASY_PORT="${EASY_PORT:-18780}"

# 确保 .openclaw 目录存在
mkdir -p "$OPENCLAW_HOME"

# 检查目录权限
if [ ! -w "$OPENCLAW_HOME" ]; then
    echo "❌ 权限检查失败：无法写入 $OPENCLAW_HOME"
    echo "请确保挂载目录有正确的权限"
    exit 1
fi

echo "✅ 配置目录: $OPENCLAW_HOME"

# 创建基础配置文件（如果不存在）
CONFIG_FILE="$OPENCLAW_HOME/openclaw.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "创建基础配置文件..."
    cat > "$CONFIG_FILE" <<'EOF'
{
  "meta": { "lastTouchedVersion": "2026.3.8" },
  "update": { "checkOnStart": false },
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

# 启动服务
echo "=== 启动 OpenClaw Easy 配置管理服务 ==="
echo "服务端口: $EASY_PORT"

cd /app
exec node server.js
