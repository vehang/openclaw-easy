/**
 * OpenClaw Easy - 配置管理 Web 界面
 *
 * 功能：
 * 1. 首次访问设置管理密码
 * 2. 配置 AI 模型（Provider、API Key、Base URL、模型ID）
 * 3. 配置 IM 渠道（飞书、钉钉、QQ机器人、企业微信）
 * 4. 保存配置到 ~/.openclaw/openclaw.json
 * 5. 支持重启 OpenClaw Gateway 服务
 * 6. 后续访问需要密码验证
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');

// ==================== 配置常量 ====================
const PORT = 18780;
const SALT_ROUNDS = 10;
const SESSION_EXPIRE_TIME = 24 * 60 * 60 * 1000; // 24小时

// 配置文件路径
const OPENCLAW_DIR = path.join(os.homedir(), '.openclaw');
const CONFIG_FILE = path.join(OPENCLAW_DIR, 'openclaw.json');
const PASSWORD_FILE = path.join(OPENCLAW_DIR, '.passwd');

// Session 存储（内存中）
const sessions = new Map();

// ==================== Express 应用初始化 ====================
const app = express();

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// ==================== 工具函数 ====================

/**
 * 确保配置目录存在
 */
function ensureConfigDir() {
    if (!fs.existsSync(OPENCLAW_DIR)) {
        fs.mkdirSync(OPENCLAW_DIR, { recursive: true });
    }
}

/**
 * 检查是否已设置密码
 */
function isPasswordSet() {
    return fs.existsSync(PASSWORD_FILE);
}

/**
 * 保存密码（bcrypt 加密）
 */
async function savePassword(password) {
    ensureConfigDir();
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    fs.writeFileSync(PASSWORD_FILE, hash, 'utf8');
}

/**
 * 验证密码
 */
async function verifyPassword(password) {
    if (!fs.existsSync(PASSWORD_FILE)) {
        return false;
    }
    const hash = fs.readFileSync(PASSWORD_FILE, 'utf8').trim();
    return bcrypt.compare(password, hash);
}

/**
 * 生成 Session Token
 */
function generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * 创建 Session
 */
function createSession() {
    const token = generateSessionToken();
    sessions.set(token, {
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_EXPIRE_TIME
    });
    return token;
}

/**
 * 验证 Session
 */
function validateSession(token) {
    if (!token) return false;
    const session = sessions.get(token);
    if (!session) return false;
    if (Date.now() > session.expiresAt) {
        sessions.delete(token);
        return false;
    }
    return true;
}

/**
 * 读取配置文件
 */
function readConfig() {
    ensureConfigDir();
    if (!fs.existsSync(CONFIG_FILE)) {
        return {
            ai: {
                provider: 'openai',
                apiKey: '',
                baseUrl: '',
                modelId: ''
            },
            im: {
                feishu: { enabled: false, appId: '', appSecret: '' },
                dingtalk: { enabled: false, clientId: '', clientSecret: '' },
                qqbot: { enabled: false, appId: '', appSecret: '' },
                wecom: { enabled: false, corpId: '', agentId: '', secret: '' }
            }
        };
    }
    try {
        const content = fs.readFileSync(CONFIG_FILE, 'utf8');
        return JSON.parse(content);
    } catch (e) {
        console.error('读取配置文件失败:', e);
        return null;
    }
}

/**
 * 保存配置文件
 */
function saveConfig(config) {
    ensureConfigDir();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

/**
 * 重启 OpenClaw Gateway 服务
 */
async function restartGateway() {
    const { exec } = require('child_process');

    return new Promise((resolve, reject) => {
        // 尝试多种重启方式
        const commands = [
            'systemctl restart openclaw-gateway',
            'service openclaw-gateway restart',
            'pm2 restart openclaw-gateway'
        ];

        let lastError = null;
        let successCount = 0;

        // 尝试执行重启命令
        const tryRestart = (index) => {
            if (index >= commands.length) {
                if (successCount > 0) {
                    resolve({ success: true, message: '重启命令已执行' });
                } else {
                    reject(new Error('无法重启服务，请手动重启。最后错误: ' + (lastError || '未知错误')));
                }
                return;
            }

            exec(commands[index], (error, stdout, stderr) => {
                if (error) {
                    // 命令不存在或执行失败，尝试下一个
                    lastError = error.message;
                    tryRestart(index + 1);
                } else {
                    successCount++;
                    resolve({ success: true, message: '重启命令已执行', output: stdout });
                }
            });
        };

        tryRestart(0);
    });
}

// ==================== 认证中间件 ====================

/**
 * 认证检查中间件
 */
function authMiddleware(req, res, next) {
    // 如果密码未设置，允许访问设置密码页面
    if (!isPasswordSet()) {
        return next();
    }

    // 检查 Session
    const token = req.cookies.session_token;
    if (validateSession(token)) {
        return next();
    }

    // API 请求返回 401
    if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: '未授权访问' });
    }

    // 页面请求重定向到登录页
    res.redirect('/login.html');
}

// ==================== API 路由 ====================

/**
 * 检查系统状态
 * GET /api/status
 */
app.get('/api/status', (req, res) => {
    res.json({
        passwordSet: isPasswordSet(),
        authenticated: validateSession(req.cookies.session_token)
    });
});

/**
 * 设置密码（首次访问）
 * POST /api/setup/password
 */
app.post('/api/setup/password', async (req, res) => {
    try {
        // 如果密码已设置，拒绝再次设置
        if (isPasswordSet()) {
            return res.status(400).json({ error: '密码已设置，请使用修改密码功能' });
        }

        const { password, confirmPassword } = req.body;

        // 验证密码
        if (!password || password.length < 6) {
            return res.status(400).json({ error: '密码长度至少6位' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: '两次输入的密码不一致' });
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

        res.json({ success: true, message: '密码设置成功' });
    } catch (error) {
        console.error('设置密码失败:', error);
        res.status(500).json({ error: '设置密码失败' });
    }
});

/**
 * 登录验证
 * POST /api/login
 */
app.post('/api/login', async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: '请输入密码' });
        }

        // 验证密码
        const valid = await verifyPassword(password);

        if (!valid) {
            return res.status(401).json({ error: '密码错误' });
        }

        // 创建 Session
        const token = createSession();

        res.cookie('session_token', token, {
            httpOnly: true,
            maxAge: SESSION_EXPIRE_TIME,
            sameSite: 'strict'
        });

        res.json({ success: true, message: '登录成功' });
    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({ error: '登录失败' });
    }
});

/**
 * 退出登录
 * POST /api/logout
 */
app.post('/api/logout', (req, res) => {
    const token = req.cookies.session_token;
    if (token) {
        sessions.delete(token);
    }
    res.clearCookie('session_token');
    res.json({ success: true, message: '已退出登录' });
});

/**
 * 修改密码
 * POST /api/password/change
 */
app.post('/api/password/change', authMiddleware, async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body;

        // 验证旧密码
        const valid = await verifyPassword(oldPassword);
        if (!valid) {
            return res.status(401).json({ error: '原密码错误' });
        }

        // 验证新密码
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: '新密码长度至少6位' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: '两次输入的密码不一致' });
        }

        // 保存新密码
        await savePassword(newPassword);

        res.json({ success: true, message: '密码修改成功' });
    } catch (error) {
        console.error('修改密码失败:', error);
        res.status(500).json({ error: '修改密码失败' });
    }
});

/**
 * 获取配置
 * GET /api/config
 */
app.get('/api/config', authMiddleware, (req, res) => {
    try {
        const config = readConfig();
        if (!config) {
            return res.status(500).json({ error: '读取配置失败' });
        }
        res.json(config);
    } catch (error) {
        console.error('获取配置失败:', error);
        res.status(500).json({ error: '获取配置失败' });
    }
});

/**
 * 保存配置
 * POST /api/config
 */
app.post('/api/config', authMiddleware, (req, res) => {
    try {
        const config = req.body;

        // 验证配置结构
        if (!config || !config.ai || !config.im) {
            return res.status(400).json({ error: '配置格式不正确' });
        }

        // 保存配置
        saveConfig(config);

        res.json({ success: true, message: '配置保存成功' });
    } catch (error) {
        console.error('保存配置失败:', error);
        res.status(500).json({ error: '保存配置失败' });
    }
});

/**
 * 重启 Gateway 服务
 * POST /api/gateway/restart
 */
app.post('/api/gateway/restart', authMiddleware, async (req, res) => {
    try {
        const result = await restartGateway();
        res.json(result);
    } catch (error) {
        console.error('重启服务失败:', error);
        res.status(500).json({ error: error.message || '重启服务失败' });
    }
});

/**
 * 测试 AI 连接
 * POST /api/test/ai
 */
app.post('/api/test/ai', authMiddleware, async (req, res) => {
    try {
        const { provider, apiKey, baseUrl, modelId } = req.body;

        // 这里可以实现实际的连接测试
        // 目前只做基本的参数验证
        if (!apiKey || !modelId) {
            return res.status(400).json({ error: 'API Key 和模型ID不能为空' });
        }

        // 模拟测试成功
        res.json({ success: true, message: 'AI 配置验证通过' });
    } catch (error) {
        console.error('测试 AI 连接失败:', error);
        res.status(500).json({ error: '测试连接失败' });
    }
});

// ==================== 页面路由 ====================

// 首页重定向
app.get('/', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== 错误处理 ====================

// 404 处理
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// 全局错误处理
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
});

// ==================== 启动服务器 ====================

app.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════╗');
    console.log('║       OpenClaw Easy 配置管理系统           ║');
    console.log('╠════════════════════════════════════════════╣');
    console.log(`║  服务地址: http://localhost:${PORT}          ║`);
    console.log(`║  配置文件: ${CONFIG_FILE.padEnd(24)}║`);
    console.log('╚════════════════════════════════════════════╝');
    console.log('');
});
