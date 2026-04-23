# Git Backup Schedule Configuration

## 自动备份配置

```yaml
name: git-backup
description: 自动备份工作区到 GitHub 私有仓库
schedule: "0 * * * *"  # 每小时执行一次
command: /root/.openclaw/workspace/scripts/git-backup.sh
enabled: true
```

## 执行时间

每小时整点执行（有更新才备份，无更新跳过）

## 日志位置

`memory/git-backup.log`

## 仓库信息

- 仓库: https://github.com/vehang/openclaw_backup
- 分支: master
- 认证: GitHub PAT (存储在 remote URL 中)
