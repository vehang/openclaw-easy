/**
 * OpenClaw 升级路由
 *
 * 接口列表（需 accessToken 认证）：
 * - GET  /versions         获取可升级版本列表
 * - POST /upgrade          执行升级
 * - GET  /upgrade/status   查询升级状态
 */
const express = require('express');
const router = express.Router();

const { appAuthMiddleware } = require('../middleware');
const {
    getAvailableVersions,
    acquireLock,
    getUpgradeStatus,
    performUpgrade
} = require('../utils/upgrade');

/**
 * GET /versions
 * 获取可升级版本列表
 */
router.get('/versions', appAuthMiddleware, async (req, res) => {
    try {
        const data = await getAvailableVersions();
        res.json({
            code: 0,
            msg: '成功',
            data,
            currentTime: Math.floor(Date.now() / 1000)
        });
    } catch (error) {
        console.error('[升级] 获取版本列表失败:', error);
        res.json({
            code: 1000,
            errorMsg: '获取版本列表失败: ' + error.message,
            currentTime: Math.floor(Date.now() / 1000)
        });
    }
});

/**
 * POST /upgrade
 * 执行升级
 * body: { version: "1.3.0" }
 */
router.post('/upgrade', appAuthMiddleware, async (req, res) => {
    const { version } = req.body || {};
    const currentTime = Math.floor(Date.now() / 1000);

    if (!version || typeof version !== 'string') {
        return res.json({
            code: 1000,
            errorMsg: '缺少 version 参数',
            currentTime
        });
    }

    // 简单格式校验
    if (!/^\d+\.\d+\.\d+$/.test(version.trim())) {
        return res.json({
            code: 1000,
            errorMsg: '版本号格式无效，应为 x.y.z',
            currentTime
        });
    }

    // 尝试加锁
    const lock = acquireLock(version.trim());
    if (!lock.ok) {
        return res.json({
            code: 1001,
            errorMsg: lock.errorMsg,
            currentTime
        });
    }

    // 立即返回
    res.json({
        code: 0,
        msg: '升级任务已启动',
        data: { version: version.trim() },
        currentTime
    });

    // 真异步执行 —— spawn 不阻塞事件循环
    setImmediate(() => performUpgrade(version.trim()));
});

/**
 * GET /upgrade/status
 * 查询升级状态
 */
router.get('/upgrade/status', appAuthMiddleware, (req, res) => {
    const status = getUpgradeStatus();
    res.json({
        code: 0,
        msg: '成功',
        data: status,
        currentTime: Math.floor(Date.now() / 1000)
    });
});

module.exports = router;
