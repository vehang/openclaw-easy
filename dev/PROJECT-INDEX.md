# 项目索引 - 独立管理规范

> ⚠️ 每个项目有独立的 git 仓库，**必须在各自目录下操作**，禁止在工作区根目录混推。

---

## 项目清单

| 项目 | 目录 | 仓库 | 当前分支 | 说明 |
|------|------|------|----------|------|
| baoboxs-nav | `projects/baoboxs-nav/` | vehang/baoboxs-nav | feature/all-tools-page | BaoBoxs 前端 (Next.js 15) |
| baoboxs-service | `projects/baoboxs-service/` | vehang/baoboxs-service | master | BaoBoxs 后端 (Spring Boot) |
| eh-mp-formatter | `projects/eh-mp-formatter/` | vehang/eh-mp-formatter | ui-optimization | 恩和名片排版小程序 |
| openclaw-easy | `projects/openclaw-easy/` | vehang/openclaw-easy | feature/modular-refactor | OpenClaw 配置管理系统 |

## 操作规范

### ✅ 正确做法

```bash
# 在对应项目目录下操作
cd projects/openclaw-easy
git add -A
git commit -m "feat: xxx"
git push origin feature/modular-refactor
```

### ❌ 错误做法

```bash
# 在工作区根目录操作，remote 指向错误仓库
cd ~/.openclaw/workspace/dev
git add projects/openclaw-easy/
git push  # → 推到 eh-mp-formatter 了！
```

## Git 操作检查清单

每次 commit/push 前必须确认：

1. `pwd` → 确认在正确的项目目录
2. `git remote -v` → 确认 remote 指向正确的仓库
3. `git branch --show-current` → 确认在正确的分支

---

_更新时间：2026-04-14_
