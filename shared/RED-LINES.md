# 🔴 红线规则（绝对禁止）

## 发布日期
2026-03-23

## 背景
2026-03-23 执行 TASK-004 时，错误删除了服务器上所有 Docker 容器和镜像，造成严重后果。

---

## 🚫 禁止的危险命令

### Docker 相关
```bash
# ❌ 绝对禁止
docker system prune
docker system prune -a
docker system prune --volumes
docker container prune
docker image prune -a
docker volume prune
docker network prune

# ❌ 禁止使用通配符删除
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)
docker rmi $(docker images -q)
```

### 文件系统
```bash
# ❌ 绝对禁止
rm -rf /opt/docker
rm -rf /var/lib/docker
rm -rf /home/data
```

### 配置修改
```bash
# ❌ 禁止修改 Docker 数据目录配置
# 可能导致现有容器和镜像丢失
```

---

## ✅ 正确的做法

### 1. 只操作项目相关容器
```bash
# ✅ 明确指定容器名称
docker stop baoboxs-nav baoboxs-service
docker rm baoboxs-nav baoboxs-service

# ✅ 使用前缀匹配（谨慎）
docker ps --filter "name=baoboxs-" --format "{{.Names}}"
```

### 2. 部署前检查
```bash
# ✅ 查看现有容器
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# ✅ 确认数据卷
docker volume ls

# ✅ 确认镜像
docker images
```

### 3. 保护数据
```bash
# ✅ 备份重要数据
docker exec mysql mysqldump -u root -p database > backup.sql

# ✅ 检查挂载目录
ls -la /opt/docker/
```

---

## ⚠️ Claude Code 权限问题

### 问题
`--dangerously-skip-permissions` 跳过所有确认，AI 可以执行任何命令！

### 建议
1. **不使用** `--dangerously-skip-permissions`
2. 或在执行危险命令前 **人工确认**

---

## 📋 部署检查清单

### 部署前
- [ ] 查看现有容器列表
- [ ] 确认只操作项目相关容器（如 `baoboxs-*`）
- [ ] 确认数据卷不会被影响
- [ ] 确认镜像不会被删除

### 部署时
- [ ] 只使用明确的容器名称
- [ ] 不使用通配符或批量操作
- [ ] 不执行任何 `prune` 命令
- [ ] 不修改 Docker 核心配置

### 部署后
- [ ] 检查容器状态
- [ ] 检查其他容器是否正常
- [ ] 检查数据完整性

---

## 🎯 项目特定规则

### BaoBoxs 项目
- **容器名称**（固定）：
  - 前端：`baoboxs-nav-web`
  - 后端：`baoboxs-nav-service`
- **镜像名称**（固定）：
  - 前端：`baoboxs-nav-web:YYMMDDHHMMSS`
  - 后端：`baoboxs-nav-service:YYMMDDHHMMSS`
- **端口**：
  - 前端：43000
  - 后端：48080
- **数据目录**: /opt/docker/baoboxs/

### ⚠️ 部署时只允许操作这两个容器
```bash
# ✅ 允许
docker stop baoboxs-nav-web baoboxs-nav-service
docker rm baoboxs-nav-web baoboxs-nav-service

# ❌ 禁止操作其他容器
docker stop <其他容器名>
docker rm <其他容器名>
```

### 其他项目
- 每个项目有独立容器名前缀
- 部署前确认容器列表

---

## 🔔 触发条件

**以下情况必须检查本规范：**
1. 执行任何 `docker` 命令
2. 部署到生产服务器
3. 修改系统配置
4. 删除任何文件或容器

---

## 📝 事故记录

### 2026-03-23 TASK-004 事故
- **问题**: 删除了服务器上所有容器和镜像
- **原因**: 配置 Docker 镜像加速时可能执行了清理命令
- **影响**: 10+ 容器丢失，基础镜像丢失
- **教训**: 必须限制操作范围，禁止危险命令

---

_此规范必须严格遵守！_