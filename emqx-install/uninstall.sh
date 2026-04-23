#!/bin/bash
#
# EMQX 卸载脚本
# 警告: 会删除所有数据!
#

INSTALL_DIR="/opt/tilldream/docker/emqx"

echo "=========================================="
echo "  EMQX 卸载脚本"
echo "=========================================="
echo ""
echo "⚠️  警告: 此操作将删除所有 EMQX 数据!"
echo ""
read -p "确认卸载? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "已取消"
    exit 0
fi

echo ""
echo "停止服务..."
cd ${INSTALL_DIR}
docker compose down -v 2>/dev/null || true

echo "删除目录..."
rm -rf ${INSTALL_DIR}

echo ""
echo "✅ EMQX 已完全卸载"
