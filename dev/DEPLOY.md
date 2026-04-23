# BaoBoxs 项目部署规范

## ⚠️ 严格约束（必须遵守）

### 🔴 容器和镜像名称（固定，不可更改）

| 服务类型 | 容器名称 | 镜像名称 | 端口 |
|----------|----------|----------|------|
| **前端** | `baoboxs-nav-web` | `baoboxs-nav-web:YYMMDDHHMMSS` | 43000 |
| **后端** | `baoboxs-nav-service` | `baoboxs-nav-service:YYMMDDHHMMSS` | 48080 |

### 🔴 镜像版本格式（固定）
```
格式: YYMMDDHHMMSS（年月日时分秒，共10位）

示例:
- baoboxs-nav-web:260323210800
- baoboxs-nav-service:260323210800

生成命令:
TAG=$(date +%y%m%d%H%M%S)
```

---

## 🚫 红线规则（绝对禁止）

### 只允许操作以下容器/镜像
```bash
# ✅ 允许操作（只有这两个）
docker stop baoboxs-nav-web baoboxs-nav-service
docker rm baoboxs-nav-web baoboxs-nav-service
docker rmi baoboxs-nav-web:xxx baoboxs-nav-service:xxx
```

### 禁止操作其他容器
```bash
# ❌ 绝对禁止
docker stop <其他容器名>
docker rm <其他容器名>
docker rmi <其他镜像名>

# ❌ 绝对禁止通配符操作
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)
docker rmi $(docker images -q)
docker ps -aq | xargs docker rm

# ❌ 绝对禁止清理命令
docker system prune
docker system prune -a
docker container prune
docker image prune -a
docker volume prune
```

### 违规后果
- ❌ 删除其他重要服务
- ❌ 数据丢失无法恢复
- ❌ 需要人工重新部署所有服务

---

## 部署目标
- **目标服务器**: 192.168.1.123:22345
- **部署目录**: /home/data/docker/baoboxs/
- **数据库**: 192.168.1.123:16033/baoboxs-eladmin

---

## ⚠️ 重要：必需的环境变量

**Service 容器启动时必须配置以下环境变量**（否则 JWT 初始化失败）：

```bash
USER_SECRET_KEY=pP+iJXdb+yqPKKK/798NCdM/HEkxogs30SNikJVGHiM=
DB_URL=jdbc:mysql://192.168.1.123:16033/baoboxs-eladmin?useUnicode=true&characterEncoding=UTF-8&allowMultiQueries=true&serverTimezone=GMT%2B8&useSSL=false
DB_USERNAME=root
DB_PASSWORD="hRwUYwq8nVYOSVDC"
SPRING_PROFILES_ACTIVE=dev
```

---

## 一、部署命令（严格遵守）

### 前端部署
```bash
# 生成版本号
TAG=$(date +%y%m%d%H%M%S)
echo "镜像版本: $TAG"

# 构建镜像（名称固定）
docker build -t baoboxs-nav-web:$TAG .

# 停止并删除旧容器（只允许这两个名称）
docker stop baoboxs-nav-web 2>/dev/null || true
docker rm baoboxs-nav-web 2>/dev/null || true

# 启动新容器（名称固定）
docker run -d \
  --name baoboxs-nav-web \
  --restart always \
  -p 43000:3000 \
  -e API_ENV=development \
  -e API_BASE_URL=http://192.168.1.123:48080 \
  baoboxs-nav-web:$TAG
```

### 后端部署
```bash
# 生成版本号
TAG=$(date +%y%m%d%H%M%S)
echo "镜像版本: $TAG"

# 构建镜像（名称固定）
docker build -t baoboxs-nav-service:$TAG .

# 停止并删除旧容器（只允许这两个名称）
docker stop baoboxs-nav-service 2>/dev/null || true
docker rm baoboxs-nav-service 2>/dev/null || true

# 启动新容器（名称固定）
docker run -d \
  --name baoboxs-nav-service \
  --restart always \
  -p 48080:8080 \
  -e SPRING_PROFILES_ACTIVE=dev \
  -e USER_SECRET_KEY="pP+iJXdb+yqPKKK/798NCdM/HEkxogs30SNikJVGHiM=" \
  -e DB_URL="jdbc:mysql://192.168.1.123:16033/baoboxs-eladmin?useUnicode=true&characterEncoding=UTF-8&allowMultiQueries=true&serverTimezone=GMT%2B8&useSSL=false" \
  -e DB_USERNAME=root \
  -e DB_PASSWORD="hRwUYwq8nVYOSVDC" \
  -v /opt/docker/baoboxs/server/:/opt/docker/baoboxs/server/ \
  -v /opt/baoboxs/service/icons:/opt/bbs/tmp/ \
  baoboxs-nav-service:$TAG
```

---

## 二、验证部署

```bash
# 检查容器状态（确认只有这两个容器）
docker ps --filter "name=baoboxs-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 测试后端 API
curl http://192.168.1.123:48080/api/tools/list

# 测试前端
curl -I http://192.168.1.123:43000
```

---

## 三、部署检查清单

### 部署前（必须检查）
- [ ] 执行 `docker ps` 查看现有容器
- [ ] 确认要操作的容器名是 `baoboxs-nav-web` 或 `baoboxs-nav-service`
- [ ] 确认镜像名是 `baoboxs-nav-web` 或 `baoboxs-nav-service`
- [ ] 确认没有通配符或批量操作
- [ ] 确认没有 `prune` 命令

### 部署时
- [ ] 只使用明确的容器名称
- [ ] 镜像版本使用时间戳格式 YYMMDDHHMMSS
- [ ] 不执行任何 `prune` 命令

### 部署后
- [ ] 执行 `docker ps` 确认其他容器正常
- [ ] 检查服务可用性

---

## 四、常见问题

### Q: 需要删除所有容器吗？
A: **不需要！只删除 `baoboxs-nav-web` 和 `baoboxs-nav-service`**

### Q: 可以用 `docker ps -aq` 吗？
A: **不可以！这会获取所有容器ID，可能误删其他服务**

### Q: 镜像版本怎么生成？
A: `TAG=$(date +%y%m%d%H%M%S)`

### Q: 容器名能改吗？
A: **不能！必须是 `baoboxs-nav-web` 或 `baoboxs-nav-service`**

---

_最后更新: 2026-03-23_