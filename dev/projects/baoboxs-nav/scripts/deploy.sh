#!/bin/bash

# 一次编译，多环境部署脚本
# 作者：Baoboxs Team
# 用途：演示如何通过一次编译实现多环境部署

set -e

echo "🚀 开始一次编译，多环境部署流程..."

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 配置
IMAGE_NAME="baoboxs-nav"
IMAGE_TAG="latest"
FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"

# 函数：打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 函数：检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_message $RED "❌ 错误: $1 命令未找到，请先安装 $1"
        exit 1
    fi
}

# 检查必要的命令
print_message $BLUE "🔍 检查必要的工具..."
check_command "npm"
check_command "docker"

# 步骤1：编译前端代码（只需一次）
print_message $BLUE "📦 步骤1: 编译前端代码（统一编译，不指定环境）..."
if [ ! -d "node_modules" ]; then
    print_message $YELLOW "📥 安装依赖..."
    npm install
fi

print_message $YELLOW "🔨 开始编译..."
npm run build

if [ $? -eq 0 ]; then
    print_message $GREEN "✅ 前端代码编译成功！"
else
    print_message $RED "❌ 前端代码编译失败！"
    exit 1
fi

# 步骤2：构建Docker镜像（只需一次）
print_message $BLUE "🐳 步骤2: 构建Docker镜像..."
docker build -t $FULL_IMAGE .

if [ $? -eq 0 ]; then
    print_message $GREEN "✅ Docker镜像构建成功！"
else
    print_message $RED "❌ Docker镜像构建失败！"
    exit 1
fi

# 步骤3：停止并删除现有容器（如果存在）
print_message $BLUE "🧹 步骤3: 清理现有容器..."
containers=("baoboxs-nav-dev" "baoboxs-nav-test" "baoboxs-nav-prod")

for container in "${containers[@]}"; do
    if docker ps -a --format "table {{.Names}}" | grep -q "^${container}$"; then
        print_message $YELLOW "🛑 停止并删除容器: $container"
        docker stop $container 2>/dev/null || true
        docker rm $container 2>/dev/null || true
    fi
done

# 步骤4：启动多个环境
print_message $BLUE "🌍 步骤4: 启动多环境部署..."

# 开发环境
print_message $YELLOW "🟡 启动开发环境 (端口: 3001)..."
docker run -d \
    --name baoboxs-nav-dev \
    -p 3001:3000 \
    -e API_ENV=development \
    $FULL_IMAGE

# 测试环境
print_message $YELLOW "🟠 启动测试环境 (端口: 3002)..."
docker run -d \
    --name baoboxs-nav-test \
    -p 3002:3000 \
    -e API_ENV=test \
    $FULL_IMAGE

# 生产环境
print_message $YELLOW "🔴 启动生产环境 (端口: 3000)..."
    docker run -d \
    --name baoboxs-nav-prod \
    -p 3000:3000 \
    -e API_ENV=production \
    $FULL_IMAGE

# 等待容器启动
print_message $BLUE "⏳ 等待容器启动..."
sleep 5

# 检查容器状态
print_message $BLUE "📋 检查容器状态..."
echo ""
echo "容器运行状态:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep baoboxs-nav

echo ""
print_message $GREEN "🎉 部署完成！"
echo ""
print_message $BLUE "📡 访问地址:"
print_message $YELLOW "  开发环境: http://localhost:3001"
print_message $YELLOW "  测试环境: http://localhost:3002"
print_message $YELLOW "  生产环境: http://localhost:3000"
echo ""
print_message $BLUE "🔧 管理命令:"
print_message $YELLOW "  查看日志: docker logs baoboxs-nav-[dev|test|prod]"
print_message $YELLOW "  停止容器: docker stop baoboxs-nav-[dev|test|prod]"
print_message $YELLOW "  重启容器: docker restart baoboxs-nav-[dev|test|prod]"
    echo ""
print_message $GREEN "✨ 一次编译，多环境部署成功完成！"

# 可选：显示环境变量验证
print_message $BLUE "🔍 环境变量验证:"
echo "开发环境 API_ENV:"
docker exec baoboxs-nav-dev printenv API_ENV 2>/dev/null || echo "无法获取"

echo "测试环境 API_ENV:"
docker exec baoboxs-nav-test printenv API_ENV 2>/dev/null || echo "无法获取"

echo "生产环境 API_ENV:"
docker exec baoboxs-nav-prod printenv API_ENV 2>/dev/null || echo "无法获取"

print_message $GREEN "🎯 部署完成！各环境已通过不同的API_ENV环境变量配置了不同的后端地址。" 