/**
 * 配置路由
 * 
 * 接口列表：
 * - GET  /api/config          获取配置（前端表单格式）
 * - GET  /api/config/raw      获取原始配置（OpenClaw 格式）
 * - GET  /api/config/status   获取配置状态
 * - POST /api/config/validate 验证配置
 * - POST /api/config          保存配置
 * - POST /api/config/simple   简化配置接口
 * - GET  /api/config/simple          查询缓存的 Simple 配置
 * - GET  /api/config/simple/status   查询是否已配置（无需认证）
 */
const express = require('express');
const fs = require('fs');
const router = express.Router();

const { authMiddleware, appAuthMiddleware } = require('../middleware');
const { readConfig, saveConfig, configToFormFormat, formToConfig, getConfigStatus } = require('../utils/config');
const { validateAiConfig, validateAllChannels } = require('../utils/validator');
const { SIMPLE_CACHE_FILE, OPENCLAW_DIR, WEIXIN_BOUND_FILE, DEFAULT_PLACEHOLDER } = require('../constants');
const { restartGateway } = require('../utils/restart');
const { notifyNas } = require('../utils/common');
const { setWeixinBoundStatus } = require('../utils/weixin');
const { probeAiConfig } = require('../utils/ai-probe');

/**
 * GET /api/config
 * 获取配置（前端表单格式）
 */
router.get('/config', authMiddleware, (req, res) => {
    try {
        const config = readConfig();
        const formConfig = configToFormFormat(config);
        res.json({
            code: 0,
            msg: '成功',
            data: formConfig,
            currentTime: Math.floor(Date.now() / 1000)
        });
    } catch (error) {
        console.error('获取配置失败:', error);
        res.json({ code: 1000, errorMsg: '获取配置失败', currentTime: Math.floor(Date.now() / 1000) });
    }
});

/**
 * GET /api/config/raw
 * 获取原始配置（OpenClaw 格式）
 */
router.get('/config/raw', authMiddleware, (req, res) => {
    try {
        const config = readConfig();
        res.json({
            code: 0,
            msg: '成功',
            data: config,
            currentTime: Math.floor(Date.now() / 1000)
        });
    } catch (error) {
        console.error('获取配置失败:', error);
        res.json({ code: 1000, errorMsg: '获取配置失败', currentTime: Math.floor(Date.now() / 1000) });
    }
});

/**
 * GET /api/config/status
 * 获取配置状态
 */
router.get('/config/status', authMiddleware, (req, res) => {
    try {
        const config = readConfig();
        const status = getConfigStatus(config);
        res.json({
            code: 0,
            msg: '成功',
            data: status,
            currentTime: Math.floor(Date.now() / 1000)
        });
    } catch (error) {
        console.error('获取配置状态失败:', error);
        res.json({ code: 1000, errorMsg: '获取配置状态失败', currentTime: Math.floor(Date.now() / 1000) });
    }
});

/**
 * POST /api/config/validate
 * 验证配置
 */
router.post('/config/validate', authMiddleware, (req, res) => {
    try {
        const formConfig = req.body;

        if (!formConfig) {
            return res.json({ code: 1000, errorMsg: '配置不能为空', currentTime: Math.floor(Date.now() / 1000) });
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
            errors.push(...channelsValidation.allErrors);
        }

        const isValid = errors.length === 0;
        const validateResponse = {
            code: isValid ? 0 : 1000,
            [isValid ? 'msg' : 'errorMsg']: isValid ? '验证通过' : errors.join('; '),
            data: { valid: isValid, errors },
            currentTime: Math.floor(Date.now() / 1000)
        };
        res.json(validateResponse);
    } catch (error) {
        console.error('验证配置失败:', error);
        res.json({ code: 1000, errorMsg: '验证配置失败', currentTime: Math.floor(Date.now() / 1000) });
    }
});

/**
 * POST /api/config
 * 保存配置
 */
router.post('/config', authMiddleware, async (req, res) => {
    try {
        const formConfig = req.body;

        // 验证配置结构
        if (!formConfig || !formConfig.ai) {
            return res.json({ code: 1000, errorMsg: '配置格式不正确', currentTime: Math.floor(Date.now() / 1000) });
        }

        // 验证配置
        const aiValidation = validateAiConfig(formConfig.ai);
        if (!aiValidation.valid) {
            return res.json({ code: 1000, errorMsg: aiValidation.errors.join('; '), currentTime: Math.floor(Date.now() / 1000) });
        }

        // 验证启用的渠道
        if (formConfig.im) {
            const channelsValidation = validateAllChannels(formConfig.im);
            if (channelsValidation.allErrors.length > 0) {
                return res.json({ code: 1000, errorMsg: channelsValidation.allErrors.join('; '), currentTime: Math.floor(Date.now() / 1000) });
            }
        }

        // 转换为 OpenClaw 格式并保存
        const openclawConfig = formToConfig(formConfig);
        saveConfig(openclawConfig);

        res.json({
            code: 0,
            msg: '配置保存成功',
            currentTime: Math.floor(Date.now() / 1000)
        });
    } catch (error) {
        console.error('保存配置失败:', error);
        res.json({ code: 1000, errorMsg: '保存配置失败', currentTime: Math.floor(Date.now() / 1000) });
    }
});

/**
 * POST /api/config/simple
 * 简化配置接口 - 通过 JSON 参数设置配置
 */
router.post('/config/simple', appAuthMiddleware, async (req, res) => {
    try {
        const { nickName, apiUrl, apiKey, modelName, appId, appSecret, authToken, barCode } = req.body;

        // ==================== 参数校验 ====================
        const errors = [];

        // barCode 仍必传
        if (!barCode || barCode.trim() === '') {
            errors.push('barCode必传，设备标识不能为空');
        }

        // apiUrl / apiKey / modelName 允许为空，后续统一 fallback 为占位值

        // appId + appSecret 组校验：要么都不传，要么都传
        const hasAppId = appId && appId.trim() !== '';
        const hasAppSecret = appSecret && appSecret.trim() !== '';
        const hasAppCredentialsGroup = hasAppId && hasAppSecret;

        if ((hasAppId && !hasAppSecret) || (!hasAppId && hasAppSecret)) {
            errors.push('appId和appSecret需同时传递');
        }

        // nickName + authToken 组校验：要么都不传，要么都传
        const hasNickName = nickName && nickName.trim() !== '';
        const hasAuthToken = authToken && authToken.trim() !== '';
        const hasAuthTokenGroup = hasNickName && hasAuthToken;

        if ((hasNickName && !hasAuthToken) || (!hasNickName && hasAuthToken)) {
            errors.push('nickName和authToken需同时传递');
        }

        // 两组必须至少传一组
        if (!hasAppCredentialsGroup && !hasAuthTokenGroup) {
            errors.push('需传递appId+appSecret或nickName+authToken');
        }

        // 返回校验错误
        if (errors.length > 0) {
            return res.json({ code: 1002, errorMsg: errors.join('; '), currentTime: Math.floor(Date.now() / 1000) });
        }

        // ==================== AI 连通性探测 ====================
        const rawApiUrl = (apiUrl && apiUrl.trim()) || '';
        const rawApiKey = (apiKey && apiKey.trim()) || '';
        const rawModelName = (modelName && modelName.trim()) || '';

        // 三项都有真实值时才探测，空值跳过
        if (rawApiUrl && rawApiKey && rawModelName) {
            const probeResult = await probeAiConfig(rawApiUrl, rawApiKey, rawModelName);
            if (!probeResult.ok) {
                return res.json({ code: 1002, errorMsg: probeResult.msg, currentTime: Math.floor(Date.now() / 1000) });
            }
        }

        // ==================== 构建配置 ====================
        // 空值 fallback 为占位默认值（保证配置文件有值，避免服务无法启动）
        const finalApiUrl = (apiUrl && apiUrl.trim()) || DEFAULT_PLACEHOLDER.API_URL;
        const finalApiKey = (apiKey && apiKey.trim()) || DEFAULT_PLACEHOLDER.API_KEY;
        const finalModelName = (modelName && modelName.trim()) || DEFAULT_PLACEHOLDER.MODEL_NAME;

        const existingConfig = readConfig();

        // 构建 AI 配置（使用 fallback 后的值，保证非空）
        const defaultProvider = {
            baseUrl: finalApiUrl,
            apiKey: finalApiKey,
            api: 'openai-completions',
            models: [{
                id: finalModelName,
                name: finalModelName,
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
        
        // 设置插件加载路径

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
                        primary: `default/${finalModelName}`
                    },
                    imageModel: {
                        primary: `default/${finalModelName}`
                    }
                }
            },
            channels,
            plugins
        };

        // 保存配置（openclaw.json）
        try {
            saveConfig(newConfig);
        } catch (e) {
            console.error('[配置保存] openclaw.json 写入失败:', e.message);
            return res.json({ code: 1001, errorMsg: '配置更新失败，请检查磁盘是否正常插入', currentTime: Math.floor(Date.now() / 1000) });
        }

        // 缓存 simple 接口的原始参数到文件（存原始传入值，不存 fallback 后的占位值）
        try {
            const cacheData = {
                apiUrl: (apiUrl && apiUrl.trim()) || '',
                apiKey: (apiKey && apiKey.trim()) || '',
                modelName: (modelName && modelName.trim()) || '',
                barCode: barCode.trim(),
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
        } catch (e) {
            console.error('[配置保存] 缓存文件写入失败:', e.message);
        }

        // ==================== 异步重启（临时禁用，升级功能调试阶段不自动重启）====================
        // setImmediate(async () => {
        //     try {
        //         console.log('[配置保存] 开始异步重启 Gateway...');
        //         const result = await restartGateway();
        //         console.log('[配置保存] 异步重启结果:', result);
        //         console.log("[通知] 准备通知NAS, type=200(配置保存重启)");
        //         await notifyNas(200);
        //         console.log("[通知] NAS通知完成, type=200");
        //     } catch (error) {
        //         console.error('[配置保存] 异步重启失败:', error);
        //     }
        // });

        res.json({
            code: 0,
            msg: '配置已保存，服务正在自动重启中，请稍等一会儿后再使用',
            currentTime: Math.floor(Date.now() / 1000)
        });
    } catch (error) {
        console.error('简化配置保存失败:', error);
        res.json({ code: 1000, errorMsg: '配置保存失败', currentTime: Math.floor(Date.now() / 1000) });
    }
});

/**
 * GET /api/config/simple
 * 查询缓存的 Simple 配置参数
 */
router.get('/config/simple', appAuthMiddleware, (req, res) => {
    try {
        const { barCode } = req.query;
        
        // barCode 必传
        if (!barCode || barCode.trim() === '') {
            return res.json({
                code: 1002,
                errorMsg: 'barCode参数必传',
                currentTime: Math.floor(Date.now() / 1000)
            });
        }
        
        // 检查缓存文件是否存在
        if (!fs.existsSync(SIMPLE_CACHE_FILE)) {
            return res.json({
                code: 1001,
                errorMsg: '设备未配置',
                currentTime: Math.floor(Date.now() / 1000)
            });
        }

        // 读取缓存数据
        const cachedData = JSON.parse(fs.readFileSync(SIMPLE_CACHE_FILE, "utf8"));

        // 验证 barCode 是否匹配
        if (cachedData.barCode !== barCode.trim()) {
            return res.json({
                code: 1003,
                errorMsg: '设备未配置',
                currentTime: Math.floor(Date.now() / 1000)
            });
        }
        
        // barCode 匹配，尝试从 openclaw.json 同步最新的 AI 配置
        const resultData = { ...cachedData };
        try {
            const realConfig = readConfig();
            const provider = (realConfig.models?.providers?.default) || {};
            const model = ((provider.models || [])[0]) || {};

            // 用 openclaw.json 的实际值替换这三个字段
            if (provider.baseUrl) resultData.apiUrl = provider.baseUrl;
            if (provider.apiKey) resultData.apiKey = provider.apiKey;
            if (model.id) resultData.modelName = model.id;
        } catch (e) {
            // 任何异常都不影响正常返回，使用缓存原值
            console.error('[config/simple] 同步 openclaw.json 失败:', e.message);
        }

        // 脱占位：如果值为占位默认值，返回空字符串给客户端
        if (resultData.apiUrl === DEFAULT_PLACEHOLDER.API_URL) resultData.apiUrl = '';
        if (resultData.apiKey === DEFAULT_PLACEHOLDER.API_KEY) resultData.apiKey = '';
        if (resultData.modelName === DEFAULT_PLACEHOLDER.MODEL_NAME) resultData.modelName = '';

        res.json({
            code: 0,
            msg: '成功',
            data: resultData,
            currentTime: Math.floor(Date.now() / 1000)
        });
    } catch (error) {
        console.error('查询 Simple 配置缓存失败:', error);
        res.json({ code: 1000, errorMsg: '查询失败', currentTime: Math.floor(Date.now() / 1000) });
    }
});

/**
 * GET /api/config/simple/status
 * 查询是否已配置（无需认证，不返回配置数据）
 */
router.get('/config/simple/status', (req, res) => {
    try {
        const { barCode } = req.query;

        // barCode 必传
        if (!barCode || barCode.trim() === '') {
            return res.json({
                code: 1002,
                errorMsg: 'barCode参数必传',
                currentTime: Math.floor(Date.now() / 1000)
            });
        }

        // 检查缓存文件是否存在
        if (!fs.existsSync(SIMPLE_CACHE_FILE)) {
            return res.json({
                code: 1001,
                errorMsg: '设备未配置',
                currentTime: Math.floor(Date.now() / 1000)
            });
        }

        // 验证 barCode 是否匹配
        const cachedData = JSON.parse(fs.readFileSync(SIMPLE_CACHE_FILE, "utf8"));
        if (cachedData.barCode !== barCode.trim()) {
            return res.json({
                code: 1003,
                errorMsg: '设备未配置',
                currentTime: Math.floor(Date.now() / 1000)
            });
        }

        res.json({
            code: 0,
            msg: '已配置',
            currentTime: Math.floor(Date.now() / 1000)
        });
    } catch (error) {
        console.error('查询配置状态失败:', error);
        res.json({ code: 1000, errorMsg: '查询失败', currentTime: Math.floor(Date.now() / 1000) });
    }
});

module.exports = router;
