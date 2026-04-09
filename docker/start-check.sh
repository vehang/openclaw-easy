#!/bin/bash
# openclaw-easy 启动检查脚本
# 在服务启动时检查是否有失败的更新需要回滚

APP_DIR="/app/openclaw-easy"
MARKER_FILE="/tmp/openclaw-easy-update-marker"
VERSION_FILE="$APP_DIR/version.json"
ROLLBACK_SCRIPT="/app/openclaw-easy/docker/update.sh"
STARTUP_LOG="/var/log/supervisor/startup.log"
ROLLBACK_COUNT_FILE="/tmp/openclaw-easy-rollback-count"

# 日志函数
log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [启动检查] $1"
    echo "$msg"
    echo "$msg" >> "$STARTUP_LOG" 2>/dev/null || true
}

# 检查是否有未完成的更新
check_failed_update() {
    if [ ! -f "$MARKER_FILE" ]; then
        return 0
    fi
    
    log "检测到未完成的更新..."
    
    local backup_dir=$(cat "$MARKER_FILE" 2>/dev/null)
    
    if [ -z "$backup_dir" ]; then
        log "标记文件为空，清理"
        rm -f "$MARKER_FILE"
        return 0
    fi
    
    if [ ! -d "$backup_dir" ]; then
        log "备份目录不存在: $backup_dir，清理标记"
        rm -f "$MARKER_FILE"
        return 0
    fi
    
    # 检查回滚次数，防止无限循环
    local rollback_count=0
    if [ -f "$ROLLBACK_COUNT_FILE" ]; then
        rollback_count=$(cat "$ROLLBACK_COUNT_FILE")
    fi
    
    if [ "$rollback_count" -ge 3 ]; then
        log "错误: 回滚次数已达上限 ($rollback_count 次)"
        log "请手动检查问题并清理标记文件"
        log "标记文件: $MARKER_FILE"
        log "备份目录: $backup_dir"
        # 删除标记文件，避免继续尝试
        rm -f "$MARKER_FILE"
        rm -f "$ROLLBACK_COUNT_FILE"
        return 0
    fi
    
    # 增加回滚计数
    rollback_count=$(( rollback_count + 1 ))
    echo "$rollback_count" > "$ROLLBACK_COUNT_FILE"
    
    log "可能是上次更新失败 (第 $rollback_count 次回滚)，尝试回滚..."
    log "备份目录: $backup_dir"
    
    # 执行回滚
    if [ -x "$ROLLBACK_SCRIPT" ]; then
        if "$ROLLBACK_SCRIPT" rollback "$backup_dir"; then
            log "回滚成功"
        else
            log "错误: 回滚脚本执行失败"
        fi
    else
        log "错误: 回滚脚本不存在或不可执行: $ROLLBACK_SCRIPT"
    fi
    
    return 0
}

# 后台监控进程，启动成功后删除标记文件
monitor_startup() {
    local pid=$1
    
    # 等待 10 秒，检查服务是否还在运行
    sleep 10
    
    if kill -0 "$pid" 2>/dev/null; then
        # 服务还在运行，认为启动成功
        if [ -f "$MARKER_FILE" ]; then
            log "服务启动成功，清理标记文件"
            rm -f "$MARKER_FILE"
            rm -f "$ROLLBACK_COUNT_FILE"
        fi
    fi
}

# 主流程
log "========== 启动检查开始 =========="

# 1. 检查失败的更新
check_failed_update

# 2. 显示版本信息
if [ -f "$VERSION_FILE" ]; then
    if command -v grep &> /dev/null; then
        version_name=$(grep -o '"versionName"[[:space:]]*:[[:space:]]*"[^"]*"' "$VERSION_FILE" 2>/dev/null | head -1 | cut -d'"' -f4)
        if [ -n "$version_name" ]; then
            log "当前版本: $version_name"
        fi
    fi
fi

log "启动检查完成，准备启动服务..."

# 3. 启动服务
log "启动 Node.js 服务..."

# 启动服务并获取 PID
node "$APP_DIR/server.js" &
NODE_PID=$!

# 启动后台监控
monitor_startup $NODE_PID &

# 等待 Node.js 进程
wait $NODE_PID
