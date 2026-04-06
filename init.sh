#!/bin/bash
# OpenClaw 基础镜像初始化脚本

set -e

echo "=== OpenClaw 基础镜像初始化 ==="

OPENCLAW_HOME="${OPENCLAW_HOME:-/root}"
OPENCLAW_SEED="/root/.openclaw-seed"

# 创建必要目录
mkdir -p "$OPENCLAW_HOME/.openclaw/workspace"
mkdir -p "$OPENCLAW_HOME/.openclaw/extensions"

# 同步种子插件（如果存在）
if [ -d "$OPENCLAW_SEED/extensions" ]; then
    echo "=== 同步内置插件 ==="
    target_dir="$OPENCLAW_HOME/.openclaw/extensions"
    mkdir -p "$target_dir"
    
    find "$OPENCLAW_SEED/extensions" -mindepth 1 -maxdepth 1 ! -name '.seed-version' | while IFS= read -r seed_item; do
        item_name="$(basename "$seed_item")"
        target_item="$target_dir/$item_name"
        if [ ! -e "$target_item" ]; then
            cp -a "$seed_item" "$target_item"
            echo "  ➕ 已同步: $item_name"
        else
            echo "  ✓ 已存在: $item_name"
        fi
    done
fi

echo "✅ 初始化完成"
