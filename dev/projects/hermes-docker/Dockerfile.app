# ========================================
# Layer 2: Hermes Agent App
# 基于 base 镜像，安装 Hermes 源码 + 依赖
# ========================================
ARG BASE_IMAGE=hermes-base:latest
FROM ${BASE_IMAGE}

ARG HERMES_VERSION=main

# 克隆 Hermes 源码
WORKDIR /opt
RUN rm -rf /opt/hermes && \
    git clone --depth 1 --branch ${HERMES_VERSION} \
    https://github.com/NousResearch/hermes-agent.git /opt/hermes && \
    rm -rf /opt/hermes/.git

WORKDIR /opt/hermes

# 配置 npm 国内镜像加速
RUN npm config set registry https://registry.npmmirror.com

# 安装 Node 依赖
RUN npm install --prefer-offline --no-audit && \
    cd /opt/hermes/scripts/whatsapp-bridge && \
    npm install --prefer-offline --no-audit && \
    npm cache clean --force

# 安装 Python 依赖（含飞书 SDK）- 使用国内镜像
RUN uv venv && \
    uv pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple -e ".[all]" && \
    uv pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple lark-oapi

# 预置默认配置
COPY hermes.env /opt/hermes/hermes.env.example

# entrypoint
COPY entrypoint.sh /opt/hermes/docker/entrypoint.sh
RUN chmod +x /opt/hermes/docker/entrypoint.sh

ENV HERMES_HOME=/opt/data
VOLUME ["/opt/data"]
ENTRYPOINT ["/opt/hermes/docker/entrypoint.sh"]
