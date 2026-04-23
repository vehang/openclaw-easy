#!/bin/bash
# Claude Code 任务启动脚本
# 使用 --dangerously-skip-permissions 跳过所有确认框

set -e

echo "🧹 清理旧进程..."
pkill -f "claude-monitor" 2>/dev/null || true
pkill -f "auto-confirm" 2>/dev/null || true
rm -f /root/.openclaw/workspace/.ai/scripts/*.lock

echo "🔍 检查 tmux session..."
if tmux has-session -t claude-code 2>/dev/null; then
    echo "✅ tmux session 'claude-code' 已存在"
    # 检查 claude 是否在运行
    if ! tmux capture-pane -t claude-code -p 2>/dev/null | grep -q "Claude Code"; then
        echo "⚠️ Claude Code 未运行，重新启动..."
        tmux send-keys -t claude-code 'cd /root/.openclaw/workspace && /root/.openclaw/npm-global/bin/claude --dangerously-skip-permissions' Enter
        sleep 5
    fi
else
    echo "📦 创建新的 tmux session..."
    tmux new-session -d -s claude-code -x 200 -y 50
    sleep 1
    tmux send-keys -t claude-code 'cd /root/.openclaw/workspace && /root/.openclaw/npm-global/bin/claude --dangerously-skip-permissions' Enter
    sleep 5
fi

echo ""
echo "✅ 准备就绪！"
echo ""
echo "⚙️ Claude Code 启动参数：--dangerously-skip-permissions"
echo "   （自动跳过所有确认框）"
echo ""
echo "使用方式："
echo "  发送任务: tmux send-keys -t claude-code '你的任务描述' Enter"
echo "  查看进度: tmux capture-pane -t claude-code -p | tail -40"
echo ""
