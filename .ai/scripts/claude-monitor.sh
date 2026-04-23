#!/bin/bash
# Claude Code 统一监控脚本
# 功能：自动确认、定期汇报、任务恢复、防止重复

set -e

# ========== 配置 ==========
SESSION="claude-code"
LOG_FILE="/root/.openclaw/workspace/scripts/claude-monitor.log"
REPORT_FILE="/root/.openclaw/workspace/scripts/claude-report.txt"
LOCK_FILE="/root/.openclaw/workspace/scripts/claude-monitor.lock"
REPORT_INTERVAL=300  # 5分钟汇报一次
CHECK_INTERVAL=2     # 2秒检查一次

# ========== 锁文件检查（防止重复运行）==========
if [ -f "$LOCK_FILE" ]; then
    OLD_PID=$(cat "$LOCK_FILE" 2>/dev/null)
    if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
        echo "[$(date '+%H:%M:%S')] 监控脚本已在运行 (PID: $OLD_PID)，退出" >> "$LOG_FILE"
        exit 0
    else
        rm -f "$LOCK_FILE"
    fi
fi
echo $$ > "$LOCK_FILE"
trap "rm -f $LOCK_FILE" EXIT

# ========== 日志函数 ==========
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# ========== 汇报函数（写入文件供主进程读取）==========
report() {
    local msg="$1"
    echo "REPORT:$msg" > "$REPORT_FILE"
    log "📊 汇报: $msg"
}

# ========== 检查并启动 Claude Code ==========
ensure_claude_running() {
    if ! tmux has-session -t "$SESSION" 2>/dev/null; then
        log "⚠️ Session 不存在，创建新 session..."
        tmux new-session -d -s "$SESSION" -x 200 -y 50
        sleep 2
        tmux send-keys -t "$SESSION" 'cd /root/.openclaw/workspace && /root/.openclaw/npm-global/bin/claude' Enter
        sleep 10
        report "Claude Code 已重启"
        return 0
    fi
    
    # 检查 claude 进程是否在运行
    if ! tmux capture-pane -t "$SESSION" -p 2>/dev/null | grep -q "Claude Code"; then
        log "⚠️ Claude Code 未运行，尝试启动..."
        tmux send-keys -t "$SESSION" '/root/.openclaw/npm-global/bin/claude' Enter
        sleep 10
    fi
}

# ========== 自动确认函数 ==========
auto_confirm() {
    local output="$1"
    
    # 检测确认对话框并自动选择
    if echo "$output" | grep -qE "Do you want.*don't ask again"; then
        tmux send-keys -t "$SESSION" '2' Enter
        log "✅ 自动确认: 选项 2 (don't ask again)"
        return 0
    elif echo "$output" | grep -qE "Do you want (to )?(proceed|overwrite|make this edit)"; then
        tmux send-keys -t "$SESSION" '1' Enter
        log "✅ 自动确认: 选项 1 (Yes)"
        return 0
    elif echo "$output" | grep -qE "^\s*❯.*Yes.*No"; then
        tmux send-keys -t "$SESSION" '1' Enter
        log "✅ 自动确认: Yes/No 选 Yes"
        return 0
    fi
    
    return 1
}

# ========== 主循环 ==========
LAST_REPORT=$(date +%s)
LAST_HASH=""

log "🚀 监控脚本启动 (PID: $$)"

while true; do
    # 1. 确保 Claude Code 运行
    ensure_claude_running
    
    # 2. 获取屏幕内容
    OUTPUT=$(tmux capture-pane -t "$SESSION" -p 2>/dev/null) || continue
    
    # 3. 检测变化（用于调试）
    CURRENT_HASH=$(echo "$OUTPUT" | tail -20 | md5sum | cut -d' ' -f1)
    
    # 4. 自动确认
    auto_confirm "$OUTPUT"
    
    # 5. 检测错误
    if echo "$OUTPUT" | grep -qiE "error|failed|timeout"; then
        ERRORS=$(echo "$OUTPUT" | grep -iE "error|failed|timeout" | tail -3)
        log "❌ 检测到错误: $ERRORS"
    fi
    
    # 6. 定期汇报
    NOW=$(date +%s)
    if [ $((NOW - LAST_REPORT)) -ge $REPORT_INTERVAL ]; then
        # 提取任务状态
        TASKS=$(echo "$OUTPUT" | grep -E "✔|◼|◻|Running|Error" | head -10)
        if [ -n "$TASKS" ]; then
            report "进度更新:\n$TASKS"
        else
            report "运行中..."
        fi
        LAST_REPORT=$NOW
    fi
    
    # 7. 检测完成
    if echo "$OUTPUT" | grep -qiE "all tasks completed|任务完成|finished"; then
        report "🎉 任务可能已完成"
    fi
    
    sleep $CHECK_INTERVAL
done
