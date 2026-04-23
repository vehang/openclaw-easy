#!/bin/bash

# 本地构建脚本
# 用法: ./scripts/build.sh [environment]

set -e

# 默认参数
ENVIRONMENT="production"

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -h|--help)
            echo "用法: $0 [选项]"
            echo "选项:"
            echo "  -e, --env ENV        环境 (development|test|production) [默认: production]"
            echo "  -h, --help           显示帮助"
            echo ""
            echo "示例:"
            echo "  $0 -e development    构建开发环境"
            echo "  $0 -e production     构建生产环境"
            exit 0
            ;;
        *)
            ENVIRONMENT="$1"
            shift
            ;;
    esac
done

# 验证环境参数
if [[ ! "$ENVIRONMENT" =~ ^(development|test|production)$ ]]; then
    echo "错误: 环境必须是 development, test, 或 production"
    exit 1
fi

echo "======================================"
echo "开始构建应用"
echo "======================================"
echo "环境: $ENVIRONMENT"
echo "======================================"

# 设置环境变量
# 注意：NODE_ENV 始终设为 production 进行构建优化
# NEXT_PUBLIC_API_ENV 用于区分API环境
export NODE_ENV="production"
export NEXT_PUBLIC_API_ENV="$ENVIRONMENT"

echo "构建配置:"
echo "  NODE_ENV: $NODE_ENV"
echo "  NEXT_PUBLIC_API_ENV: $NEXT_PUBLIC_API_ENV"

# 清理之前的构建
echo "清理之前的构建..."
rm -rf .next

# 安装依赖
echo "安装依赖..."
npm ci

# 运行构建前检查（只在测试环境）
if [ "$ENVIRONMENT" = "test" ]; then
    echo "运行代码检查..."
    npm run lint
fi

# 运行构建
echo "开始构建..."
npm run build

# 检查构建结果
if [ ! -d ".next" ]; then
    echo "❌ 构建失败：.next 目录不存在"
    exit 1
fi

if [ ! -d ".next/standalone" ]; then
    echo "❌ 构建失败：standalone 模式未启用或构建不完整"
    echo "请确保 next.config.ts 中设置了 output: 'standalone'"
    exit 1
fi

echo "✅ 构建完成！"
echo "======================================"
echo "构建结果:"
echo "  .next/standalone/     - 独立运行文件"
echo "  .next/static/         - 静态资源"
echo "  public/               - 公共文件"
echo "======================================"
echo "环境配置:"
echo "  目标环境: $ENVIRONMENT"
echo "  API环境: $NEXT_PUBLIC_API_ENV"
echo "======================================"
echo "下一步: 运行 ./scripts/deploy.sh -e $ENVIRONMENT 来部署"
echo "======================================" 