/**
 * 中间件模块统一导出
 */
const htmlAccess = require('./html-access');
const auth = require('./auth');

module.exports = {
    ...htmlAccess,
    ...auth
};
