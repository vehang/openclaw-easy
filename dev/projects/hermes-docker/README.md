# Hermes Docker 部署文档

## 目录
- [一、架构概览](#一架构概览)
- [二、构建镜像](#二构建镜像)
- [三、配置](#三配置)
- [四、运行](#四运行)
- [五、飞书平台配置](#五飞书平台配置)
- [六、LLM 模型配置](#六llm-模型配置)
- [七、完整构建示例](#七完整构建示例)
- [八、常见问题](#八常见问题)

---

## 一、架构概览

### 分层镜像设计

```
hermes-agent (App 层)     约 4.8GB
  └── hermes-base (系统层)  约 2GB
        ├── debian:13.4
        ├── Python 3.13 + Node 20
        ├── uv 0.11.6
        ├── Playwright (Chromium)
        ├── Claude Code CLI (@anthropic-ai/claude-code)
        └── 常用工具链（见下表）
```

### Base 镜像包含的工具

| 类别 | 工具 | 说明 |
|------|------|------|
| **基础开发** | python3, nodejs, npm, git, curl, ripgrep, ffmpeg | 核心运行时 |
| **编译构建** | build-essential, gcc, libffi-dev | 编译 C 扩展 |
| **Shell 增强** | tmux, zsh, fonts-powerline, sudo, wget | 终端体验 |
| **系统工具** | tree, htop, ncdu, fastfetch | 系统查看 |
| **Git 增强** | lazygit, gh, delta | Git 可视化 / GitHub CLI / diff 高亮 |
| **文件搜索** | bat, eza, fd, fzf, zoxide | 文件查看 / 智能 cd |
| **数据处理** | jq, yq, httpie | JSON/YAML/HTTP 处理 |
| **消息平台** | lark-oapi | 飞书 SDK |
| **浏览器** | Playwright (Chromium) | 网页自动化 |

### 支持的消息平台

| 平台 | 状态 | 配置 Key |
|------|------|---------|
| 飞书 (Feishu) | ✅ WebSocket 已连接 | `FEISHU_APP_ID` / `FEISHU_APP_SECRET` |
| 钉钉 (DingTalk) | 待配置 | `DINGTALK_*` |
| 企业微信 (WeCom) | 待配置 | `WECOM_*` |
| QQ Bot | 待配置 | `QQBOT_*` |

### 支持的 LLM

| 模型 | Provider | 配置 |
|------|----------|------|
| 智谱 GLM-5.1 | `zai` | `GLM_API_KEY` |
| Kimi / Moonshot | `kimi-coding` | `KIMI_API_KEY` |
| MiniMax | `minimax-cn` | `MINIMAX_CN_API_KEY` |

---

## 二、构建镜像

### 2.1 构建 base 镜像（系统依赖层）

```bash
cd ~/hermes-docker

docker build -f Dockerfile.base -t hermes-base:latest .
```

**⚠️ 注意：不要加 `--no-cache`**，会导致 apt-get 内存不足被 kill。构建约需 10-15 分钟（取决于网络）。

### 2.2 构建 app 镜像（应用层）

```bash
# 先构建 base
docker build -f Dockerfile.base -t hermes-base:latest .

# 再构建 app（会复用 base 的缓存层）
docker build -f Dockerfile.app -t hermes-agent:latest .
```

### 2.3 验证镜像

```bash
# 检查镜像大小
docker images | grep hermes

# 预期：
# hermes-base     latest   约 2GB
# hermes-agent   latest   约 4.8GB

# 验证 base 工具链
docker run --rm hermes-base:latest bash -c "which uv && uv --version && node --version"

# 验证 app
docker run --rm hermes-agent:latest hermes --help
```

---

## 三、配置

### 配置文件位置

所有配置在 Docker 数据卷 `/opt/data/` 中：

```
/opt/data/
├── .env          # API Keys、平台凭证（敏感数据）
├── config.yaml   # 模型、工具、行为配置
└── SOUL.md      # AI 人格设定
```

### 3.1 方式一：挂载本地目录（配置持久化，推荐）

```bash
docker run -d \
  --name hermes \
  -p 49080:8080 \
  -e TZ=Asia/Shanghai \
  -v /home/data/docker/hermes/data:/opt/data \
  -v /home/sys/docker/openclaw:/home/sys/docker/openclaw \
  -v /home/data/docker/workspace:/home/data/docker/workspace \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /home/sys/docker/overlay2:/var/lib/docker/overlay2 \
  --restart unless-stopped \
  hermes-agent:latest gateway run
```

**挂载说明：**

| 挂载 | 作用 |
|------|------|
| `/home/data/docker/hermes/data:/opt/data` | Hermes 配置、数据、sessions、日志（**绑定到本地目录**） |
| `/home/sys/docker/openclaw` | OpenClaw 数据 |
| `/home/data/docker/workspace:/home/data/docker/workspace` | 工作目录映射 |
| `/var/run/docker.sock` | Docker daemon socket（容器内运行 docker 命令） |
| `/var/lib/docker/overlay2` | 复用宿主机镜像缓存（节省空间和带宽） |

### 3.2 方式二：进入容器编辑

```bash
# 进入容器
docker exec -it hermes bash

# 编辑配置
vi /opt/data/.env
vi /opt/data/config.yaml

# 改完后重启
docker restart hermes

# 查看日志
docker logs -f hermes
```

### 3.3 快捷配置命令

```bash
# 查看当前 .env（非注释非空行）
docker exec hermes bash -c 'cat /opt/data/.env | grep -v "^#" | grep -v "^$"'

# 查看当前模型配置
docker exec hermes bash -c 'grep -E "^  (default|provider|base_url):" /opt/data/config.yaml'

# 追加配置到 .env
docker exec hermes bash -c 'cat >> /opt/data/.env << EOF
GLM_API_KEY=你的Key
GLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
EOF'

# 修改 config.yaml 中的模型配置
docker exec hermes bash -c '
sed -i "/^  default:/c\  default: \\"glm-5.1\\"" /opt/data/config.yaml
sed -i "/^  provider:/c\  provider: \\"zai\\"" /opt/data/config.yaml
sed -i "/^  base_url:/c\  base_url: \\"https://open.bigmodel.cn/api/paas/v4\\"" /opt/data/config.yaml
'

docker restart hermes
```

---

## 四、运行

### 4.1 首次启动

entrypoint 会自动初始化目录结构和默认配置：

```bash
docker run -d \
  --name hermes \
  -p 49080:8080 \
  -e TZ=Asia/Shanghai \
  -v /home/data/docker/hermes/data:/opt/data \
  -v /home/sys/docker/openclaw:/home/sys/docker/openclaw \
  -v /home/data/docker/workspace:/home/data/docker/workspace \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /home/sys/docker/overlay2:/var/lib/docker/overlay2 \
  --restart unless-stopped \
  hermes-agent:latest gateway run
```

**自动创建：**
- `.env` — 从 `hermes.env.example` 复制（包含默认 LLM + 飞书配置）
- `config.yaml` — 模型、工具配置
- `SOUL.md` — AI 人格
- `cron/`, `sessions/`, `logs/`, `skills/`, `memories/` 等目录

### 4.2 查看状态

```bash
# 查看日志
docker logs --tail 30 hermes

# 实时跟踪
docker logs -f hermes

# 检查飞书连接
docker logs hermes 2>&1 | grep -i "lark\|feishu\|connected"
```

**飞书连接成功的日志：**
```
[Lark] connected to wss://msg-frontier.feishu.cn/ws/v2...
```

### 4.3 停止 / 重启

```bash
docker stop hermes
docker start hermes
docker restart hermes
```

---

## 五、飞书平台配置

### 步骤 1：创建飞书应用

1. 打开 [飞书开放平台](https://open.feishu.cn/app)
2. 创建**企业自建应用**
3. 获取 **App ID** 和 **App Secret**
4. 开启**机器人**功能
5. 配置**权限**（消息相关权限）
6. 开启**长连接**（WebSocket 模式）

### 步骤 2：写入配置

```bash
docker exec hermes bash -c 'cat >> /opt/data/.env << EOF

# 飞书平台
FEISHU_APP_ID=你的AppID
FEISHU_APP_SECRET=你的AppSecret
EOF'

docker restart hermes
```

### 步骤 3：验证连接

```bash
docker logs -f hermes
# 看到 [Lark] connected 表示成功
```

### 飞书必配权限

| 权限 | 说明 |
|------|------|
| `im:message` | 读写消息 |
| `im:message.receive_v1` | 接收消息事件 |
| `im:chat` | 获取群信息 |

---

## 六、LLM 模型配置

### 6.1 智谱 GLM（推荐国内使用）

```bash
docker exec hermes bash -c 'cat >> /opt/data/.env << EOF

# 智谱 GLM
GLM_API_KEY=你的APIKey
GLM_BASE_URL=https://open.bigmodel.cn/api/coding/paas/v4
EOF'

docker exec hermes bash -c '
sed -i "/^  default:/c\  default: \\"glm-5.1\\"" /opt/data/config.yaml
sed -i "/^  provider:/c\  provider: \\"zai\\"" /opt/data/config.yaml
sed -i "/^  base_url:/c\  base_url: \\"https://open.bigmodel.cn/api/coding/paas/v4\\"" /opt/data/config.yaml
'

docker restart hermes
```

### 6.2 Kimi / Moonshot

```bash
docker exec hermes bash -c 'cat >> /opt/data/.env << EOF

# Kimi
KIMI_API_KEY=你的KimiKey
EOF'

docker exec hermes bash -c '
sed -i "/^  default:/c\  default: \\"kimi-k2.5\\"" /opt/data/config.yaml
sed -i "/^  provider:/c\  provider: \\"kimi-coding\\"" /opt/data/config.yaml
sed -i "/^  base_url:/s|base_url:.*|base_url: \\"https://api.kimi.com/coding/v1\\"|" /opt/data/config.yaml
'

docker restart hermes
```

### 6.3 MiniMax

```bash
docker exec hermes bash -c 'cat >> /opt/data/.env << EOF

# MiniMax 中国
MINIMAX_CN_API_KEY=你的Key
MINIMAX_CN_BASE_URL=https://api.minimaxi.com/v1
EOF'

docker exec hermes bash -c '
sed -i "/^  default:/c\  default: \\"MiniMax-M2.7\\"" /opt/data/config.yaml
sed -i "/^  provider:/c\  provider: \\"minimax-cn\\"" /opt/data/config.yaml
'

docker restart hermes
```

---

## 七、完整构建示例

以下是从零开始构建并配置 Hermes 的完整流程：

```bash
# ========== 1. 进入项目目录 ==========
cd ~/hermes-docker

# ========== 2. 构建 base 镜像（约 10-15 分钟）==========
docker build -f Dockerfile.base -t hermes-base:latest .

# ========== 3. 构建 app 镜像（约 3-5 分钟）==========
docker build -f Dockerfile.app -t hermes-agent:latest .

# ========== 4. 创建数据卷 ==========
docker volume create hermes-data

# ========== 5. 运行容器（首次，自动初始化配置）==========
docker run -d \
  --name hermes \
  -p 49080:8080 \
  -e TZ=Asia/Shanghai \
  -v /home/data/docker/hermes/data:/opt/data \
  -v /home/sys/docker/openclaw:/home/sys/docker/openclaw \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /home/sys/docker/overlay2:/var/lib/docker/overlay2 \
  --restart unless-stopped \
  hermes-agent:latest gateway run

# ========== 6. 配置智谱 GLM ==========
docker exec hermes bash -c 'cat >> /opt/data/.env << EOF

# 智谱 GLM
GLM_API_KEY=你的APIKey
GLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
EOF'

# ========== 7. 配置飞书平台 ==========
docker exec hermes bash -c 'cat >> /opt/data/.env << EOF

# 飞书平台
FEISHU_APP_ID=你的AppID
FEISHU_APP_SECRET=你的AppSecret
EOF'

# ========== 8. 修改 config.yaml 模型配置 ==========
docker exec hermes bash -c '
sed -i "/^  default:/c\  default: \\"glm-5.1\\"" /opt/data/config.yaml
sed -i "/^  provider:/c\  provider: \\"zai\\"" /opt/data/config.yaml
sed -i "/^  base_url:/c\  base_url: \\"https://open.bigmodel.cn/api/paas/v4\\"" /opt/data/config.yaml
'

# ========== 9. 重启生效 ==========
docker restart hermes

# ========== 10. 验证 ==========
docker logs -f hermes
# 看到 [Lark] connected 表示飞书连接成功
```

---

## 八、常见问题

### Q1: 端口被占用

```bash
# 查占用进程
lsof -i :49080

# 换端口（如 48080）
docker run -d --name hermes -p 48080:8080 ...
```

### Q2: 飞书 SDK (lark-oapi) 缺失

```bash
# 手动安装（临时）
docker exec hermes bash -c "cd /opt/hermes && .venv/bin/pip install lark-oapi"

# 更新 Dockerfile.app（永久）
# 在 uv pip install 那行末尾添加：&& uv pip install lark-oapi
```

### Q3: 飞书连接成功但收不到消息

- 检查应用是否已**发布/上线**
- 检查**权限**是否已审批
- 确认机器人是否被**加入会话**

### Q4: 模型不生效

```bash
# 确认 .env 有 KEY
docker exec hermes grep GLM_API_KEY /opt/data/.env

# 确认 config.yaml 非注释行
docker exec hermes grep -E "^  (default|provider|base_url):" /opt/data/config.yaml

docker restart hermes
```

### Q5: 重建镜像后配置丢失

**配置在数据卷中，不在镜像中，不会丢失！**

```bash
# 备份（可选）
docker exec hermes tar czf /tmp/hermes-backup.tar.gz -C /opt/data .
docker cp hermes:/tmp/hermes-backup.tar.gz ~/hermes-backup.tar.gz
```

### Q6: 磁盘空间不足

```bash
# 清理未使用资源
docker system prune -a --volumes

# 检查空间
df -h /
```

---

## 附录：快速命令速查

```bash
# 构建
docker build -f Dockerfile.base -t hermes-base:latest .
docker build -f Dockerfile.app -t hermes-agent:latest .

# 运行
docker run -d --name hermes -p 49080:8080 \
  -v /home/data/docker/hermes/data:/opt/data \
  -v /home/sys/docker/openclaw:/home/sys/docker/openclaw \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /home/sys/docker/overlay2:/var/lib/docker/overlay2 \
  --restart unless-stopped \
  hermes-agent:latest gateway run

# 日志
docker logs -f hermes

# 进入容器
docker exec -it hermes bash

# 重启
docker restart hermes

# 停止
docker stop hermes

# 删除
docker rm -f hermes
```

---

## 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|---------|
| 2026-04-16 | v1.0 | 初始文档，基础镜像分层 + 飞书配置 |
| 2026-04-16 | v1.1 | 新增常用工具链（lazygit/gh/delta/bat/eza/fd/fzf/zoxide/jq/yq/httpie等）|
| 2026-04-16 | v1.2 | 新增 Claude Code CLI + 完整构建示例章节 |
