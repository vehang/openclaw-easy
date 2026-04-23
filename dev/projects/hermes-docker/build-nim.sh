#!/bin/bash
# 构建 Hermes NIM 版本（三层构建）
set -e

echo "=========================================="
echo "  Hermes NIM 三层构建"
echo "  基于 PR #13062 (NeteaseIM 集成)"
echo "=========================================="
echo ""
echo "  Layer 1 (base):      系统依赖（已有，跳过）"
echo "  Layer 2 (nim-node):  源码 + npm 依赖（约 10-15 分钟）"
echo "  Layer 3 (nim-app):   Python 依赖 + NIM（约 3-5 分钟）"
echo ""

# ==================== Layer 2: Node ====================
echo "🔨 [1/2] 构建 nim-node 镜像 (hermes-nim-node:latest)..."
echo "   包含：Hermes 源码（PR 分支）、npm 依赖"
echo ""

docker build \
  -f Dockerfile.nim-node \
  --build-arg BASE_IMAGE=hermes-base:latest \
  --build-arg NPM_REGISTRY=https://registry.npmmirror.com \
  -t hermes-cloud-node:latest \
  .

echo ""
echo "✅ nim-node 镜像构建完成！"
echo ""

# ==================== Layer 3: App ====================
echo "🔨 [2/2] 构建 nim-app 镜像 (hermes-agent:nim)..."
echo "   包含：Python 依赖、飞书 SDK、NIM SDK"
echo ""

docker build \
  -f Dockerfile.app.nim \
  --build-arg NODE_IMAGE=hermes-nim-node:latest \
  -t hermes-cloud:latest \
  .

echo ""
echo "=========================================="
echo "  ✅ 构建完成！"
echo "=========================================="
echo ""
echo "镜像列表："
docker images | grep hermes
echo ""
echo "启动命令："
echo "  docker run -d \\"
echo "    --name hermes-nim \\"
echo "    -p 49081:8080 \\"
echo "    -e TZ=Asia/Shanghai \\"
echo "    -v /home/data/docker/hermes/nim:/opt/data \\"
echo "    --restart unless-stopped \\"
echo "    hermes-agent:nim gateway run"