#!/bin/bash
# 部署脚本 - baoboxs-nav

set -e

# 配置
SSH_HOST="192.168.1.123"
SSH_PORT="22345"
SSH_USER="root"
SSH_PASS="Aa123456789#"
REGISTRY="192.168.1.123:22345"
IMAGE_NAME="baoboxs-nav"
IMAGE_TAG="latest"

echo "=== 部署测试流程 ==="

# 步骤1: 确认构建产物
echo "[1/4] 检查构建产物..."
if [ ! -d ".next/standalone" ]; then
    echo "错误: .next/standalone 目录不存在，请先运行 npm run build"
    exit 1
fi
echo "✓ 构建产物检查通过"

# 步骤2: 构建 Docker 镜像 (需要本地有 Docker)
echo "[2/4] 构建 Docker 镜像..."
if command -v docker &> /dev/null; then
    docker build -t ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} .
    echo "✓ Docker 镜像构建完成"
else
    echo "警告: 本地没有 Docker，需要在远程服务器构建"
fi

# 步骤3: 推送镜像到 Registry
echo "[3/4] 推送镜像到 Registry..."
if command -v docker &> /dev/null; then
    docker push ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
    echo "✓ 镜像推送完成"
else
    echo "跳过: 需要手动推送"
fi

# 步骤4: 远程部署
echo "[4/4] 远程部署..."
echo "请手动执行以下命令:"
echo ""
echo "  ssh ${SSH_USER}@${SSH_HOST} -p ${SSH_PORT}"
echo ""
echo "然后在服务器上执行:"
echo ""
echo "  # 拉取镜像"
echo "  docker pull ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
echo ""
echo "  # 停止旧容器"
echo "  docker stop baoboxs-nav-test 2>/dev/null || true"
echo "  docker rm baoboxs-nav-test 2>/dev/null || true"
echo ""
echo "  # 启动新容器"
echo "  docker run -d \\"
echo "    --name baoboxs-nav-test \\"
echo "    -p 3000:3000 \\"
echo "    -e API_ENV=test \\"
echo "    --restart unless-stopped \\"
echo "    ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
echo ""
echo "  # 验证"
echo "  curl http://localhost:3000/api/health"
echo ""

echo "=== 部署脚本完成 ==="