# OpenClaw Easy Docker Image
# 基于上游镜像 justlikemaki/openclaw-docker-cn-im，集成 Web 配置界面和 NIM 插件

FROM justlikemaki/openclaw-docker-cn-im:latest

LABEL maintainer="OpenClaw Easy"
LABEL description="OpenClaw with Web Configuration Interface - 耘想定制版"
LABEL version="1.2.1"

# 安装 supervisord 和 git（用于克隆插件）
RUN apt-get update && \
    apt-get install -y --no-install-recommends supervisor git && \
    rm -rf /var/lib/apt/lists/*

# 创建日志目录
RUN mkdir -p /var/log/supervisor

# ========== NIM YX Auth 插件安装 ==========
# 参考: openclaw-nim-yx-auth/DEPLOY.md

# 1. 创建插件目录并提前设置权限（目录为空，很快）
RUN mkdir -p /home/node/.openclaw/extensions/openclaw-nim-yx-auth && \
    chown -R node:node /home/node/.openclaw

# 2. 从 GitHub 克隆插件源码，以 node 用户身份
RUN git clone --depth 1 https://github.com/vehang/openclaw-nim-yx-auth.git /tmp/openclaw-nim-yx-auth && \
    cp -r /tmp/openclaw-nim-yx-auth/* /home/node/.openclaw/extensions/openclaw-nim-yx-auth/ && \
    rm -rf /tmp/openclaw-nim-yx-auth && \
    chown -R node:node /home/node/.openclaw/extensions/openclaw-nim-yx-auth

# 3. 以 node 用户身份安装依赖（避免后续 chown 耗时）
RUN su - node -c "cd /home/node/.openclaw/extensions/openclaw-nim-yx-auth && \
    npm install --production && \
    npm install nim-web-sdk-ng@10.9.77-alpha.3"

# 4. 清理不需要的文件
RUN rm -rf /home/node/.openclaw/extensions/openclaw-nim-yx-auth/.git \
    /home/node/.openclaw/extensions/openclaw-nim-yx-auth/dist \
    /home/node/.openclaw/extensions/openclaw-nim-yx-auth/node_modules/.cache

# ========== OpenClaw Easy Web 界面 ==========

# 复制 openclaw-easy Web 界面
COPY . /app/openclaw-easy
WORKDIR /app/openclaw-easy

# 安装 openclaw-easy 依赖
RUN npm install --production

# 设置默认工作目录
WORKDIR /home/node

# 复制启动脚本
COPY init-fixed.sh /usr/local/bin/init-fixed.sh
RUN chmod +x /usr/local/bin/init-fixed.sh

# 复制 supervisord 配置
COPY supervisord.conf /etc/supervisor/conf.d/openclaw.conf

# 清除基础镜像的 ENTRYPOINT
ENTRYPOINT []

# 禁用环境变量同步
ENV SYNC_MODEL_CONFIG=false

# 暴露端口
# 18780: Web 配置界面
# 18789: OpenClaw Gateway API
# 18790: Gateway Control UI
EXPOSE 18780 18789 18790

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:18789/health && curl -f http://localhost:18780/api/status || exit 1

# 启动
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/openclaw.conf"]