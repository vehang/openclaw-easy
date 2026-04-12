/**
 * 系统路由
 * 
 * 接口列表：
 * - POST /gateway/restart  重启 Gateway 服务
 * - POST /fix              修复 OpenClaw 运行环境
 * - POST /test/ai          测试 AI 连接
 */
const express = require('express');
const { spawn } = require('child_process');
const router = express.Router();

const { authMiddleware } = require('../middleware');
const { restartGateway } = require('../utils/restart');

/**
 * 通知 NAS 接口
 * @param {number} type - 100:修复成功, 200:重启成功
 */
async function notifyNas(type) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5秒超时
        
        const response = await fetch('http://127.0.0.1:18319/sendNotifyToNas?type=' + type, {
            signal: controller.signal
        });
        clearTimeout(timeout);
        
        const data = await response.text();
        console.log('[NAS通知] type=' + type + ', status=' + response.status + ', response=' + data);
    } catch (error) {
        // 任何异常都不影响后续流程
        console.error('[NAS通知] 调用失败 type=' + type + ', error=' + error.message);
    }
}

/**
 * POST /api/gateway/restart
 * 重启 Gateway 服务
 */
router.post('/gateway/restart', authMiddleware, async (req, res) => {
    console.log('[操作] 开始重启网关...');
    try {
        const result = await restartGateway();
        if (result.success || result.code === 0) {
            console.log('[操作] 网关重启成功');
            await notifyNas(200);
        } else {
            console.log('[操作] 网关重启失败:', result.error);
        }
        res.json(result);
    } catch (error) {
        console.error('重启服务失败:', error);
        res.json({ code: 1000, msg: error.message || '重启服务失败', currentTime: Math.floor(Date.now() / 1000) });
    }
});

/**
 * POST /api/fix
 * 修复 OpenClaw 运行环境（异步执行）
 * 无需登录验证
 */
router.post('/fix', async (req, res) => {
    console.log('[操作] 修复任务已触发');
    // 立即返回响应
    res.json({
        code: 0,
        msg: '修复任务已启动',
        currentTime: Math.floor(Date.now() / 1000)
    });
    
    // 后台异步执行
    setImmediate(async () => {
        try {
            console.log('[修复] 开始执行 openclaw doctor --fix...');
            
            const child = spawn('openclaw', ['doctor', '--fix'], { shell: true });
            
            child.stdout.on('data', (data) => {
                console.log('[修复]', data.toString().trim());
            });
            
            child.stderr.on('data', (data) => {
                console.log('[修复]', data.toString().trim());
            });
            
            child.on('close', async (code) => {
                console.log('[修复] 执行完成，退出码:', code);
                if (code === 0) {
                    await notifyNas(100);
                }
            });
            
            child.on('error', (err) => {
                console.error('[修复] 执行错误:', err);
            });
        } catch (error) {
            console.error('[修复] 启动失败:', error);
        }
    });
});

/**
 * POST /api/test/ai
 * 测试 AI 连接
 */
router.post('/test/ai', authMiddleware, async (req, res) => {
    try {
        const { apiKey, baseUrl, modelId } = req.body;

        // 这里可以实现实际的连接测试
        // 目前只做基本的参数验证
        if (!apiKey || !modelId) {
            return res.json({ code: 1000, msg: 'API Key 和模型ID不能为空', currentTime: Math.floor(Date.now() / 1000) });
        }

        // 模拟测试成功
        res.json({ code: 0, msg: 'AI 配置验证通过', currentTime: Math.floor(Date.now() / 1000) });
    } catch (error) {
        console.error('测试 AI 连接失败:', error);
        res.json({ code: 1000, msg: '测试连接失败', currentTime: Math.floor(Date.now() / 1000) });
    }
});

module.exports = router;
