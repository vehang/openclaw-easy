#!/bin/bash
# 更可靠的自动确认脚本
# 每1秒检查一次，立即确认

SESSION="claude-code"
LOG="/root/.openclaw/workspace/.ai/scripts/auto-confirm.log"
LOCK="/root/.openclaw/workspace/.ai/scripts/auto-confirm.lock"

# 锁检查
if [ -f "$LOCK" ]; then
  OLD_PID=$(cat "$LOCK" 2>/dev/null)
  if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
    echo "已有实例运行 (PID: $OLD_PID)" >> "$LOG"
    exit 0
  fi
fi
echo $$ > "$LOCK"
trap "rm -f $LOCK" EXIT

log() {
  echo "[$(date '+%H:%M:%S')] $1" >> "$LOG"
}

log "🚀 自动确认脚本启动 (PID: $$)"

while true; do
  if ! tmux has-session -t "$SESSION" 2>/dev/null; then
    sleep 2
    continue
  fi

  # 获取最后20行
  OUTPUT=$(tmux capture-pane -t "$SESSION" -p -S -20 2>/dev/null) || continue

  # 检测确认框 - 更宽松的匹配
  if echo "$OUTPUT" | grep -qE "Do you want.*proceed|proceed\?"; then
    # 检测是否有 "don't ask again" 选项
    if echo "$OUTPUT" | grep -qi "don't ask again"; then
      log "✅ 检测到确认框，选择 2 (don't ask again)"
      tmux send-keys -t "$SESSION" '2' Enter
    else
      log "✅ 检测到确认框，选择 1 (Yes)"
      tmux send-keys -t "$SESSION" '1' Enter
    fi
    sleep 2
    # 再次确认
    tmux send-keys -t "$SESSION" Enter
    sleep 1
  fi

  sleep 1
done
