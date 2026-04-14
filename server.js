/**
 * OpenClaw Easy - 配置管理 Web 界面
 * 
 * 主入口文件，负责：
 * 1. 初始化 Express 应用
 * 2. 配置中间件
 * 3. 挂载路由
 * 4. 启动服务器
 * 
 * 功能：
 * 1. 首次访问设置管理密码
 * 2. 配置 AI 模型（Provider、API Key、Base URL、模型ID）
 * 3. 配置 IM 渠道（飞书、钉钉、QQ机器人、企业微信、网易云信）
 * 4. 保存配置到 ~/.openclaw/openclaw.json（OpenClaw 标准格式）
 * 5. 支持重启 OpenClaw Gateway 服务
 * 6. 后续访问需要密码验证
 * 7. 支持 API 方式配置（简化接口）
 */

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const { PORT, CONFIG_FILE } = require('./constants');
const { htmlAccessMiddleware } = require('./middleware');
const { mountRoutes } = require('./routes');
const { startAutoUpdateTask } = require('./tasks');
const { loadAppTokens } = require('./state/app-tokens');

// ==================== 加载持久化状态 ====================
loadAppTokens();

// ==================== Express 应用初始化 ====================
const app = express();

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// HTML 文件访问控制（必须在静态文件服务之前）
app.use(htmlAccessMiddleware);

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// ==================== 挂载路由 ====================
mountRoutes(app);

// ==================== 错误处理 ====================

// 404 处理
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// 全局错误处理
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.json({ code: 1000, msg: '服务器内部错误', currentTime: Math.floor(Date.now() / 1000) });
});

// ==================== 启动自动更新任务 ====================
startAutoUpdateTask();

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
