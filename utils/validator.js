/**
 * 配置验证工具函数
 */
const { CHANNEL_REQUIRED_FIELDS } = require('../constants');

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

module.exports = {
    validateAiConfig,
    validateChannelConfig,
    validateAllChannels
};
