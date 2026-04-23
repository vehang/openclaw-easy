#!/bin/bash
# task-monitor-notify.sh - 任务监控+通知脚本
# 每隔10分钟检查任务进度，并通过 OpenClaw API 发送通知

TASK_ID=$1
TMUX_SESSION=$2
LOG_FILE=$3
USER_ID="ou_4dfb61a553fcb14a61005f3b302800d2"
INTERVAL=600  # 10分钟

# OpenClaw message API（示例，需要确认实际 API）
SEND_MESSAGE() {
    local message="$1"
    echo "发送通知: $message"
    # 可以通过 curl 调用 OpenClaw API 发送消息
    # 或者写入一个通知队列，等待下次触发时发送
    echo "[NOTIFY] $(date '+%H:%M') - $message" >> /tmp/task-notifications.log
}

echo "========================================"
echo "任务监控启动"
echo "任务ID: $TASK_ID"
echo "tmux会话: $TMUX_SESSION"
echo "日志文件: $LOG_FILE"
echo "通知间隔: ${INTERVAL}秒"
echo "========================================"
echo ""

# 发送启动通知
SEND_MESSAGE "🚀 任务 $TASK_ID 已启动监控，每10分钟汇报进度"

NOTIFY_COUNT=0

while true; do
    # 检查 tmux 会话是否存在
    if ! tmux has-session -t $TMUX_SESSION 2>/dev/null; then
        SEND_MESSAGE "✅ 任务 $TASK_ID 完成（会话已关闭）"
        break
    fi
    
    # 读取日志最新内容
    if [ -f "$LOG_FILE" ]; then
        LATEST=$(tail -200 "$LOG_FILE" 2>/dev/null)
        
        # 检查是否包含完成标记
        if echo "$LATEST" | grep -q "任务完成\|Task completed\|✅.*完成\|部署成功\|healthy"; then
            # 提取关键信息
            SUMMARY=$(echo "$LATEST" | tail -50)
            SEND_MESSAGE "✅ 任务 $TASK_ID 完成！

📋 完成汇总:
$SUMMARY"
            break
        fi
        
        # 检查是否包含错误
        if echo "$LATEST" | grep -q "错误\|Error\|失败\|❌"; then
            ERROR_INFO=$(echo "$LATEST" | grep -A 5 "错误\|Error\|失败")
            SEND_MESSAGE "⚠️ 任务 $TASK_ID 遇到问题：
$ERROR_INFO"
        fi
        
        # 进度汇报
        NOTIFY_COUNT=$((NOTIFY_COUNT + 1))
        PROGRESS=$(echo "$LATEST" | grep -o "progress.*[0-9]*%\|进度.*[0-9]*%\|✔.*\|✓.*" | tail -5)
        
        SEND_MESSAGE "📊 任务 $TASK-002 进度汇报 #$NOTIFY_COUNT

⏰ 时间: $(date '+%H:%M')
📈 进度信息:
$PROGRESS

继续监控中..."
    fi
    
    # 等待下一次检查
    sleep $INTERVAL
done

echo ""
echo "监控结束"