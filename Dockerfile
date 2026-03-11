# OpenClaw Easy Docker Image
# 基于上游镜像 justlikemaki/openclaw-docker-cn-im，集成 Web 配置界面

FROM justlikemaki/openclaw-docker-cn-im:latest

LABEL maintainer="OpenClaw Easy"
LABEL description="OpenClaw with Web Configuration Interface"
LABEL version="1.0.0"

# 安装 supervisord 用于进程管理
RUN apt-get update && \
    apt-get install -y --no-install-recommends supervisor && \
    rm -rf /var/lib/apt/lists/*

# 创建日志目录
RUN mkdir -p /var/log/supervisor

# 复制 openclaw-easy Web 界面（当前目录）
COPY . /app/openclaw-easy
WORKDIR /app/openclaw-easy

# 安装 openclaw-easy 依赖
RUN npm install --production

# 复制修复后的启动脚本
COPY init-fixed.sh /usr/local/bin/init-fixed.sh
RUN chmod +x /usr/local/bin/init-fixed.sh

# 复制 supervisord 配置
COPY supervisord.conf /etc/supervisor/conf.d/openclaw.conf

# 暴露端口
# 18780: Web 配置界面
# 18789: OpenClaw Gateway API
# 18790: Gateway Control UI (可选)
EXPOSE 18780 18789 18790

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:18789/health && curl -f http://localhost:18780/api/status || exit 1

# 使用 supervisord 启动
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/openclaw.conf"]
