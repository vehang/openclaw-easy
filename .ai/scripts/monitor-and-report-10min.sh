#!/bin/bash
# 每10分钟汇报 Claude Code 进度的脚本

LOG_FILE="/root/.openclaw/workspace/.ai/scripts/progress-report.log"
REPORT_INTERVAL=600  # 10分钟

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "🚀 进度监控启动"

while true; do
  # 获取 tmux 输出
  OUTPUT=$(tmux capture-pane -t claude-code -p 2>/dev/null | tail -60)
  
  # 提取任务进度
  TASK_STATUS=$(echo "$OUTPUT" | grep -E "✔|◼|◻|✓|✗" | head -10)
  
  # 检测错误
  ERRORS=$(echo "$OUTPUT" | grep -iE "error|failed|timeout" | tail -3)
  
  # 检测完成
  COMPLETED=$(echo "$OUTPUT" | grep -iE "completed|finished|done|完成")
  
  # 检测确认框
  CONFIRM=$(echo "$OUTPUT" | grep -E "Do you want|proceed\?")
  
  # 写入汇报文件
  REPORT_FILE="/root/.openclaw/workspace/.ai/scripts/latest-progress.txt"
  {
    echo "TIME: $(date '+%H:%M')"
    if [ -n "$CONFIRM" ]; then
      echo "STATUS: WAITING_CONFIRM"
      # 自动确认
      tmux send-keys -t claude-code '2' Enter
      log "✅ 自动确认对话框"
    elif [ -n "$ERRORS" ]; then
      echo "STATUS: ERROR"
      echo "ERRORS: $ERRORS"
    elif [ -n "$COMPLETED" ]; then
      echo "STATUS: COMPLETED"
    else
      echo "STATUS: RUNNING"
    fi
    echo "TASKS:"
    echo "$TASK_STATUS"
  } > "$REPORT_FILE"
  
  log "📊 进度更新: $(cat $REPORT_FILE | head -5 | tr '\n' ' ')"
  
  sleep $REPORT_INTERVAL
done
