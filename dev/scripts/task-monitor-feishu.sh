#!/bin/bash
# task-monitor-feishu.sh - 任务监控脚本（改进版，带详细日志）

TASK_ID=$1
TMUX_SESSION=$2
LOG_FILE=$3
ACCOUNT=${4:-"niuma"}

# 飞书配置
case "$ACCOUNT" in
    "niuma")
        APP_ID="cli_a93d2ad9a4785cd4"
        APP_SECRET="kJMS7qp5eIGvR2JTeFNMTes8JFAIqKBm"
        ;;
    *)
        APP_ID="cli_a93d2ad9a4785cd4"
        APP_SECRET="kJMS7qp5eIGvR2JTeFNMTes8JFAIqKBm"
        ;;
esac

RECEIVE_ID="ou_4dfb61a553fcb14a61005f3b302800d2"
INTERVAL=600
PID_FILE="/tmp/task-monitor-$TASK_ID.pid"
MONITOR_LOG="/tmp/task-monitor-$TASK_ID-monitor.log"

echo $$ > "$PID_FILE"

# 日志函数
log() {
    echo "[$(date '+%H:%M:%S')] $1" >> "$MONITOR_LOG"
    echo "[$(date '+%H:%M:%S')] $1"
}

# 获取 token
get_token() {
    curl -s -X POST "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal" \
        -H "Content-Type: application/json" \
        -d "{\"app_id\":\"$APP_ID\",\"app_secret\":\"$APP_SECRET\"}" | \
        grep -o '"tenant_access_token":"[^"]*"' | cut -d'"' -f4
}

# 发送消息
send_msg() {
    local msg="$1"
    log "获取 token..."
    local token=$(get_token)
    
    if [ -z "$token" ]; then
        log "❌ Token 获取失败"
        return 1
    fi
    
    log "Token 获取成功，发送消息..."
    
    local result=$(curl -s -X POST "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d '{"receive_id":"'"$RECEIVE_ID"'","msg_type":"text","content":"{\"text\":\"'"$msg"'\"}"}')
    
    if echo "$result" | grep -q '"code":0'; then
        log "✅ 消息发送成功"
        return 0
    else
        log "❌ 消息发送失败: $result"
        return 1
    fi
}

# 清理
cleanup() {
    log "监控结束，清理..."
    rm -f "$PID_FILE"
    exit 0
}
trap cleanup SIGINT SIGTERM

log "========================================"
log "飞书任务监控启动"
log "任务ID: $TASK_ID"
log "tmux会话: $TMUX_SESSION"
log "日志: $LOG_FILE"
log "账号: $ACCOUNT"
log "间隔: ${INTERVAL}秒"
log "========================================"

# 启动通知
send_msg "🚀 任务 $TASK_ID 监控已启动

⏰ 每10分钟自动汇报进度
📋 任务完成后发送汇总报告"

NOTIFY_COUNT=0

while true; do
    log "等待 ${INTERVAL} 秒..."
    sleep $INTERVAL
    
    NOTIFY_COUNT=$((NOTIFY_COUNT + 1))
    log "=== 第 $NOTIFY_COUNT 次检查 ==="
    
    # 检查 tmux 会话
    if ! tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
        log "tmux 会话已关闭"
        send_msg "✅ 任务 $TASK_ID 已完成（会话关闭）"
        cleanup
    fi
    
    # 读取日志
    if [ -f "$LOG_FILE" ]; then
        LATEST=$(tail -100 "$LOG_FILE" 2>/dev/null)
        
        # 检查完成标记
        if echo "$LATEST" | grep -qi "任务完成\|task completed\|部署成功\|healthy"; then
            log "检测到完成标记"
            SUMMARY=$(echo "$LATEST" | tail -20 | sed 's/"/\\"/g' | tr '\n' '\\n')
            send_msg "✅ 任务 $TASK_ID 完成！\\n\\n$SUMMARY"
            cleanup
        fi
        
        # 进度汇报
        PROGRESS=$(echo "$LATEST" | grep -o "✔[^,]*\|✓[^,]*\|进度[^,]*" | tail -5 | tr '\n' '\\n')
        
        send_msg "📊 任务 $TASK_ID 进度汇报 #$NOTIFY_COUNT\\n\\n⏰ $(date '+%H:%M')\\n📈 $PROGRESS\\n\\n继续监控中..."
    else
        log "日志文件不存在: $LOG_FILE"
    fi
done