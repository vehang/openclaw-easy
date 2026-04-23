#!/bin/bash
# 自动清理超过 5 分钟的残留锁文件
find ~/.openclaw/agents/*/sessions/*.lock -mmin +5 -delete 2>/dev/null
echo "$(date): 锁文件清理完成"
