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
const { validateAppToken, getAppTokenInfo } = require('../state/app-tokens');
const { SESSION_EXPIRE_TIME } = require('../constants');
const path = require('path');
const fs = require('fs');
const VERSION_FILE = path.join(__dirname, '..', 'version.json');

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
    
    // 1. 先检查凭证（token 登录用户可能没设密码，但有有效 session）
    const credential = getAccessToken(req);
    
    if (credential) {
        // 获取 barCode（用于设备绑定验证）
        const barCode = getBarCode(req);
        
        // 验证 Session
        const isValid = barCode 
            ? validateSessionForDevice(credential.token, barCode)
            : validateSession(credential.token);
        
        if (isValid) {
            // 有有效 session，直接放行
            return next();
        }
    }
    
    // 2. 无有效凭证，检查密码是否设置
    if (!isPasswordSet()) {
        return res.json({ 
            code: 1002, 
            msg: '请先设置管理密码', 
            data: { needSetup: true }, 
            currentTime 
        });
    }
    
    // 3. 密码已设置但无有效凭证
    return res.json({ 
        code: 1001, 
        msg: '未授权访问，请先认证', 
        currentTime 
    });
}

/**
 * 读取 appAuthRequired 开关
 */
function isAppAuthRequired() {
    try {
        const v = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
        return v.appAuthRequired === true;
    } catch (_) {
        return false;
    }
}

/**
 * App API 认证中间件
 * 检查 appAuthRequired 开关 → 从 5 种来源提取 accessToken → 校验
 */
function appAuthMiddleware(req, res, next) {
    if (!isAppAuthRequired()) return next();

    // 从 5 种来源提取 accessToken
    let token = null;

    // 1. Authorization: Bearer ac_xxx
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
    }

    // 2. X-Access-Token
    if (!token && req.headers['x-access-token']) {
        token = req.headers['x-access-token'].trim();
    }

    // 3. Query
    if (!token && req.query?.accessToken) {
        token = req.query.accessToken.trim();
    }

    // 4. Body
    if (!token && req.body?.accessToken) {
        token = req.body.accessToken.trim();
    }

    // 5. Cookie
    if (!token && req.cookies?.access_token) {
        token = req.cookies.access_token.trim();
    }

    if (!token || !validateAppToken(token)) {
        return res.json({
            code: 4001,
            errorMsg: 'accessToken 无效或已过期，请重新认证',
            currentTime: Math.floor(Date.now() / 1000)
        });
    }

    req.appDevice = getAppTokenInfo(token);
    next();
}

module.exports = { 
    authMiddleware,
    appAuthMiddleware,
    getAccessToken,
    getBarCode
};
