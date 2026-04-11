/**
 * 常量模块统一导出
 */
const config = require('./config');
const channels = require('./channels');

module.exports = {
    ...config,
    ...channels
};
