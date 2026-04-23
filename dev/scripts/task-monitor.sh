#!/bin/bash
# task-monitor.sh - 长时间任务监控脚本
# 每10分钟检查一次任务进度并发送汇报

TASK_ID=$1
TMUX_SESSION=$2
INTERVAL=600  # 10分钟 = 600秒

echo "开始监控任务: $TASK_ID"
echo "tmux 会话: $TMUX_SESSION"
echo "检查间隔: ${INTERVAL}秒"

while true; do
    # 检查 tmux 会话是否存在
    if ! tmux has-session -t $TMUX_SESSION 2>/dev/null; then
        echo "任务完成或会话已关闭"
        break
    fi
    
    # 获取 tmux 输出的最后 50 行
    OUTPUT=$(tmux capture-pane -t $TMUX_SESSION -p | tail -50)
    
    # 检查是否包含完成标记
    if echo "$OUTPUT" | grep -q "任务完成\|Task completed\|✅"; then
        echo "检测到任务完成信号"
        echo "$OUTPUT"
        break
    fi
    
    # 检查是否包含错误标记
    if echo "$OUTPUT" | grep -q "错误\|Error\|失败\|❌"; then
        echo "检测到错误信号"
        echo "$OUTPUT"
    fi
    
    # 输出当前状态
    echo "=== $(date '+%H:%M:%S') 进度检查 ==="
    echo "$OUTPUT" | tail -10
    
    # 等待下一次检查
    sleep $INTERVAL
done

echo "监控结束"