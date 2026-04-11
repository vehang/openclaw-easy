/**
 * 工具函数模块统一导出
 */
const common = require('./common');
const password = require('./password');
const session = require('./session');
const config = require('./config');
const validator = require('./validator');
const restart = require('./restart');
const weixin = require('./weixin');
const update = require('./update');

module.exports = {
    ...common,
    ...password,
    ...session,
    ...config,
    ...validator,
    ...restart,
    ...weixin,
    ...update
};
