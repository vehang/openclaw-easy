# 长时间任务开发规范

> 在 OpenClaw 环境中开发和管理长时间运行任务的指南

## 概述

长时间任务（如编译、测试、数据迁移、AI 训练等）需要：
1. 持久化运行（断开连接不中断）
2. 进度可追踪
3. 按需汇报

## 核心原则

### 1. 使用 tmux 托管任务

**所有长时间任务必须在 tmux 会话中运行**

```bash
# 创建命名会话
tmux new -s <task-name>

# 示例
tmux new -s build-project
tmux new -s data-migration
tmux new -s claude-code-task
```

### 2. 任务输出结构化

任务脚本应输出可解析的进度标记：

```bash
# 推荐格式
echo "[PROGRESS] 10% - 正在编译..."
echo "[PROGRESS] 50% - 正在测试..."
echo "[PROGRESS] 100% - 完成"
echo "[DONE] 任务完成，结果: xxx"

# 或使用 JSON
echo '{"progress": 50, "stage": "testing", "eta": "5min"}'
```

### 3. 日志持久化

同时输出到日志文件，便于回溯：

```bash
# 推荐：tee 同时输出到屏幕和文件
your-command 2>&1 | tee /root/.openclaw/workspace/logs/<task-name>.log

# 或重定向
your-command > /root/.openclaw/workspace/logs/<task-name>.log 2>&1
```

## 启动任务流程

### Step 1: 创建 tmux 会话

```bash
tmux new -s <task-name>
```

### Step 2: 运行任务

```bash
# 进入项目目录
cd /path/to/project

# 运行任务（带日志）
npm run build 2>&1 | tee ~/workspace/logs/build.log
```

### Step 3: 请求监控

告诉 OpenClaw：

```
帮我监控 tmux 会话 <task-name>，每 <N> 分钟汇报一次进度
```

或手动启动监控：

```bash
~/workspace/scripts/task-monitor.sh start <task-name> <interval>
```

### Step 4: 分离会话

```bash
# 按 Ctrl+B 然后 D 分离
# 或直接关闭终端，会话会继续运行
```

## 停止监控

任务完成后：

```bash
~/workspace/scripts/task-monitor.sh stop
```

或告诉 OpenClaw：
```
停止监控
```

## 查看任务状态

### 查看所有 tmux 会话
```bash
tmux ls
```

### 重新连接会话
```bash
tmux attach -t <task-name>
```

### 查看会话输出（不连接）
```bash
tmux capture-pane -t <task-name> -p | tail -50
```

### 查看日志文件
```bash
tail -100 ~/workspace/logs/<task-name>.log
```

## 任务状态文件

监控状态存储在：
```
/root/.openclaw/workspace/.task-monitor.json
```

格式：
```json
{
  "session": "task-name",
  "interval": 10,
  "startedAt": "2026-03-28T23:40:00+08:00",
  "lastReport": "2026-03-28T23:50:00+08:00"
}
```

## 最佳实践

### ✅ 推荐

- 会话命名清晰：`build-fe`、`test-api`、`migrate-db`
- 输出进度标记：`[PROGRESS]`、`[DONE]`、`[ERROR]`
- 同时记录日志文件
- 任务完成后清理监控状态

### ❌ 避免

- 在普通终端运行长任务（SSH 断开会中断）
- 会话名含糊：`session1`、`tmp`
- 没有进度输出
- 忘记分离会话

## 示例：完整流程

```bash
# 1. 创建会话
tmux new -s build-release

# 2. 进入项目
cd ~/workspace/my-project

# 3. 运行构建（带日志）
npm run build 2>&1 | tee ~/workspace/logs/build-release.log

# 4. 按 Ctrl+B D 分离

# 5. 请求监控
# 告诉 OpenClaw: "监控 tmux 会话 build-release，每 10 分钟汇报"

# 6. 定期收到汇报...

# 7. 任务完成后停止监控
~/workspace/scripts/task-monitor.sh stop

# 8. 查看完整日志
cat ~/workspace/logs/build-release.log
```

## 错误处理

### 任务卡住
```bash
# 重新连接
tmux attach -t <task-name>

# 必要时终止
tmux kill-session -t <task-name>
```

### 会话丢失
```bash
# 检查 tmux 服务
tmux list-sessions

# 检查日志文件
ls ~/workspace/logs/
```

### 监控不工作
```bash
# 检查状态文件
cat ~/workspace/.task-monitor.json

# 手动触发检查
openclaw heartbeat
```

## 相关文档

- [tmux Skill](/skills/tmux)
- [HEARTBEAT.md](/HEARTBEAT.md)
- [task-monitor.sh](/scripts/task-monitor.sh)
