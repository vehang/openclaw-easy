/**
 * 配置读写工具函数
 */
const fs = require('fs');
const path = require('path');
const { CONFIG_FILE, OPENCLAW_DIR, WEIXIN_BOUND_FILE, DEFAULT_PLACEHOLDER } = require('../constants');
const { ensureConfigDir, deepMerge } = require('./common');
const { validateAiConfig, validateAllChannels } = require('./validator');

/**
 * 获取默认配置结构（OpenClaw 标准格式）
 */
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
                "workspace": "/root/.openclaw/workspace",
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
                        "path": "/root/.openclaw/workspace",
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

/**
 * 读取配置文件
 */
function readConfig() {
    ensureConfigDir();

    // 如果配置文件不存在，返回默认配置
    if (!fs.existsSync(CONFIG_FILE)) {
        return getDefaultConfig();
    }

    try {
        const content = fs.readFileSync(CONFIG_FILE, 'utf8');
        const config = JSON.parse(content);

        // 与默认配置合并，确保所有字段都存在
        return deepMerge(getDefaultConfig(), config);
    } catch (e) {
        console.error('读取配置文件失败:', e);
        return getDefaultConfig();
    }
}

/**
 * 保存配置文件
 */
function saveConfig(config) {
    ensureConfigDir();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

/**
 * 将 OpenClaw 配置转换为前端表单格式
 */
function configToFormFormat(config) {
    const models = config.models || {};
    const providers = models.providers || {};
    const defaultProvider = providers.default || {};
    const defaultModel = (defaultProvider.models || [])[0] || {};

    const channels = config.channels || {};
    const gateway = config.gateway || {};

    // 辅助：脱占位（占位默认值 → 空字符串）
    const strip = (val, placeholder) => (val === placeholder ? '' : (val || ''));

    return {
        ai: {
            baseUrl: strip(defaultProvider.baseUrl, DEFAULT_PLACEHOLDER.API_URL),
            apiKey: strip(defaultProvider.apiKey, DEFAULT_PLACEHOLDER.API_KEY),
            modelId: strip(defaultModel.id, DEFAULT_PLACEHOLDER.MODEL_NAME),
            contextWindow: defaultModel.contextWindow || 200000,
            maxTokens: defaultModel.maxTokens || 8192
        },
        im: {
            feishu: {
                enabled: channels.feishu?.enabled || false,
                appId: (channels.feishu?.accounts?.default || {}).appId || '',
                appSecret: (channels.feishu?.accounts?.default || {}).appSecret || '',
                botName: (channels.feishu?.accounts?.default || {}).botName || 'OpenClaw Bot'
            },
            dingtalk: {
                enabled: channels.dingtalk?.enabled || false,
                clientId: channels.dingtalk?.clientId || '',
                clientSecret: channels.dingtalk?.clientSecret || ''
            },
            qqbot: {
                enabled: channels.qqbot?.enabled || false,
                appId: channels.qqbot?.appId || '',
                clientSecret: channels.qqbot?.clientSecret || ''
            },
            wecom: {
                enabled: channels.wecom?.enabled || false,
                token: (channels.wecom?.default || {}).token || '',
                encodingAesKey: (channels.wecom?.default || {}).encodingAesKey || ''
            },
            nim: {
                enabled: channels.nim?.enabled || false,
                appId: channels.nim?.appId || '',
                appSecret: channels.nim?.appSecret || ''
            }
        },
        gateway: {
            port: gateway.port || 18789,
            bind: gateway.bind || '0.0.0.0',
            token: (gateway.auth || {}).token || ''
        }
    };
}

/**
 * 将前端表单格式转换为 OpenClaw 配置
 */
function formToConfig(formConfig) {
    // 读取现有配置作为基础
    const existingConfig = readConfig();

    const { ai, im, gateway = {} } = formConfig;

    // 构建 models.providers.default 配置
    // 空值 fallback 为占位默认值，保证配置文件字段非空
    const finalBaseUrl = (ai.baseUrl && ai.baseUrl.trim()) || DEFAULT_PLACEHOLDER.API_URL;
    const finalApiKey = (ai.apiKey && ai.apiKey.trim()) || DEFAULT_PLACEHOLDER.API_KEY;
    const finalModelId = (ai.modelId && ai.modelId.trim()) || DEFAULT_PLACEHOLDER.MODEL_NAME;

    const defaultProvider = {};
    defaultProvider.baseUrl = finalBaseUrl;
    defaultProvider.apiKey = finalApiKey;
    defaultProvider.api = 'openai-completions';

    defaultProvider.models = [{
        id: finalModelId,
        name: finalModelId,
        reasoning: false,
        input: ['text', 'image'],
        cost: {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0
        },
        contextWindow: ai.contextWindow || 200000,
        maxTokens: ai.maxTokens || 8192
    }];

    // 构建 channels 配置
    const channels = { ...existingConfig.channels };

    // 飞书配置
    if (im.feishu && im.feishu.enabled) {
        channels.feishu = {
            enabled: true,
            dmPolicy: 'open',
            groupPolicy: 'open',
            allowFrom: ['*'],
            streaming: true,
            footer: {
                elapsed: true,
                status: true
            },
            requireMention: true,
            accounts: {
                default: {
                    appId: im.feishu.appId || '',
                    appSecret: im.feishu.appSecret || '',
                    botName: im.feishu.botName || 'OpenClaw Bot'
                }
            }
        };
    } else if (channels.feishu) {
        channels.feishu.enabled = false;
    }

    // 钉钉配置
    if (im.dingtalk && im.dingtalk.enabled) {
        channels.dingtalk = {
            enabled: true,
            clientId: im.dingtalk.clientId || '',
            clientSecret: im.dingtalk.clientSecret || '',
            robotCode: im.dingtalk.clientId || '',
            dmPolicy: 'open',
            groupPolicy: 'open',
            messageType: 'markdown',
            allowFrom: ['*']
        };
    } else if (channels.dingtalk) {
        channels.dingtalk.enabled = false;
    }

    // QQ机器人配置
    if (im.qqbot && im.qqbot.enabled) {
        channels.qqbot = {
            enabled: true,
            appId: im.qqbot.appId || '',
            clientSecret: im.qqbot.clientSecret || '',
            dmPolicy: 'open',
            groupPolicy: 'open',
            allowFrom: ['*']
        };
    } else if (channels.qqbot) {
        channels.qqbot.enabled = false;
    }

    // 企业微信配置
    if (im.wecom && im.wecom.enabled) {
        channels.wecom = {
            enabled: true,
            dmPolicy: 'open',
            groupPolicy: 'open',
            allowFrom: ['*'],
            default: {
                token: im.wecom.token || '',
                encodingAesKey: im.wecom.encodingAesKey || ''
            },
            commands: {
                enabled: true,
                allowlist: ['/new', '/status', '/help', '/compact']
            }
        };
    } else if (channels.wecom) {
        channels.wecom.enabled = false;
    }

    // 网易云信配置（只更新，不禁用 - 因为 web 表单没有此选项）
    if (im.nim && im.nim.enabled) {
        channels.nim = {
            enabled: true,
            appId: im.nim.appId || '',
            appSecret: im.nim.appSecret || ''
        };
    }

    // 构建 gateway 配置
    const gatewayConfig = {
        port: gateway.port || 18789,
        bind: gateway.bind || '0.0.0.0',
        mode: 'local',
        auth: {
            mode: 'token',
            token: gateway.token || ''
        }
    };

    // 合并配置
    const newConfig = {
        ...existingConfig,
        models: {
            ...existingConfig.models,
            mode: 'merge',
            providers: {
                ...existingConfig.models?.providers,
                default: defaultProvider
            }
        },
        agents: {
            ...existingConfig.agents,
            defaults: {
                ...existingConfig.agents?.defaults,
                model: {
                    primary: `default/${finalModelId}`
                },
                imageModel: {
                    primary: `default/${finalModelId}`
                }
            }
        },
        channels,
        gateway: gatewayConfig
    };

    return newConfig;
}

/**
 * 获取配置状态
 */
function getConfigStatus(config) {
    const formConfig = configToFormFormat(config);

    // AI 配置状态
    const aiValidation = validateAiConfig(formConfig.ai);

    // 渠道配置状态
    const channelsValidation = validateAllChannels(formConfig.im);

    // 检查微信绑定状态
    let weixinBound = false;
    try {
        if (fs.existsSync(WEIXIN_BOUND_FILE)) {
            const data = fs.readFileSync(WEIXIN_BOUND_FILE, 'utf8');
            const boundState = JSON.parse(data);
            weixinBound = boundState.bound === true;
        }
    } catch (e) {
        // 忽略错误
    }

    // 如果微信已绑定，增加计数
    let enabledCount = channelsValidation.enabledCount;
    if (weixinBound) {
        enabledCount++;
    }

    // 计算完成百分比
    let completedItems = 0;
    let totalItems = 1; // AI 配置

    if (aiValidation.valid) {
        completedItems++;
    }

    // 添加启用的渠道到计数
    for (const [channelId, result] of Object.entries(channelsValidation.results)) {
        if (result.enabled) {
            totalItems++;
            if (result.valid) {
                completedItems++;
            }
        }
    }

    // 如果微信已绑定，加入计数
    if (weixinBound) {
        totalItems++;
        completedItems++;
    }

    const percentage = Math.round((completedItems / totalItems) * 100);

    return {
        ai: {
            configured: aiValidation.valid,
            errors: aiValidation.errors
        },
        channels: channelsValidation.results,
        weixin: {
            bound: weixinBound
        },
        hasEnabledChannels: enabledCount > 0,
        enabledChannelsCount: enabledCount,
        percentage,
        isComplete: aiValidation.valid && (enabledCount > 0),
        allErrors: [...aiValidation.errors, ...channelsValidation.allErrors]
    };
}

module.exports = {
    getDefaultConfig,
    readConfig,
    saveConfig,
    configToFormFormat,
    formToConfig,
    getConfigStatus
};
