#!/bin/bash
# OpenClaw 整合版初始化脚本 - root 权限运行

set -e

echo "=== OpenClaw 整合版初始化 (root) ==="

OPENCLAW_HOME="${OPENCLAW_HOME:-/root}"
OPENCLAW_SEED="/root/.openclaw-seed"
OPENCLAW_WORKSPACE="${WORKSPACE:-/root/.openclaw/workspace}"
CONFIG_FILE="$OPENCLAW_HOME/.openclaw/openclaw.json"
NIM_EXTENSIONS_DIR="$OPENCLAW_HOME/.openclaw/extensions/openclaw-nim-yx-auth"

mkdir -p "$OPENCLAW_HOME" "$OPENCLAW_WORKSPACE"

# ========== 插件同步函数 ==========
sync_seed_extensions() {
    local seed_dir="$OPENCLAW_SEED/extensions"
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

# ========== 从配置中移除 nim 引用 ==========
remove_nim_from_config() {
    if [ ! -f "$CONFIG_FILE" ]; then
        return
    fi
    python3 -c "
import json, os
cfg = '$CONFIG_FILE'
try:
    with open(cfg, 'r') as f:
        c = json.load(f)
    ch = False
    if 'channels' in c and 'nim' in c['channels']:
        del c['channels']['nim']
        if not c['channels']: del c['channels']
        ch = True
    if 'plugins' in c and 'allow' in c['plugins']:
        c['plugins']['allow'] = [p for p in c['plugins']['allow'] if p != 'nim']
        if not c['plugins']['allow']:
            if 'allow' in c['plugins']: del c['plugins']['allow']
        ch = True
    if ch:
        with open(cfg, 'w') as f:
            json.dump(c, f, indent=2, ensure_ascii=False)
except Exception as e:
    print('  remove_nim_from_config error: ' + str(e))
"
}

# ========== 确保配置中包含 nim 引用 ==========
ensure_nim_in_config() {
    if [ ! -f "$CONFIG_FILE" ]; then
        return
    fi
    python3 -c "
import json, os
cfg = '$CONFIG_FILE'
try:
    with open(cfg, 'r') as f:
        c = json.load(f)
    c.setdefault('plugins', {})
    c['plugins']['enabled'] = True
    allow = c['plugins'].get('allow', [])
    if 'nim' not in allow:
        allow.append('nim')
        c['plugins']['allow'] = allow
    with open(cfg, 'w') as f:
        json.dump(c, f, indent=2, ensure_ascii=False)
except Exception as e:
    print('  ensure_nim_in_config error: ' + str(e))
"
}

# ========== 检查 nim 插件是否已安装 ==========
is_nim_installed() {
    [ -d "$NIM_EXTENSIONS_DIR" ] && [ -f "$NIM_EXTENSIONS_DIR/package.json" ]
}

# ========== 配置同步函数 ==========
sync_config_with_env() {
    if [ ! -f "$CONFIG_FILE" ]; then
        echo "创建基础配置文件..."
        cat > "$CONFIG_FILE" << CFGEOF
{
  "meta": { "lastTouchedVersion": "${OPENCLAW_VERSION}" },
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
        "baseUrl": "https://placeholder.invalid/v1",
        "apiKey": "__PLACEHOLDER_API_KEY__",
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
  "plugins": {
    "enabled": true
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
CFGEOF
        echo "✅ 基础配置文件已创建（不含 nim 引用）"
    fi

    if [ -n "$API_KEY" ]; then
        echo "同步环境变量配置..."
        export CONFIG_FILE="$CONFIG_FILE"
        python3 - << 'PYCODE'
import json, os

config_file = os.environ.get('CONFIG_FILE')
with open(config_file, 'r') as f:
    config = json.load(f)

env = os.environ

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
}

# ========== 执行同步 ==========
sync_seed_extensions

# ========== 安装 NIM 插件（在 sync_config 之前，确保配置干净） ==========
echo ""
echo "=== 安装 NIM YX Auth 插件 ==="
NIM_PLUGIN_VERSION="${NIM_PLUGIN_VERSION:-0.3.0}"

remove_nim_from_config

if is_nim_installed; then
    echo "✅ NIM 插件已安装，跳过"
else
    echo "安装 openclaw-nim-yx-auth@${NIM_PLUGIN_VERSION}..."
    if openclaw plugins install "openclaw-nim-yx-auth@${NIM_PLUGIN_VERSION}" 2>&1; then
        echo "✅ NIM 插件安装完成"
    else
        echo "⚠️ NIM 插件安装失败，尝试手动安装..."
        mkdir -p "$OPENCLAW_HOME/.openclaw/extensions"
        cd /tmp
        if npm pack "openclaw-nim-yx-auth@${NIM_PLUGIN_VERSION}" 2>/dev/null; then
            tarball=$(ls openclaw-nim-yx-auth-*.tgz 2>/dev/null | head -1)
            if [ -n "$tarball" ]; then
                mkdir -p "$NIM_EXTENSIONS_DIR"
                tar xzf "$tarball" -C "$NIM_EXTENSIONS_DIR" --strip-components=1
                cd "$NIM_EXTENSIONS_DIR" && npm install --production 2>&1
                echo "✅ NIM 插件手动安装完成"
            fi
            rm -f /tmp/openclaw-nim-yx-auth-*.tgz
        else
            echo "❌ NIM 插件安装失败，将在首次配置时重试"
        fi
    fi
fi

# 现在同步配置
sync_config_with_env

# 如果 nim 插件已安装，确保配置中有 nim 引用
if is_nim_installed; then
    ensure_nim_in_config
    echo "✅ nim 插件配置已就绪"
fi

# ========== 显示配置信息 ==========
echo ""
echo "=== 当前配置 ==="
echo "OpenClaw Home: $OPENCLAW_HOME/.openclaw"
echo "Workspace: $OPENCLAW_WORKSPACE"

if [ -f "$CONFIG_FILE" ]; then
    echo "配置文件: $CONFIG_FILE"
    MODEL=$(jq -r '.agents.defaults.model.primary // "未配置"' "$CONFIG_FILE" 2>/dev/null || echo "未配置")
    echo "默认模型: $MODEL"
fi

# ========== 显示插件信息 ==========
echo ""
echo "=== 已安装插件 ==="
ls -la "$OPENCLAW_HOME/.openclaw/extensions/" 2>/dev/null || echo "无插件目录"

# ========== 启动 OpenClaw Gateway ==========
echo ""
echo "=== 启动 OpenClaw Gateway ==="

GATEWAY_BIND="${OPENCLAW_GATEWAY_BIND:-lan}"
GATEWAY_PORT="${OPENCLAW_GATEWAY_PORT:-18789}"
GATEWAY_TOKEN="${OPENCLAW_GATEWAY_TOKEN:-}"

if [ -z "$GATEWAY_TOKEN" ]; then
    GATEWAY_TOKEN=$(cat /proc/sys/kernel/random/uuid 2>/dev/null || echo "default-token-$(date +%s)")
    echo "⚠️ Gateway Token 未配置，已自动生成"
fi

echo "Gateway: bind=$GATEWAY_BIND, port=$GATEWAY_PORT"
echo "Token: ${GATEWAY_TOKEN:0:8}..."

exec openclaw gateway run \
    --bind "$GATEWAY_BIND" \
    --port "$GATEWAY_PORT" \
    --token "$GATEWAY_TOKEN" \
    --allow-unconfigured \
    --verbose
