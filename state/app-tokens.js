/**
 * App AccessToken 存储（内存 + 文件持久化）
 * 
 * 规则：
 * - 一个 barCode 只对应一个 accessToken
 * - 重启后从文件加载，自动清理过期 token
 * - 每次写入同步到文件
 */
const fs = require('fs');
const crypto = require('crypto');
const { APP_TOKENS_FILE, APP_TOKEN_EXPIRE_TIME } = require('../constants');

const ACCESS_TOKEN_PREFIX = 'ac_';

// 内存映射: Map<accessToken, { barCode, createdAt, expiresAt }>
const appTokens = new Map();

/**
 * 从文件加载（启动时调用）
 */
function loadAppTokens() {
    try {
        if (!fs.existsSync(APP_TOKENS_FILE)) return;
        const data = JSON.parse(fs.readFileSync(APP_TOKENS_FILE, 'utf8'));
        const now = Date.now();
        const valid = data.filter(t => t.expiresAt > now);
        valid.forEach(t => {
            appTokens.set(t.accessToken, {
                barCode: t.barCode,
                createdAt: t.createdAt,
                expiresAt: t.expiresAt
            });
        });
        if (valid.length !== data.length) saveAppTokens();
        console.log(`[App认证] 加载 ${valid.length} 个有效 accessToken`);
    } catch (error) {
        console.error('[App认证] 加载 token 文件失败:', error.message);
    }
}

/**
 * 持久化到文件
 */
function saveAppTokens() {
    try {
        const data = [];
        appTokens.forEach((info, token) => {
            data.push({ accessToken: token, ...info });
        });
        fs.writeFileSync(APP_TOKENS_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('[App认证] 保存 token 文件失败:', error.message);
    }
}

/**
 * 生成 accessToken（同一 barCode 旧 token 自动失效）
 */
function createAppToken(barCode) {
    const token = ACCESS_TOKEN_PREFIX + crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    // 清除该 barCode 的旧 token
    for (const [key, val] of appTokens.entries()) {
        if (val.barCode === barCode) appTokens.delete(key);
    }
    appTokens.set(token, {
        barCode,
        createdAt: now,
        expiresAt: now + APP_TOKEN_EXPIRE_TIME
    });
    saveAppTokens();
    return { accessToken: token, barCode, createdAt: now, expiresAt: now + APP_TOKEN_EXPIRE_TIME };
}

/**
 * 查找该 barCode 是否已有有效 token，有则直接返回
 */
function findAppTokenByBarCode(barCode) {
    for (const [token, info] of appTokens.entries()) {
        if (info.barCode === barCode && info.expiresAt > Date.now()) {
            return { accessToken: token, ...info };
        }
    }
    return null;
}

/**
 * 校验 accessToken
 */
function validateAppToken(token) {
    const info = appTokens.get(token);
    if (!info) return false;
    if (info.expiresAt <= Date.now()) {
        appTokens.delete(token);
        saveAppTokens();
        return false;
    }
    return true;
}

/**
 * 获取 token 信息
 */
function getAppTokenInfo(token) {
    return appTokens.get(token) || null;
}

module.exports = {
    appTokens,
    loadAppTokens,
    saveAppTokens,
    createAppToken,
    findAppTokenByBarCode,
    validateAppToken,
    getAppTokenInfo
};
