#!/bin/bash
# Claude Code 自动确认脚本
# 严格遵循 AGENTS.md 规范

SESSION="claude-code"
LOG="/root/.openclaw/workspace/.ai/scripts/auto-confirm.log"
LOCK="/root/.openclaw/workspace/.ai/scripts/auto-confirm.lock"

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

log "🚀 自动确认脚本启动 (PID: $$)"

while true; do
  if ! tmux has-session -t "$SESSION" 2>/dev/null; then
    sleep 5
    continue
  fi

  # 获取最后 20 行（减少范围，避免干扰）
  OUTPUT=$(tmux capture-pane -t "$SESSION" -p -S -20 2>/dev/null) || continue

  # 只在最后 5 行检测确认框（更精确）
  LAST_5_LINES=$(echo "$OUTPUT" | tail -5)
  
  # 检测确认框
  if echo "$LAST_5_LINES" | grep -qE "Do you want.*proceed|proceed\?|requires approval"; then
    # 优先选择 "don't ask again"
    if echo "$LAST_5_LINES" | grep -qi "don't ask again"; then
      log "✅ 检测到确认框，选择 2 (don't ask again)"
      tmux send-keys -t "$SESSION" '2' Enter
    else
      log "✅ 检测到确认框，选择 1 (Yes)"
      tmux send-keys -t "$SESSION" '1' Enter
    fi
    # 处理确认后等待 3 秒，避免干扰
    sleep 3
    # 再次确认
    tmux send-keys -t "$SESSION" Enter
    sleep 2
  fi

  # 检测需要按 Enter 的情况（只在最后 3 行）
  LAST_3_LINES=$(echo "$OUTPUT" | tail -3)
  if echo "$LAST_3_LINES" | grep -qE "^❯ $|^  ❯ $"; then
    log "⏎ 检测到等待输入，按 Enter"
    tmux send-keys -t "$SESSION" Enter
    sleep 2
  fi

  # 检测进程死亡
  if echo "$LAST_3_LINES" | grep -qE "node@.*:.*\$ $"; then
    log "⚠️ 检测到 Claude Code 进程可能已死亡"
    # 可以在这里添加自动重启逻辑
  fi

  # 检查间隔：3 秒（平衡响应速度和干扰）
  sleep 3
done
