#!/bin/bash
# OpenClaw Docker 镜像构建脚本
# 支持多平台构建：x86 和 arm64
# 用法: ./build.sh [命令] [参数]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

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

# 检测当前平台
detect_arch() {
    if [ "$(uname -m)" = "aarch64" ] || [ "$(uname -m)" = "arm64" ]; then
        echo "arm64"
    else
        echo "x86"
    fi
}

# 构建基础镜像
build_base() {
    local arch="${1:-$(detect_arch)}"
    local dockerfile="docker/Dockerfile.base"
    
    if [ "$arch" = "arm64" ]; then
        dockerfile="docker/Dockerfile.base-arm64"
    fi
    
    log_info "构建 ${arch} 基础镜像..."
    docker build -f "$dockerfile" -t "openclaw-base:${arch}" -t "openclaw-base:latest" .
    log_success "基础镜像构建完成! (openclaw-base:${arch})"
    docker images "openclaw-base"
}

# 构建版本镜像
build_version() {
    local version="$1"
    local arch="${2:-$(detect_arch)}"
    
    if [ -z "$version" ]; then
        log_error "请指定版本号，例如: ./build.sh version 2026.4.1 [x86|arm64]"
        exit 1
    fi

    log_info "构建 ${arch} 版本镜像 openclaw:${version}-root-${arch} ..."

    # 检查基础镜像是否存在
    if ! docker images "openclaw-base:${arch}" | grep -q "openclaw-base"; then
        log_warn "${arch} 基础镜像不存在，先构建..."
        build_base "$arch"
    fi

    docker build \
        --build-arg OPENCLAW_VERSION="$version" \
        -f docker/Dockerfile.version-template \
        -t "openclaw:${version}-root-${arch}" \
        -t "openclaw:${version}-root" \
        .

    log_success "版本镜像构建完成! (openclaw:${version}-root-${arch})"
    docker images "openclaw" | grep "${version}-root"
}

# 构建整合版镜像
build_integrated() {
    local version="$1"
    local arch="${2:-$(detect_arch)}"
    if [ -z "$version" ]; then
        version="2026.4.1"
        log_warn "未指定版本，使用默认版本: ${version}"
    fi

    local base_image="openclaw:${version}-root-${arch}"
    
    # 检查版本镜像是否存在
    if ! docker images "$base_image" | grep -q "openclaw"; then
        log_warn "版本镜像 ${base_image} 不存在，先构建..."
        build_version "$version" "$arch"
    fi

    log_info "基于 ${base_image} 构建 ${arch} 整合版镜像..."

    docker build \
        --build-arg BASE_VERSION="${version}-root-${arch}" \
        --build-arg OPENCLAW_VERSION="$version" \
        -f docker/Dockerfile.integrated \
        -t "openclaw:${version}-integrated-${arch}" \
        -t "openclaw-integrated:${arch}-latest" \
        -t "openclaw-integrated:latest" \
        .

    log_success "整合版镜像构建完成! (openclaw:${version}-integrated-${arch})"
    docker images "openclaw" | grep "integrated"
}

# 构建所有版本
build_all() {
    local arch="${1:-$(detect_arch)}"
    local versions=("2026.3.13" "2026.4.1")

    log_info "构建 ${arch} 平台所有版本..."

    for version in "${versions[@]}"; do
        log_info "构建版本 ${version}..."
        build_version "$version" "$arch"
        build_integrated "$version" "$arch"
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
    echo "OpenClaw Docker 镜像构建脚本 (支持多平台)"
    echo ""
    echo "用法: ./build.sh [命令] [参数] [平台]"
    echo ""
    echo "命令:"
    echo "  base [x86|arm64]                   构建基础镜像"
    echo "                                     默认: 当前平台"
    echo "                                     输出: openclaw-base:<平台>"
    echo ""
    echo "  version <版本> [x86|arm64]         构建版本镜像"
    echo "                                     输出: openclaw:<版本>-root-<平台>"
    echo ""
    echo "  integrated <版本> [x86|arm64]          构建整合版镜像"
    echo "                                     输出: openclaw:<版本>-integrated-<平台>"
    echo "                                     NIM插件在启动时通过 openclaw plugins install 安装"
    echo ""
    echo "  all [x86|arm64]                    构建所有版本"
    echo ""
    echo "  clean                              清理构建缓存"
    echo ""
    echo "示例:"
    echo "  # x86 平台 (默认)"
    echo "  ./build.sh base                    # 构建基础镜像"
    echo "  ./build.sh version 2026.4.1        # 构建版本镜像"
    echo "  ./build.sh integrated 2026.3.13    # 构建整合版(默认插件)"
    echo ""
    echo "  # ARM64 平台"
    echo "  ./build.sh base arm64"
    echo "  ./build.sh version 2026.4.1 arm64"
    echo "  ./build.sh integrated 2026.3.13 arm64"
}

# 主入口
case "${1:-help}" in
    base)
        build_base "$2"
        ;;
    version)
        build_version "$2" "$3"
        ;;
    integrated)
        build_integrated "$2" "$3"
        ;;
    all)
        build_all "$2"
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
