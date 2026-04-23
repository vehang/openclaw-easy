#!/bin/bash
# 仅重新构建 app 层（版本更新时用，不需要重装系统依赖）
set -e

echo "🔄 仅重建 app 层 (hermes-agent:latest)..."
echo "   复用已有的 base 镜像，速度很快"
echo ""

docker build -f Dockerfile.app -t hermes-agent:latest .

echo ""
echo "✅ app 层重建完成！"
docker images | grep hermes
