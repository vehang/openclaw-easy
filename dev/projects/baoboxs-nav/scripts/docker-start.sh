#!/bin/sh

echo "🚀 Starting Next.js application in Docker..."

# 显示环境信息
echo "Environment: $NODE_ENV"
echo "Port: $PORT"
echo "Hostname: $HOSTNAME"

# 检查必要文件是否存在
echo "📁 Checking required files..."
if [ ! -f "server.js" ]; then
    echo "❌ Error: server.js not found!"
    exit 1
fi

if [ ! -d ".next" ]; then
    echo "❌ Error: .next directory not found!"
    exit 1
fi

if [ ! -d "public" ]; then
    echo "⚠️  Warning: public directory not found!"
fi

# 显示文件结构（调试用）
echo "📂 Current directory structure:"
ls -la

echo "📂 .next directory structure:"
ls -la .next/

# 检查端口是否可用
echo "🔍 Checking if port $PORT is available..."

# 启动应用
echo "✅ Starting server on port $PORT..."
exec node server.js 