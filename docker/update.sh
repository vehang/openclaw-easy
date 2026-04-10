#!/bin/bash
# openclaw-easy 更新脚本
# 独立于 Node.js 进程，可在服务停止后继续执行
# 支持多种压缩格式: tar.gz, tar.bz2, tar.xz, zip, gz, 7z

APP_DIR="/app/openclaw-easy"
BACKUP_BASE="/tmp/openclaw-easy-backup"
UPDATE_BASE="/tmp/openclaw-easy-update"
MARKER_FILE="/tmp/openclaw-easy-update-marker"
LOG_FILE="/var/log/supervisor/update.log"

# 支持的压缩格式配置
# 格式: "扩展名|检测工具|解压命令|格式描述"
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

# 检测压缩格式
# 参数: $1 = 文件路径
# 返回: 格式信息 (扩展名|检测工具|解压命令|格式描述) 或空
detect_archive_format() {
    local file="$1"
    
    if [ ! -f "$file" ]; then
        return 1
    fi
    
    # 方法1: 根据文件扩展名检测
    local filename=$(basename "$file")
    local ext=""
    
    # 检测复合扩展名 (tar.gz, tar.bz2, tar.xz)
    if [[ "$filename" =~ \.tar\.(gz|bz2|xz)$ ]]; then
        ext="tar.${BASH_REMATCH[1]}"
    elif [[ "$filename" =~ \.([a-z0-9]+)$ ]]; then
        ext="${BASH_REMATCH[1]}"
    fi
    
    # 方法2: 使用 file 命令检测文件类型 (更可靠)
    local file_type=""
    if command -v file &> /dev/null; then
        file_type=$(file -b "$file" 2>/dev/null)
        
        # 根据文件类型映射扩展名
        case "$file_type" in
            *"gzip compressed"*)
                if [[ "$filename" == *.tar.gz || "$filename" == *.tgz ]]; then
                    ext="tar.gz"
                else
                    ext="gz"
                fi
                ;;
            *"bzip2 compressed"*)
                ext="tar.bz2"
                ;;
            *"XZ compressed"*)
                ext="tar.xz"
                ;;
            *"Zip archive"*)
                ext="zip"
                ;;
            *"7-zip archive"*)
                ext="7z"
                ;;
        esac
    fi
    
    # 查找匹配的格式配置
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
# 参数: $1 = 工具列表 (空格分隔)
# 返回: 0=可用, 1=不可用
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

# 显示所有支持的格式和工具状态
show_format_status() {
    log "========== 支持的压缩格式 =========="
    
    for format in "${ARCHIVE_FORMATS[@]}"; do
        IFS='|' read -r fmt_ext fmt_tools fmt_cmd fmt_desc <<< "$format"
        
        local status="✓ 可用"
        local missing=()
        
        for tool in $fmt_tools; do
            if ! command -v "$tool" &> /dev/null; then
                missing+=("$tool")
            fi
        done
        
        if [ ${#missing[@]} -gt 0 ]; then
            status="✗ 缺少工具: ${missing[*]}"
        fi
        
        printf "  %-12s %-30s %s\n" ".$fmt_ext" "$fmt_desc" "$status"
    done
    
    log "====================================="
}

# 解压文件
# 参数: $1 = 文件路径, $2 = 目标目录
# 返回: 0=成功, 1=失败
extract_archive() {
    local file="$1"
    local dest_dir="$2"
    
    # 检测格式
    local format_info=$(detect_archive_format "$file")
    
    if [ -z "$format_info" ]; then
        log "错误: 无法识别压缩格式"
        log "支持的格式: tar.gz, tgz, tar.bz2, tar.xz, zip, gz, 7z"
        
        # 显示工具状态帮助调试
        show_format_status
        
        return 1
    fi
    
    IFS='|' read -r fmt_ext fmt_tools fmt_cmd fmt_desc <<< "$format_info"
    
    log "检测到压缩格式: .$fmt_ext ($fmt_desc)"
    
    # 检测工具是否可用
    if ! check_extract_tools "$fmt_tools"; then
        log "错误: 缺少解压工具，请安装: $fmt_tools"
        return 1
    fi
    
    log "解压工具: $fmt_tools"
    log "解压命令: $fmt_cmd"
    
    # 执行解压
    mkdir -p "$dest_dir"
    
    local extract_result=0
    
    case "$fmt_ext" in
        tar.gz|tgz|tar.bz2|tar.xz)
            # TAR 格式直接解压到目标目录
            if $fmt_cmd "$file" -C "$dest_dir" 2>&1; then
                extract_result=0
            else
                extract_result=1
            fi
            ;;
        zip)
            # unzip 需要指定 -d 参数
            if unzip -q "$file" -d "$dest_dir" 2>&1; then
                extract_result=0
            else
                extract_result=1
            fi
            ;;
        gz)
            # gunzip 解压单文件，需要重定向输出
            local output_file="$dest_dir/$(basename "$file" .gz)"
            if gunzip -c "$file" > "$output_file" 2>&1; then
                extract_result=0
            else
                extract_result=1
            fi
            ;;
        7z)
            # 7z 解压
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
    
    # 如果无法提取，使用默认名称
    if [ -z "$filename" ] || [[ "$filename" == *"="* ]]; then
        filename="update.tar.gz"
    fi
    
    echo "$filename"
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
    
    local restore_failed=0
    for item in server.js version.json package.json package-lock.json public; do
        local src="$backup_dir/$item"
        local dest="$APP_DIR/$item"
        
        if [ -e "$src" ]; then
            if [ -e "$dest" ]; then
                mv "$dest" "$dest.broken" 2>/dev/null || true
            fi
            
            if [ -d "$src" ]; then
                if cp -r "$src" "$dest" 2>/dev/null; then
                    log "已恢复: $item/"
                else
                    log "警告: 恢复 $item 失败"
                    restore_failed=1
                fi
            else
                if cp "$src" "$dest" 2>/dev/null; then
                    log "已恢复: $item"
                else
                    log "警告: 恢复 $item 失败"
                    restore_failed=1
                fi
            fi
        fi
    done
    
    if [ $restore_failed -eq 1 ]; then
        log "警告: 部分文件恢复失败"
    fi
    
    log "重新安装依赖..."
    cd "$APP_DIR" || error_exit "无法进入应用目录"
    if command -v npm &> /dev/null; then
        npm install --production --no-audit --no-fund 2>&1 | while read line; do log "npm: $line"; done || true
    fi
    
    rm -f "$MARKER_FILE"
    rm -rf "$APP_DIR"/*.broken 2>/dev/null || true
    
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
    log "[1/7] 创建临时目录..."
    mkdir -p "$backup_dir" || error_exit "创建备份目录失败"
    mkdir -p "$update_dir" || error_exit "创建更新目录失败"
    
    # ==================== 步骤2: 备份当前版本 ====================
    log "[2/7] 备份当前版本..."
    for item in server.js version.json package.json package-lock.json public; do
        local src="$APP_DIR/$item"
        if [ -e "$src" ]; then
            if [ -d "$src" ]; then
                cp -r "$src" "$backup_dir/" || error_exit "备份 $item 失败"
            else
                cp "$src" "$backup_dir/" || error_exit "备份 $item 失败"
            fi
        fi
    done
    
    echo "$backup_dir" > "$MARKER_FILE"
    log "备份完成: $backup_dir"
    
    # ==================== 步骤3: 下载更新包 ====================
    log "[3/7] 下载更新包..."
    
    # 从 URL 提取文件名
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
    
    # ==================== 步骤4: 检测压缩格式和工具 ====================
    log "[4/7] 检测压缩格式..."
    
    local format_info=$(detect_archive_format "$archive_path")
    
    if [ -z "$format_info" ]; then
        cleanup_update
        error_exit "无法识别压缩格式，支持的格式: tar.gz, tar.bz2, tar.xz, zip, gz, 7z"
    fi
    
    IFS='|' read -r fmt_ext fmt_tools fmt_cmd fmt_desc <<< "$format_info"
    log "检测到格式: .$fmt_ext ($fmt_desc)"
    
    # 检测工具是否可用
    if ! check_extract_tools "$fmt_tools"; then
        cleanup_update
        error_exit "缺少解压工具，请安装: $fmt_tools"
    fi
    
    log "解压工具已就绪: $fmt_tools"
    
    # ==================== 步骤5: 解压更新包 ====================
    log "[5/7] 解压更新包..."
    
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
    
    if [ ! -f "$source_dir/server.js" ] && [ ! -f "$source_dir/package.json" ]; then
        cleanup_update
        error_exit "更新包内容不完整，缺少 server.js 或 package.json"
    fi
    
    # ==================== 步骤6: 更新文件 ====================
    log "[6/7] 更新文件..."
    
    local updated_files=0
    local updated_dirs=0
    
    for item in $(ls -A "$source_dir"); do
        if [ "$item" = "node_modules" ] || [ "$item" = "tmp" ] || [ "$item" = ".git" ]; then
            continue
        fi
        
        local src="$source_dir/$item"
        local dest="$APP_DIR/$item"
        
        if [ -d "$src" ]; then
            rm -rf "$dest"
            if cp -r "$src" "$dest"; then
                updated_dirs=$(( updated_dirs + 1 ))
            else
                log "警告: 复制目录 $item 失败"
            fi
        else
            if cp "$src" "$dest"; then
                updated_files=$(( updated_files + 1 ))
            else
                log "警告: 复制文件 $item 失败"
            fi
        fi
    done
    
    log "文件更新完成: $updated_files 个文件, $updated_dirs 个目录"
    
    # ==================== 步骤7: 更新依赖 ====================
    log "[7/7] 更新依赖..."
    cd "$APP_DIR" || error_exit "无法进入应用目录"
    
    if command -v npm &> /dev/null; then
        if npm install --production --no-audit --no-fund 2>&1 | while read line; do log "npm: $line"; done; then
            log "依赖更新完成"
        else
            log "警告: npm install 失败，服务可能无法正常启动"
        fi
    else
        log "警告: npm 命令不存在"
    fi
    
    # ==================== 清理临时文件 ====================
    log "清理更新目录..."
    rm -rf "$update_dir"
    
    local backup_count=$(ls -d "$BACKUP_BASE"-* 2>/dev/null | wc -l)
    if [ "$backup_count" -gt 5 ]; then
        ls -dt "$BACKUP_BASE"-* 2>/dev/null | tail -n +6 | while read old; do
            rm -rf "$old"
            log "清理旧备份: $old"
        done
    fi
    
    log "========== 更新文件完成 =========="
    log "备份保存在: $backup_dir"
    log "注意: 标记文件保留，重启成功后将自动删除"
    
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
        # 显示支持的格式和工具状态
        show_format_status
        ;;
    clear-marker)
        rm -f "$MARKER_FILE"
        log "标记文件已清理"
        ;;
    *)
        echo "用法: $0 {update <下载地址>|rollback [备份目录]|status|formats|clear-marker}"
        echo ""
        echo "命令说明:"
        echo "  update <URL>    - 下载并安装更新"
        echo "  rollback [目录] - 回滚到备份版本"
        echo "  status          - 查看更新状态"
        echo "  formats         - 显示支持的压缩格式和工具状态"
        echo "  clear-marker    - 清理更新标记文件"
        exit 1
        ;;
esac
