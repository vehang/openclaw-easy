#!/bin/bash
# OpenClaw 整合版初始化脚本 - root 权限运行

set -e

echo "=== OpenClaw 整合版初始化 (root) ==="

# 注意：OPENCLAW_HOME 应该是用户主目录，OpenClaw 会自动在其下创建 .openclaw/ 目录
OPENCLAW_HOME="${OPENCLAW_HOME:-/root}"
OPENCLAW_SEED="/root/.openclaw-seed"
OPENCLAW_WORKSPACE="${WORKSPACE:-/root/.openclaw/workspace}"

# 创建必要目录
mkdir -p "$OPENCLAW_HOME" "$OPENCLAW_WORKSPACE"

# ========== 插件同步函数 ==========
sync_seed_extensions() {
    local seed_dir="$OPENCLAW_SEED/extensions"
    # OpenClaw 实际目录是 $OPENCLAW_HOME/.openclaw/
    local target_dir="$OPENCLAW_HOME/.openclaw/extensions"
    local seed_version_file="$seed_dir/.seed-version"
    local target_version_file="$target_dir/.seed-version"
    local sync_mode="${SYNC_EXTENSIONS_MODE:-missing}"

    if [ ! -d "$seed_dir" ]; then
        echo "ℹ️ 未找到插件 seed 目录，跳过同步: $seed_dir"
        return
    fi

    mkdir -p "$target_dir"

    case "$sync_mode" in
        missing)
            echo "=== 同步内置插件（仅补充缺失项） ==="
            find "$seed_dir" -mindepth 1 -maxdepth 1 | while IFS= read -r seed_item; do
                local item_name target_item
                item_name="$(basename "$seed_item")"
                target_item="$target_dir/$item_name"
                if [ -e "$target_item" ]; then
                    echo "  ✓ 已存在: $item_name"
                    continue
                fi
                cp -a "$seed_item" "$target_item"
                echo "  ➕ 已补充插件: $item_name"
            done
            ;;
        overwrite)
            echo "=== 同步内置插件（强制覆盖） ==="
            find "$seed_dir" -mindepth 1 -maxdepth 1 ! -name '.seed-version' | while IFS= read -r seed_item; do
                rm -rf "$target_dir/$(basename "$seed_item")"
            done
            cp -a "$seed_dir"/. "$target_dir"/
            echo "  ✅ 已覆盖同步所有插件"
            ;;
        seed-version|*)
            local seed_version current_version
            seed_version=""
            current_version=""
            
            if [ -f "$seed_version_file" ]; then
                seed_version="$(cat "$seed_version_file")"
            fi
            
            if [ -f "$target_version_file" ]; then
                current_version="$(cat "$target_version_file")"
            fi
            
            if [ -n "$seed_version" ] && [ "$seed_version" = "$current_version" ]; then
                echo "=== 插件版本一致 ($seed_version)，跳过同步 ==="
            else
                echo "=== 同步内置插件 (seed: $seed_version -> current: $current_version) ==="
                find "$seed_dir" -mindepth 1 -maxdepth 1 ! -name '.seed-version' | while IFS= read -r seed_item; do
                    rm -rf "$target_dir/$(basename "$seed_item")"
                done
                cp -a "$seed_dir"/. "$target_dir"/
                echo "  ✅ 已同步所有插件"
            fi
            ;;
    esac
}

# ========== 配置同步函数 ==========
sync_config_with_env() {
    # OpenClaw 实际目录是 $OPENCLAW_HOME/.openclaw/
    local config_file="$OPENCLAW_HOME/.openclaw/openclaw.json"
    
    # 如果文件不存在，创建基础骨架
    if [ ! -f "$config_file" ]; then
        echo "创建基础配置文件..."
        cat > "$config_file" << 'EOF'
{
  "meta": { "lastTouchedVersion": "2026.4.1" },
  "update": { "checkOnStart": false },
  "browser": {
    "headless": true,
    "noSandbox": true,
    "defaultProfile": "openclaw",
    "executablePath": "/usr/bin/chromium"
  },
  "models": { 
    "mode": "merge", 
    "providers": { 
      "default": { 
        "baseUrl": "https://api.openai.com/v1",
        "apiKey": "placeholder-configure-via-web-ui",
        "api": "openai-completions",
        "models": [] 
      } 
    } 
  },
  "agents": {
    "defaults": {
      "compaction": { "mode": "safeguard" },
      "sandbox": { "mode": "off" },
      "elevatedDefault": "full",
      "maxConcurrent": 4,
      "workspace": "/root/.openclaw/workspace"
    }
  },
  "messages": { "ackReactionScope": "group-mentions" },
  "tools": {
    "profile": "full",
    "sessions": { "visibility": "all" },
    "fs": { "workspaceOnly": true }
  },
  "channels": {},
  "plugins": { 
    "enabled": true,
    "allow": ["nim", "openclaw-weixin"],
    "load": {
      "paths": [
        "/root/.openclaw/extensions/openclaw-nim-yx-auth",
        "/root/.openclaw/extensions/openclaw-weixin"
      ]
    },
    "installs": {
      "nim": {
        "source": "path",
        "installPath": "/root/.openclaw/extensions/openclaw-nim-yx-auth",
        "version": "1.0.0"
      },
      "openclaw-weixin": {
        "source": "npm",
        "installPath": "/root/.openclaw/extensions/openclaw-weixin",
        "version": "1.0.3"
      }
    }
  },
  "memory": {
    "backend": "qmd",
    "qmd": {
      "command": "/usr/local/bin/qmd",
      "paths": [
        {
          "path": "/root/.openclaw/workspace",
          "name": "workspace",
          "pattern": "**/*.md"
        }
      ]
    }
  }
}
EOF
        echo "✅ 基础配置文件已创建"
    fi

    # 如果有环境变量，同步配置
    if [ -n "$API_KEY" ]; then
        echo "同步环境变量配置..."
        export CONFIG_FILE="$config_file"
        python3 - << 'PYCODE'
import json, os, sys

config_file = os.environ.get('CONFIG_FILE')
with open(config_file, 'r') as f:
    config = json.load(f)

env = os.environ

# 同步模型配置
if env.get('API_KEY'):
    config.setdefault('models', {}).setdefault('providers', {})['default'] = {
        'baseUrl': env.get('BASE_URL', 'https://api.openai.com/v1'),
        'apiKey': env['API_KEY'],
        'api': env.get('API_PROTOCOL', 'openai-completions'),
        'models': []
    }
    
    model_id = env.get('MODEL_ID', 'gpt-4o')
    config['models']['providers']['default']['models'] = [{
        'id': model_id,
        'name': model_id,
        'contextWindow': int(env.get('CONTEXT_WINDOW', 200000)),
        'maxTokens': int(env.get('MAX_TOKENS', 8192))
    }]
    
    config.setdefault('agents', {}).setdefault('defaults', {})['model'] = {
        'primary': f'default/{model_id}'
    }
    print(f'✅ 模型配置已同步: {model_id}')

# Gateway 配置
if env.get('OPENCLAW_GATEWAY_TOKEN'):
    config['gateway'] = {
        'port': int(env.get('OPENCLAW_GATEWAY_PORT', 18789)),
        'bind': env.get('OPENCLAW_GATEWAY_BIND', '0.0.0.0'),
        'auth': { 'token': env['OPENCLAW_GATEWAY_TOKEN'] }
    }
    print('✅ Gateway 配置已同步')

with open(config_file, 'w') as f:
    json.dump(config, f, indent=2, ensure_ascii=False)
PYCODE
    fi

    # ========== 始终确保 plugins 配置正确 ==========
    echo "确保 plugins 配置正确..."
    export CONFIG_FILE="$config_file"
    python3 - << 'PYCODE'
import json, os

config_file = os.environ.get('CONFIG_FILE')
with open(config_file, 'r') as f:
    config = json.load(f)

# 确保 plugins 配置正确（包含 NIM 和微信插件）
config["plugins"] = {
    "enabled": True,
    "allow": ["nim", "openclaw-weixin"],
    "load": {
        "paths": [
            "/root/.openclaw/extensions/openclaw-nim-yx-auth",
            "/root/.openclaw/extensions/openclaw-weixin"
        ]
    },
    "installs": {
        "nim": {
            "source": "path",
            "installPath": "/root/.openclaw/extensions/openclaw-nim-yx-auth",
            "version": "1.0.0"
        },
        "openclaw-weixin": {
            "source": "npm",
            "installPath": "/root/.openclaw/extensions/openclaw-weixin",
            "version": "1.0.3"
        }
    }
}
print("✅ plugins 配置已确保正确")

with open(config_file, 'w') as f:
    json.dump(config, f, indent=2, ensure_ascii=False)
PYCODE
}

# ========== 执行同步 ==========
sync_seed_extensions
sync_config_with_env

# ========== 显示配置信息 ==========
echo ""
echo "=== 当前配置 ==="
echo "OpenClaw Home: $OPENCLAW_HOME/.openclaw"
echo "Workspace: $OPENCLAW_WORKSPACE"

if [ -f "$OPENCLAW_HOME/.openclaw/openclaw.json" ]; then
    echo "配置文件: $OPENCLAW_HOME/.openclaw/openclaw.json"
    
    # 显示模型配置
    MODEL=$(jq -r '.agents.defaults.model.primary // "未配置"' "$OPENCLAW_HOME/.openclaw/openclaw.json" 2>/dev/null || echo "未配置")
    echo "默认模型: $MODEL"
fi

# ========== 显示插件信息 ==========
echo ""
echo "=== 已安装插件 ==="
ls -la "$OPENCLAW_HOME/.openclaw/extensions/" 2>/dev/null || echo "无插件目录"

# ========== 启动 OpenClaw Gateway ==========
echo ""
echo "=== 启动 OpenClaw Gateway ==="

# --bind 参数: loopback=127.0.0.1, lan=0.0.0.0, tailnet, auto, custom
GATEWAY_BIND="${OPENCLAW_GATEWAY_BIND:-lan}"
GATEWAY_PORT="${OPENCLAW_GATEWAY_PORT:-18789}"
GATEWAY_TOKEN="${OPENCLAW_GATEWAY_TOKEN:-}"

# 如果没有配置 token，生成一个
if [ -z "$GATEWAY_TOKEN" ]; then
    GATEWAY_TOKEN=$(cat /proc/sys/kernel/random/uuid 2>/dev/null || echo "default-token-$(date +%s)")
    echo "⚠️ Gateway Token 未配置，已自动生成"
fi

echo "Gateway: bind=$GATEWAY_BIND, port=$GATEWAY_PORT"
echo "Token: ${GATEWAY_TOKEN:0:8}..."

# 启动 gateway
# --allow-unconfigured 允许在未完整配置时启动
exec openclaw gateway run \
    --bind "$GATEWAY_BIND" \
    --port "$GATEWAY_PORT" \
    --token "$GATEWAY_TOKEN" \
    --allow-unconfigured \
    --verbose
