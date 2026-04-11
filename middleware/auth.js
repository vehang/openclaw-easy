/**
 * 认证检查中间件
 * 
 * 支持多种凭证传递方式：
 * 1. Cookie（网页用户）
 * 2. Authorization Header（Bearer Token）
 * 3. X-Access-Token Header
 * 4. Query 参数 accessToken
 * 5. Body 参数 accessToken（POST 请求）
 */
const { isPasswordSet } = require('../utils/password');
const { validateSession, validateSessionForDevice } = require('../utils/session');
const { SESSION_EXPIRE_TIME } = require('../constants');

/**
 * 从请求中获取凭证（多渠道）
 * 按优先级取用
 */
function getAccessToken(req) {
    // 优先级1: Cookie（网页用户）
    if (req.cookies?.session_token) {
        return { token: req.cookies.session_token, source: 'cookie' };
    }
    
    // 优先级2: Authorization Header（Bearer Token）
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return { token: authHeader.substring(7), source: 'auth-header' };
    }
    
    // 优先级3: X-Access-Token Header
    if (req.headers['x-access-token']) {
        return { token: req.headers['x-access-token'], source: 'x-header' };
    }
    
    // 优先级4: Query 参数
    if (req.query?.accessToken) {
        return { token: req.query.accessToken, source: 'query' };
    }
    
    // 优先级5: Body 参数（POST 请求）
    if (req.body?.accessToken) {
        return { token: req.body.accessToken, source: 'body' };
    }
    
    return null;
}

/**
 * 从请求中获取 barCode
 */
function getBarCode(req) {
    // Query 参数
    if (req.query?.barCode) {
        return req.query.barCode;
    }
    
    // Body 参数
    if (req.body?.barCode) {
        return req.body.barCode;
    }
    
    return null;
}

/**
 * 认证中间件
 */
function authMiddleware(req, res, next) {
    const currentTime = Math.floor(Date.now() / 1000);
    
    // 1. 检查密码是否已设置
    if (!isPasswordSet()) {
        return res.json({ 
            code: 1002, 
            msg: '请先设置管理密码', 
            data: { needSetup: true }, 
            currentTime 
        });
    }
    
    // 2. 获取凭证
    const credential = getAccessToken(req);
    if (!credential) {
        return res.json({ 
            code: 1001, 
            msg: '未授权访问，请先认证', 
            currentTime 
        });
    }
    
    // 3. 获取 barCode（用于设备绑定验证）
    const barCode = getBarCode(req);
    
    // 4. 验证 Session
    // 如果有 barCode，使用设备绑定验证
    // 否则使用基础验证
    const isValid = barCode 
        ? validateSessionForDevice(credential.token, barCode)
        : validateSession(credential.token);
    
    if (!isValid) {
        return res.json({ 
            code: 1001, 
            msg: '凭证无效或已过期', 
            currentTime 
        });
    }
    
    // 5. 认证通过，继续处理
    next();
}

module.exports = { 
    authMiddleware,
    getAccessToken,
    getBarCode
};
