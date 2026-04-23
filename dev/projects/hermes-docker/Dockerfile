FROM debian:13.4 AS builder

# 安装系统依赖
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential nodejs npm python3 python3-pip python3-venv \
        ripgrep ffmpeg gcc python3-dev libffi-dev procps git curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# 安装 uv（Python 包管理器）
RUN curl -LsSf https://astral.sh/uv/0.11.6/install.sh | sh
ENV PATH="/root/.local/bin:${PATH}"

# 克隆 Hermes Agent
ARG HERMES_VERSION=main
RUN git clone --depth 1 --branch ${HERMES_VERSION} https://github.com/NousResearch/hermes-agent.git /opt/hermes

WORKDIR /opt/hermes

# 安装 Node 依赖和 Playwright
RUN npm install --prefer-offline --no-audit && \
    npx playwright install --with-deps chromium --only-shell && \
    cd /opt/hermes/scripts/whatsapp-bridge && \
    npm install --prefer-offline --no-audit && \
    npm cache clean --force

# 创建非 root 用户
RUN useradd -u 10000 -m -d /opt/data hermes && \
    chown -R hermes:hermes /opt/hermes

# 安装 Python 依赖
USER hermes
RUN uv venv && \
    uv pip install --no-cache-dir -e ".[all]"

USER root

# Playwright 浏览器放到非卷目录
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/hermes/.playwright
ENV PYTHONUNBUFFERED=1
ENV HERMES_HOME=/opt/data

# entrypoint
COPY entrypoint.sh /opt/hermes/docker/entrypoint.sh
RUN chmod +x /opt/hermes/docker/entrypoint.sh

VOLUME ["/opt/data"]
ENTRYPOINT ["/opt/hermes/docker/entrypoint.sh"]
