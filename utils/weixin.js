/**
 * 微信相关工具函数
 */
const fs = require('fs');
const { WEIXIN_QR_STATE_FILE, WEIXIN_BOUND_FILE } = require('../constants');

/**
 * 更新微信二维码状态文件
 */
function updateWeixinQrState(stateData) {
    try {
        fs.writeFileSync(WEIXIN_QR_STATE_FILE, JSON.stringify(stateData, null, 2));
    } catch (error) {
        console.error('[微信QR] 状态文件更新失败:', error);
    }
}

/**
 * 获取微信绑定状态
 */
function getWeixinBoundStatus() {
    try {
        if (fs.existsSync(WEIXIN_BOUND_FILE)) {
            const data = fs.readFileSync(WEIXIN_BOUND_FILE, 'utf8');
            const boundState = JSON.parse(data);
            return boundState.bound === true;
        }
    } catch (e) {
        // 忽略错误
    }
    return false;
}

/**
 * 设置微信绑定状态
 */
function setWeixinBoundStatus(bound) {
    fs.writeFileSync(WEIXIN_BOUND_FILE, JSON.stringify({ bound: bound === true }));
}

module.exports = {
    updateWeixinQrState,
    getWeixinBoundStatus,
    setWeixinBoundStatus
};
