/**
 * HTML 文件访问控制中间件
 * 
 * 处理规则：
 * - 如果 URL 带 token + barCode 参数，直接放行（让前端 JS 处理验证跳转）
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
    
    // 检查 URL 中是否带有 token 和 barCode 参数
    const urlToken = req.query.token;
    const urlBarCode = req.query.barCode;
    
    if (urlToken && urlBarCode) {
        // 根路径 / 带 token 时，需要重定向到 login.html（因为 index.html 没有完整的验证逻辑）
        // 但要保留 token 和 barCode 参数
        if (req.path === '/' || req.path === '') {
            const params = new URLSearchParams({ token: urlToken, barCode: urlBarCode }).toString();
            console.log('[HTML中间件] 根路径检测到 token+barCode，重定向到 login.html');
            return res.redirect(`/login.html?${params}`);
        }
        // login.html / setup.html 带 token 时，直接放行，让前端 JS 处理验证跳转
        console.log('[HTML中间件] 检测到 token+barCode 参数，放行页面');
        return next();
    }
    
    // 以下是没有 token 参数时的原有逻辑
    
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
