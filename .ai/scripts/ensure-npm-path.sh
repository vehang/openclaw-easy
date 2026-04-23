#!/bin/bash
# 确保 npm 全局路径和 Claude Code 配置正确
# 如果发现路径不对，自动修复

NPM_PREFIX="/root/.openclaw/npm-global"
CLAUDE_CONFIG_DIR="/root/.openclaw/claude-config"
CLAUDE_JSON="/root/.openclaw/.claude.json"

echo "===== 检查 npm 全局路径 ====="
EXPECTED_PREFIX="$NPM_PREFIX"
CURRENT_PREFIX=$(npm config get prefix 2>/dev/null)

if [ "$CURRENT_PREFIX" != "$EXPECTED_PREFIX" ]; then
    echo "⚠️ npm prefix 不正确，正在修复..."
    echo "当前: $CURRENT_PREFIX"
    echo "期望: $EXPECTED_PREFIX"
    
    npm config set prefix "$EXPECTED_PREFIX"
    echo "✅ 已修复 npm prefix"
else
    echo "✅ npm prefix 正确: $EXPECTED_PREFIX"
fi

# 确保 PATH 包含自定义目录
export PATH="$NPM_PREFIX/bin:$PATH"

echo ""
echo "===== 检查 Claude Code 配置 ====="

# 检查 ~/.claude 符号链接
if [ ! -L "/root/.claude" ] || [ "$(readlink /root/.claude)" != "$CLAUDE_CONFIG_DIR" ]; then
    echo "⚠️ ~/.claude 符号链接不正确，正在修复..."
    mkdir -p "$CLAUDE_CONFIG_DIR"
    ln -sf "$CLAUDE_CONFIG_DIR" /root/.claude
    echo "✅ 已修复 ~/.claude 符号链接"
else
    echo "✅ ~/.claude 符号链接正确"
fi

# 检查 ~/.claude.json 符号链接
if [ ! -L "/root/.claude.json" ] || [ "$(readlink /root/.claude.json)" != "$CLAUDE_JSON" ]; then
    echo "⚠️ ~/.claude.json 符号链接不正确，正在修复..."
    ln -sf "$CLAUDE_JSON" /root/.claude.json
    echo "✅ 已修复 ~/.claude.json 符号链接"
else
    echo "✅ ~/.claude.json 符号链接正确"
fi

# 检查 settings.json 是否存在
if [ ! -f "$CLAUDE_CONFIG_DIR/settings.json" ]; then
    echo "⚠️ Claude Code settings.json 不存在，正在创建..."
    cat > "$CLAUDE_CONFIG_DIR/settings.json" << 'EOF'
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "697e4a18cc904043a768c421f6b26f1b.D5DLxHV4lKXSSnjl",
    "ANTHROPIC_BASE_URL": "https://open.bigmodel.cn/api/anthropic",
    "API_TIMEOUT_MS": "3000000",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-5",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-5",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-5"
  }
}
EOF
    echo "✅ 已创建 settings.json"
else
    echo "✅ settings.json 存在"
fi

# 检查 .claude.json 是否存在
if [ ! -f "$CLAUDE_JSON" ]; then
    echo "⚠️ .claude.json 不存在，正在创建..."
    echo '{"hasCompletedOnboarding": true}' > "$CLAUDE_JSON"
    echo "✅ 已创建 .claude.json"
else
    echo "✅ .claude.json 存在"
fi

echo ""
echo "===== 检查 claude 命令 ====="
# 检查 claude 是否可用
if command -v claude &>/dev/null; then
    echo "✅ claude 命令可用: $(claude --version 2>&1 | head -1)"
elif [ -x "$NPM_PREFIX/bin/claude" ]; then
    echo "✅ claude 已安装: $NPM_PREFIX/bin/claude"
    echo "   使用: $NPM_PREFIX/bin/claude"
else
    echo "⚠️ claude 未安装，正在安装..."
    npm install -g @anthropic-ai/claude-code
fi

echo ""
echo "===== 全部检查完成 ====="
