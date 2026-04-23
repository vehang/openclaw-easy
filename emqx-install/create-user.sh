#!/bin/bash
#
# 创建 MQTT 用户脚本
#

INSTALL_DIR="/opt/tilldream/docker/emqx"

echo "=========================================="
echo "  创建 MQTT 用户"
echo "=========================================="

read -p "用户名: " USERNAME
read -s -p "密码: " PASSWORD
echo ""
read -s -p "确认密码: " PASSWORD2
echo ""

if [ "$PASSWORD" != "$PASSWORD2" ]; then
    echo "❌ 密码不匹配!"
    exit 1
fi

# 检查容器是否运行
if ! docker ps | grep -q emqx; then
    echo "❌ EMQX 容器未运行，请先启动"
    exit 1
fi

# 创建用户
echo ""
echo "创建用户..."
docker exec emqx emqx ctl admins add ${USERNAME} ${PASSWORD}

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 用户创建成功!"
    echo "用户名: ${USERNAME}"
else
    echo ""
    echo "❌ 用户创建失败"
fi
