#!/bin/bash
# openclaw-easy 更新脚本
# 独立于 Node.js 进程，可在服务停止后继续执行
# 支持多种压缩格式: tar.gz, tar.bz2, tar.xz, zip, gz, 7z
# 使用排除法更新，保留 node_modules 和用户数据
# 不依赖 rsync，使用纯 shell 命令

APP_DIR="/app/openclaw-easy"
BACKUP_BASE="/tmp/openclaw-easy-backup"
UPDATE_BASE="/tmp/openclaw-easy-update"
MARKER_FILE="/tmp/openclaw-easy-update-marker"
LOG_FILE="/var/log/supervisor/update.log"

# 排除列表（不更新、不删除）
EXCLUDE_PATTERNS=(
    "node_modules"           # 依赖目录，保留并增量更新
    "tmp"                    # 临时文件
    ".git"                   # Git 目录
    ".env"                   # 本地环境配置
    ".env.local"             # 本地环境配置
    ".passwd"                 # 密码文件
    ".simple-config.json"    # 配置缓存
    ".weixin-bound"          # 微信绑定状态
    ".weixin-qr-state.json"  # 微信登录状态
    "*.backup"               # 备份文件
    "*.bak"                  # 备份文件
    "*.log"                  # 日志文件
)

# 支持的压缩格式配置
ARCHIVE_FORMATS=(
    "tar.gz|gzip tar|tar -xzf|Gzip 压缩的 TAR 归档"
    "tgz|gzip tar|tar -xzf|Gzip 压缩的 TAR 归档"
    "tar.bz2|bzip2 tar|tar -xjf|Bzip2 压缩的 TAR 归档"
    "tar.xz|xz tar|tar -xJf|XZ 压缩的 TAR 归档"
    "zip|unzip|unzip -q|ZIP 归档"
    "gz|gzip|gunzip -c|Gzip 单文件压缩"
    "7z|7z|7z x -y|7-Zip 归档"
)

# 日志函数
log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo "$msg"
    echo "$msg" >> "$LOG_FILE" 2>/dev/null || true
}

# 错误处理
error_exit() {
    log "错误: $1"
    log "更新失败，保留备份和标记文件以便回滚"
    exit 1
}

# 清理更新目录（不清理备份）
cleanup_update() {
    if [ -n "$UPDATE_DIR" ] && [ -d "$UPDATE_DIR" ]; then
        rm -rf "$UPDATE_DIR"
    fi
}

# 检查是否在排除列表
should_exclude() {
    local item="$1"
    
    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
        # 通配符匹配
        if [[ "$pattern" == "*"* ]]; then
            local suffix="${pattern#\*}"
            if [[ "$item" == *"$suffix" ]]; then
                return 0
            fi
        elif [[ "$pattern" == *"*" ]]; then
            local prefix="${pattern%\*}"
            if [[ "$item" == "$prefix"* ]]; then
                return 0
            fi
        # 精确匹配
        elif [[ "$item" == "$pattern" ]]; then
            return 0
        fi
    done
    
    return 1
}

# 使用排除法复制目录（不依赖 rsync）
copy_with_exclude() {
    local source_dir="$1"
    local dest_dir="$2"
    local action="$3"  # "backup" or "update"
    
    log "复制文件（排除: node_modules, tmp, .git 等）..."
    
    local copied_files=0
    local copied_dirs=0
    local skipped_items=0
    
    # 遍历源目录
    for item in $(ls -A "$source_dir"); do
        # 检查是否排除
        if should_exclude "$item"; then
            log "跳过排除项: $item"
            skipped_items=$(( skipped_items + 1 ))
            continue
        fi
        
        local src="$source_dir/$item"
        local dest="$dest_dir/$item"
        
        if [ -d "$src" ]; then
            # 目录：删除目标（如果存在），然后复制
            if [ -e "$dest" ]; then
                rm -rf "$dest"
            fi
            if cp -r "$src" "$dest" 2>/dev/null; then
                copied_dirs=$(( copied_dirs + 1 ))
                log "复制目录: $item"
            else
                log "警告: 复制目录 $item 失败"
            fi
        else
            # 文件：直接复制
            if cp "$src" "$dest" 2>/dev/null; then
                copied_files=$(( copied_files + 1 ))
            else
                log "警告: 复制文件 $item 失败"
            fi
        fi
    done
    
    log "复制完成: $copied_files 个文件, $copied_dirs 个目录, $skipped_items 项已跳过"
}

# 检测压缩格式
detect_archive_format() {
    local file="$1"
    
    if [ ! -f "$file" ]; then
        return 1
    fi
    
    local filename=$(basename "$file")
    local ext=""
    
    if [[ "$filename" =~ \.tar\.(gz|bz2|xz)$ ]]; then
        ext="tar.${BASH_REMATCH[1]}"
    elif [[ "$filename" =~ \.([a-z0-9]+)$ ]]; then
        ext="${BASH_REMATCH[1]}"
    fi
    
    local file_type=""
    if command -v file &> /dev/null; then
        file_type=$(file -b "$file" 2>/dev/null)
        case "$file_type" in
            *"gzip compressed"*)
                if [[ "$filename" == *.tar.gz || "$filename" == *.tgz ]]; then
                    ext="tar.gz"
                else
                    ext="gz"
                fi
                ;;
            *"bzip2 compressed"*) ext="tar.bz2" ;;
            *"XZ compressed"*) ext="tar.xz" ;;
            *"Zip archive"*) ext="zip" ;;
            *"7-zip archive"*) ext="7z" ;;
        esac
    fi
    
    for format in "${ARCHIVE_FORMATS[@]}"; do
        IFS='|' read -r fmt_ext fmt_tools fmt_cmd fmt_desc <<< "$format"
        if [ "$ext" = "$fmt_ext" ]; then
            echo "$format"
            return 0
        fi
    done
    
    return 1
}

# 检测解压工具是否可用
check_extract_tools() {
    local tools="$1"
    local missing=()
    
    for tool in $tools; do
        if ! command -v "$tool" &> /dev/null; then
            missing+=("$tool")
        fi
    done
    
    if [ ${#missing[@]} -gt 0 ]; then
        log "缺少解压工具: ${missing[*]}"
        return 1
    fi
    
    return 0
}

# 解压文件
extract_archive() {
    local file="$1"
    local dest_dir="$2"
    
    local format_info=$(detect_archive_format "$file")
    
    if [ -z "$format_info" ]; then
        log "错误: 无法识别压缩格式"
        return 1
    fi
    
    IFS='|' read -r fmt_ext fmt_tools fmt_cmd fmt_desc <<< "$format_info"
    
    log "检测到压缩格式: .$fmt_ext ($fmt_desc)"
    
    if ! check_extract_tools "$fmt_tools"; then
        log "错误: 缺少解压工具，请安装: $fmt_tools"
        return 1
    fi
    
    log "解压工具: $fmt_tools"
    log "解压命令: $fmt_cmd"
    
    mkdir -p "$dest_dir"
    
    local extract_result=0
    
    case "$fmt_ext" in
        tar.gz|tgz|tar.bz2|tar.xz)
            if $fmt_cmd "$file" -C "$dest_dir" 2>&1; then
                extract_result=0
            else
                extract_result=1
            fi
            ;;
        zip)
            if unzip -q "$file" -d "$dest_dir" 2>&1; then
                extract_result=0
            else
                extract_result=1
            fi
            ;;
        gz)
            local output_file="$dest_dir/$(basename "$file" .gz)"
            if gunzip -c "$file" > "$output_file" 2>&1; then
                extract_result=0
            else
                extract_result=1
            fi
            ;;
        7z)
            if 7z x -y "$file" -o"$dest_dir" 2>&1; then
                extract_result=0
            else
                extract_result=1
            fi
            ;;
        *)
            log "错误: 未实现的解压格式: $fmt_ext"
            return 1
            ;;
    esac
    
    if [ $extract_result -eq 0 ]; then
        log "解压成功"
        return 0
    else
        log "错误: 解压失败，文件可能已损坏"
        return 1
    fi
}

# 从 URL 提取文件名
get_filename_from_url() {
    local url="$1"
    local filename=$(basename "$url" | cut -d'?' -f1)
    
    if [ -z "$filename" ] || [[ "$filename" == *"="* ]]; then
        filename="update.tar.gz"
    fi
    
    echo "$filename"
}

# 增量依赖更新
update_dependencies() {
    local backup_dir="$1"
    
    cd "$APP_DIR" || error_exit "无法进入应用目录"
    
    # 检查 package.json 是否变化
    local old_package="$backup_dir/package.json.bak"
    local new_package="$APP_DIR/package.json"
    
    if [ -f "$old_package" ] && [ -f "$new_package" ]; then
        if cmp -s "$old_package" "$new_package"; then
            log "package.json 未变化，跳过 npm install（节省时间）"
            return 0
        fi
    fi
    
    log "package.json 已变化，执行增量 npm install..."
    
    if command -v npm &> /dev/null; then
        # 增量安装，不删除现有 node_modules
        npm install --production --no-audit --no-fund 2>&1 | while read line; do
            log "npm: $line"
        done || log "警告: npm install 失败"
        log "依赖更新完成"
    else
        log "警告: npm 命令不存在"
    fi
}

# 回滚函数
rollback() {
    local backup_dir="$1"
    
    if [ -z "$backup_dir" ]; then
        if [ -f "$MARKER_FILE" ]; then
            backup_dir=$(cat "$MARKER_FILE")
        fi
    fi
    
    if [ -z "$backup_dir" ]; then
        log "错误: 没有指定备份目录且标记文件不存在"
        return 1
    fi
    
    if [ ! -d "$backup_dir" ]; then
        log "错误: 备份目录不存在: $backup_dir"
        rm -f "$MARKER_FILE"
        return 1
    fi
    
    log "========== 开始回滚 =========="
    log "备份目录: $backup_dir"
    
    copy_with_exclude "$backup_dir" "$APP_DIR" "rollback"
    
    # 重新安装依赖
    update_dependencies "$backup_dir"
    
    rm -f "$MARKER_FILE"
    
    log "========== 回滚完成 =========="
    return 0
}

# 主更新函数
main() {
    local download_url="$1"
    
    if [ -z "$download_url" ]; then
        error_exit "下载地址不能为空"
    fi
    
    local timestamp=$(date +%s)
    local backup_dir="$BACKUP_BASE-$timestamp"
    local update_dir="$UPDATE_BASE-$timestamp"
    
    UPDATE_DIR="$update_dir"
    export UPDATE_DIR
    
    log "========== 开始更新 =========="
    log "时间戳: $timestamp"
    log "下载地址: $download_url"
    
    # ==================== 步骤1: 创建目录 ====================
    log "[1/6] 创建临时目录..."
    mkdir -p "$backup_dir" || error_exit "创建备份目录失败"
    mkdir -p "$update_dir" || error_exit "创建更新目录失败"
    
    # ==================== 步骤2: 备份当前版本 ====================
    log "[2/6] 备份当前版本..."
    
    # 保存 package.json 用于后续比较
    if [ -f "$APP_DIR/package.json" ]; then
        cp "$APP_DIR/package.json" "$backup_dir/package.json.bak"
    fi
    
    copy_with_exclude "$APP_DIR" "$backup_dir" "backup"
    
    echo "$backup_dir" > "$MARKER_FILE"
    
    # ==================== 步骤3: 下载更新包 ====================
    log "[3/6] 下载更新包..."
    
    local archive_file=$(get_filename_from_url "$download_url")
    local archive_path="$update_dir/$archive_file"
    
    log "保存为: $archive_file"
    
    if command -v wget &> /dev/null; then
        wget -q -O "$archive_path" "$download_url" || {
            cleanup_update
            error_exit "wget 下载失败"
        }
    elif command -v curl &> /dev/null; then
        curl -sL -o "$archive_path" "$download_url" || {
            cleanup_update
            error_exit "curl 下载失败"
        }
    else
        cleanup_update
        error_exit "没有可用的下载工具 (wget/curl)"
    fi
    
    if [ ! -f "$archive_path" ] || [ ! -s "$archive_path" ]; then
        cleanup_update
        error_exit "下载文件为空或不存在"
    fi
    
    local file_size=$(stat -c%s "$archive_path" 2>/dev/null || echo "0")
    log "下载完成，文件大小: $(( file_size / 1024 )) KB"
    
    # ==================== 步骤4: 解压更新包 ====================
    log "[4/6] 解压更新包..."
    
    if ! extract_archive "$archive_path" "$update_dir/extracted"; then
        cleanup_update
        error_exit "解压失败"
    fi
    
    # 确定源目录
    local source_dir="$update_dir/extracted"
    local items=$(ls -A "$source_dir" 2>/dev/null)
    local item_count=$(echo "$items" | wc -w)
    
    if [ "$item_count" -eq 1 ]; then
        local single_item=$(echo "$items")
        if [ -d "$source_dir/$single_item" ]; then
            source_dir="$source_dir/$single_item"
            log "检测到单目录结构: $single_item/"
        fi
    fi
    
    # ==================== 步骤5: 更新文件 ====================
    log "[5/6] 更新文件..."
    copy_with_exclude "$source_dir" "$APP_DIR" "update"
    
    # ==================== 步骤6: 增量依赖更新 ====================
    log "[6/6] 增量依赖更新..."
    update_dependencies "$backup_dir"
    
    # ==================== 清理临时文件 ====================
    log "清理更新目录..."
    rm -rf "$update_dir"
    
    # 清理旧备份（保留最近5个）
    local backup_count=$(ls -d "$BACKUP_BASE"-* 2>/dev/null | wc -l)
    if [ "$backup_count" -gt 5 ]; then
        ls -dt "$BACKUP_BASE"-* 2>/null | tail -n +6 | while read old; do
            rm -rf "$old"
            log "清理旧备份: $old"
        done
    fi
    
    log "========== 更新完成 =========="
    log "备份保存在: $backup_dir"
    log "注意: node_modules 已保留，package.json 未变化时跳过了 npm install"

    # 更新成功，清理标记文件（防止下次启动时误判为更新失败而触发回滚）
    rm -f "$MARKER_FILE"
    rm -f "$ROLLBACK_COUNT_FILE"
    log "已清理更新标记文件"

    echo "$backup_dir"
}

# 检查命令
case "$1" in
    update)
        main "$2"
        ;;
    rollback)
        rollback "$2"
        ;;
    status)
        if [ -f "$MARKER_FILE" ]; then
            local backup=$(cat "$MARKER_FILE")
            echo "更新进行中"
            echo "备份目录: $backup"
            if [ -d "$backup" ]; then
                echo "备份状态: 有效"
            else
                echo "备份状态: 不存在"
            fi
        else
            echo "无进行中的更新"
        fi
        ;;
    formats)
        for format in "${ARCHIVE_FORMATS[@]}"; do
            IFS='|' read -r fmt_ext fmt_tools fmt_cmd fmt_desc <<< "$format"
            local status="✓"
            for tool in $fmt_tools; do
                if ! command -v "$tool" &> /dev/null; then
                    status="✗ 缺少: $tool"
                fi
            done
            printf "  %-12s %-30s %s\n" ".$fmt_ext" "$fmt_desc" "$status"
        done
        ;;
    excludes)
        echo "排除列表（不更新、不删除）:"
        for pattern in "${EXCLUDE_PATTERNS[@]}"; do
            echo "  - $pattern"
        done
        ;;
    clear-marker)
        rm -f "$MARKER_FILE"
        log "标记文件已清理"
        ;;
    *)
        echo "用法: $0 {update <下载地址>|rollback [备份目录]|status|formats|excludes|clear-marker}"
        echo ""
        echo "命令说明:"
        echo "  update <URL>    - 下载并安装更新（保留 node_modules）"
        echo "  rollback [目录] - 回滚到备份版本"
        echo "  status          - 查看更新状态"
        echo "  formats         - 显示支持的压缩格式"
        echo "  excludes        - 显示排除列表"
        echo "  clear-marker    - 清理更新标记文件"
        exit 1
        ;;
esac
