# 项目目录结构规范

## 一、核心原则

**源代码仓库 ≠ 记忆/文档**

- 源代码仓库：可推送到 GitHub
- 记忆/文档：本地保留，不推送

---

## 二、目录结构标准

### 机器人工作区结构

```
机器人/
├── projects/                    # 源码仓库（可推送到 GitHub）
│   ├── project-a/              # Git 仓库
│   │   ├── .git/               # Git 目录
│   │   ├── src/                # 源码
│   │   ├── package.json / pom.xml
│   │   └── .gitignore          # 必须排除 memory/, docs/, .claude/
│   │
│   └── project-b/              # 另一个 Git 仓库
│       └── ...
│
├── memory/                      # 本地记忆（不推送）
│   ├── project-a/              # 项目专属记忆
│   └── project-b/              # 项目专属记忆
│
├── docs/                        # 本地文档（不推送）
│   ├── project-a/              # 项目专属文档
│   └── project-b/              # 项目专属文档
│
├── IDENTITY.md                 # 机器人身份
└── PROJECT-CONFIG.md           # 项目配置（Token 等，不推送）
```

### 示例：niuma 工作区

```
niuma/
├── projects/
│   ├── baoboxs-nav/            # 前端项目（Git 仓库）
│   ├── baoboxs-service/        # 后端项目（Git 仓库）
│   └── nim-yx-auth/            # 云信插件（Git 仓库）
│
├── memory/
│   ├── baoboxs/                # BaoBoxs 项目记忆
│   └── nim-yx-auth/            # NIM 插件记忆
│
├── docs/
│   ├── baoboxs/                # BaoBoxs 项目文档
│   └── nim-yx-auth/            # NIM 插件文档
│
├── IDENTITY.md
└── BAOBOXS-CONFIG.md           # Token 配置
```

---

## 三、推送规则

| 目录/文件 | 推送到 GitHub |
|-----------|---------------|
| `projects/*/src/` | ✅ 推送 |
| `projects/*/package.json` | ✅ 推送 |
| `projects/*/pom.xml` | ✅ 推送 |
| `projects/*/.gitignore` | ✅ 推送 |
| `memory/` | ❌ 不推送 |
| `docs/` | ❌ 不推送 |
| `.claude/` | ❌ 不推送 |
| `*.memory.md` | ❌ 不推送 |
| `IDENTITY.md` | ❌ 不推送 |
| `*-CONFIG.md` | ❌ 不推送 |

---

## 四、.gitignore 必须包含

每个项目仓库的 `.gitignore` 必须包含：

```gitignore
# 记忆和文档（不推送到仓库）
memory/
docs/
.claude/
*.memory.md
```

---

## 五、目录创建命令

新建项目时，按以下顺序创建：

```bash
# 1. 在机器人工作区创建项目目录
mkdir -p ~/workspace/{机器人}/projects/{项目名}
mkdir -p ~/workspace/{机器人}/memory/{项目名}
mkdir -p ~/workspace/{机器人}/docs/{项目名}

# 2. 克隆代码到 projects/{项目名}/
cd ~/workspace/{机器人}/projects/{项目名}
git clone {仓库地址} .

# 3. 更新 .gitignore
echo -e "\n# 记忆和文档（不推送）\nmemory/\ndocs/\n.claude/\n*.memory.md" >> .gitignore

# 4. 提交 .gitignore 更新
git add .gitignore
git commit -m "chore: 更新 .gitignore 排除记忆和文档目录"
git push
```

---

## 六、检查清单

每次新建项目或克隆代码后，检查：

- [ ] `projects/{项目名}/` 下没有 `memory/` 目录
- [ ] `projects/{项目名}/` 下没有 `docs/` 目录
- [ ] `projects/{项目名}/` 下没有 `.claude/` 目录
- [ ] `.gitignore` 包含 `memory/`, `docs/`, `.claude/`
- [ ] `memory/{项目名}/` 目录已创建
- [ ] `docs/{项目名}/` 目录已创建

---

_创建时间: 2026-03-21_