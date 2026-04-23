#!/bin/bash
#
# SSL 证书生成脚本
# 生成自签名证书用于 MQTT SSL/TLS
#

CERTS_DIR="/opt/tilldream/docker/emqx/certs"

echo "=========================================="
echo "  生成 SSL 自签名证书"
echo "=========================================="

# 检查目录
if [ ! -d "$CERTS_DIR" ]; then
    echo "创建证书目录..."
    mkdir -p ${CERTS_DIR}
fi

cd ${CERTS_DIR}

# 获取服务器 IP
read -p "请输入服务器 IP 或域名: " SERVER_NAME
SERVER_NAME=${SERVER_NAME:-"localhost"}

echo ""
echo "生成 CA 证书..."
openssl genrsa -out ca.key 2048 2>/dev/null
openssl req -new -x509 -days 3650 -key ca.key -out ca.crt \
    -subj "/C=CN/ST=Beijing/L=Beijing/O=TillDream/CN=EMQX-CA" 2>/dev/null

echo "生成服务器证书..."
openssl genrsa -out server.key 2048 2>/dev/null
openssl req -new -key server.key -out server.csr \
    -subj "/C=CN/ST=Beijing/L=Beijing/O=TillDream/CN=${SERVER_NAME}" 2>/dev/null

echo "签名服务器证书..."
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key \
    -CAcreateserial -out server.crt -days 3650 2>/dev/null

# 清理临时文件
rm -f server.csr ca.srl

# 设置权限
chmod 644 ca.crt server.crt
chmod 600 ca.key server.key

echo ""
echo "✅ 证书生成完成!"
echo ""
echo "证书文件:"
ls -la ${CERTS_DIR}
echo ""
echo "重启 EMQX 以应用证书:"
echo "  cd /opt/tilldream/docker/emqx && ./scripts/restart.sh"
