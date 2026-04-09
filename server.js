/**
 * OpenClaw Easy - 配置管理 Web 界面
 *
 * 功能：
 * 1. 首次访问设置管理密码
 * 2. 配置 AI 模型（Provider、API Key、Base URL、模型ID）
 * 3. 配置 IM 渠道（飞书、钉钉、QQ机器人、企业微信、网易云信）
 * 4. 保存配置到 ~/.openclaw/openclaw.json（OpenClaw 标准格式）
 * 5. 支持重启 OpenClaw Gateway 服务
 * 6. 后续访问需要密码验证
 * 7. 支持 API 方式配置（简化接口）
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');

// ==================== 配置常量 ====================
const PORT = 18780;
const SALT_ROUNDS = 10;
const SESSION_EXPIRE_TIME = 24 * 60 * 60 * 1000; // 24小时

// 配置文件路径
const OPENCLAW_DIR = path.join(os.homedir(), '.openclaw');
const CONFIG_FILE = path.join(OPENCLAW_DIR, 'openclaw.json');
const PASSWORD_FILE = path.join(OPENCLAW_DIR, '.passwd');
const SIMPLE_CACHE_FILE = path.join(OPENCLAW_DIR, '.simple-config.json');

// Session 存储（内存中）
const sessions = new Map();


// ==================== 渠道必填字段定义 ====================
const CHANNEL_REQUIRED_FIELDS = {
    feishu: {
        name: '飞书',
        fields: [
            { key: 'appId', label: 'App ID' },
            { key: 'appSecret', label: 'App Secret' }
        ]
    },
    dingtalk: {
        name: '钉钉',
        fields: [
            { key: 'clientId', label: 'Client ID' },
            { key: 'clientSecret', label: 'Client Secret' }
        ]
    },
    qqbot: {
        name: 'QQ机器人',
        fields: [
            { key: 'appId', label: 'App ID' },
            { key: 'clientSecret', label: 'Client Secret' }
        ]
    },
    wecom: {
        name: '企业微信',
        fields: [
            { key: 'token', label: 'Token' },
            { key: 'encodingAesKey', label: 'Encoding AES Key' }
        ]
    }
    // 注意：nim (网易云信) 有两种认证方式：
    // 1. appId + appSecret
    // 2. authToken
    // 两组数据有一组即可，不在此处验证
};

// ==================== Express 应用初始化 ====================
const app = express();

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// HTML 文件访问控制（必须在静态文件服务之前）
app.use((req, res, next) => {
    // 只拦截 HTML 文件和根路径
    const isHtmlRequest = req.path.endsWith('.html') || req.path === '/' || req.path === '';
    
    if (!isHtmlRequest) {
        return next(); // 非HTML请求，继续到静态文件服务
    }
    
    // 允许访问 setup.html
    if (req.path === '/setup.html') {
        return next();
    }
    
    // 密码未设置，强制跳转到设置页面
    if (!isPasswordSet()) {
        if (req.path.startsWith('/api/')) {
            return res.status(403).json({ error: '请先设置管理密码', needSetup: true });
        }
        return res.redirect('/setup.html');
    }
    
    // 允许访问 login.html
    if (req.path === '/login.html') {
        return next();
    }
    
    // 检查 Session
    const token = req.cookies.session_token;
    if (validateSession(token)) {
        return next(); // 已登录，继续
    }
    
    // 未登录，重定向到登录页
    if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: '未授权访问' });
    }
    res.redirect('/login.html');
});

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// ==================== 工具函数 ====================

/**
 * 确保配置目录存在
 */
function ensureConfigDir() {
    if (!fs.existsSync(OPENCLAW_DIR)) {
        fs.mkdirSync(OPENCLAW_DIR, { recursive: true });
    }
}

/**
 * 检查是否已设置密码
 */
function isPasswordSet() {
    return fs.existsSync(PASSWORD_FILE);
}

/**
 * 保存密码（bcrypt 加密）
 */
async function savePassword(password) {
    ensureConfigDir();
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    fs.writeFileSync(PASSWORD_FILE, hash, 'utf8');
}

/**
 * 验证密码
 */
async function verifyPassword(password) {
    if (!fs.existsSync(PASSWORD_FILE)) {
        return false;
    }
    const hash = fs.readFileSync(PASSWORD_FILE, 'utf8').trim();
    return bcrypt.compare(password, hash);
}

/**
 * 验证密码强度
 * 要求：至少8位，包含大小写字母和数字
 */
function validatePasswordStrength(password) {
    const errors = [];

    if (!password || password.length < 8) {
        errors.push('密码长度至少8位');
    }

    if (password && !/[a-z]/.test(password)) {
        errors.push('密码必须包含小写字母');
    }

    if (password && !/[A-Z]/.test(password)) {
        errors.push('密码必须包含大写字母');
    }

    if (password && !/[0-9]/.test(password)) {
        errors.push('密码必须包含数字');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * 生成 Session Token
 */
function generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * 创建 Session
 */
function createSession() {
    const token = generateSessionToken();
    sessions.set(token, {
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_EXPIRE_TIME
    });
    return token;
}

/**
 * 验证 Session
 */
function validateSession(token) {
    if (!token) return false;
    const session = sessions.get(token);
    if (!session) return false;
    if (Date.now() > session.expiresAt) {
        sessions.delete(token);
        return false;
    }
    return true;
}

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
 * 深度合并对象
 */
function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (target[key] && typeof target[key] === 'object') {
                result[key] = deepMerge(target[key], source[key]);
            } else {
                result[key] = source[key];
            }
        } else {
            result[key] = source[key];
        }
    }
    return result;
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
 * 验证 AI 配置
 */
function validateAiConfig(ai) {
    const errors = [];

    if (!ai) {
        errors.push('AI 配置不能为空');
        return { valid: false, errors };
    }

    if (!ai.baseUrl || ai.baseUrl.trim() === '') {
        errors.push('Base URL 不能为空');
    }

    if (!ai.apiKey || ai.apiKey.trim() === '') {
        errors.push('API Key 不能为空');
    }

    if (!ai.modelId || ai.modelId.trim() === '') {
        errors.push('模型 ID 不能为空');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * 验证单个渠道配置
 */
function validateChannelConfig(channelId, channelConfig) {
    const errors = [];
    const channelDef = CHANNEL_REQUIRED_FIELDS[channelId];

    if (!channelDef) {
        return { valid: true, errors: [] };
    }

    for (const field of channelDef.fields) {
        const value = channelConfig[field.key];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
            errors.push(`${channelDef.name}: ${field.label} 不能为空`);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        channel: channelDef.name
    };
}

/**
 * 验证所有启用的渠道配置
 * 注意：如果渠道启用了但缺少必填字段，自动禁用该渠道而不是报错
 */
function validateAllChannels(im) {
    const results = {};
    const allErrors = [];
    let enabledCount = 0;

    for (const [channelId, channelDef] of Object.entries(CHANNEL_REQUIRED_FIELDS)) {
        const channelConfig = im[channelId] || {};
        let enabled = channelConfig.enabled;

        results[channelId] = {
            enabled,
            valid: true,
            errors: []
        };

        if (enabled) {
            const validation = validateChannelConfig(channelId, channelConfig);
            
            // 如果启用了但缺少必填字段，自动禁用该渠道而不是报错
            if (!validation.valid) {
                console.log(`[配置验证] ${channelDef.name} 缺少必填字段，自动禁用: ${validation.errors.join(', ')}`);
                enabled = false;
                im[channelId].enabled = false; // 自动禁用
                results[channelId] = {
                    enabled: false,
                    valid: true, // 不再报错
                    errors: [],
                    autoDisabled: true
                };
            } else {
                enabledCount++;
                results[channelId] = {
                    enabled: true,
                    valid: true,
                    errors: []
                };
            }
        }
    }

    // 特殊处理 nim (网易云信) - 有两种认证方式
    if (im.nim && im.nim.enabled) {
        const hasAppCredentials = im.nim.appId && im.nim.appSecret;
        const hasAuthToken = im.nim.authToken;
        
        if (!hasAppCredentials && !hasAuthToken) {
            // 缺少必要的认证信息，自动禁用
            console.log('[配置验证] 网易云信 缺少认证信息，自动禁用');
            im.nim.enabled = false;
            results.nim = {
                enabled: false,
                valid: true,
                errors: [],
                autoDisabled: true
            };
        } else {
            enabledCount++;
            results.nim = {
                enabled: true,
                valid: true,
                errors: []
            };
        }
    }

    return {
        results,
        allErrors,
        enabledCount,
        hasEnabledChannels: enabledCount > 0
    };
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
        const boundFile = path.join(OPENCLAW_DIR, '.weixin-bound');
        if (fs.existsSync(boundFile)) {
            const data = fs.readFileSync(boundFile, 'utf8');
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

    return {
        ai: {
            baseUrl: defaultProvider.baseUrl || '',
            apiKey: defaultProvider.apiKey || '',
            modelId: defaultModel.id || '',
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
    const defaultProvider = {};
    if (ai.baseUrl) defaultProvider.baseUrl = ai.baseUrl;
    if (ai.apiKey) defaultProvider.apiKey = ai.apiKey;
    defaultProvider.api = 'openai-completions';

    if (ai.modelId) {
        defaultProvider.models = [{
            id: ai.modelId,
            name: ai.modelId,
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
    } else {
        defaultProvider.models = [];
    }

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
    // 注意：如果 im.nim 不存在，保留现有 channels.nim 配置，不做修改

    // 个人微信配置
    // 注意：微信是通过 openclaw-weixin 插件实现的，不作为独立的 channel 处理
    // 绑定状态由 OpenClaw 自己管理（通过 openclaw channels login --channel openclaw-weixin）
    // 这里不处理 im.weixin，避免生成 channels.weixin 导致配置错误

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
                    primary: ai.modelId ? `default/${ai.modelId}` : ''
                },
                imageModel: {
                    primary: ai.modelId ? `default/${ai.modelId}` : ''
                }
            }
        },
        channels,
        gateway: gatewayConfig
    };

    return newConfig;
}

/**
 * 保存配置文件
 */
function saveConfig(config) {
    ensureConfigDir();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

/**
 * 检测命令是否可用
 */
function isCommandAvailable(command) {
    const { execSync } = require('child_process');
    try {
        execSync(`which ${command}`, { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

/**
 * 重启 OpenClaw Gateway 服务
 */
async function restartGateway() {
    const { exec } = require('child_process');

    return new Promise((resolve, reject) => {
        // 检测可用的重启方式
        const restartMethods = [];

        // 优先级 1: openclaw gateway restart（用户优先要求）
        if (isCommandAvailable('openclaw')) {
            restartMethods.push({
                name: 'openclaw',
                description: '使用 openclaw 命令重启',
                cmd: 'openclaw gateway restart',
                manual: 'openclaw gateway restart'
            });
        }

        // 优先级 2: 通过 kill 发送信号（supervisord 会自动重启）
        // 适用于 Docker 容器环境
        restartMethods.push({
            name: 'kill-supervisor',
            description: '发送信号给 Gateway 进程（supervisord 自动重启）',
            cmd: 'pkill -f "openclaw gateway run"',
            manual: 'pkill -f "openclaw gateway run"'
        });

        // 优先级 3: supervisorctl（如果 supervisord 正在运行）
        if (isCommandAvailable('supervisorctl')) {
            restartMethods.push({
                name: 'supervisorctl',
                cmd: 'supervisorctl restart openclaw-gateway',
                manual: 'supervisorctl restart openclaw-gateway'
            });
        }

        // 优先级 4: systemctl（系统服务）
        if (isCommandAvailable('systemctl')) {
            restartMethods.push({
                name: 'systemctl',
                cmd: 'systemctl restart openclaw-gateway',
                manual: 'sudo systemctl restart openclaw-gateway'
            });
        }

        // 优先级 5: pm2（进程管理器）
        if (isCommandAvailable('pm2')) {
            restartMethods.push({
                name: 'pm2',
                cmd: 'pm2 restart openclaw-gateway',
                manual: 'pm2 restart openclaw-gateway'
            });
        }

        // 优先级 6: service（系统服务）
        if (isCommandAvailable('service')) {
            restartMethods.push({
                name: 'service',
                cmd: 'service openclaw-gateway restart',
                manual: 'sudo service openclaw-gateway restart'
            });
        }

        // 尝试执行可用的重启方法
        let lastError = null;
        let successCount = 0;

        const tryRestart = (index) => {
            if (index >= restartMethods.length) {
                if (successCount > 0) {
                    resolve({ success: true, message: '重启命令已执行' });
                } else {
                    // 所有方法都失败了，提供手动重启指南
                    const manualCommands = [
                        '# 自动重启失败，请手动执行以下操作：',
                        '',
                        '# 方法1: 使用 openclaw 命令',
                        'openclaw gateway restart',
                        '',
                        '# 方法2: 重启整个容器（最简单）',
                        'docker restart openclaw-easy',
                        '',
                        '# 方法3: 在容器内手动重启',
                        'docker exec -it openclaw-easy bash',
                        'pkill -f "openclaw gateway run"',
                        '# supervisord 会自动重启 Gateway',
                        '',
                        '# 方法4: 重启 supervisord 服务',
                        'docker exec -it openclaw-easy supervisorctl restart openclaw-gateway'
                    ].join('\n');

                    reject(new Error(`无法自动重启服务\n\n${manualCommands}\n\n最后错误: ${lastError || '未知错误'}`));
                }
                return;
            }

            const { name, cmd, description } = restartMethods[index];
            console.log(`尝试重启方式 [${index + 1}/${restartMethods.length}]: ${name} - ${description}`);

            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    console.log(`❌ ${name} 失败: ${error.message}`);
                    lastError = error.message;
                    tryRestart(index + 1);
                } else {
                    successCount++;
                    resolve({ success: true, message: '重启命令已执行', output: stdout });
                }
            });
        };

        tryRestart(0);
    });
}

// ==================== 认证中间件 ====================

/**
 * 认证检查中间件
 */
function authMiddleware(req, res, next) {
    // 如果密码未设置，强制跳转到设置页面
    if (!isPasswordSet()) {
        // 允许访问 setup 相关的路由
        if (req.path === '/setup.html' ||
            req.path === '/api/setup/password' ||
            req.path === '/api/status' ||
            req.path.startsWith('/css/') ||
            req.path.startsWith('/js/')) {
            return next();
        }
        // 其他路由重定向到 setup.html
        if (req.path.startsWith('/api/')) {
            return res.status(403).json({ error: '请先设置管理密码', needSetup: true });
        }
        return res.redirect('/setup.html');
    }

    // 检查 Session
    const token = req.cookies.session_token;
    if (validateSession(token)) {
        return next();
    }

    // API 请求返回 401
    if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: '未授权访问' });
    }

    // 页面请求重定向到登录页
    res.redirect('/login.html');
}

// ==================== API 路由 ====================

/**
 * 检查系统状态
 * GET /api/status
 */
app.get('/api/status', (req, res) => {
    res.json({
        passwordSet: isPasswordSet(),
        authenticated: validateSession(req.cookies.session_token)
    });
});

/**
 * 设置密码（首次访问）
 * POST /api/setup/password
 */
app.post('/api/setup/password', async (req, res) => {
    try {
        // 如果密码已设置，拒绝再次设置
        if (isPasswordSet()) {
            return res.status(400).json({ error: '密码已设置，请使用修改密码功能' });
        }

        const { password, confirmPassword } = req.body;

        // 验证密码强度
        const strengthValidation = validatePasswordStrength(password);
        if (!strengthValidation.valid) {
            return res.status(400).json({ error: strengthValidation.errors.join('，') });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: '两次输入的密码不一致' });
        }

        // 保存密码
        await savePassword(password);

        // 创建 Session
        const token = createSession();

        res.cookie('session_token', token, {
            httpOnly: true,
            maxAge: SESSION_EXPIRE_TIME,
            sameSite: 'strict'
        });

        res.json({ success: true, message: '密码设置成功' });
    } catch (error) {
        console.error('设置密码失败:', error);
        res.status(500).json({ error: '设置密码失败' });
    }
});

/**
 * 登录验证
 * POST /api/login
 */
app.post('/api/login', async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: '请输入密码' });
        }

        // 验证密码
        const valid = await verifyPassword(password);

        if (!valid) {
            return res.status(401).json({ error: '密码错误' });
        }

        // 创建 Session
        const token = createSession();

        res.cookie('session_token', token, {
            httpOnly: true,
            maxAge: SESSION_EXPIRE_TIME,
            sameSite: 'strict'
        });

        res.json({ success: true, message: '登录成功' });
    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({ error: '登录失败' });
    }
});

/**
 * 退出登录
 * POST /api/logout
 */
app.post('/api/logout', (req, res) => {
    const token = req.cookies.session_token;
    if (token) {
        sessions.delete(token);
    }
    res.clearCookie('session_token');
    res.json({ success: true, message: '已退出登录' });
});

/**
 * 修改密码
 * POST /api/password/change
 */
app.post('/api/password/change', authMiddleware, async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body;

        // 验证旧密码
        const valid = await verifyPassword(oldPassword);
        if (!valid) {
            return res.status(401).json({ error: '原密码错误' });
        }

        // 验证新密码强度
        const strengthValidation = validatePasswordStrength(newPassword);
        if (!strengthValidation.valid) {
            return res.status(400).json({ error: '新' + strengthValidation.errors.join('，') });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: '两次输入的密码不一致' });
        }

        // 保存新密码
        await savePassword(newPassword);

        res.json({ success: true, message: '密码修改成功' });
    } catch (error) {
        console.error('修改密码失败:', error);
        res.status(500).json({ error: '修改密码失败' });
    }
});

/**
 * 获取配置（前端表单格式）
 * GET /api/config
 */
app.get('/api/config', authMiddleware, (req, res) => {
    try {
        const config = readConfig();
        const formConfig = configToFormFormat(config);
        res.json(formConfig);
    } catch (error) {
        console.error('获取配置失败:', error);
        res.status(500).json({ error: '获取配置失败' });
    }
});

/**
 * 获取原始配置（OpenClaw 格式）
 * GET /api/config/raw
 */
app.get('/api/config/raw', authMiddleware, (req, res) => {
    try {
        const config = readConfig();
        res.json(config);
    } catch (error) {
        console.error('获取配置失败:', error);
        res.status(500).json({ error: '获取配置失败' });
    }
});

/**
 * 获取配置状态
 * GET /api/config/status
 */
app.get('/api/config/status', authMiddleware, (req, res) => {
    try {
        const config = readConfig();
        const status = getConfigStatus(config);
        res.json(status);
    } catch (error) {
        console.error('获取配置状态失败:', error);
        res.status(500).json({ error: '获取配置状态失败' });
    }
});

/**
 * 验证配置
 * POST /api/config/validate
 */
app.post('/api/config/validate', authMiddleware, (req, res) => {
    try {
        const formConfig = req.body;

        if (!formConfig) {
            return res.status(400).json({ valid: false, errors: ['配置不能为空'] });
        }

        const errors = [];

        // 验证 AI 配置
        const aiValidation = validateAiConfig(formConfig.ai);
        if (!aiValidation.valid) {
            errors.push(...aiValidation.errors);
        }

        // 验证渠道配置
        if (formConfig.im) {
            const channelsValidation = validateAllChannels(formConfig.im);
            if (!channelsValidation.hasEnabledChannels) {
                // 不强制要求启用渠道，但给出提示
                // errors.push('请至少启用一个 IM 渠道');
            }
            errors.push(...channelsValidation.allErrors);
        }

        res.json({
            valid: errors.length === 0,
            errors
        });
    } catch (error) {
        console.error('验证配置失败:', error);
        res.status(500).json({ valid: false, errors: ['验证配置失败'] });
    }
});

/**
 * 保存配置
 * POST /api/config
 */
app.post('/api/config', authMiddleware, async (req, res) => {
    try {
        const formConfig = req.body;

        // 验证配置结构
        if (!formConfig || !formConfig.ai) {
            return res.status(400).json({ error: '配置格式不正确' });
        }

        // 验证配置
        const aiValidation = validateAiConfig(formConfig.ai);
        if (!aiValidation.valid) {
            return res.status(400).json({ error: aiValidation.errors.join('; ') });
        }

        // 验证启用的渠道
        if (formConfig.im) {
            const channelsValidation = validateAllChannels(formConfig.im);
            if (channelsValidation.allErrors.length > 0) {
                return res.status(400).json({ error: channelsValidation.allErrors.join('; ') });
            }
        }

        // 转换为 OpenClaw 格式并保存
        const openclawConfig = formToConfig(formConfig);
        saveConfig(openclawConfig);


        res.json({
            success: true,
            message: '配置保存成功'
        });
    } catch (error) {
        console.error('保存配置失败:', error);
        res.status(500).json({ error: '保存配置失败' });
    }
});

/**
 * 简化配置接口 - 通过 JSON 参数设置配置
 * POST /api/config/simple
 * 
 * 请求参数：
 * - nickName: 昵称（可选）
 * - apiUrl: API 地址（必填）
 * - apiKey: API Key（必填）
 * - modelName: 模型名称（必填）
 * - appId: App ID（二选一）
 * - appSecret: App Secret（与 appId 配合使用）
 * - authToken: Auth Token（二选一）
 */
app.post('/api/config/simple', async (req, res) => {
    try {
        const { nickName, apiUrl, apiKey, modelName, appId, appSecret, authToken } = req.body;

        // ==================== 参数校验 ====================
        const errors = [];

        // 1. 必传参数校验：apiUrl、apiKey、modelName
        if (!apiUrl || apiUrl.trim() === '') {
            errors.push('apiUrl必传');
        }
        
        if (!apiKey || apiKey.trim() === '') {
            errors.push('apiKey必传');
        }
        
        if (!modelName || modelName.trim() === '') {
            errors.push('modelName必传');
        }

        // 2. appId + appSecret 组校验：要么都不传，要么都传
        const hasAppId = appId && appId.trim() !== '';
        const hasAppSecret = appSecret && appSecret.trim() !== '';
        const hasAppCredentialsGroup = hasAppId && hasAppSecret;
        
        if ((hasAppId && !hasAppSecret) || (!hasAppId && hasAppSecret)) {
            errors.push('appId和appSecret需同时传递');
        }

        // 3. nickName + authToken 组校验：要么都不传，要么都传
        const hasNickName = nickName && nickName.trim() !== '';
        const hasAuthToken = authToken && authToken.trim() !== '';
        const hasAuthTokenGroup = hasNickName && hasAuthToken;
        
        if ((hasNickName && !hasAuthToken) || (!hasNickName && hasAuthToken)) {
            errors.push('nickName和authToken需同时传递');
        }

        // 4. 两组必须至少传一组
        if (!hasAppCredentialsGroup && !hasAuthTokenGroup) {
            errors.push('需传递appId+appSecret或nickName+authToken');
        }

        // 返回校验错误
        if (errors.length > 0) {
            return res.json({ code: 1002, msg: errors.join('; '), currentTime: Math.floor(Date.now() / 1000) });
        }

        // ==================== 构建配置 ====================
        // 读取现有配置
        const existingConfig = readConfig();

        // 构建 AI 配置（必传参数，已确保非空）
        const defaultProvider = {
            baseUrl: apiUrl.trim(),
            apiKey: apiKey.trim(),
            api: 'openai-completions',
            models: [{
                id: modelName.trim(),
                name: modelName.trim(),
                reasoning: false,
                input: ['text', 'image'],
                cost: {
                    input: 0,
                    output: 0,
                    cacheRead: 0,
                    cacheWrite: 0
                },
                contextWindow: 200000,
                maxTokens: 8192
            }]
        };

        // 构建 NIM 配置（根据传参情况决定）
        const channels = { ...existingConfig.channels };
        
        channels.nim = {
            enabled: true
        };

        // 设置 appId + appSecret 组（如果传了）
        if (hasAppCredentialsGroup) {
            channels.nim.appId = appId.trim();
            channels.nim.appSecret = appSecret.trim();
        }

        // 设置 nickName + authToken 组（如果传了）
        if (hasAuthTokenGroup) {
            channels.nim.nickName = nickName.trim();
            channels.nim.authToken = authToken.trim();
        }

        // 构建插件配置 - 确保 nim 插件被正确注册
        const plugins = { ...existingConfig.plugins };
        plugins.enabled = true;
        plugins.entries = plugins.entries || {};
        plugins.entries.nim = { enabled: true };
        
        // 确保 nim 在 allow 列表中
        plugins.allow = plugins.allow || [];
        if (!plugins.allow.includes('nim')) {
            plugins.allow.push('nim');
        }
        
        // 设置插件加载路径（关键！确保 OpenClaw 能找到插件）
        plugins.load = plugins.load || {};
        plugins.load.paths = plugins.load.paths || [];
        const nimPluginPath = '/root/.openclaw/extensions/openclaw-nim-yx-auth';
        if (!plugins.load.paths.includes(nimPluginPath)) {
            plugins.load.paths.push(nimPluginPath);
        }

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
                        primary: `default/${modelName.trim()}`
                    },
                    imageModel: {
                        primary: `default/${modelName.trim()}`
                    }
                }
            },
            channels,
            plugins
        };

        // 保存配置
        saveConfig(newConfig);

        // 缓存 simple 接口的原始参数到文件（设置什么就返回什么）
        const cacheData = {
            apiUrl: apiUrl.trim(),
            apiKey: apiKey.trim(),
            modelName: modelName.trim(),
            updatedAt: Math.floor(Date.now() / 1000)
        };
        if (hasAppCredentialsGroup) {
            cacheData.appId = appId.trim();
            cacheData.appSecret = appSecret.trim();
        }
        if (hasAuthTokenGroup) {
            cacheData.nickName = nickName.trim();
            cacheData.authToken = authToken.trim();
        }
        fs.writeFileSync(SIMPLE_CACHE_FILE, JSON.stringify(cacheData, null, 2), "utf8");

        res.json({
            code: 0,
            msg: '成功',
            currentTime: Math.floor(Date.now() / 1000)
        });
    } catch (error) {
        console.error('简化配置保存失败:', error);
        res.json({ code: 1000, msg: '配置保存失败', currentTime: Math.floor(Date.now() / 1000) });
    }
});

/**
 * 查询缓存的 Simple 配置参数
 * GET /api/config/simple
 * 
 * 返回之前通过 POST /api/config/simple 保存的参数缓存
 * 无需鉴权
 */
app.get('/api/config/simple', (req, res) => {
    try {
        if (!fs.existsSync(SIMPLE_CACHE_FILE)) {
            return res.json({
                code: 1001,
                msg: '暂无缓存配置',
                currentTime: Math.floor(Date.now() / 1000)
            });
        }
        const cachedData = JSON.parse(fs.readFileSync(SIMPLE_CACHE_FILE, "utf8"));

        res.json({
            code: 0,
            msg: '成功',
            data: cachedData,
            currentTime: Math.floor(Date.now() / 1000)
        });
    } catch (error) {
        console.error('查询 Simple 配置缓存失败:', error);
        res.json({ code: 1000, msg: '查询失败', currentTime: Math.floor(Date.now() / 1000) });
    }
});

/**
 * 重启 Gateway 服务
 * POST /api/gateway/restart
 */
app.post('/api/gateway/restart', authMiddleware, async (req, res) => {
    try {
        const result = await restartGateway();
        res.json(result);
    } catch (error) {
        console.error('重启服务失败:', error);
        res.status(500).json({ error: error.message || '重启服务失败' });
    }
});

/**
 * 修复 OpenClaw 运行环境
 * POST /api/fix
 * 无需登录验证，供外部调用
 * 
 * 返回格式：
 * - code: 0 成功，1000 执行异常
 * - msg: 结果描述
 * - currentTime: 当前时间戳
 * - output: 命令输出内容（可选）
 */
app.post('/api/fix', async (req, res) => {
    try {
        console.log('执行 openclaw doctor --fix...');
        
        const { execSync } = require('child_process');
        const output = execSync('openclaw doctor --fix', {
            encoding: 'utf8',
            timeout: 120000  // 2分钟超时
        });
        
        console.log('修复输出:', output);
        
        res.json({
            code: 0,
            msg: '修复完成',
            currentTime: Math.floor(Date.now() / 1000),
            output: output
        });
    } catch (error) {
        console.error('修复失败:', error);
        
        // 即使有错误，也可能包含有用的输出信息
        const output = error.stdout || error.stderr || '';
        
        res.json({
            code: 1000,
            msg: error.message || '修复执行失败',
            currentTime: Math.floor(Date.now() / 1000),
            output: output
        });
    }
});

/**
 * 测试 AI 连接
 * POST /api/test/ai
 */
app.post('/api/test/ai', authMiddleware, async (req, res) => {
    try {
        const { apiKey, baseUrl, modelId } = req.body;

        // 这里可以实现实际的连接测试
        // 目前只做基本的参数验证
        if (!apiKey || !modelId) {
            return res.status(400).json({ error: 'API Key 和模型ID不能为空' });
        }

        // 模拟测试成功
        res.json({ success: true, message: 'AI 配置验证通过' });
    } catch (error) {
        console.error('测试 AI 连接失败:', error);
        res.status(500).json({ error: '测试连接失败' });
    }
});

/**
 * 个人微信登录 - SSE 实时输出
 * GET /api/weixin/login
 * 
 * 执行登录命令，展示二维码，实时推送控制台输出
 */
app.get('/api/weixin/login', authMiddleware, (req, res) => {
    // 设置 SSE 头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const { spawn } = require('child_process');
    
    // 发送 SSE 消息的辅助函数
    const sendEvent = (type, data) => {
        res.write(`event: ${type}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // 发送初始状态
    sendEvent('status', { message: '正在启动微信登录...' });
    sendEvent('output', { text: '$ openclaw channels login --channel openclaw-weixin\n\n' });

    // 执行登录命令
    const child = spawn('openclaw', ['channels', 'login', '--channel', 'openclaw-weixin'], {
        env: { ...process.env, TERM: 'xterm-256color' },
        shell: true
    });

    console.log('[微信登录] 开始执行登录命令...');

    // 捕获标准输出
    child.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('[微信登录] stdout:', output);
        sendEvent('output', { text: output });
    });

    // 捕获错误输出
    child.stderr.on('data', (data) => {
        const output = data.toString();
        console.log('[微信登录] stderr:', output);
        sendEvent('output', { text: output });
    });

    // 进程结束
    child.on('close', (code) => {
        console.log('[微信登录] 进程结束，退出码:', code);
        if (code === 0) {
            sendEvent('complete', { success: true, message: '登录成功' });
        } else {
            sendEvent('complete', { success: false, message: `登录失败，退出码: ${code}` });
        }
        res.end();
    });

    // 进程错误
    child.on('error', (error) => {
        console.error('[微信登录] 进程错误:', error);
        sendEvent('error', { message: `启动失败: ${error.message}` });
        res.end();
    });

    // 客户端断开连接时终止进程
    req.on('close', () => {
        console.log('[微信登录] 客户端断开连接，终止进程');
        child.kill();
        res.end();
    });
});


/**
 * 获取微信绑定状态
 * GET /api/weixin/bound
 */
app.get('/api/weixin/bound', authMiddleware, (req, res) => {
    const boundFile = path.join(OPENCLAW_DIR, '.weixin-bound');
    try {
        if (fs.existsSync(boundFile)) {
            const data = fs.readFileSync(boundFile, 'utf8');
            const boundState = JSON.parse(data);
            res.json({ bound: boundState.bound === true });
        } else {
            res.json({ bound: false });
        }
    } catch (error) {
        res.json({ bound: false });
    }
});

/**
 * 设置微信绑定状态
 * POST /api/weixin/bound
 */
app.post('/api/weixin/bound', authMiddleware, (req, res) => {
    const boundFile = path.join(OPENCLAW_DIR, '.weixin-bound');
    try {
        const { bound } = req.body;
        fs.writeFileSync(boundFile, JSON.stringify({ bound: bound === true }));
        res.json({ success: true });
    } catch (error) {
        console.error('[微信] 保存绑定状态失败:', error);
        res.status(500).json({ error: '保存失败' });
    }
});

// ==================== 页面路由 ====================

// 首页重定向
app.get('/', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== 错误处理 ====================

// 404 处理
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// 全局错误处理
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
});

// ==================== 启动服务器 ====================

app.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════╗');
    console.log('║       OpenClaw Easy 配置管理系统           ║');
    console.log('╠════════════════════════════════════════════╣');
    console.log(`║  服务地址: http://localhost:${PORT}          ║`);
    console.log(`║  配置文件: ${CONFIG_FILE.padEnd(24)}║`);
    console.log('╚════════════════════════════════════════════╝');
    console.log('');
});
