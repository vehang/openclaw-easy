#!/bin/bash
# 10 分钟进度汇报脚本
# 严格遵循 AGENTS.md 规范

SESSION="claude-code"
LOG="/root/.openclaw/workspace/.ai/scripts/progress-report.log"
LOCK="/root/.openclaw/workspace/.ai/scripts/progress-report.lock"

# 锁检查
if [ -f "$LOCK" ]; then
  OLD_PID=$(cat "$LOCK" 2>/dev/null)
  if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
    echo "[$(date '+%H:%M:%S')] 已有实例运行 (PID: $OLD_PID)" >> "$LOG"
    exit 0
  fi
fi
echo $$ > "$LOCK"
trap "rm -f $LOCK" EXIT

log() {
  echo "[$(date '+%H:%M:%S')] $1" >> "$LOG"
}

log "🚀 进度汇报脚本启动 (PID: $$)"

while true; do
  sleep 600  # 每 10 分钟

  if ! tmux has-session -t "$SESSION" 2>/dev/null; then
    log "⚠️ tmux session 不存在"
    continue
  fi

  # 获取最后 50 行
  OUTPUT=$(tmux capture-pane -t "$SESSION" -p -S -50 2>/dev/null) || continue

  # 写入进度文件
  PROGRESS_FILE="/root/.openclaw/workspace/.ai/scripts/latest-progress.txt"
  {
    echo "TIME: $(date '+%H:%M')"
    echo "STATUS: RUNNING"
    echo ""
    echo "LAST 50 LINES:"
    echo "$OUTPUT"
  } > "$PROGRESS_FILE"

  log "📊 进度已更新到 $PROGRESS_FILE"

  # 可以在这里添加发送消息的逻辑
  # 例如通过 message 工具发送给用户
done
