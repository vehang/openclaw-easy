/**
 * Session 创建/验证工具函数
 */
const crypto = require('crypto');
const { SESSION_EXPIRE_TIME } = require('../constants');
const { sessions, findSessionByBarCode, clearSessionsByBarCode } = require('../state');

/**
 * 生成 Session Token
 */
function generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * 创建 Session（网页用户）
 */
function createSession() {
    const token = generateSessionToken();
    sessions.set(token, {
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_EXPIRE_TIME,
        source: 'web',
        verifiedByPassword: true,
        verifiedByToken: false,
        barCode: null
    });
    return token;
}

/**
 * 创建 Session（APP 用户，绑定设备）
 * 单设备绑定：先清除该 barCode 的旧 Session
 */
function createSessionForDevice(barCode) {
    // 单设备绑定：清除该 barCode 的旧 Session
    const clearedCount = clearSessionsByBarCode(barCode);
    if (clearedCount > 0) {
        console.log(`[Session] 清除设备 ${barCode} 的 ${clearedCount} 个旧 Session`);
    }
    
    // 创建新 Session
    const token = generateSessionToken();
    sessions.set(token, {
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_EXPIRE_TIME,
        source: 'app',
        verifiedByPassword: false,
        verifiedByToken: true,
        barCode: barCode
    });
    
    console.log(`[Session] 为设备 ${barCode} 创建新 Session`);
    return token;
}

/**
 * 验证 Session（基础验证）
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
 * 验证 Session（带设备绑定检查）
 * 如果 Session 有 barCode，检查请求的 barCode 是否匹配
 */
function validateSessionForDevice(token, barCode) {
    if (!token) return false;
    
    const session = sessions.get(token);
    if (!session) return false;
    
    // 检查过期
    if (Date.now() > session.expiresAt) {
        sessions.delete(token);
        return false;
    }
    
    // 如果 Session 有 barCode 绑定，检查是否匹配
    if (session.barCode && barCode && session.barCode !== barCode) {
        console.log(`[Session] barCode 不匹配: Session=${session.barCode}, Request=${barCode}`);
        return false;
    }
    
    return true;
}

/**
 * 删除 Session
 */
function deleteSession(token) {
    if (token) {
        sessions.delete(token);
    }
}

/**
 * 生成 Session ID（用于 token 验证）
 */
function generateSessionId() {
    return generateSessionToken();
}

/**
 * 获取 Session 信息
 */
function getSessionInfo(token) {
    if (!token) return null;
    return sessions.get(token);
}

module.exports = {
    generateSessionToken,
    createSession,
    createSessionForDevice,
    validateSession,
    validateSessionForDevice,
    deleteSession,
    generateSessionId,
    getSessionInfo
};
