#!/bin/bash
# 快速构建 Hermes NIM 版本（带缓存优化）
# 
# 优化：利用 BuildKit cache mount，npm 下载缓存跨构建复用
# - 首次构建：~2小时
# - 后续构建（仅源码变动）：~5-15分钟
#
set -e

echo "=========================================="
echo "  Hermes NIM 快速构建（缓存优化版）"
echo "  基于 PR #13062 (NeteaseIM 集成)"
echo "=========================================="

# 确保 BuildKit 启用
export DOCKER_BUILDKIT=1

echo ""
echo "  Layer 1 (base):      系统依赖（已有，跳过）"
echo "  Layer 2 (nim-node):  源码 + npm 依赖（带缓存）"
echo "  Layer 3 (nim-app):   Python 依赖 + NIM"
echo ""

# ==================== Layer 2: Node（缓存优化） ====================
echo "🔨 [1/2] 构建 nim-node 镜像..."
echo "   ✨ npm 下载缓存跨构建复用"
echo ""

docker build \
  -f Dockerfile.nim-node.cached \
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
