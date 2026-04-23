#!/bin/bash
# Hermes Docker 快速配置脚本
# 用法: docker exec -i hermes-test bash < setup.sh
# 或者: docker cp 本地文件 hermes-test:/opt/data/

set -e

# ====== 修改这里 ======
# LLM 配置（智谱 GLM）
LLM_PROVIDER="zai"
LLM_MODEL="glm-5.1"
LLM_API_KEY="30aea80a14684247b415d81c75bc8b6d.YkKelX1WBIOt2xPC"
LLM_BASE_URL="https://open.bigmodel.cn/api/paas/v4"

# 开放访问（测试用）
GATEWAY_ALLOW_ALL="true"

# ====== 写入 .env ======
cat > /opt/data/.env << EOF
# LLM - 智谱 GLM
GLM_API_KEY=${LLM_API_KEY}
GLM_BASE_URL=${LLM_BASE_URL}

# 开放访问
GATEWAY_ALLOW_ALL_USERS=${GATEWAY_ALLOW_ALL}
EOF

# ====== 写入 config.yaml 关键配置 ======
python3 << PYEOF
import yaml

cfg_path = "/opt/data/config.yaml"
with open(cfg_path, "r") as f:
    cfg = yaml.safe_load(f)

# Model
cfg["model"]["default"] = "${LLM_MODEL}"
cfg["model"]["provider"] = "${LLM_PROVIDER}"
cfg["model"]["base_url"] = "${LLM_BASE_URL}"

with open(cfg_path, "w") as f:
    yaml.dump(cfg, f, default_flow_style=False)

print("✅ 配置完成")
PYEOF

echo "✅ .env 和 config.yaml 已更新"
echo "重启容器生效: docker restart hermes-test"
