#!/bin/bash

echo "🔍 Docker 问题诊断脚本"
echo "========================"

# 检查Docker是否运行
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装或不在PATH中"
    exit 1
fi

echo "✅ Docker已安装"

# 检查构建产物
echo ""
echo "📁 检查构建产物..."
if [ ! -d ".next/standalone" ]; then
    echo "❌ .next/standalone 目录不存在"
    echo "请先运行: npm run build"
    exit 1
fi

if [ ! -f ".next/standalone/server.js" ]; then
    echo "❌ server.js 文件不存在"
    echo "请检查 next.config.ts 中的 output: 'standalone' 配置"
    exit 1
fi

echo "✅ 构建产物检查通过"

# 检查Docker镜像
echo ""
echo "🐳 检查Docker镜像..."
if docker images | grep -q baoboxs-nav; then
    echo "✅ 找到 baoboxs-nav 镜像"
    docker images | grep baoboxs-nav
else
    echo "⚠️  未找到 baoboxs-nav 镜像"
    echo "请先构建镜像: docker build -t baoboxs-nav:latest ."
fi

# 检查运行中的容器
echo ""
echo "📦 检查运行中的容器..."
if docker ps | grep -q baoboxs-nav; then
    echo "✅ 找到运行中的容器"
    docker ps | grep baoboxs-nav
else
    echo "⚠️  未找到运行中的容器"
fi

# 检查所有容器（包括停止的）
echo ""
echo "📦 检查所有容器..."
if docker ps -a | grep -q baoboxs-nav; then
    echo "📋 所有相关容器:"
    docker ps -a | grep baoboxs-nav
    
    # 获取最新的容器ID
    CONTAINER_ID=$(docker ps -a | grep baoboxs-nav | head -1 | awk '{print $1}')
    
    if [ ! -z "$CONTAINER_ID" ]; then
        echo ""
        echo "📄 最新容器日志 (最后50行):"
        echo "容器ID: $CONTAINER_ID"
        echo "---"
        docker logs --tail 50 $CONTAINER_ID
    fi
else
    echo "⚠️  未找到任何相关容器"
fi

echo ""
echo "🔧 建议的调试步骤:"
echo "1. 构建镜像: docker build -t baoboxs-nav:latest ."
echo "2. 运行容器: docker run -p 3000:3000 --name baoboxs-nav-debug baoboxs-nav:latest"
echo "3. 查看日志: docker logs baoboxs-nav-debug"
echo "4. 进入容器: docker exec -it baoboxs-nav-debug sh"
echo "5. 使用compose: docker-compose up --build" 