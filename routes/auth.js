/**
 * 认证路由
 * 
 * 接口列表：
 * - GET  /status            检查系统状态
 * - POST /setup/password    设置密码（首次访问）
 * - POST /login             登录验证
 * - POST /logout            退出登录
 * - POST /verifyToken      通过 token 验证用户身份（旧接口）
 * - POST /auth/token        认证获取临时凭证（新接口）
 * - POST /password/change   修改密码
 */
const express = require('express');
const router = express.Router();

const { isPasswordSet, savePassword, verifyPassword, validatePasswordStrength } = require('../utils/password');
const { createSession, createSessionForDevice, validateSession, deleteSession, generateSessionId, getSessionInfo } = require('../utils/session');
const { SESSION_EXPIRE_TIME } = require('../constants');
const { sessions, findSessionByBarCode, clearSessionsByBarCode } = require('../state');
const { authMiddleware } = require('../middleware');

/**
 * GET /api/status
 * 检查系统状态
 */
router.get('/status', (req, res) => {
    const token = req.cookies.session_token;
    const session = getSessionInfo(token);
    
    res.json({
        code: 0,
        msg: '成功',
        data: {
            passwordSet: isPasswordSet(),
            authenticated: validateSession(token),
            loginMethod: session ? (session.verifiedByToken ? 'token' : 'password') : null,
            isTokenLogin: session ? session.verifiedByToken : false
        },
        currentTime: Math.floor(Date.now() / 1000)
    });
});

/**
 * POST /api/setup/password
 * 设置密码（首次访问）
 */
router.post('/setup/password', async (req, res) => {
    try {
        // 如果密码已设置，拒绝再次设置
        if (isPasswordSet()) {
            return res.json({ code: 1000, msg: '密码已设置，请使用修改密码功能', currentTime: Math.floor(Date.now() / 1000) });
        }

        const { password, confirmPassword } = req.body;

        // 验证密码强度
        const strengthValidation = validatePasswordStrength(password);
        if (!strengthValidation.valid) {
            return res.json({ code: 1000, msg: strengthValidation.errors.join('，'), currentTime: Math.floor(Date.now() / 1000) });
        }

        if (password !== confirmPassword) {
            return res.json({ code: 1000, msg: '两次输入的密码不一致', currentTime: Math.floor(Date.now() / 1000) });
        }

        // 保存密码
        await savePassword(password);

        // 创建 Session
        const token = createSession();

        res.cookie('session_token', token, {
            httpOnly: true,
            maxAge: SESSION_EXPIRE_TIME,
            sameSite: 'strict'
        });

        console.log('[操作] 设置密码成功');
        res.json({ code: 0, msg: '密码设置成功', currentTime: Math.floor(Date.now() / 1000) });
    } catch (error) {
        console.error('设置密码失败:', error);
        res.json({ code: 1000, msg: '设置密码失败', currentTime: Math.floor(Date.now() / 1000) });
    }
});

/**
 * POST /api/login
 * 登录验证（网页用户）
 */
router.post('/login', async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.json({ code: 1000, msg: '请输入密码', currentTime: Math.floor(Date.now() / 1000) });
        }

        // 验证密码
        const valid = await verifyPassword(password);

        if (!valid) {
            return res.json({ code: 1001, msg: '密码错误', currentTime: Math.floor(Date.now() / 1000) });
        }

        // 创建 Session
        const token = createSession();

        res.cookie('session_token', token, {
            httpOnly: true,
            maxAge: SESSION_EXPIRE_TIME,
            sameSite: 'strict'
        });

        console.log('[操作] 用户登录成功');
        res.json({ code: 0, msg: '登录成功', currentTime: Math.floor(Date.now() / 1000) });
    } catch (error) {
        console.error('登录失败:', error);
        res.json({ code: 1000, msg: '登录失败', currentTime: Math.floor(Date.now() / 1000) });
    }
});

/**
 * POST /api/logout
 * 退出登录
 */
router.post('/logout', (req, res) => {
    const token = req.cookies.session_token;
    deleteSession(token);
    res.clearCookie('session_token');
    console.log('[操作] 用户退出登录');
    res.json({ code: 0, msg: '已退出登录', currentTime: Math.floor(Date.now() / 1000) });
});

/**
 * POST /api/verifyToken
 * 通过 token 验证用户身份（自动登录）
 * 旧接口，保持兼容
 */
router.post('/verifyToken', async (req, res) => {
    try {
        const { token, barCode } = req.body;
        
        // 参数校验
        if (!token || token.trim() === '') {
            return res.json({
                code: 1002,
                msg: 'token参数必传',
                currentTime: Math.floor(Date.now() / 1000)
            });
        }
        
        if (!barCode || barCode.trim() === '') {
            return res.json({
                code: 1002,
                msg: 'barCode参数必传',
                currentTime: Math.floor(Date.now() / 1000)
            });
        }
        
        console.log('[Token验证] 开始验证:', { token: token.substring(0, 10) + '...', barCode });
        
        // 调用远程验证接口
        const verifyUrl = 'https://api.yun.tilldream.com/api/im/openClaw/verifyByAdmin';
        
        const response = await fetch(verifyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: token.trim(),
                barCode: barCode.trim()
            })
        });
        
        const result = await response.json();
        
        console.log('[Token验证] 验证结果:', result);
        
        // 验证成功
        if (result.code === 0 || result.success) {
            // 创建 session（使用新的设备绑定函数）
            const sessionId = createSessionForDevice(barCode.trim());
            
            // 设置 cookie
            res.cookie('session_token', sessionId, {
                httpOnly: true,
                maxAge: SESSION_EXPIRE_TIME
            });
            
            console.log('[Token验证] 验证成功，已创建 session:', sessionId);
            
            return res.json({
                code: 0,
                msg: '验证成功',
                currentTime: Math.floor(Date.now() / 1000),
                data: {
                    verified: true,
                    sessionCreated: true
                }
            });
        }
        
        // 验证失败
        console.log('[Token验证] 验证失败:', result.msg || result.message);
        
        return res.json({
            code: 1003,
            msg: result.msg || result.message || '验证失败',
            currentTime: Math.floor(Date.now() / 1000)
        });
        
    } catch (error) {
        console.error('[Token验证] 请求失败:', error);
        return res.json({
            code: 1000,
            msg: '验证请求失败: ' + error.message,
            currentTime: Math.floor(Date.now() / 1000)
        });
    }
});

/**
 * POST /api/auth/token
 * 认证接口 - 通过 token + barCode 获取临时访问凭证
 * 
 * 新接口，用于 APP 客户端认证
 * 返回 accessToken，后续接口使用该凭证
 */
router.post('/auth/token', async (req, res) => {
    const currentTime = Math.floor(Date.now() / 1000);
    
    try {
        const { token, barCode } = req.body;
        
        // 参数校验
        if (!token || token.trim() === '') {
            return res.json({
                code: 1002,
                msg: 'token参数必传',
                currentTime
            });
        }
        
        if (!barCode || barCode.trim() === '') {
            return res.json({
                code: 1002,
                msg: 'barCode参数必传',
                currentTime
            });
        }
        
        console.log('[认证] 开始认证:', { 
            token: token.substring(0, 10) + '...', 
            barCode: barCode.trim() 
        });
        
        // 调用远程验证接口
        const verifyUrl = 'https://api.yun.tilldream.com/api/im/openClaw/verifyByAdmin';
        
        const response = await fetch(verifyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: token.trim(),
                barCode: barCode.trim()
            })
        });
        
        const result = await response.json();
        
        console.log('[认证] 远程验证结果:', result);
        
        // 验证成功
        if (result.code === 0 || result.success) {
            // 创建 Session（单设备绑定）
            const accessToken = createSessionForDevice(barCode.trim());
            
            console.log('[认证] 认证成功，accessToken:', accessToken.substring(0, 10) + '...');
            
            return res.json({
                code: 0,
                msg: '认证成功',
                currentTime,
                data: {
                    accessToken: accessToken,
                    expiresIn: Math.floor(SESSION_EXPIRE_TIME / 1000)  // 秒
                }
            });
        }
        
        // 验证失败
        console.log('[认证] 认证失败:', result.msg || result.message);
        
        return res.json({
            code: 1003,
            msg: '认证失败',
            currentTime
        });
        
    } catch (error) {
        console.error('[认证] 请求失败:', error);
        return res.json({
            code: 1000,
            msg: '认证请求失败: ' + error.message,
            currentTime
        });
    }
});

/**
 * POST /api/password/change
 * 修改密码
 */
router.post('/password/change', authMiddleware, async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body;

        // 验证旧密码
        const valid = await verifyPassword(oldPassword);
        if (!valid) {
            return res.json({ code: 1001, msg: '原密码错误', currentTime: Math.floor(Date.now() / 1000) });
        }

        // 验证新密码强度
        const strengthValidation = validatePasswordStrength(newPassword);
        if (!strengthValidation.valid) {
            return res.json({ code: 1000, msg: '新' + strengthValidation.errors.join('，'), currentTime: Math.floor(Date.now() / 1000) });
        }

        if (newPassword !== confirmPassword) {
            return res.json({ code: 1000, msg: '两次输入的密码不一致', currentTime: Math.floor(Date.now() / 1000) });
        }

        // 保存新密码
        await savePassword(newPassword);

        res.json({ code: 0, msg: '密码修改成功', currentTime: Math.floor(Date.now() / 1000) });
    } catch (error) {
        console.error('修改密码失败:', error);
        res.json({ code: 1000, msg: '修改密码失败', currentTime: Math.floor(Date.now() / 1000) });
    }
});

module.exports = router;
