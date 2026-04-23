#!/bin/bash
# 快速构建 Hermes NIM 版本（预缓存版）
# 
# 原理：利用已构建镜像的 node_modules，npm install 只需校验+补缺
# 
# 依赖没变化时：npm install 从 2h+ 降到 几秒~几分钟
# 
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 确保 BuildKit 启用（layer caching 更高效）
export DOCKER_BUILDKIT=1

echo "=========================================="
echo "  Hermes NIM 快速构建（预缓存版）"
echo "  基于 PR #13062 (NeteaseIM 集成)"
echo "=========================================="

# 检查预缓存是否存在
if [ ! -d "npm-precache/hermes-node-modules" ] || [ ! -d "npm-precache/whatsapp-bridge-modules" ]; then
    echo ""
    echo "❌ 预缓存不存在，请先执行："
    echo "   mkdir -p npm-precache"
    echo "   docker cp <容器ID>:/opt/hermes/node_modules npm-precache/hermes-node-modules"
    echo "   docker cp <容器ID>:/opt/hermes/scripts/whatsapp-bridge/node_modules npm-precache/whatsapp-bridge-modules"
    echo ""
    echo "或者使用常规构建脚本：./build-nim.sh"
    exit 1
fi

echo ""
echo "  ✅ 预缓存已就绪"
echo "     hermes-node-modules: $(du -sh npm-precache/hermes-node-modules 2>/dev/null | cut -f1)"
echo "     whatsapp-bridge:     $(du -sh npm-precache/whatsapp-bridge-modules 2>/dev/null | cut -f1)"
echo ""

# ==================== Layer 2: Node（预缓存） ====================
echo "🔨 [1/2] 构建 nim-node 镜像（预缓存加速）..."
echo ""

docker build \
  -f Dockerfile.nim-node.precache \
  --build-arg BASE_IMAGE=hermes-base:latest \
  --build-arg NPM_REGISTRY=https://registry.npmmirror.com \
  -t hermes-cloud-node:latest \
  .

echo ""
echo "✅ nim-node 镜像构建完成！"
echo ""

# ==================== Layer 3: App ====================
echo "🔨 [2/2] 构建 nim-app 镜像..."
echo ""

docker build \
  -f Dockerfile.app.nim \
  --build-arg NODE_IMAGE=hermes-cloud-node:latest \
  -t hermes-cloud:latest \
  .

echo ""
echo "=========================================="
echo "  ✅ 构建完成！"
echo "=========================================="
echo ""
echo "镜像列表："
docker images | grep -E "hermes-cloud|hermes-nim" | head -5

# 构建成功后，更新预缓存（保持最新）
echo ""
echo "💡 提示：构建成功后，可更新预缓存以保持最新："
echo "   ./update-precache.sh"
