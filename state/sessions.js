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

module.exports = {
    sessions,
    getSessions
};
