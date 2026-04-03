# OpenClaw Easy Docker Image
# 基于上游镜像 justlikemaki/openclaw-docker-cn-im，集成 Web 配置界面和 NIM 插件

FROM justlikemaki/openclaw-docker-cn-im:latest

LABEL maintainer="OpenClaw Easy"
LABEL description="OpenClaw with Web Configuration Interface - 耘想定制版"
LABEL version="1.2.5"

# 安装 supervisord 和 git
RUN apt-get update && \
    apt-get install -y --no-install-recommends supervisor git && \
    rm -rf /var/lib/apt/lists/*

# 创建日志目录
RUN mkdir -p /var/log/supervisor

# ========== 插件安装（以 root 身份）==========

# 创建插件目录
RUN mkdir -p /home/node/.openclaw/extensions

# 设置工作目录
WORKDIR /home/node/.openclaw/extensions

# ---------- NIM YX Auth 插件 ----------
RUN mkdir -p openclaw-nim-yx-auth && \
    cd /tmp && \
    git clone --depth 1 https://github.com/vehang/openclaw-nim-yx-auth.git && \
    cp -r /tmp/openclaw-nim-yx-auth/* /home/node/.openclaw/extensions/openclaw-nim-yx-auth/ && \
    cd /home/node/.openclaw/extensions/openclaw-nim-yx-auth && \
    npm install --production && \
    npm install nim-web-sdk-ng@10.9.77-alpha.3 && \
    rm -rf .git dist node_modules/.cache /tmp/openclaw-nim-yx-auth

# ---------- 个人微信插件 ----------
RUN cd /home/node/.openclaw/extensions && \
    # 创建临时目录安装
    mkdir -p .weixin-tmp && \
    cd .weixin-tmp && \
    npm init -y && \
    npm install @tencent-weixin/openclaw-weixin && \
    # 把插件和依赖整合到一起
    cd .. && \
    mv .weixin-tmp/node_modules/@tencent-weixin/openclaw-weixin openclaw-weixin && \
    mv .weixin-tmp/node_modules openclaw-weixin/node_modules 2>/dev/null || true && \
    rm -rf .weixin-tmp && \
    echo "=== 插件目录内容 ===" && \
    ls -la /home/node/.openclaw/extensions/ && \
    echo "=== 微信插件内容 ===" && \
    ls -la /home/node/.openclaw/extensions/openclaw-weixin/

# 清理 npm 缓存
RUN rm -rf /root/.npm /tmp/*

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
EXPOSE 18780 18789 18790

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:18789/health && curl -f http://localhost:18780/api/status || exit 1

# 启动
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/openclaw.conf"]