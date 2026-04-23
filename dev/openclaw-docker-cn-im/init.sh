#!/bin/bash

set -e

# ROOT 版本：所有路径改为 /root
OPENCLAW_HOME="/root/.openclaw"
OPENCLAW_WORKSPACE_ROOT="${OPENCLAW_WORKSPACE_ROOT:-$OPENCLAW_HOME}"
OPENCLAW_WORKSPACE_ROOT="${OPENCLAW_WORKSPACE_ROOT%/}"
OPENCLAW_WORKSPACE="${OPENCLAW_WORKSPACE_ROOT}/workspace"
GATEWAY_PID=""

log_section() {
    echo "=== $1 ==="
}

ensure_workspace_root_link() {
    mkdir -p "$OPENCLAW_HOME"

    if [ "$OPENCLAW_WORKSPACE_ROOT" = "$OPENCLAW_HOME" ]; then
        return
    fi

    local workspace_root_parent
    workspace_root_parent="$(dirname "$OPENCLAW_WORKSPACE_ROOT")"
    mkdir -p "$workspace_root_parent"
    mkdir -p "$OPENCLAW_WORKSPACE_ROOT"

    if [ -L "$OPENCLAW_WORKSPACE_ROOT" ]; then
        local current_target
        current_target="$(readlink "$OPENCLAW_WORKSPACE_ROOT" || true)"
        if [ "$current_target" = "$OPENCLAW_HOME" ]; then
            return
        fi
        rm -f "$OPENCLAW_WORKSPACE_ROOT"
    elif [ -e "$OPENCLAW_WORKSPACE_ROOT" ]; then
        if [ -d "$OPENCLAW_WORKSPACE_ROOT" ] && [ -z "$(ls -A "$OPENCLAW_WORKSPACE_ROOT" 2>/dev/null)" ]; then
            rmdir "$OPENCLAW_WORKSPACE_ROOT"
        else
            echo "❌ OPENCLAW_WORKSPACE_ROOT 已存在且不能替换为指向 $OPENCLAW_HOME 的软链接: $OPENCLAW_WORKSPACE_ROOT"
            echo "   请清理或改用其他路径后重试。"
            exit 1
        fi
    fi

    ln -s "$OPENCLAW_HOME" "$OPENCLAW_WORKSPACE_ROOT"
    echo "已创建工作空间根目录软链接: $OPENCLAW_WORKSPACE_ROOT -> $OPENCLAW_HOME"
}

ensure_directories() {
    ensure_workspace_root_link
    mkdir -p "$OPENCLAW_HOME" "$OPENCLAW_WORKSPACE"
}

ensure_config_persistence() {
    log_section "配置 .config 目录持久化"
    local persistent_config_dir="$OPENCLAW_HOME/.config"
    local container_config_dir="/root/.config"

    mkdir -p "$persistent_config_dir"
    
    if [ -d "$container_config_dir" ] && [ ! -L "$container_config_dir" ]; then
        if [ -z "$(ls -A "$persistent_config_dir")" ]; then
            echo "检测到容器内已有 .config 目录，正在迁移到持久化目录..."
            cp -a "$container_config_dir/." "$persistent_config_dir/"
        fi
        rm -rf "$container_config_dir"
    fi

    if [ ! -L "$container_config_dir" ]; then
        ln -sfn "$persistent_config_dir" "$container_config_dir"
        echo "已建立软链接: $container_config_dir -> $persistent_config_dir"
    fi
}

sync_seed_extensions() {
    local seed_dir="/root/.openclaw-seed/extensions"
    local target_dir="$OPENCLAW_HOME/extensions"
    local seed_version_file="$seed_dir/.seed-version"
    local target_version_file="$target_dir/.seed-version"
    local global_sync="${SYNC_OPENCLAW_CONFIG:-true}"
    local sync_mode="${SYNC_EXTENSIONS_MODE:-seed-version}"
    local sync_on_start="${SYNC_EXTENSIONS_ON_START:-true}"
    local normalized_mode normalized_toggle

    global_sync="$(echo "$global_sync" | tr '[:upper:]' '[:lower:]' | xargs)"
    if [ "$global_sync" = "false" ] || [ "$global_sync" = "0" ] || [ "$global_sync" = "no" ]; then
        echo "ℹ️ 已关闭整体配置同步，跳过插件目录同步"
        return
    fi

    normalized_mode="$(echo "$sync_mode" | tr '[:upper:]' '[:lower:]' | xargs)"
    normalized_toggle="$(echo "$sync_on_start" | tr '[:upper:]' '[:lower:]' | xargs)"

    if [ "$normalized_toggle" = "false" ] || [ "$normalized_toggle" = "0" ] || [ "$normalized_toggle" = "no" ]; then
        echo "ℹ️ 已关闭启动时插件同步"
        return
    fi

    if [ ! -d "$seed_dir" ]; then
        echo "ℹ️ 未找到插件 seed 目录，跳过同步: $seed_dir"
        return
    fi

    mkdir -p "$target_dir"

    case "$normalized_mode" in
        missing)
            echo "=== 同步内置插件（仅补充缺失项） ==="
            find "$seed_dir" -mindepth 1 -maxdepth 1 | while IFS= read -r seed_item; do
                local item_name target_item
                item_name="$(basename "$seed_item")"
                target_item="$target_dir/$item_name"
                if [ -e "$target_item" ]; then
                    continue
                fi
                cp -a "$seed_item" "$target_item"
                echo "➕ 已补充插件/文件: $item_name"
            done
            ;;
        overwrite)
            echo "=== 同步内置插件（强制覆盖） ==="
            find "$seed_dir" -mindepth 1 -maxdepth 1 ! -name '.seed-version' | while IFS= read -r seed_item; do
                rm -rf "$target_dir/$(basename "$seed_item")"
            done
            cp -a "$seed_dir"/. "$target_dir"/
            ;;
        seed-version|versioned|"")
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
                echo "ℹ️ 内置插件已是最新 seed 版本: $seed_version"
                return
            fi

            echo "=== 同步内置插件（按 seed 版本） ==="
            if [ -n "$current_version" ]; then
                echo "当前插件 seed 版本: $current_version"
            else
                echo "当前插件 seed 版本: 未初始化"
            fi
            if [ -n "$seed_version" ]; then
                echo "镜像内置 seed 版本: $seed_version"
            else
                echo "镜像内置 seed 版本: 未标记，执行覆盖同步"
            fi
            find "$seed_dir" -mindepth 1 -maxdepth 1 ! -name '.seed-version' | while IFS= read -r seed_item; do
                rm -rf "$target_dir/$(basename "$seed_item")"
            done
            cp -a "$seed_dir"/. "$target_dir"/
            ;;
        *)
            echo "⚠️ 未识别的 SYNC_EXTENSIONS_MODE=$sync_mode，支持 missing / overwrite / seed-version，已跳过插件同步"
            return
            ;;
    esac

    rm -rf "$seed_dir"
    echo "🧹 已清空插件 seed 目录: $seed_dir"
    echo "✅ 内置插件同步完成，模式: ${normalized_mode:-seed-version}"
}

fix_permissions_if_needed() {
    # ROOT 版本：无需修复权限，直接检查目录可写
    if [ ! -w "$OPENCLAW_HOME" ]; then
        echo "❌ 权限检查失败：root 用户无法写入 $OPENCLAW_HOME"
        exit 1
    fi

    if [ -S /var/run/docker.sock ]; then
        echo "检测到 Docker Socket，正在尝试修复权限以支持沙箱..."
        chmod 666 /var/run/docker.sock || true
    fi
}

ensure_base_config() {
    local config_file="$OPENCLAW_HOME/openclaw.json"

    if [ -f "$config_file" ]; then
        return
    fi

    echo "配置文件不存在，创建基础骨架..."
    cat > "$config_file" <<'EOF'
{
  "meta": { "lastTouchedVersion": "2026.4.1" },
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
      "sandbox": { "mode": "off", "workspaceAccess": "none" },
      "elevatedDefault": "full",
      "maxConcurrent": 4,
      "subagents": { "maxConcurrent": 8 }
    }
  },
  "messages": {
    "ackReactionScope": "group-mentions",
    "tts": {
      "auto": "off",
      "mode": "final",
      "provider": "edge",
      "providers": {
        "edge": {
          "voice": "zh-CN-XiaoxiaoNeural",
          "lang": "zh-CN",
          "outputFormat": "ogg-24khz-16bit-mono-opus",
          "pitch": "+0Hz",
          "rate": "+0%",
          "volume": "+0%",
          "timeoutMs": 30000
        }
      }
    }
  },
  "commands": { "native": "auto", "nativeSkills": "auto" },
  "tools": {
    "profile": "full",
    "sessions": {
      "visibility": "all"
    },
    "fs": {
      "workspaceOnly": true
    }
  },
  "channels": {},
  "plugins": { "entries": {}, "installs": {} },
  "memory": {
    "backend": "qmd",
    "citations": "auto",
    "qmd": {
      "includeDefaultMemory": true,
      "sessions": {
        "enabled": true
      },
      "limits": {
        "timeoutMs": 8000,
        "maxResults": 16
      },
      "update": {
        "onBoot": true,
        "interval": "5m",
        "debounceMs": 15000
      },
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
}

# 简化版配置同步（保留核心功能，路径改为 /root）
sync_config_with_env() {
    local config_file="$OPENCLAW_HOME/openclaw.json"

    ensure_base_config

    echo "正在根据当前环境变量同步配置状态..."
    
    # 使用 Python 同步配置（保持原有逻辑，但路径已通过环境变量 HOME=/root 调整）
    CONFIG_FILE="$config_file" HOME="/root" python3 - <<'PYCODE'
import json
import os
import sys
from copy import deepcopy
from datetime import datetime

# 简化版：只同步核心配置
def load_config(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.loads(f.read())

def save_config(path, config):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)

def ensure_path(cfg, keys):
    curr = cfg
    for key in keys:
        if key not in curr or not isinstance(curr.get(key), dict):
            curr[key] = {}
        curr = curr[key]
    return curr

def parse_csv(value):
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [item.strip() for item in str(value).split(',') if item.strip()]

def utc_now_iso():
    return datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

def sync_models(config, env):
    models = ensure_path(config, ['models', 'providers', 'default'])
    
    if env.get('API_KEY'):
        models['apiKey'] = env['API_KEY']
    if env.get('BASE_URL'):
        models['baseUrl'] = env['BASE_URL']
    models['api'] = env.get('API_PROTOCOL') or 'openai-completions'
    
    model_id = env.get('MODEL_ID') or 'gpt-4o'
    model_id = model_id.split(',')[0].strip()
    
    existing = models.get('models', [])
    if not any(m.get('id') == model_id for m in existing):
        existing.append({
            'id': model_id,
            'name': model_id,
            'contextWindow': int(env.get('CONTEXT_WINDOW') or 200000),
            'maxTokens': int(env.get('MAX_TOKENS') or 8192),
            'reasoning': False,
            'input': ['text', 'image'],
            'cost': {'input': 0, 'output': 0, 'cacheRead': 0, 'cacheWrite': 0}
        })
    models['models'] = existing
    
    # 设置默认模型
    primary_model = env.get('PRIMARY_MODEL') or f'default/{model_id}'
    if '/' not in primary_model:
        primary_model = f'default/{primary_model}'
    
    ensure_path(config, ['agents', 'defaults', 'model'])['primary'] = primary_model
    ensure_path(config, ['agents', 'defaults', 'imageModel'])['primary'] = primary_model
    
    # 工作目录
    workspace = '/root/.openclaw/workspace'
    config['agents']['defaults']['workspace'] = workspace
    
    # 内存配置
    memory = ensure_path(config, ['memory', 'qmd'])
    memory.setdefault('command', '/usr/local/bin/qmd')
    paths = memory.get('paths', [])
    if not any(p.get('name') == 'workspace' for p in paths):
        paths.append({'name': 'workspace', 'path': workspace, 'pattern': '**/*.md'})
    memory['paths'] = paths
    
    print(f'✅ 模型同步完成: 主模型={primary_model}')

def sync_gateway(config, env):
    if not env.get('OPENCLAW_GATEWAY_TOKEN'):
        return
    
    gateway = ensure_path(config, ['gateway'])
    gateway['port'] = int(env.get('OPENCLAW_GATEWAY_PORT') or 18789)
    gateway['bind'] = env.get('OPENCLAW_GATEWAY_BIND') or '0.0.0.0'
    gateway['mode'] = env.get('OPENCLAW_GATEWAY_MODE') or 'local'
    
    auth = ensure_path(gateway, ['auth'])
    auth['token'] = env['OPENCLAW_GATEWAY_TOKEN']
    auth['mode'] = env.get('OPENCLAW_GATEWAY_AUTH_MODE') or 'token'
    
    print('✅ Gateway 同步完成')

def sync():
    path = os.environ.get('CONFIG_FILE', '/root/.openclaw/openclaw.json')
    try:
        config = load_config(path)
        sync_models(config, os.environ)
        sync_gateway(config, os.environ)
        ensure_path(config, ['meta'])['lastTouchedAt'] = utc_now_iso()
        save_config(path, config)
    except Exception as exc:
        print(f'❌ 同步失败: {exc}', file=sys.stderr)
        sys.exit(1)

sync()
PYCODE
}

print_runtime_summary() {
    log_section "初始化完成"
    echo "当前主模型: ${PRIMARY_MODEL:-default/${MODEL_ID:-gpt-4o}}"
    echo "API 协议: ${API_PROTOCOL:-openai-completions}"
    echo "Base URL: ${BASE_URL}"
    echo "Gateway 端口: ${OPENCLAW_GATEWAY_PORT:-18789}"
    echo "Gateway 绑定: ${OPENCLAW_GATEWAY_BIND:-0.0.0.0}"
    echo "运行用户: root (ROOT 版本)"
    echo "工作目录: /root/.openclaw"
}

setup_runtime_env() {
    export BUN_INSTALL="/usr/local"
    export PATH="$BUN_INSTALL/bin:$PATH"
    export AGENT_REACH_HOME="/root/.agent-reach"
    export AGENT_REACH_VENV_HOME="/root/.agent-reach-venv"
    export PATH="$AGENT_REACH_HOME/bin:$PATH"
    
    if [ -d "$AGENT_REACH_VENV_HOME/bin" ]; then
        export PATH="$AGENT_REACH_VENV_HOME/bin:$PATH"
    fi

    export DBUS_SESSION_BUS_ADDRESS=/dev/null
}

cleanup() {
    echo "=== 接收到停止信号,正在关闭服务 ==="
    if [ -n "$GATEWAY_PID" ]; then
        kill -TERM "$GATEWAY_PID" 2>/dev/null || true
        wait "$GATEWAY_PID" 2>/dev/null || true
    fi
    echo "=== 服务已停止 ==="
    exit 0
}

install_signal_traps() {
    trap cleanup SIGTERM SIGINT SIGQUIT
}

start_gateway() {
    log_section "启动 OpenClaw Gateway (ROOT 版本)"

    # ROOT 版本：直接运行，无需 gosu 降权
    env HOME=/root DBUS_SESSION_BUS_ADDRESS=/dev/null \
        BUN_INSTALL="/usr/local" \
        PATH="/usr/local/bin:$PATH" \
        openclaw gateway run \
        --bind "${OPENCLAW_GATEWAY_BIND:-0.0.0.0}" \
        --port "${OPENCLAW_GATEWAY_PORT:-18789}" \
        --token "${OPENCLAW_GATEWAY_TOKEN}" \
        --verbose &
    GATEWAY_PID=$!

    echo "=== OpenClaw Gateway 已启动 (PID: $GATEWAY_PID) ==="
}

wait_for_gateway() {
    wait "$GATEWAY_PID"
    local exit_code=$?
    echo "=== OpenClaw Gateway 已退出 (退出码: $exit_code) ==="
    exit "$exit_code"
}

main() {
    log_section "OpenClaw 初始化脚本 (ROOT 版本)"
    ensure_directories
    ensure_config_persistence
    fix_permissions_if_needed
    sync_seed_extensions
    sync_config_with_env
    print_runtime_summary
    setup_runtime_env
    install_signal_traps
    start_gateway
    wait_for_gateway
}

main