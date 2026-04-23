# ========================================
# Layer 3: Hermes App (NIM Version)
# 基于 nim-node，只安装 Python 依赖 + NIM
# 这一层构建很快
# ========================================
ARG NODE_IMAGE=hermes-cloud-node:latest
FROM ${NODE_IMAGE}

# 安装 Python 依赖 + 飞书 + NIM 支持
RUN uv venv && \
    uv pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple -e ".[all]" && \
    uv pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple \
        lark-oapi \
        "nim-bot-py>=0.1.0b1"

# 安装 NIM bridge JS 依赖（nim-bot-py 的 Node.js bridge 需要）
RUN BRIDGE_DIR=$(.venv/bin/python3 -c "import nim_bot_py; import os; print(os.path.join(os.path.dirname(nim_bot_py.__file__), 'bridge_js'))") && \
    cd "$BRIDGE_DIR" && \
    npm install --registry https://registry.npmmirror.com && \
    npm cache clean --force

# 预置 NIM 环境变量示例
COPY hermes-nim.env /opt/hermes/hermes-nim.env.example

# entrypoint（复用现有的）
COPY entrypoint.sh /opt/hermes/docker/entrypoint.sh
RUN chmod +x /opt/hermes/docker/entrypoint.sh

ENV HERMES_HOME=/opt/data
VOLUME ["/opt/data"]
ENTRYPOINT ["/opt/hermes/docker/entrypoint.sh"]