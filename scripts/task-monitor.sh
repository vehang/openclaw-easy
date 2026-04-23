#!/bin/bash
# task-monitor.sh - 任务监控工具
# 用法:
#   ./task-monitor.sh start <session-name> <interval-minutes>
#   ./task-monitor.sh stop
#   ./task-monitor.sh status

MONITOR_STATE="/root/.openclaw/workspace/.task-monitor.json"

case "$1" in
  start)
    SESSION="$2"
    INTERVAL="${3:-10}"
    echo "{\"session\":\"$SESSION\",\"interval\":$INTERVAL,\"startedAt\":\"$(date -Iseconds)\"}" > "$MONITOR_STATE"
    echo "✅ 开始监控 tmux 会话: $SESSION (每 ${INTERVAL} 分钟汇报)"
    ;;
  stop)
    rm -f "$MONITOR_STATE"
    echo "🛑 停止监控"
    ;;
  status)
    if [ -f "$MONITOR_STATE" ]; then
      cat "$MONITOR_STATE"
    else
      echo "当前无监控任务"
    fi
    ;;
  *)
    echo "用法: $0 {start|stop|status} [session-name] [interval-minutes]"
    ;;
esac
