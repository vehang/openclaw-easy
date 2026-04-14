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

const { authMiddleware, appAuthMiddleware } = require('../middleware');
const { restartGateway } = require('../utils/restart');
const { notifyNas } = require('../utils/common');
const { probeAiConfig } = require('../utils/ai-probe');

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
            console.log('[通知] 准备通知NAS, type=200(重启成功)');
            await notifyNas(200);
            console.log('[通知] NAS通知完成, type=200');
        } else {
            console.log('[操作] 网关重启失败:', result.error);
        }
        res.json(result);
    } catch (error) {
        console.error('重启服务失败:', error);
        res.json({ code: 1000, errorMsg: error.message || '重启服务失败', currentTime: Math.floor(Date.now() / 1000) });
    }
});

/**
 * POST /api/fix
 * 修复 OpenClaw 运行环境（异步执行）
 * 无需登录验证
 */
router.post('/fix', appAuthMiddleware, async (req, res) => {
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
                    console.log('[通知] 准备通知NAS, type=100(修复成功)');
                    await notifyNas(100);
                    console.log('[通知] NAS通知完成, type=100');
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

        if (!apiKey || !modelId) {
            return res.json({ code: 1000, errorMsg: 'API Key 和模型ID不能为空', currentTime: Math.floor(Date.now() / 1000) });
        }

        const result = await probeAiConfig(baseUrl || '', apiKey, modelId);
        const responseObj = {
            code: result.ok ? 0 : 1000,
            currentTime: Math.floor(Date.now() / 1000)
        };
        responseObj[result.ok ? 'msg' : 'errorMsg'] = result.msg;
        res.json(responseObj);
    } catch (error) {
        console.error('测试 AI 连接失败:', error);
        res.json({ code: 1000, errorMsg: '测试连接失败', currentTime: Math.floor(Date.now() / 1000) });
    }
});

module.exports = router;
