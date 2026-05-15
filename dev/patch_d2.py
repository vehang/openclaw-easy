with open('/root/.openclaw/workspace/openclaw-easy/docker/Dockerfile.integrated', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if '安装 NIM YX Auth 插件' in line and '构建时安装' in line:
        new_lines.append('# ========== 安装 NIM YX Auth 插件 ==========\n')
        new_lines.append('# 构建时通过 openclaw plugins install 安装，启动时和 simple 接口仅做兜底\n')
        skip = True
        continue
    if skip and line.strip().startswith('ARG NIM_PLUGIN_VERSION'):
        new_lines.append(line)
        new_lines.append('RUN openclaw plugins install "openclaw-nim-yx-auth@${NIM_PLUGIN_VERSION}"\n')
        skip = False
        continue
    if skip:
        continue
    new_lines.append(line)

with open('/root/.openclaw/workspace/openclaw-easy/docker/Dockerfile.integrated', 'w') as f:
    f.writelines(new_lines)
print('OK')
