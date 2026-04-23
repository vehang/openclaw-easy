# OpenClaw Docker 镜像 - ROOT 版本 (国内加速版)
# 此版本以 root 用户运行，适合智能体工具需要高权限的场景
FROM node:22-slim

# 从 Python 官方镜像拷贝 Python 3.12 (确保使用与 node 镜像一致的 Debian Bookworm 版本)
COPY --from=python:3.12-slim-bookworm /usr/local /usr/local

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV BUN_INSTALL="/usr/local" \
    PATH="/usr/local/bin:$PATH" \
    DEBIAN_FRONTEND=noninteractive

# 1. 配置国内镜像源加速
RUN sed -i 's|http://deb.debian.org|http://mirrors.aliyun.com|g' /etc/apt/sources.list.d/debian.sources && \
    sed -i 's|http://security.debian.org|http://mirrors.aliyun.com|g' /etc/apt/sources.list.d/debian.sources

# 2. 系统依赖安装与全局工具安装
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    bash \
    ca-certificates \
    chromium \
    curl \
    docker.io \
    build-essential \
    ffmpeg \
    fonts-liberation \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    git \
    jq \
    locales \
    openssh-client \
    procps \
    socat \
    tini \
    unzip && \
    sed -i 's/^# *en_US.UTF-8 UTF-8$/en_US.UTF-8 UTF-8/' /etc/locale.gen && \
    locale-gen && \
    printf 'LANG=en_US.UTF-8\nLANGUAGE=en_US:en\nLC_ALL=en_US.UTF-8\n' > /etc/default/locale && \
    git config --system url."https://github.com/".insteadOf ssh://git@github.com/ && \
    # 设置 npm 镜像
    npm config set registry https://registry.npmmirror.com && \
    npm install -g openclaw@2026.4.1 opencode-ai@latest clawhub playwright playwright-extra puppeteer-extra-plugin-stealth @steipete/bird && \
    # 安装 bun、uv 和 qmd (使用国内镜像)
    curl -fsSL https://bun.sh/install | BUN_INSTALL=/usr/local bash && \
    curl -LsSf https://astral.sh/uv/install.sh | env UV_INSTALL_DIR=/usr/local/bin sh && \
    # 建立 python3 -> python 链接并安装 websockify (使用清华 pip 镜像)
    ln -sf /usr/local/bin/python3 /usr/local/bin/python && \
    /usr/local/bin/python3 -m pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple websockify && \
    npm install -g @tobilu/qmd@1.1.6 && \
    # 安装 Playwright 浏览器依赖
    npx playwright install chromium --with-deps && \
    # 清理 apt 缓存
    apt-get purge -y --auto-remove && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /root/.npm /root/.cache

# 3. 插件安装（ROOT 版本：所有操作都在 root 下进行）
RUN mkdir -p /root/.openclaw/workspace /root/.openclaw/extensions

# 设置环境变量（ROOT 版本）
ENV HOME=/root
WORKDIR /root

# 安装linuxbrew（Homebrew 的 Linux 版本），使用国内镜像
RUN mkdir -p /root/.linuxbrew/Homebrew && \
    git clone --depth 1 https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/brew.git /root/.linuxbrew/Homebrew && \
    mkdir -p /root/.linuxbrew/bin && \
    ln -s /root/.linuxbrew/Homebrew/bin/brew /root/.linuxbrew/bin/brew && \
    chmod -R g+rwX /root/.linuxbrew

# 设置 Homebrew 国内镜像
ENV HOMEBREW_API_DOMAIN=https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/homebrew-api.git \
    HOMEBREW_BOTTLE_DOMAIN=https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/homebrew-bottles.git \
    HOMEBREW_BREW_GIT_REMOTE=https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/brew.git \
    HOMEBREW_CORE_GIT_REMOTE=https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/homebrew-core.git

RUN cd /root/.openclaw/extensions && \
  git clone --depth 1 -b v4.17.25 https://github.com/Daiyimo/openclaw-napcat.git napcat && \
  cd napcat && \
  npm install --production && \
  timeout 300 openclaw plugins install -l . || true && \
  cd /root/.openclaw/extensions && \
  timeout 300 openclaw plugins install @soimy/dingtalk || true && \
  timeout 300 openclaw plugins install @tencent-connect/openclaw-qqbot@latest || true && \
  timeout 300 openclaw plugins install @sunnoy/wecom || true && \
  mkdir -p /root/.openclaw /root/.openclaw-seed && \
  find /root/.openclaw/extensions -name ".git" -type d -exec rm -rf {} + && \
  mv /root/.openclaw/extensions /root/.openclaw-seed/ && \
  printf '%s\n' '2026.4.1' > /root/.openclaw-seed/extensions/.seed-version && \
  rm -rf /tmp/* /root/.npm /root/.cache

# 4. 最终配置（ROOT 版本：无需切换用户）

# 复制初始化脚本并确保换行符为 LF
COPY ./init.sh /usr/local/bin/init.sh
RUN sed -i 's/\r$//' /usr/local/bin/init.sh && \
    chmod +x /usr/local/bin/init.sh

# 设置环境变量（ROOT 版本）
ENV HOME=/root \
    TERM=xterm-256color \
    NODE_PATH=/usr/local/lib/node_modules \
    LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en \
    LC_ALL=en_US.UTF-8 \
    NODE_ENV=production \
    PATH="/root/.linuxbrew/bin:/root/.linuxbrew/sbin:/usr/local/lib/node_modules/.bin:${PATH}" \
    HOMEBREW_NO_AUTO_UPDATE=1 \
    HOMEBREW_NO_INSTALL_CLEANUP=1

# 暴露端口
EXPOSE 18789 18790

# 设置工作目录为 root home（ROOT 版本）
WORKDIR /root

# 使用初始化脚本作为入口点
ENTRYPOINT ["/bin/bash", "/usr/local/bin/init.sh"]