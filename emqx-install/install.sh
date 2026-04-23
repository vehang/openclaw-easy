#!/bin/bash
#
# EMQX 一键安装脚本
# 安装目录: /opt/tilldream/docker/emqx
#

set -e

INSTALL_DIR="/opt/tilldream/docker/emqx"

echo "=========================================="
echo "  EMQX MQTT Broker 安装脚本"
echo "=========================================="

# 检查 root 权限
if [ "$EUID" -ne 0 ]; then
    echo "请使用 root 权限运行此脚本"
    echo "sudo bash $0"
    exit 1
fi

# 创建目录结构
echo "[1/5] 创建目录结构..."
mkdir -p ${INSTALL_DIR}/{data,log,etc,plugins,certs}
mkdir -p ${INSTALL_DIR}/scripts

# 创建 docker-compose.yml
echo "[2/5] 创建 docker-compose.yml..."
cat > ${INSTALL_DIR}/docker-compose.yml << 'EOF'
version: '3.8'

services:
  emqx:
    image: emqx/emqx:5.5.0
    container_name: emqx
    restart: unless-stopped
    hostname: emqx
    ports:
      # MQTT 协议端口
      - "1883:1883"      # MQTT TCP
      - "8883:8883"      # MQTT SSL/TLS
      - "8083:8083"      # WebSocket
      - "8084:8084"      # WSS (WebSocket Secure)
      # 管理端口
      - "18083:18083"    # Dashboard 管理界面
      # 集群端口（多节点时使用）
      - "4370:4370"      # 集群 RPC
      - "5370:5370"      # 集群 RPC
    environment:
      # 时区
      - TZ=Asia/Shanghai
      # 节点名称
      - EMQX_NODE_NAME=emqx@0.0.0.0
      # 节点 cookie（集群用）
      - EMQX_NODE_COOKIE=emqxsecretcookie
      # Dashboard 管理员账号
      - EMQX_DASHBOARD__DEFAULT_USERNAME=admin
      - EMQX_DASHBOARD__DEFAULT_PASSWORD=Admin@123456
      # 监听器配置
      - EMQX_LISTENERS__TCP__DEFAULT__BIND=1883
      - EMQX_LISTENERS__SSL__DEFAULT__BIND=8883
      - EMQX_LISTENERS__WS__DEFAULT__BIND=8083
      - EMQX_LISTENERS__WSS__DEFAULT__BIND=8084
    volumes:
      - ./data:/opt/emqx/data
      - ./log:/opt/emqx/log
      - ./etc:/opt/emqx/etc
      - ./plugins:/opt/emqx/plugins
      - ./certs:/opt/emqx/certs
    healthcheck:
      test: ["CMD", "emqx", "ctl", "status"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "5"
    networks:
      - emqx-network

networks:
  emqx-network:
    driver: bridge
    name: emqx-network
EOF

# 创建启动脚本
echo "[3/5] 创建管理脚本..."
cat > ${INSTALL_DIR}/scripts/start.sh << 'EOF'
#!/bin/bash
# 启动 EMQX 服务

cd /opt/tilldream/docker/emqx
docker compose up -d

echo "等待 EMQX 启动..."
sleep 10

# 检查状态
if docker compose ps | grep -q "Up"; then
    echo "✅ EMQX 启动成功!"
    echo ""
    echo "Dashboard: http://$(hostname -I | awk '{print $1}'):18083"
    echo "MQTT 端口: 1883"
    echo "用户名: admin"
    echo "密码: Admin@123456"
else
    echo "❌ EMQX 启动失败，请检查日志"
    docker compose logs
fi
EOF

# 创建停止脚本
cat > ${INSTALL_DIR}/scripts/stop.sh << 'EOF'
#!/bin/bash
# 停止 EMQX 服务

cd /opt/tilldream/docker/emqx
docker compose down
echo "✅ EMQX 已停止"
EOF

# 创建重启脚本
cat > ${INSTALL_DIR}/scripts/restart.sh << 'EOF'
#!/bin/bash
# 重启 EMQX 服务

cd /opt/tilldream/docker/emqx
docker compose restart
echo "✅ EMQX 已重启"
EOF

# 创建状态检查脚本
cat > ${INSTALL_DIR}/scripts/status.sh << 'EOF'
#!/bin/bash
# 查看 EMQX 状态

cd /opt/tilldream/docker/emqx

echo "=== 容器状态 ==="
docker compose ps

echo ""
echo "=== EMQX 状态 ==="
docker exec emqx emqx ctl status 2>/dev/null || echo "EMQX 未运行"

echo ""
echo "=== 连接数 ==="
docker exec emqx emqx ctl broker 2>/dev/null || true
EOF

# 创建日志查看脚本
cat > ${INSTALL_DIR}/scripts/logs.sh << 'EOF'
#!/bin/bash
# 查看 EMQX 日志

cd /opt/tilldream/docker/emqx
docker compose logs -f --tail=100 "$@"
EOF

# 创建 MQTT 测试脚本
cat > ${INSTALL_DIR}/scripts/mqtt-test.sh << 'EOF'
#!/bin/bash
# MQTT 连接测试脚本

HOST=${1:-"localhost"}
PORT=${2:-"1883"}
TOPIC="test/hello"

echo "=== MQTT 连接测试 ==="
echo "Broker: ${HOST}:${PORT}"
echo "Topic: ${TOPIC}"
echo ""

# 检查 mosquitto-clients
if ! command -v mosquitto_pub &> /dev/null; then
    echo "安装 mosquitto-clients..."
    apt-get update && apt-get install -y mosquitto-clients
fi

echo "发布测试消息..."
mosquitto_pub -h ${HOST} -p ${PORT} -t "${TOPIC}" -m "Hello EMQX! $(date)"

if [ $? -eq 0 ]; then
    echo "✅ MQTT 连接正常!"
else
    echo "❌ MQTT 连接失败!"
fi
EOF

# 设置脚本权限
chmod +x ${INSTALL_DIR}/scripts/*.sh

# 创建 EMQX 配置文件
echo "[4/5] 创建 EMQX 配置文件..."
cat > ${INSTALL_DIR}/etc/emqx.conf << 'EOF'
## EMQX 配置文件
## 更多配置: https://www.emqx.io/docs/zh/latest/configuration/configuration.html

## 节点配置
node {
  name = "emqx@0.0.0.0"
  cookie = "emqxsecretcookie"
  data_dir = "data"
}

## 集群配置（单机模式）
cluster {
  name = emqxcl
  discovery_strategy = manual
}

## 日志配置
log {
  file {
    enable = true
    level = info
    path = "/opt/emqx/log/emqx.log"
    rotation_count = 10
    rotation_size = "50MB"
  }
  console {
    enable = true
    level = info
  }
}

## MQTT 监听器
listeners.tcp.default {
  bind = "0.0.0.0:1883"
  max_connections = 1024000
  mqtt.max_packet_size = "1MB"
}

listeners.ssl.default {
  bind = "0.0.0.0:8883"
  max_connections = 512000
  ssl_options {
    cacertfile = "/opt/emqx/certs/ca.crt"
    certfile = "/opt/emqx/certs/server.crt"
    keyfile = "/opt/emqx/certs/server.key"
    verify = verify_none
    fail_if_no_peer_cert = false
  }
}

listeners.ws.default {
  bind = "0.0.0.0:8083"
  max_connections = 1024000
  websocket.mqtt_path = "/mqtt"
}

listeners.wss.default {
  bind = "0.0.0.0:8084"
  max_connections = 512000
  websocket.mqtt_path = "/mqtt"
  ssl_options {
    cacertfile = "/opt/emqx/certs/ca.crt"
    certfile = "/opt/emqx/certs/server.crt"
    keyfile = "/opt/emqx/certs/server.key"
  }
}

## Dashboard 配置
dashboard {
  listeners.http {
    bind = "0.0.0.0:18083"
  }
  default_username = "admin"
  default_password = "Admin@123456"
}

## 限流配置
limiter {
  bytes_in {
    rate = "100MB/s"
    capacity = "100MB"
  }
  message_in {
    rate = "50000/s"
    capacity = 50000
  }
}
EOF

# 创建 ACL 配置
cat > ${INSTALL_DIR}/etc/acl.conf << 'EOF'
## ACL 访问控制列表

## 允许 dashboard 用户订阅所有主题
{allow, {user, "dashboard"}, subscribe, ["#"]}.

## 允许 admin 用户所有操作
{allow, {user, "admin"}, all, ["#"]}.

## 拒绝所有用户订阅系统主题
{deny, all, subscribe, ["$SYS/#", "eq #"]}.

## 拒绝所有用户向系统主题发布消息
{deny, all, publish, ["$SYS/#"]}.

## 允许客户端订阅自己的上下线消息
{allow, all, subscribe, ["$SYS/brokers/+/clients/+#"]}.

## 允许所有客户端发布和订阅（开发环境，生产环境请修改）
{allow, all, all, ["#"]}.
EOF

# 创建 README
cat > ${INSTALL_DIR}/README.md << 'EOF'
# EMQX MQTT Broker

## 目录结构
```
/opt/tilldream/docker/emqx/
├── docker-compose.yml    # Docker Compose 配置
├── data/                 # 数据目录
├── log/                  # 日志目录
├── etc/                  # 配置文件
│   ├── emqx.conf        # EMQX 主配置
│   └── acl.conf         # ACL 访问控制
├── plugins/              # 插件目录
├── certs/                # SSL 证书目录
└── scripts/              # 管理脚本
    ├── start.sh         # 启动
    ├── stop.sh          # 停止
    ├── restart.sh       # 重启
    ├── status.sh        # 状态
    ├── logs.sh          # 日志
    └── mqtt-test.sh     # 测试
```

## 端口说明
| 端口 | 用途 |
|------|------|
| 1883 | MQTT TCP |
| 8883 | MQTT SSL/TLS |
| 8083 | WebSocket |
| 8084 | WSS |
| 18083 | Dashboard |

## 快速使用

### 启动服务
```bash
./scripts/start.sh
# 或
docker compose up -d
```

### 停止服务
```bash
./scripts/stop.sh
```

### 查看状态
```bash
./scripts/status.sh
```

### 查看日志
```bash
./scripts/logs.sh
```

### 访问 Dashboard
- URL: http://服务器IP:18083
- 用户名: admin
- 密码: Admin@123456

## 客户端测试

### 使用 mosquitto-clients
```bash
# 安装
apt-get install mosquitto-clients

# 订阅
mosquitto_sub -h 服务器IP -p 1883 -t "test/#" -v

# 发布
mosquitto_pub -h 服务器IP -p 1883 -t "test/hello" -m "Hello"
```

### 使用 Python
```python
import paho.mqtt.client as mqtt

client = mqtt.Client()
client.connect("服务器IP", 1883, 60)
client.publish("test/hello", "Hello EMQX!")
```

## 生产环境配置

### 1. 修改默认密码
修改 docker-compose.yml 中的:
- EMQX_DASHBOARD__DEFAULT_USERNAME
- EMQX_DASHBOARD__DEFAULT_PASSWORD

### 2. 配置认证
在 Dashboard 中: 访问控制 → 认证 → 创建

### 3. 配置 SSL
将证书放入 certs/ 目录，修改 emqx.conf

### 4. 修改 ACL
修改 etc/acl.conf 限制客户端权限

EOF

# 设置权限
echo "[5/5] 设置权限..."
chown -R 1000:1000 ${INSTALL_DIR}

echo ""
echo "=========================================="
echo "  ✅ EMQX 安装完成!"
echo "=========================================="
echo ""
echo "安装目录: ${INSTALL_DIR}"
echo ""
echo "快速启动:"
echo "  cd ${INSTALL_DIR}"
echo "  ./scripts/start.sh"
echo ""
echo "或使用 docker compose:"
echo "  cd ${INSTALL_DIR}"
echo "  docker compose up -d"
echo ""
echo "Dashboard: http://服务器IP:18083"
echo "用户名: admin"
echo "密码: Admin@123456"
echo ""
