#!/bin/bash
# 定期检查汇报文件并发送消息
# 这个脚本由主 Agent 定期调用

REPORT_FILE="/root/.openclaw/workspace/scripts/claude-report.txt"
SENT_FILE="/root/.openclaw/workspace/scripts/claude-report-sent.txt"

if [ -f "$REPORT_FILE" ]; then
    # 检查是否已发送过
    if [ ! -f "$SENT_FILE" ] || [ "$REPORT_FILE" -nt "$SENT_FILE" ]; then
        cat "$REPORT_FILE"
        touch "$SENT_FILE"
    fi
fi
