/**
 * 认证检查中间件
 * 
 * 用于 API 接口的权限验证
 */
const { isPasswordSet } = require('../utils/password');
const { validateSession } = require('../utils/session');

function authMiddleware(req, res, next) {
    // 密码未设置
    if (!isPasswordSet()) {
        return res.json({ 
            code: 1002, 
            msg: '请先设置管理密码', 
            data: { needSetup: true }, 
            currentTime: Math.floor(Date.now() / 1000) 
        });
    }
    
    // 检查 Session
    const token = req.cookies.session_token;
    if (validateSession(token)) {
        return next();
    }
    
    // 未授权
    res.json({ code: 1001, msg: '未授权访问', currentTime: Math.floor(Date.now() / 1000) });
}

module.exports = { authMiddleware };
