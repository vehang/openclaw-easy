/**
 * HTML 文件访问控制中间件
 * 
 * 处理规则：
 * - login.html: 密码未设置→setup，已设置→停留
 * - setup.html: 密码已设置→login，未设置→停留
 * - 其他页面: 未设置密码→setup，未登录→login
 */
const { isPasswordSet } = require('../utils/password');
const { validateSession } = require('../utils/session');

function htmlAccessMiddleware(req, res, next) {
    // 只拦截 HTML 文件和根路径
    const isHtmlRequest = req.path.endsWith('.html') || req.path === '/' || req.path === '';
    
    if (!isHtmlRequest) {
        return next();
    }
    
    // login.html: 密码未设置→setup，已设置→停留
    if (req.path === '/login.html') {
        if (!isPasswordSet()) {
            return res.set('Cache-Control', 'no-store').redirect('/setup.html');
        }
        return next();
    }
    
    // setup.html: 密码已设置→login，未设置→停留
    if (req.path === '/setup.html') {
        if (isPasswordSet()) {
            return res.set('Cache-Control', 'no-store').redirect('/login.html');
        }
        return next();
    }
    
    // 其他页面: 未设置密码→setup，未登录→login
    if (!isPasswordSet()) {
        return res.set('Cache-Control', 'no-store').redirect('/setup.html');
    }
    
    const token = req.cookies.session_token;
    if (validateSession(token)) {
        return next();
    }
    
    res.set('Cache-Control', 'no-store').redirect('/login.html');
}

module.exports = { htmlAccessMiddleware };
