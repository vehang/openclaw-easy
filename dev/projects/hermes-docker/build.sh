#!/bin/bash
# 分层构建 Hermes Agent Docker 镜像
set -e

echo "=========================================="
echo "  Hermes Agent 分层构建"
echo "=========================================="
echo ""
echo "  Layer 1 (base): 系统依赖 + Playwright（约 800MB，很少变）"
echo "  Layer 2 (app):  Hermes 源码 + 依赖（版本更新时重建）"
echo ""

# ==================== Layer 1: Base ====================
echo "🔨 [1/2] 构建 base 镜像 (hermes-base:latest)..."
echo "   包含：系统依赖、Node.js、Python、Playwright Chromium (Chrome Headless Shell)"
echo ""

docker build --no-cache -f Dockerfile.base -t hermes-base:latest .

echo ""
echo "✅ base 镜像构建完成！"
echo ""

# ==================== Layer 2: App ====================
echo "🔨 [2/2] 构建 app 镜像 (hermes-agent:latest)..."
echo "   包含：Hermes 源码、Node 依赖、Python 依赖"
echo ""

docker build -f Dockerfile.app -t hermes-agent:latest .

echo ""
echo "=========================================="
echo "  ✅ 构建完成！"
echo "=========================================="
echo ""
echo "镜像列表："
docker images | grep hermes
echo ""
echo "后续操作："
echo "  1. 编辑 .env 填入 API Key"
echo "  2. 启动: docker compose up -d"
echo "  3. 配置: docker compose exec hermes hermes setup"
