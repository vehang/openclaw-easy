#!/bin/bash
# OpenClaw Docker 镜像构建脚本
# 用法: ./build.sh [命令] [参数]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 构建基础镜像
build_base() {
    log_info "构建基础镜像 openclaw-base:latest ..."
    docker build -f Dockerfile.base -t openclaw-base:latest .
    log_success "基础镜像构建完成!"
    docker images openclaw-base:latest
}

# 构建版本镜像
build_version() {
    local version="$1"
    if [ -z "$version" ]; then
        log_error "请指定版本号，例如: ./build.sh version 2026.4.1"
        exit 1
    fi

    log_info "构建版本镜像 openclaw:${version}-root ..."

    # 检查基础镜像是否存在
    if ! docker images openclaw-base:latest | grep -q "openclaw-base"; then
        log_warn "基础镜像不存在，先构建基础镜像..."
        build_base
    fi

    docker build \
        --build-arg OPENCLAW_VERSION="$version" \
        -f Dockerfile.version-template \
        -t "openclaw:${version}-root" \
        .

    log_success "版本镜像 openclaw:${version}-root 构建完成!"
    docker images "openclaw:${version}-root"
}

# 构建整合版镜像 (基于已构建的版本镜像 + NIM插件 + 微信插件 + openclaw-easy)
build_integrated() {
    local version="$1"
    if [ -z "$version" ]; then
        version="2026.4.1"
        log_warn "未指定版本，使用默认版本: ${version}"
    fi

    local base_image="openclaw:${version}-root"
    
    # 检查版本镜像是否存在
    if ! docker images "$base_image" | grep -q "openclaw"; then
        log_error "版本镜像 ${base_image} 不存在！请先构建：./build.sh version ${version}"
        exit 1
    fi

    log_info "基于 ${base_image} 构建整合版镜像..."

    docker build \
        --build-arg BASE_VERSION="${version}-root" \
        --build-arg OPENCLAW_VERSION="$version" \
        -f Dockerfile.integrated \
        -t "openclaw:${version}-integrated" \
        -t "openclaw-integrated:latest" \
        .

    log_success "整合版镜像 openclaw:${version}-integrated 构建完成!"
    docker images "openclaw:${version}-integrated"
}

# 构建所有版本
build_all() {
    local versions=("2026.3.13" "2026.3.24" "2026.4.1")

    log_info "构建基础镜像..."
    build_base

    for version in "${versions[@]}"; do
        log_info "构建版本 ${version}..."
        build_version "$version"
    done

    log_success "所有版本构建完成!"
    docker images | grep openclaw
}

# 清理构建缓存
clean() {
    log_info "清理 Docker 构建缓存..."
    docker builder prune -af
    log_success "清理完成!"
}

# 显示帮助
show_help() {
    echo "OpenClaw Docker 镜像构建脚本"
    echo ""
    echo "用法: ./build.sh [命令] [参数]"
    echo ""
    echo "命令:"
    echo "  base                  构建基础镜像 (openclaw-base:latest)"
    echo "  version <版本>        构建指定版本镜像"
    echo "  integrated [版本]     构建整合版镜像 (含 NIM/微信插件 + Easy Web)"
    echo "  all                   构建基础镜像和所有版本"
    echo "  clean                 清理 Docker 构建缓存"
    echo "  help                  显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  ./build.sh base                    # 只构建基础镜像"
    echo "  ./build.sh version 2026.4.1        # 构建 2026.4.1 版本"
    echo "  ./build.sh integrated 2026.3.13    # 构建整合版 (2026.3.13)"
    echo "  ./build.sh integrated              # 构建整合版 (默认 2026.4.1)"
    echo "  ./build.sh all                     # 构建所有版本"
}

# 主入口
case "${1:-help}" in
    base)
        build_base
        ;;
    version)
        build_version "$2"
        ;;
    integrated)
        build_integrated "$2"
        ;;
    all)
        build_all
        ;;
    clean)
        clean
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "未知命令: $1"
        show_help
        exit 1
        ;;
esac