# HEARTBEAT.md

## 每次对话开始时

1. 搜索公共记忆：`~/.openclaw/memory/MEMORY.md`
2. 搜索私有记忆：`~/.openclaw/workspace/main/memory/`
3. 加载 shared/ 中的相关规范

## 对话进行中

- **公共信息**（用户偏好、项目、决策）→ 写入 `~/.openclaw/memory/MEMORY.md`
- **私有信息**（本 Agent 任务）→ 写入 `~/.openclaw/workspace/main/memory/`
- 不需要用户说"帮我记住"

## 定期汇总（HEARTBEAT 触发时）

1. 检查今日对话是否有需要记录的内容
2. 更新公共记忆中的项目信息
3. 更新私有记忆中的工作日志
