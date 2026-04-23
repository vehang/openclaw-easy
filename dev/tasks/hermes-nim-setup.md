# Hermes NIM 版本构建与配置文档

> 目标：在 Docker 容器中运行 Hermes Gateway，配置网易云信（NIM）作为消息通道，MiniMax-M2.7 作为大模型。

---

## 一、环境信息

| 项目 | 值 |
|------|------|
| 镜像 | `hermes-cloud:latest` |
| 宿主机端口 | `49081`（NIM 容器）|
| 数据卷 | `/home/data/docker/hermes/nim` → `/opt/data` |
| 时区 | `Asia/Shanghai` |
| 模型 | `MiniMax-M2.7` |
| 模型 Provider | `minimax-cn` |

---

## 二、配置文件职责划分

| 文件 | 路径 | 存放内容 | 说明 |
|------|------|---------|------|
| `.env` | `/opt/data/.env` | **API Key、凭证、敏感信息** | NIM 凭证、LLM API Key、开放访问开关 |
| `config.yaml` | `/opt/data/config.yaml` | **模型名、Provider、NIM instances** | 非敏感的运行配置 |

> ⚠️ **模型名称和 Provider 不能通过 `.env` 设置**，hermes 只从 `config.yaml` 读取。API Key 和 base_url 可以放 `.env`。

---

## 三、构建镜像（如需重新构建）

### 3.1 从源码构建

```bash
docker build -t hermes-cloud:latest \
  --build-arg HERMES_BRANCH=feature/nim \
  --build-arg HERMES_REPO=NousResearch/hermes-agent \
  https://github.com/NousResearch/hermes-agent.git#feature/nim
```

### 3.2 拉取现成镜像

```bash
docker pull ghcr.io/nousresearch/hermes-agent:nim
docker tag ghcr.io/nousresearch/hermes-agent:nim hermes-cloud:latest
```

---

## 四、运行容器

### 4.1 创建数据卷目录

```bash
mkdir -p /home/data/docker/hermes/nim
```

### 4.2 首次启动

```bash
docker run -d \
  --name hermes-nim \
  -p 49081:8080 \
  -e TZ=Asia/Shanghai \
  -v /home/data/docker/hermes/nim:/opt/data \
  --restart unless-stopped \
  hermes-cloud:latest gateway run
```

> entrypoint 会自动初始化：
> - 如果 `.env` 不存在 → 从 `.env.example` 复制（约 18KB，包含大量注释）
> - 如果 `config.yaml` 不存在 → 从 `cli-config.yaml.example` 复制
> - 如果 `SOUL.md` 不存在 → 生成默认人格
> - 创建 `cron/`、`sessions/`、`logs/`、`skills/` 等目录

> ⚠️ 端口 `49080` 留给原有的 `hermes` 容器，不要冲突。

### 4.3 确认初始化完成

```bash
docker exec hermes-nim ls -la /opt/data/config.yaml /opt/data/.env /opt/data/SOUL.md
```

---

## 五、配置步骤

> 以下操作通过 `docker exec` 在运行中的容器内执行。
> 配置顺序：先 `.env`（凭证）→ 再 `config.yaml`（模型 + NIM instances）→ 最后重启。

### 5.1 配置 `.env`（API Key + 凭证）

#### 5.1.1 删除注释掉的冲突行

entrypoint 复制的 `.env.example` 中包含注释掉的 key（如 `# MINIMAX_CN_API_KEY=`），这些注释行会干扰 dotenv 解析，必须先删除：

```bash
docker exec hermes-nim bash -c '
sed -i "/^# MINIMAX_CN_API_KEY=$/d" /opt/data/.env
sed -i "/^# MINIMAX_CN_BASE_URL=/d" /opt/data/.env
'
```

#### 5.1.2 追加实际凭证

```bash
docker exec hermes-nim bash -c 'cat >> /opt/data/.env << '\''EOF'\''

# === MiniMax 大模型 ===
MINIMAX_CN_API_KEY=你的APIKey
MINIMAX_CN_BASE_URL=https://api.minimaxi.com/v1

# === NIM 云信凭证 ===
NIM_APP_KEY=你的appKey
NIM_ACCOUNT=你的account
NIM_TOKEN=你的token

# === 开放访问（允许所有用户，无需配对） ===
GATEWAY_ALLOW_ALL_USERS=true
EOF'
```

#### 5.1.3 验证 `.env`

```bash
docker exec hermes-nim bash -c 'grep -v "^#" /opt/data/.env | grep -v "^$" | grep -E "MINIMAX|NIM|GATEWAY_ALLOW"'
```

预期输出：
```
MINIMAX_CN_API_KEY=sk-...
MINIMAX_CN_BASE_URL=https://api.minimaxi.com/v1
NIM_APP_KEY=40d...
NIM_ACCOUNT=ocb_...
NIM_TOKEN=0d6a...
GATEWAY_ALLOW_ALL_USERS=true
```

### 5.2 配置 `config.yaml`（模型名 + NIM instances）

#### 5.2.1 设置模型名称和 Provider

> 使用 `hermes config set` 命令修改，确保 hermes 能正确识别。
> **不要用 sed 直接改**，hermes 启动时会 save_config 重写 config.yaml，sed 修改会被覆盖。

```bash
docker exec hermes-nim hermes config set model.default MiniMax-M2.7
docker exec hermes-nim hermes config set model.provider minimax-cn
```

#### 5.2.2 设置 NIM Home Channel（可选但推荐）

设置 home channel 后，cron 定时任务结果和跨平台消息会投递到此频道，避免每次对话都提示。

```bash
docker exec hermes-nim hermes config set nim.home_channel ocb_4dc736c83a2f
```

> `ocb_4dc736c83a2f` 是你的 NIM account ID。也可以在聊天中发送 `/sethome` 来设置。

### 5.2.3 追加 NIM instances

```bash
docker exec hermes-nim bash -c 'cat >> /opt/data/config.yaml << '\''EOF'\''

nim:
  instances:
    - appKey: "你的appKey"
      account: "你的account"
      token: "你的token"
      p2p: {}
      team: {}
      qchat: {}
      advanced: {}
EOF'
```

> 说明：`nim.instances` 是 NIM 凭证的标准配置位置。gateway 启动时会自动将 `nim.instances` 合并到 `platforms.nim`，无需手动配置 `platforms` 段。

#### 5.2.4 验证 `config.yaml`

```bash
# 模型
docker exec hermes-nim bash -c 'grep -E "^  (default|provider):" /opt/data/config.yaml | head -2'

# NIM instances
docker exec hermes-nim bash -c 'grep -A 2 "^nim:" /opt/data/config.yaml'
```

预期输出：
```
  default: MiniMax-M2.7
  provider: minimax-cn
nim:
  instances:
    - appKey: ...
```

### 5.3 验证 NIM bridge 可用

```bash
docker exec hermes-nim /opt/hermes/.venv/bin/python -c "
import os, sys
sys.path.insert(0, '/opt/hermes')
os.environ['HERMES_HOME'] = '/opt/data'
from gateway.config import load_nim_instances, PlatformConfig
from gateway.platforms.nim import check_nim_requirements
pc = PlatformConfig(enabled=True, extra={'instances': [{'appKey': '40d169d01f5a9b88d6938f81e0e143de', 'account': 'ocb_4dc736c83a2f', 'token': '0d6a672fbd227225087a948d82a5fc3e', 'p2p': {}, 'team': {}, 'qchat': {}, 'advanced': {}}]})
print('check:', check_nim_requirements(pc))
instances = load_nim_instances(pc)
for i in instances:
    print('instance:', i.instance_name, 'configured:', i.configured())
"
```

预期输出：`check: True` + `configured: True`

### 5.4 重启容器使配置生效

```bash
docker restart hermes-nim
```

### 5.5 确认启动成功

```bash
sleep 10 && docker logs --tail 15 hermes-nim 2>&1
```

**成功的标志：**
- 看到 `Hermes Gateway Starting...` 后无报错
- 有 `node .../bridge_js/index.mjs` 进程在运行（NIM bridge）
- 没有 `No messaging platforms enabled`
- 没有 `no API key was found`

**确认 NIM bridge 进程：**
```bash
docker exec hermes-nim bash -c 'ps aux | grep bridge_js | grep -v grep'
```

---

## 六、配对用户

> 如果 `.env` 中设置了 `GATEWAY_ALLOW_ALL_USERS=true`，可跳过此步骤。

### 6.1 获取配对码

用户通过网易云信给机器人发消息，机器人会回复：
```
Here's your pairing code: `XXXXXXXX`
```

### 6.2 批准配对

```bash
docker exec hermes-nim hermes pairing approve nim XXXXXXXX
```

输出 `Approved!` 即成功。

---

## 七、完整配置文件参考

### 7.1 `/opt/data/.env`（非注释非空行）

```bash
# MiniMax 大模型
MINIMAX_CN_API_KEY=sk-cp-xxxxxxxxxxxxxxxx
MINIMAX_CN_BASE_URL=https://api.minimaxi.com/v1

# NIM 云信凭证
NIM_APP_KEY=40d169d01f5a9b88d6938f81e0e143de
NIM_ACCOUNT=ocb_4dc736c83a2f
NIM_TOKEN=0d6a672fbd227225087a948d82a5fc3e

# 开放访问
GATEWAY_ALLOW_ALL_USERS=true
```

### 7.2 `/opt/data/config.yaml`（需要修改/追加的部分）

**模型配置**（使用 `hermes config set` 修改，不要手动 sed）：
```yaml
model:
  default: MiniMax-M2.7
  provider: minimax-cn
```

**NIM instances**（追加到 config.yaml 末尾）：
```yaml
nim:
  instances:
    - appKey: "40d169d01f5a9b88d6938f81e0e143de"
      account: "ocb_4dc736c83a2f"
      token: "0d6a672fbd227225087a948d82a5fc3e"
      p2p: {}
      team: {}
      qchat: {}
      advanced: {}
```

---

## 八、从零到运行的完整流程

```bash
# ========== 1. 创建数据目录 ==========
mkdir -p /home/data/docker/hermes/nim

# ========== 2. 启动容器（entrypoint 自动初始化） ==========
docker run -d \
  --name hermes-nim \
  -p 49081:8080 \
  -e TZ=Asia/Shanghai \
  -v /home/data/docker/hermes/nim:/opt/data \
  --restart unless-stopped \
  hermes-cloud:latest gateway run

# ========== 3. 删除 .env 中注释掉的冲突行 ==========
docker exec hermes-nim bash -c '
sed -i "/^# MINIMAX_CN_API_KEY=$/d" /opt/data/.env
sed -i "/^# MINIMAX_CN_BASE_URL=/d" /opt/data/.env
'

# ========== 4. 追加凭证到 .env ==========
docker exec hermes-nim bash -c 'cat >> /opt/data/.env << '\''EOF'\''

# MiniMax 大模型
MINIMAX_CN_API_KEY=你的APIKey
MINIMAX_CN_BASE_URL=https://api.minimaxi.com/v1

# NIM 云信
NIM_APP_KEY=你的appKey
NIM_ACCOUNT=你的account
NIM_TOKEN=你的token

# 开放访问
GATEWAY_ALLOW_ALL_USERS=true
EOF'

# ========== 5. 设置模型名称和 Provider ==========
docker exec hermes-nim hermes config set model.default MiniMax-M2.7
docker exec hermes-nim hermes config set model.provider minimax-cn

# ========== 6. 追加 NIM instances ==========
docker exec hermes-nim bash -c 'cat >> /opt/data/config.yaml << '\''EOF'\''

nim:
  instances:
    - appKey: "你的appKey"
      account: "你的account"
      token: "你的token"
      p2p: {}
      team: {}
      qchat: {}
      advanced: {}
EOF'

# ========== 7. 重启生效 ==========
docker restart hermes-nim

# ========== 8. 验证 ==========
sleep 10 && docker logs --tail 15 hermes-nim 2>&1
```

---

## 九、常用运维命令

| 操作 | 命令 |
|------|------|
| 查看容器状态 | `docker ps -a --filter "name=hermes-nim"` |
| 查看日志 | `docker logs hermes-nim` |
| 实时日志 | `docker logs hermes-nim -f` |
| 重启容器 | `docker restart hermes-nim` |
| 进入容器 | `docker exec -it hermes-nim /bin/bash` |
| 查看 .env 非注释行 | `docker exec hermes-nim bash -c 'grep -v "^#" /opt/data/.env \| grep -v "^$"'` |
| 查看模型配置 | `docker exec hermes-nim hermes config show model` |
| 修改模型 | `docker exec hermes-nim hermes config set model.default <模型名>` |
| 切换 Provider | `docker exec hermes-nim hermes config set model.provider <provider>` |
| 容器内执行 hermes | `docker exec hermes-nim hermes <命令>` |

---

## 十、常见问题

### Q1: `Provider 'minimax-cn' is set but no API key was found`

**原因**：`.env.example` 中有注释行 `# MINIMAX_CN_API_KEY=`，dotenv 库会将其解析为空值，导致实际写入的 `MINIMAX_CN_API_KEY=sk-...` 不生效。

**解决**：删除注释行后再追加实际值。
```bash
docker exec hermes-nim bash -c 'sed -i "/^# MINIMAX_CN_API_KEY=$/d" /opt/data/.env'
```

### Q2: `No messaging platforms enabled`

**原因**：`nim.instances` 未配置或格式错误。

**解决**：确认 config.yaml 末尾有正确的 `nim.instances` 配置，然后重启。gateway 启动时会自动将 `nim.instances` 合并到 `platforms.nim`。

### Q3: `NIM: bridge runtime is unavailable`

**原因**：nim-bot-py 未安装或 node/npm 不可用。

**解决**：
```bash
docker exec hermes-nim bash -c "cd /opt/hermes && .venv/bin/pip install nim-bot-py"
docker exec hermes-nim which node npm   # 确认 node/npm 存在
```

### Q4: `Ignoring unconfigured NIM instance entry: nim1`

**原因**：config.yaml 里的 `instances` 格式正确但凭证不完整。

**解决**：确保 `appKey`、`account`、`token` 都在同一个 instance 块内。

### Q5: 模型配置被重置为 `anthropic/claude-opus-4.6`

**原因**：hermes 启动时 save_config 会重写 config.yaml，sed 修改会被覆盖。

**解决**：使用 `hermes config set` 命令修改模型配置，不要用 sed。
```bash
docker exec hermes-nim hermes config set model.default MiniMax-M2.7
docker exec hermes-nim hermes config set model.provider minimax-cn
```

### Q6: 容器重启后配置丢失

**原因**：使用了 `docker run --rm` 或未挂载数据卷。

**解决**：确保使用 `-v /home/data/docker/hermes/nim:/opt/data` 挂载数据卷。

### Q7: `GATEWAY_ALLOW_ALL_USERS=true` 不生效

**原因**：`.env.example` 覆盖了已有的 `.env`，其中包含 `# GATEWAY_ALLOW_ALL_USERS=false` 注释行。

**解决**：手动设置（注意替换注释行，不是追加）。
```bash
docker exec hermes-nim bash -c 'sed -i "s|# GATEWAY_ALLOW_ALL_USERS=false|GATEWAY_ALLOW_ALL_USERS=true|" /opt/data/.env'
```

---

## 十一、相关文件路径

| 宿主机路径 | 容器内路径 | 说明 |
|-----------|-----------|------|
| `/home/data/docker/hermes/nim/` | `/opt/data/` | Hermes 数据根目录 |
| `/home/data/docker/hermes/nim/.env` | `/opt/data/.env` | API Key、凭证、敏感信息 |
| `/home/data/docker/hermes/nim/config.yaml` | `/opt/data/config.yaml` | 模型名、Provider、NIM instances |
| `/home/data/docker/hermes/nim/SOUL.md` | `/opt/data/SOUL.md` | AI 人格设定 |
| `/home/data/docker/hermes/nim/sessions/` | `/opt/data/sessions/` | 会话数据 |
| `/home/data/docker/hermes/nim/logs/` | `/opt/data/logs/` | 日志文件 |

---

## 十二、更新日志

| 日期 | 更新内容 |
|------|---------|
| 2026-04-22 | 初始文档 |
| 2026-04-23 | 重写配置流程：明确 .env/config.yaml 职责划分；修复 .env 注释行冲突问题；改用 `hermes config set` 设置模型；补充完整从零流程和常见问题 |

---

_文档整理于 2026-04-23_
