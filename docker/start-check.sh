#!/bin/bash
# openclaw-easy 启动检查脚本 v2
#
# 检测项：
# 1. 标记文件 → 尝试从备份回滚
# 2. bak 目录 → 说明上次 mv 切换后新版本启动失败，用 bak 回滚
# 3. 防死循环：最多连续回滚 3 次

APP_DIR="/app/openclaw-easy"
APP_DIR_BAK="/app/openclaw-easy-bak"
MARKER_FILE="/tmp/openclaw-easy-update-marker"
VERSION_FILE="$APP_DIR/version.json"
ROLLBACK_SCRIPT="/app/openclaw-easy/docker/update.sh"
STARTUP_LOG="/var/log/supervisor/startup.log"
ROLLBACK_COUNT_FILE="/tmp/openclaw-easy-rollback-count"

log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [启动检查] $1"
    echo "$msg"
    echo "$msg" >> "$STARTUP_LOG" 2>/dev/null || true
}

# 获取回滚次数
get_rollback_count() {
    if [ -f "$ROLLBACK_COUNT_FILE" ]; then
        cat "$ROLLBACK_COUNT_FILE"
    else
        echo 0
    fi
}

# 增加回滚计数
increment_rollback_count() {
    local count=$(get_rollback_count)
    count=$((count + 1))
    echo "$count" > "$ROLLBACK_COUNT_FILE"
    echo "$count"
}

# 清除回滚计数
clear_rollback_count() {
    rm -f "$ROLLBACK_COUNT_FILE"
}

# 检查是否有需要回滚的情况
check_and_rollback() {
    local needs_rollback=false
    local reason=""

    # 情况1：有 bak 目录（说明上次 mv 切换后新版本可能启动失败）
    if [ -d "$APP_DIR_BAK" ]; then
        needs_rollback=true
        reason="发现 bak 目录（上次更新可能未完成或新版本启动失败）"
    fi

    # 情况2：有标记文件（说明更新过程异常中断）
    if [ -f "$MARKER_FILE" ]; then
        needs_rollback=true
        reason="发现标记文件（更新过程可能异常中断）"
    fi

    if [ "$needs_rollback" = false ]; then
        return 0
    fi

    log "检测到异常: $reason"

    # 检查回滚次数
    local count=$(get_rollback_count)
    if [ "$count" -ge 3 ]; then
        log "❌ 回滚次数已达上限 ($count 次)，停止自动回滚"
        log "请手动检查："
        log "  - bak 目录: $APP_DIR_BAK"
        log "  - 标记文件: $MARKER_FILE"
        log "  - 回滚计数: $ROLLBACK_COUNT_FILE"
        log "清理后执行: bash $ROLLBACK_SCRIPT clear-marker"
        rm -f "$MARKER_FILE"
        return 0
    fi

    # 执行回滚
    local new_count=$(increment_rollback_count)
    log "执行回滚 (第 $new_count 次)..."

    if [ -d "$APP_DIR_BAK" ]; then
        # 用 bak 目录回滚（最完整，包含 node_modules）
        log "使用 bak 目录回滚..."
        rm -rf "$APP_DIR"
        mv "$APP_DIR_BAK" "$APP_DIR"
        log "bak → 主目录 回滚完成"
    elif [ -x "$ROLLBACK_SCRIPT" ]; then
        "$ROLLBACK_SCRIPT" rollback
    else
        log "❌ 回滚脚本不可用: $ROLLBACK_SCRIPT"
    fi

    rm -f "$MARKER_FILE"
    return 0
}

# 后台监控：启动成功后清除标记和计数
monitor_startup() {
    local pid=$1
    sleep 10

    if kill -0 "$pid" 2>/dev/null; then
        log "✅ 服务启动成功，清理标记"
        rm -f "$MARKER_FILE"
        clear_rollback_count
    fi
}

# ==================== 主流程 ====================

log "========== 启动检查开始 =========="

# 1. 检查并回滚
check_and_rollback

# 2. 显示版本信息
if [ -f "$VERSION_FILE" ]; then
    local version_name=$(grep -o '"versionName"[[:space:]]*:[[:space:]]*"[^"]*"' "$VERSION_FILE" 2>/dev/null | head -1 | cut -d'"' -f4)
    [ -n "$version_name" ] && log "当前版本: $version_name"
fi

log "启动检查完成，准备启动服务..."

# 3. 启动 Node.js 服务
log "启动 Node.js 服务..."
node "$APP_DIR/server.js" &
NODE_PID=$!

# 4. 后台监控
monitor_startup $NODE_PID &

# 5. 等待 Node.js 进程
wait $NODE_PID
