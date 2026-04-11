/**
 * Session 创建/验证工具函数
 */
const crypto = require('crypto');
const { SESSION_EXPIRE_TIME } = require('../constants');
const { sessions } = require('../state');

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

module.exports = {
    generateSessionToken,
    createSession,
    validateSession,
    deleteSession,
    generateSessionId
};
