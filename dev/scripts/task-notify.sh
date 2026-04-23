#!/bin/bash
# task-notify.sh - 任务通知监控脚本
# 用法: ./task-notify.sh <TASK_ID> <TMUX_SESSION> <LOG_FILE>

TASK_ID=$1
TMUX_SESSION=$2
LOG_FILE=$3
INTERVAL=600  # 10分钟

START_TIME=$(date +%s)
LAST_PROGRESS=""

echo "开始监控任务: $TASK_ID"
echo "tmux 会话: $TMUX_SESSION"
echo "日志文件: $LOG_FILE"
echo "通知间隔: ${INTERVAL}秒"
echo ""

while true; do
    # 检查 tmux 会话是否存在
    if ! tmux has-session -t $TMUX_SESSION 2>/dev/null; then
        echo "任务完成或会话已关闭"
        break
    fi
    
    # 读取日志最新内容
    if [ -f "$LOG_FILE" ]; then
        LATEST=$(tail -100 "$LOG_FILE" 2>/dev/null)
        
        # 检查是否包含完成标记
        if echo "$LATEST" | grep -q "任务完成\|Task completed\|✅.*完成\|部署成功"; then
            echo "检测到任务完成信号"
            echo ""
            echo "=== 任务完成汇总 ==="
            echo "$LATEST" | tail -50
            break
        fi
        
        # 检查进度变化
        CURRENT_PROGRESS=$(echo "$LATEST" | grep -o "progress.*[0-9]*%" | tail -1)
        if [ "$CURRENT_PROGRESS" != "$LAST_PROGRESS" ]; then
            LAST_PROGRESS="$CURRENT_PROGRESS"
            echo "进度更新: $CURRENT_PROGRESS"
        fi
    fi
    
    # 等待下一次检查
    sleep $INTERVAL
done

ELAPSED=$(($(date +%s) - START_TIME))
MINUTES=$((ELAPSED / 60))

echo ""
echo "监控结束"
echo "总耗时: ${MINUTES} 分钟"