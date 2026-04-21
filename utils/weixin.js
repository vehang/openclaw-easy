/**
 * 微信相关工具函数
 */
const fs = require('fs');
const { spawn } = require('child_process');
const { WEIXIN_QR_STATE_FILE, WEIXIN_BOUND_FILE } = require('../constants');

/**
 * 安装微信插件
 * 返回 child process，调用者可以监听 stdout/stderr/close 事件
 */
function spawnWeixinPluginInstall() {
    console.log('[微信插件] 开始安装/更新个人微信插件...');
    return spawn('npx', ['-y', '@tencent-weixin/openclaw-weixin-cli@latest', 'install'], {
        env: { ...process.env, TERM: 'xterm-256color' },
        shell: true
    });
}

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
    setWeixinBoundStatus,
    spawnWeixinPluginInstall
};
