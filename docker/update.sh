#!/bin/bash
# openclaw-easy 更新脚本
# 独立于 Node.js 进程，可在服务停止后继续执行

set -e

APP_DIR="/app/openclaw-easy"
BACKUP_BASE="/tmp/openclaw-easy-backup"
UPDATE_BASE="/tmp/openclaw-easy-update"
MARKER_FILE="/tmp/openclaw-easy-update-marker"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# 清理函数
cleanup() {
    if [ -d "$UPDATE_BASE" ]; then
        rm -rf "$UPDATE_BASE"
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
    
    if [ -z "$backup_dir" ] || [ ! -d "$backup_dir" ]; then
        log "错误: 没有可用的备份"
        return 1
    fi
    
    log "开始回滚，备份目录: $backup_dir"
    
    # 恢复文件
    for item in server.js version.json package.json package-lock.json public; do
        src="$backup_dir/$item"
        dest="$APP_DIR/$item"
        if [ -e "$src" ]; then
            if [ -d "$src" ]; then
                rm -rf "$dest"
                cp -r "$src" "$dest"
            else
                cp "$src" "$dest"
            fi
            log "已恢复: $item"
        fi
    done
    
    # 重新安装依赖
    cd "$APP_DIR"
    npm install --production --no-audit --no-fund 2>/dev/null || true
    
    # 清理标记文件
    rm -f "$MARKER_FILE"
    
    log "回滚完成"
}

# 主更新函数
main() {
    local download_url="$1"
    local timestamp=$(date +%s)
    local backup_dir="$BACKUP_BASE-$timestamp"
    local update_dir="$UPDATE_BASE-$timestamp"
    
    log "========== 开始更新 =========="
    log "时间戳: $timestamp"
    
    # 创建目录
    mkdir -p "$backup_dir"
    mkdir -p "$update_dir"
    
    # 备份
    log "[1/6] 备份当前版本..."
    for item in server.js version.json package.json package-lock.json public; do
        src="$APP_DIR/$item"
        if [ -e "$src" ]; then
            if [ -d "$src" ]; then
                cp -r "$src" "$backup_dir/"
            else
                cp "$src" "$backup_dir/"
            fi
        fi
    done
    
    # 写入标记文件（用于失败时回滚）
    echo "$backup_dir" > "$MARKER_FILE"
    log "备份完成: $backup_dir"
    
    # 下载
    log "[2/6] 下载更新包..."
    wget -q -O "$update_dir/update.tar.gz" "$download_url" || {
        log "错误: 下载失败"
        cleanup
        rm -f "$MARKER_FILE"
        exit 1
    }
    log "下载完成"
    
    # 解压
    log "[3/6] 解压更新包..."
    mkdir -p "$update_dir/extracted"
    tar -xzf "$update_dir/update.tar.gz" -C "$update_dir/extracted"
    
    # 确定源目录
    source_dir="$update_dir/extracted"
    subdirs=$(ls "$source_dir" 2>/dev/null)
    if [ $(echo "$subdirs" | wc -l) -eq 1 ] && [ -d "$source_dir/$subdirs" ]; then
        source_dir="$source_dir/$subdirs"
    fi
    log "解压完成"
    
    # 更新文件
    log "[4/6] 更新文件..."
    for item in $(ls "$source_dir"); do
        if [ "$item" = "node_modules" ]; then
            continue
        fi
        src="$source_dir/$item"
        dest="$APP_DIR/$item"
        if [ -d "$src" ]; then
            rm -rf "$dest"
            cp -r "$src" "$dest"
        else
            cp "$src" "$dest"
        fi
    done
    log "文件更新完成"
    
    # 更新依赖
    log "[5/6] 更新依赖..."
    cd "$APP_DIR"
    npm install --production --no-audit --no-fund 2>/dev/null || {
        log "警告: npm install 失败"
    }
    log "依赖更新完成"
    
    # 清理更新目录（保留备份）
    log "[6/6] 清理临时文件..."
    rm -rf "$update_dir"
    
    # 清理旧备份（保留最近3个）
    backups=$(ls -dt "$BACKUP_BASE"-* 2>/dev/null | tail -n +4)
    for old_backup in $backups; do
        rm -rf "$old_backup"
    done
    
    log "========== 更新完成 =========="
    log "备份保存在: $backup_dir"
    
    # 清理标记文件
    rm -f "$MARKER_FILE"
    
    echo "$backup_dir"
}

# 检查命令
case "$1" in
    update)
        if [ -z "$2" ]; then
            echo "用法: $0 update <下载地址>"
            exit 1
        fi
        main "$2"
        ;;
    rollback)
        rollback "$2"
        ;;
    status)
        if [ -f "$MARKER_FILE" ]; then
            echo "更新进行中，备份: $(cat $MARKER_FILE)"
        else
            echo "无进行中的更新"
        fi
        ;;
    *)
        echo "用法: $0 {update <下载地址>|rollback [备份目录]|status}"
        exit 1
        ;;
esac
