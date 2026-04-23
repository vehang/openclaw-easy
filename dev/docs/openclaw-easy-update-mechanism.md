# OpenClaw Easy - 更新机制重构方案（同级目录 + 测试启动 + mv 切换）

> 基线分支：feature/modular-refactor (versionCode: 1005)
> 设计时间：2026-04-14
> 状态：待实施

---

## 一、现有方案问题

### 当前架构：排除法更新

```
Node.js 进程内执行：
  routes/update.js (370行) → 下载 → 解压到 /tmp → 排除法覆盖到 /app/openclaw-easy/ → npm install → 重启

Shell 脚本执行：
  docker/update.sh (527行) → 同样的排除法逻辑
```

### 具体问题

| # | 问题 | 说明 |
|---|------|------|
| 1 | **Node 进程自更新** | `routes/update.js` 在 Node 进程内下载、解压、覆盖自己的文件，然后重启自己。文件被覆盖后进程状态不确定，npm install 失败直接导致服务起不来 |
| 2 | **两套重复逻辑** | JS（370行）和 Shell（527行）各自实现了一遍更新，Web 一键更新走 JS，自动更新/手动走 Shell，逻辑不一致 |
| 3 | **原地覆盖无回滚窗口** | 排除法直接在 `/app/openclaw-easy/` 上覆盖文件，一旦 npm install 失败，当前目录已经是坏的，虽然有备份但要靠 `start-check.sh` 重启时才回滚 |
| 4 | **npm install 风险** | 在运行目录原地 npm install，网络/依赖问题会导致 node_modules 损坏 |
| 5 | **排除列表维护负担** | JS 和 Shell 各维护一份 `EXCLUDE_PATTERNS`，新增文件类型需要两边同步 |

---

## 二、新方案设计

### 核心思路

```
下载 → 解压到同级新目录 → 拷贝 node_modules → npm install → 测试启动 → mv 切换
```

**关键：18780 服务在整个更新过程中不受影响，只有最后 mv 切换的毫秒级中断。**

### 流程图

```
POST /api/update 或 自动更新
         │
         ▼
  立即返回响应 "已开始更新"
         │
         ▼ (后台 setImmediate)
  ┌─────────────────────────────────────┐
  │  bash docker/update.sh update <URL> │
  │         （独立 shell 进程）           │
  └──────────────┬──────────────────────┘
                 │
                 ▼
  [1/8] 创建目录
        /app/openclaw-easy-new/
        /tmp/openclaw-easy-backup-{ts}/
                 │
                 ▼
  [2/8] 备份当前版本
        cp -a 排除列表文件 → 备份目录
        写标记文件 /tmp/openclaw-easy-update-marker
                 │
                 ▼
  [3/8] 下载更新包
        wget/curl → /tmp/openclaw-easy-update-{ts}/
                 │
                 ▼
  [4/8] 解压到新目录
        解压 → /app/openclaw-easy-new/
        检测单目录结构自动提升
                 │
                 ▼
  [5/8] 拷贝 node_modules
        cp -a /app/openclaw-easy/node_modules → /app/openclaw-easy-new/
                 │
                 ▼
  [6/8] npm install --production
        在新目录执行，不影响正在运行的服务
        对比 package.json 是否变化，未变则跳过
                 │
                 ▼
  [7/8] 测试启动验证
        PORT=18781 node /app/openclaw-easy-new/server.js &
        sleep 3
        curl -s http://127.0.0.1:18781/api/status
        ├─ 成功 → kill 测试进程，继续
        └─ 失败 → 清理新目录，报错退出（不切换）
                 │
                 ▼
  [8/8] mv 切换（毫秒级中断）
        supervisorctl stop openclaw-easy
        mv /app/openclaw-easy /app/openclaw-easy-bak
        mv /app/openclaw-easy-new /app/openclaw-easy
        supervisorctl start openclaw-easy
        sleep 5
        curl -s http://127.0.0.1:18780/api/status
        ├─ 成功 → rm -rf bak，清理标记，完成
        └─ 失败 → mv bak 回来，回滚
```

### 对比

| 对比项 | 旧方案（排除法） | 新方案（同级目录 + mv） |
|--------|-----------------|----------------------|
| 更新过程中服务 | 文件被覆盖，可能异常 | 18780 正常运行不受影响 |
| npm install 位置 | 原地安装，失败 = 服务挂 | 新目录安装，失败 = 不切换 |
| 回滚时机 | 重启时检测标记文件 | 测试启动失败就不切换 |
| 中断时间 | npm install + 重启期间 | mv 切换的毫秒级 |
| 逻辑统一 | JS + Shell 两套 | 全部走 Shell |
| node_modules | 原地增量，可能损坏 | 拷贝到新目录，安全隔离 |

---

## 三、统一更新路径

**三条更新路径全部走 `bash docker/update.sh update <url>`：**

| 触发方式 | 调用链 |
|----------|--------|
| Web 一键更新 | `POST /api/update` → `performUpdate(url)` → shell 脚本 |
| 自动定时更新 | `tasks/auto-update.js` → `performUpdate(url)` → shell 脚本 |
| 手动更新 | `bash docker/update.sh update <url>` |

**`routes/update.js` 大幅简化**：删除 370 行的更新逻辑，只保留：
- `/api/version` — 版本查询
- `/api/update/check` — 检查更新
- `POST /api/update` — 后台调用 shell 脚本

---

## 四、修改文件清单

### 1. `docker/update.sh` — 完全重写

**改动前**：527 行，排除法，6 步流程
**改动后**：约 400 行，同级目录法，8 步流程

核心变化：

| 旧 | 新 |
|----|----|
| 解压到 /tmp，排除法覆盖到 /app | 解压到 /app/openclaw-easy-new/ |
| 原地 npm install | 新目录 npm install |
| 无测试启动 | PORT=18781 测试启动验证 |
| 无 mv 切换 | stop → mv → start |
| 标记文件更新完成后清除 | 标记文件更新完成后清除 |
| 回滚靠 start-check.sh | 测试失败不切换 + start-check.sh 兜底 |

保留不变的部分：
- 多格式压缩支持（7种格式）
- 标记文件 + 自动回滚机制
- 排除列表（用于备份阶段）
- 回滚/状态查询等辅助命令

### 2. `routes/update.js` — 大幅简化

**改动前**：370 行，包含完整的下载/解压/覆盖逻辑
**改动后**：约 150 行

删除的内容：
- `copyWithExclude()` — 不再需要 JS 端做文件操作
- `updateDependencies()` — 不再需要 JS 端做 npm install
- `EXCLUDE_PATTERNS` — 不再需要 JS 端维护排除列表
- `POST /update` 内的 5 步更新逻辑 — 改为调用 shell 脚本

保留的内容：
- `GET /version` — 版本查询
- `GET /update/check` — 检查更新
- `POST /update` — 简化为：获取下载地址 → 调用 `performUpdate(url)` → 返回

新增：
- 无

### 3. `utils/update.js` — 修改 performUpdate

**改动前**：调用 shell 脚本但不处理测试启动逻辑
**改动后**：调用 shell 脚本（测试启动逻辑已在 shell 内），结果不变

实际上 `performUpdate` 已经是调 shell 脚本了，保持不变即可。

### 4. `server.js` — 新增 PORT 环境变量支持

```javascript
// 改动前
const { PORT } = require('./constants');

// 改动后：constants/config.js 中
const PORT = process.env.PORT || 18780;
```

用于测试启动时 `PORT=18781 node server.js`。

### 5. `constants/config.js` — PORT 支持环境变量覆盖

```javascript
// 改动前
const PORT = 18780;

// 改动后
const PORT = parseInt(process.env.PORT) || 18780;
```

### 6. `docker/start-check.sh` — 微调

新增检测 `/app/openclaw-easy-bak` 目录存在时的回滚逻辑。

### 7. `version.json` — 不变

版本号和内容不变（本次是更新机制重构，功能无变化，版本号随下一次功能发布一起升）。

---

## 五、新增/排除列表更新

排除列表统一只在 `docker/update.sh` 中维护（JS 端不再需要）：

```bash
EXCLUDE_PATTERNS=(
    "node_modules"              # 依赖目录（单独 cp -a 到新目录）
    "tmp"                       # 临时文件
    ".git"                      # Git 目录
    ".env"                      # 本地环境配置
    ".env.local"                # 本地环境配置
    ".passwd"                   # 密码文件
    ".simple-config.json"       # 配置缓存
    ".weixin-bound"             # 微信绑定状态
    ".weixin-qr-state.json"     # 微信登录状态
    ".app-tokens.json"          # App 认证 token（新增）
    "*.backup"                  # 备份文件
    "*.bak"                     # 备份文件
    "*.log"                     # 日志文件
)
```

注意：`node_modules` 在备份阶段排除，在步骤 5 单独 `cp -a` 到新目录。

---

## 六、回滚机制

### 测试启动失败（不切换）

```
npm install 失败或测试启动 curl 失败
  → 清理 /app/openclaw-easy-new/
  → 旧版本完全不受影响
  → 日志记录失败原因
  → 不需要回滚，因为根本没切换
```

### mv 切换后启动失败

```
supervisorctl start 后 curl 验证失败
  → mv /app/openclaw-easy（坏的）→ 删除
  → mv /app/openclaw-easy-bak → /app/openclaw-easy
  → supervisorctl restart
  → 日志记录回滚
```

### 异常退出（进程被杀等）

```
start-check.sh 启动时检测标记文件
  → 有标记 + bak 目录存在 → 回滚
  → 有标记 + 无 bak 目录 → 清理新目录
```

---

## 七、文件改动统计

| 文件 | 改动类型 | 改动前行数 | 预计改动后 | 说明 |
|------|----------|-----------|-----------|------|
| `docker/update.sh` | 重写 | 527 行 | ~450 行 | 同级目录法，8步流程 |
| `routes/update.js` | 大幅简化 | 370 行 | ~150 行 | 删除文件操作逻辑，只留路由 |
| `constants/config.js` | 小改 | 35 行 | 36 行 | PORT 环境变量覆盖 |
| `docker/start-check.sh` | 微调 | 100 行 | ~110 行 | 检测 bak 目录回滚 |
| `utils/update.js` | 不变 | 75 行 | 75 行 | performUpdate 已调 shell |
| `tasks/auto-update.js` | 不变 | 100 行 | 100 行 | 已走 performUpdate |

**总计**：约减少 270 行代码，逻辑更简洁。

---

_方案设计：2026-04-14_
