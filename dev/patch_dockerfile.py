import re

with open('/root/.openclaw/workspace/openclaw-easy/docker/Dockerfile.integrated', 'r') as f:
    content = f.read()

old = """# ========== 准备种子目录 ==========
# NIM YX Auth 插件改为启动时通过 openclaw plugins install 安装
# 不再在构建时 git clone，构建更快、镜像更小
RUN mkdir -p /root/.openclaw-seed/extensions

# ========== 清理运行目录（启动时会从种子目录同步） ==========
RUN rm -rf /root/.openclaw/extensions/* 2>/dev/null || true"""

new = """# ========== 安装 NIM YX Auth 插件 ==========
# 构建时安装，启动时和 simple 接口仅做兜底
ARG NIM_PLUGIN_VERSION=0.3.0
RUN echo "=== 安装 NIM YX Auth 插件@${NIM_PLUGIN_VERSION} ===" && \
    mkdir -p /root/.openclaw/extensions && \
    cd /tmp && \
    npm pack "openclaw-nim-yx-auth@${NIM_PLUGIN_VERSION}" && \
    tgz=$(ls openclaw-nim-yx-auth-*.tgz | head -1) && \
    mkdir -p /root/.openclaw/extensions/openclaw-nim-yx-auth && \
    tar xzf "$tgz" -C /root/.openclaw/extensions/openclaw-nim-yx-auth --strip-components=1 && \
    cd /root/.openclaw/extensions/openclaw-nim-yx-auth && \
    npm install --production && \
    rm -rf /tmp/openclaw-nim-yx-auth-*.tgz .git dist node_modules/.cache && \
    echo "✅ NIM YX Auth 插件@${NIM_PLUGIN_VERSION} 安装完成"

# ========== 准备种子目录（保留，兼容旧逻辑） ==========
RUN mkdir -p /root/.openclaw-seed/extensions"""

if old in content:
    content = content.replace(old, new)
    with open('/root/.openclaw/workspace/openclaw-easy/docker/Dockerfile.integrated', 'w') as f:
        f.write(content)
    print('PATCHED OK')
else:
    print('NOT FOUND')
