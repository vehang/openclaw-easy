/**
 * 路由统一导出和挂载
 * 
 * 路由挂载规则：
 * 1. 认证路由 - 直接挂载到 /api（包含 /status, /login, /logout 等）
 * 2. 配置路由 - 直接挂载到 /api（包含 /config/*, /config/simple 等）
 * 3. 微信路由 - 挂载到 /api/weixin（包含 /login, /bound, /qr/*）
 * 4. 系统路由 - 直接挂载到 /api（包含 /gateway/restart, /fix, /test/ai）
 * 5. 更新路由 - 直接挂载到 /api（包含 /version, /update/check, /update）
 * 6. 页面路由 - 挂载到 /
 */
const auth = require('./auth');
const config = require('./config');
const weixin = require('./weixin');
const system = require('./system');
const update = require('./update');
const pages = require('./pages');

/**
 * 挂载所有路由到 Express app
 */
function mountRoutes(app) {
    // 认证路由 - 挂载到 /api
    // 路径：/api/status, /api/login, /api/logout, /api/setup/password, /api/verify-token, /api/password/change
    app.use('/api', auth);
    
    // 配置路由 - 挂载到 /api
    // 路径：/api/config, /api/config/raw, /api/config/status, /api/config/validate, /api/config, /api/config/simple
    app.use('/api', config);
    
    // 微信路由 - 挂载到 /api/weixin
    // 路径：/api/weixin/login, /api/weixin/bound, /api/weixin/qr/start, /api/weixin/qr/status
    app.use('/api/weixin', weixin);
    
    // 系统路由 - 挂载到 /api
    // 路径：/api/gateway/restart, /api/fix, /api/test/ai
    app.use('/api', system);
    
    // 更新路由 - 挂载到 /api
    // 路径：/api/version, /api/update/check, /api/update
    app.use('/api', update);
    
    // 页面路由 - 挂载到根路径
    // 路径：/
    app.use('/', pages);
}

module.exports = { mountRoutes };
