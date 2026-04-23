#!/bin/bash
set -e

HERMES_HOME="/opt/data"
INSTALL_DIR="/opt/hermes"

source "${INSTALL_DIR}/.venv/bin/activate"

mkdir -p "$HERMES_HOME"/{cron,sessions,logs,hooks,memories,skills,skins,plans,workspace,home}

# .env
if [ ! -f "$HERMES_HOME/.env" ]; then
    if [ -f "$INSTALL_DIR/hermes.env.example" ]; then
        cp "$INSTALL_DIR/hermes.env.example" "$HERMES_HOME/.env"
    elif [ -f "$INSTALL_DIR/.env.example" ]; then
        cp "$INSTALL_DIR/.env.example" "$HERMES_HOME/.env"
    else
        touch "$HERMES_HOME/.env"
    fi
fi

# config.yaml
if [ ! -f "$HERMES_HOME/config.yaml" ]; then
    if [ -f "$INSTALL_DIR/cli-config.yaml.example" ]; then
        cp "$INSTALL_DIR/cli-config.yaml.example" "$HERMES_HOME/config.yaml"
    else
        touch "$HERMES_HOME/config.yaml"
    fi
fi

# SOUL.md
if [ ! -f "$HERMES_HOME/SOUL.md" ]; then
    if [ -f "$INSTALL_DIR/docker/SOUL.md" ]; then
        cp "$INSTALL_DIR/docker/SOUL.md" "$HERMES_HOME/SOUL.md"
    else
        echo "# Hermes Agent\n\nYou are a helpful AI assistant." > "$HERMES_HOME/SOUL.md"
    fi
fi

# Sync bundled skills
if [ -d "$INSTALL_DIR/skills" ] && [ -f "$INSTALL_DIR/tools/skills_sync.py" ]; then
    python3 "$INSTALL_DIR/tools/skills_sync.py"
fi

# === 确保 NIM 配置存在于 config.yaml ===
python3 /opt/data/ensure-nim.py

exec hermes "$@"
