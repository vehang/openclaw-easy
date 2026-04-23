# AGENTS.md - 工作区

## 记忆系统
- **主记忆**: `MEMORY.md` - 重要决策、偏好、项目列表
- **日常记录**: `memory/YYYY-MM-DD.md` - 每日工作日志
- **检索方式**: 使用 `memory_search` 工具搜索历史记忆

## 规范文件 (`shared/`)

| 文件 | 用途 |
|------|------|
| RED-LINES.md 🔴 | 危险命令禁止清单（必读） |
| DEVELOPMENT.md | 开发工作流规范 |
| TESTING.md | 测试工作流规范 |
| PRODUCT-DESIGN.md | 产品设计规范 |
| LONG_RUNNING_TASK.md | 长任务执行规范 |
| MODEL-CONFIG.md | 模型配置建议 |

## 公共工具

工具位置：`~/.openclaw/tools/`

```bash
# 加载环境
source ~/.openclaw/tools/env-setup.sh

# 可用工具
java -version   # JDK 8
mvn -version    # Maven 3.6.3
```

## Skills

已安装的 Skills 位于 `~/.openclaw/skills/`，当前有 32 个。
