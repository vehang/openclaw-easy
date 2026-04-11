/**
 * 状态模块统一导出
 */
const sessions = require('./sessions');
const weixinTask = require('./weixin-task');

module.exports = {
    ...sessions,
    ...weixinTask
};
