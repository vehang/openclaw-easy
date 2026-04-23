// 修复后的 getDefaultConfig 函数
function getDefaultConfig() {
    return {
        "meta": {
            "lastTouchedVersion": "2026.3.8"
        },
        "update": {
            "checkOnStart": false
        },
        "browser": {
            "headless": true,
            "noSandbox": true,
            "defaultProfile": "openclaw",
            "executablePath": "/usr/bin/chromium"
        },
        "models": {
            "mode": "merge",
            "providers": {}
        },
        "agents": {
            "defaults": {
                "model": {
                    "primary": "default/glm-5"
                },
                "imageModel": {
                    "primary": "default/glm-5"
                },
                "workspace": "/home/node/.openclaw/workspace",
                "compaction": {
                    "mode": "safeguard",
                    "reserveTokensFloor": 20000
                },
                "sandbox": {
                    "mode": "off"
                },
                "elevatedDefault": "full",
                "timeoutSeconds": 300,
                "maxConcurrent": 4,
                "subagents": {
                    "maxConcurrent": 8
                }
            }
        },
        "tools": {
            "profile": "full",
            "sessions": {
                "visibility": "all"
            },
            "fs": {
                "workspaceOnly": true
            }
        },
        "messages": {
            "ackReactionScope": "group-mentions",
            "tts": {
                "edge": {
                    "voice": "zh-CN-XiaoxiaoNeural"
                }
            }
        },
        "commands": {
            "native": "auto",
            "nativeSkills": "auto",
            "restart": true,
            "ownerDisplay": "raw"
        },
        "channels": {},
        "memory": {
            "backend": "qmd",
            "qmd": {
                "command": "/usr/local/bin/qmd",
                "paths": [
                    {
                        "path": "/home/node/.openclaw/workspace",
                        "name": "workspace",
                        "pattern": "**/*.md"
                    }
                ]
            }
        },
        "plugins": {
            "enabled": true,
            "entries": {},
            "installs": {}
        },
        "gateway": {
            "port": 18789,
            "bind": "lan",
            "mode": "local",
            "controlUi": {
                "allowedOrigins": [
                    "http://localhost:18789",
                    "http://127.0.0.1:18789"
                ],
                "allowInsecureAuth": true,
                "dangerouslyDisableDeviceAuth": false
            },
            "auth": {
                "mode": "token",
                "token": ""
            }
        }
    };
}

module.exports = { getDefaultConfig };
