/**
 * Session 存储（内存中）
 * 
 * 注意：这是一个单例，所有模块应该从这里导入同一个 sessions Map
 */

// 全局 Session 存储
const sessions = new Map();

function getSessions() {
    return sessions;
}

/**
 * 根据 barCode 查找 Session
 * 用于单设备绑定检查
 */
function findSessionByBarCode(barCode) {
    for (const [token, session] of sessions.entries()) {
        if (session.barCode === barCode) {
            return { token, session };
        }
    }
    return null;
}

/**
 * 清除指定 barCode 的所有 Session
 * 用于单设备绑定（新设备登录时清除旧 Session）
 */
function clearSessionsByBarCode(barCode) {
    let clearedCount = 0;
    for (const [token, session] of sessions.entries()) {
        if (session.barCode === barCode) {
            sessions.delete(token);
            clearedCount++;
        }
    }
    return clearedCount;
}

module.exports = {
    sessions,
    getSessions,
    findSessionByBarCode,
    clearSessionsByBarCode
};
