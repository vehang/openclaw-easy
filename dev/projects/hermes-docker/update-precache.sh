#!/bin/bash
# 从最新构建的容器更新 node_modules 预缓存
# 在成功构建并启动新容器后运行此脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

CONTAINER="${1:-hermes-cloud}"

# 查找容器
CONTAINER_ID=$(docker ps -a --filter "name=$CONTAINER" --filter "ancestor=hermes-cloud:latest" -q | head -1)

if [ -z "$CONTAINER_ID" ]; then
    # 尝试按名称查找
    CONTAINER_ID=$(docker ps -a --filter "name=$CONTAINER" -q | head -1)
fi

if [ -z "$CONTAINER_ID" ]; then
    echo "❌ 未找到容器: $CONTAINER"
    echo "   用法: $0 [容器名称或ID]"
    echo "   示例: $0 hermes-cloud"
    exit 1
fi

echo "📦 从容器 $CONTAINER_ID 提取 node_modules..."

# 清理旧缓存
rm -rf npm-precache/hermes-node-modules npm-precache/whatsapp-bridge-modules

# 提取
docker cp "$CONTAINER_ID":/opt/hermes/node_modules npm-precache/hermes-node-modules
docker cp "$CONTAINER_ID":/opt/hermes/scripts/whatsapp-bridge/node_modules npm-precache/whatsapp-bridge-modules

echo ""
echo "✅ 预缓存已更新！"
echo "   hermes-node-modules: $(du -sh npm-precache/hermes-node-modules | cut -f1)"
echo "   whatsapp-bridge:     $(du -sh npm-precache/whatsapp-bridge-modules | cut -f1)"
