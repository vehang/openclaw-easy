#!/bin/bash
# openclaw-easy 更新脚本
# 独立于 Node.js 进程，可在服务停止后继续执行

APP_DIR="/app/openclaw-easy"
BACKUP_BASE="/tmp/openclaw-easy-backup"
UPDATE_BASE="/tmp/openclaw-easy-update"
MARKER_FILE="/tmp/openclaw-easy-update-marker"
LOG_FILE="/var/log/supervisor/update.log"

# 日志函数
log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo "$msg"
    # 同时写入日志文件
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

# 回滚函数
rollback() {
    local backup_dir="$1"
    
    if [ -z "$backup_dir" ]; then
        # 从标记文件读取备份路径
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
    
    # 恢复文件
    local restore_failed=0
    for item in server.js version.json package.json package-lock.json public; do
        local src="$backup_dir/$item"
        local dest="$APP_DIR/$item"
        
        if [ -e "$src" ]; then
            # 备份当前文件（以防万一）
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
    
    # 重新安装依赖
    log "重新安装依赖..."
    cd "$APP_DIR" || error_exit "无法进入应用目录"
    if command -v npm &> /dev/null; then
        npm install --production --no-audit --no-fund 2>&1 | while read line; do log "npm: $line"; done || true
    fi
    
    # 清理标记文件（回滚完成）
    rm -f "$MARKER_FILE"
    
    # 清理临时文件
    rm -rf "$APP_DIR"/*.broken 2>/dev/null || true
    
    log "========== 回滚完成 =========="
    return 0
}

# 主更新函数
main() {
    local download_url="$1"
    
    # 参数检查
    if [ -z "$download_url" ]; then
        error_exit "下载地址不能为空"
    fi
    
    local timestamp=$(date +%s)
    local backup_dir="$BACKUP_BASE-$timestamp"
    local update_dir="$UPDATE_BASE-$timestamp"
    
    # 导出变量供 cleanup 使用
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
    
    # 写入标记文件（关键！用于失败时回滚）
    echo "$backup_dir" > "$MARKER_FILE"
    log "备份完成: $backup_dir"
    
    # ==================== 步骤3: 下载更新包 ====================
    log "[3/6] 下载更新包..."
    
    # 检查下载工具
    if command -v wget &> /dev/null; then
        wget -q -O "$update_dir/update.tar.gz" "$download_url" || {
            cleanup_update
            error_exit "wget 下载失败"
        }
    elif command -v curl &> /dev/null; then
        curl -sL -o "$update_dir/update.tar.gz" "$download_url" || {
            cleanup_update
            error_exit "curl 下载失败"
        }
    else
        cleanup_update
        error_exit "没有可用的下载工具 (wget/curl)"
    fi
    
    # 检查下载的文件
    if [ ! -f "$update_dir/update.tar.gz" ] || [ ! -s "$update_dir/update.tar.gz" ]; then
        cleanup_update
        error_exit "下载文件为空或不存在"
    fi
    
    local file_size=$(stat -c%s "$update_dir/update.tar.gz" 2>/dev/null || echo "0")
    log "下载完成，文件大小: $(( file_size / 1024 )) KB"
    
    # ==================== 步骤4: 解压更新包 ====================
    log "[4/6] 解压更新包..."
    mkdir -p "$update_dir/extracted"
    
    if ! tar -xzf "$update_dir/update.tar.gz" -C "$update_dir/extracted" 2>&1; then
        cleanup_update
        error_exit "解压失败，文件可能已损坏"
    fi
    
    # 确定源目录（处理 tar 包可能包含一级子目录的情况）
    local source_dir="$update_dir/extracted"
    local items=$(ls -A "$source_dir" 2>/dev/null)
    local item_count=$(echo "$items" | wc -w)
    
    # 如果只有一个子目录且没有其他文件，进入该目录
    if [ "$item_count" -eq 1 ]; then
        local single_item=$(echo "$items")
        if [ -d "$source_dir/$single_item" ]; then
            source_dir="$source_dir/$single_item"
            log "检测到单目录结构: $single_item/"
        fi
    fi
    
    # 验证源目录内容
    if [ ! -f "$source_dir/server.js" ] && [ ! -f "$source_dir/package.json" ]; then
        cleanup_update
        error_exit "更新包内容不完整，缺少 server.js 或 package.json"
    fi
    
    log "解压完成"
    
    # ==================== 步骤5: 更新文件 ====================
    log "[5/6] 更新文件..."
    
    local updated_files=0
    local updated_dirs=0
    
    for item in $(ls -A "$source_dir"); do
        # 跳过 node_modules 和临时文件
        if [ "$item" = "node_modules" ] || [ "$item" = "tmp" ] || [ "$item" = ".git" ]; then
            continue
        fi
        
        local src="$source_dir/$item"
        local dest="$APP_DIR/$item"
        
        if [ -d "$src" ]; then
            # 删除旧的，复制新的
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
    
    # ==================== 步骤6: 更新依赖 ====================
    log "[6/6] 更新依赖..."
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
    
    # 清理旧备份（保留最近5个）
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
    
    # 输出备份路径供调用者使用
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
    clear-marker)
        # 清理标记文件（仅在确认服务正常后手动使用）
        rm -f "$MARKER_FILE"
        log "标记文件已清理"
        ;;
    *)
        echo "用法: $0 {update <下载地址>|rollback [备份目录]|status|clear-marker}"
        exit 1
        ;;
esac
