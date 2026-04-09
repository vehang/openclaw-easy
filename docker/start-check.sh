#!/bin/bash
# openclaw-easy 启动检查脚本
# 在服务启动时检查是否有失败的更新需要回滚

APP_DIR="/app/openclaw-easy"
MARKER_FILE="/tmp/openclaw-easy-update-marker"
VERSION_FILE="$APP_DIR/version.json"
ROLLBACK_SCRIPT="/app/openclaw-easy/docker/update.sh"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [启动检查] $1"
}

# 检查是否有未完成的更新
if [ -f "$MARKER_FILE" ]; then
    log "检测到未完成的更新..."
    
    backup_dir=$(cat "$MARKER_FILE")
    
    if [ -d "$backup_dir" ]; then
        log "发现备份目录: $backup_dir"
        log "可能是上次更新失败，尝试回滚..."
        
        # 执行回滚
        if [ -x "$ROLLBACK_SCRIPT" ]; then
            "$ROLLBACK_SCRIPT" rollback "$backup_dir"
            log "回滚完成"
        else
            log "错误: 回滚脚本不存在或不可执行"
        fi
    else
        log "备份目录不存在，清理标记文件"
        rm -f "$MARKER_FILE"
    fi
fi

# 检查版本文件
if [ -f "$VERSION_FILE" ]; then
    version_name=$(grep -o '"versionName"[[:space:]]*:[[:space:]]*"[^"]*"' "$VERSION_FILE" | head -1 | cut -d'"' -f4)
    log "当前版本: $version_name"
fi

log "启动检查完成，准备启动服务..."

# 启动服务
exec node "$APP_DIR/server.js"
